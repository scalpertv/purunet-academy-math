// Cloudflare D1 학습 데이터의 주기 검증과 보고서, 백업 기록 생성을 담당한다.
type D1Value = string | number | null;

interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

export interface LearningMaintenanceEnv {
  LEARNING_DB?: D1Database;
}

type JsonRecord = Record<string, unknown>;

type StudentRecord = JsonRecord & {
  id: string;
  learnerId: string;
  name: string;
  grade: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
};

type ClassRecord = JsonRecord & {
  id: string;
  name: string;
  teacherId: string;
};

type TeacherRecord = JsonRecord & {
  id: string;
  name: string;
};

type LearningAttemptRecord = JsonRecord & {
  id: string;
  learnerId: string;
  learnerName: string;
  grade: string;
  teacherId?: string;
  classId?: string;
  unitLabel?: string;
  unitNo?: number;
  unitTitle?: string;
  topicTitle?: string;
  learnerAnswer?: string;
  correctAnswer?: string;
  ok: boolean;
  createdAt: string;
};

type ProgressOverrideRecord = JsonRecord & {
  id: string;
  studentId: string;
  learnerId: string;
  attempted: number;
  correct: number;
};

type ValidationIssue = {
  severity: "warn" | "error";
  table: string;
  id: string;
  message: string;
};

type ReportRecord = {
  id: string;
  reportType: "learning-report" | "learning-diagnosis" | "parent-counsel";
  periodKey: string;
  teacherId?: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  studentId: string;
  studentName: string;
  learnerId: string;
  generatedAt: string;
  payload: JsonRecord;
};

export type LearningMaintenanceResult = {
  ok: boolean;
  trigger: string;
  generatedAt: string;
  validationId: string;
  backupId: string;
  issueCount: number;
  reportCount: number;
  tableCounts: Record<string, number>;
  issues: ValidationIssue[];
};

const payloadTables = [
  "teachers",
  "classes",
  "students",
  "admin_accounts",
  "teacher_accounts",
  "student_accounts",
  "learning_attempts",
  "student_progress_overrides",
  "learning_security_alerts",
] as const;

function requireDb(env: LearningMaintenanceEnv) {
  if (!env.LEARNING_DB) throw new Error("Cloudflare D1 LEARNING_DB binding이 설정되지 않았습니다.");
  return env.LEARNING_DB;
}

function entityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parsePayloadRow<T extends JsonRecord>(row: { payload: string }) {
  return JSON.parse(row.payload) as T;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value ? value : fallback;
}

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function kstDateKey(iso?: string) {
  const source = iso ? new Date(iso) : new Date();
  const time = Number.isNaN(source.getTime()) ? Date.now() : source.getTime();
  return new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function reportDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

async function readPayloadRows<T extends JsonRecord>(db: D1Database, table: string, orderColumn = "rowid") {
  const rows = await db.prepare(`SELECT payload FROM ${table} ORDER BY ${orderColumn} DESC`).all<{ payload: string }>();
  return (rows.results ?? []).map(parsePayloadRow<T>);
}

async function countTable(db: D1Database, table: string) {
  const rows = await db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).all<{ total: number }>();
  return rows.results?.[0]?.total ?? 0;
}

async function countTables(db: D1Database) {
  const entries = await Promise.all(
    [
      ...payloadTables,
      "learning_periodic_reports",
      "learning_data_validations",
      "learning_db_backups",
      "student_progress_map_settings",
    ].map(async (table) => [table, await countTable(db, table)] as const),
  );
  return Object.fromEntries(entries);
}

function validateLearningData(input: {
  teachers: TeacherRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  teacherAccounts: JsonRecord[];
  studentAccounts: JsonRecord[];
  attempts: LearningAttemptRecord[];
  progressOverrides: ProgressOverrideRecord[];
}) {
  const issues: ValidationIssue[] = [];
  const teachers = new Set(input.teachers.map((teacher) => teacher.id));
  const classes = new Map(input.classes.map((classRecord) => [classRecord.id, classRecord]));
  const students = new Map(input.students.map((student) => [student.id, student]));
  const learnerIds = new Set(input.students.map((student) => student.learnerId));

  for (const classRecord of input.classes) {
    if (!teachers.has(classRecord.teacherId)) {
      issues.push({
        severity: "error",
        table: "classes",
        id: classRecord.id,
        message: `${classRecord.name} 클래스의 담당 교사 데이터가 없습니다.`,
      });
    }
  }

  for (const student of input.students) {
    const classRecord = classes.get(student.classId);
    if (!classRecord) {
      issues.push({
        severity: "error",
        table: "students",
        id: student.id,
        message: `${student.name} 학생의 클래스 데이터가 없습니다.`,
      });
    } else if (classRecord.teacherId !== student.teacherId) {
      issues.push({
        severity: "warn",
        table: "students",
        id: student.id,
        message: `${student.name} 학생의 담당 교사와 클래스 담당 교사가 다릅니다.`,
      });
    }
  }

  for (const account of input.teacherAccounts) {
    const teacherId = asString(account.teacherId);
    if (!teachers.has(teacherId)) {
      issues.push({
        severity: "error",
        table: "teacher_accounts",
        id: asString(account.id, "unknown"),
        message: `${asString(account.username, "교사용 계정")} 계정과 연결된 교사 데이터가 없습니다.`,
      });
    }
  }

  for (const account of input.studentAccounts) {
    const studentId = asString(account.studentId);
    const learnerId = asString(account.learnerId);
    if (!students.has(studentId) || !learnerIds.has(learnerId)) {
      issues.push({
        severity: "error",
        table: "student_accounts",
        id: asString(account.id, "unknown"),
        message: `${asString(account.username, "학생용 계정")} 계정과 연결된 학생 데이터가 없습니다.`,
      });
    }
  }

  for (const attempt of input.attempts) {
    if (!learnerIds.has(attempt.learnerId)) {
      issues.push({
        severity: "warn",
        table: "learning_attempts",
        id: attempt.id,
        message: `${attempt.learnerName} 풀이 기록과 연결된 현재 학생 데이터가 없습니다.`,
      });
    }
  }

  for (const override of input.progressOverrides) {
    if (!students.has(override.studentId)) {
      issues.push({
        severity: "error",
        table: "student_progress_overrides",
        id: override.id,
        message: `진도 보정 데이터와 연결된 학생 데이터가 없습니다.`,
      });
    }
    if (override.correct > override.attempted) {
      issues.push({
        severity: "error",
        table: "student_progress_overrides",
        id: override.id,
        message: `진도 보정 정답 수가 전체 풀이 수보다 큽니다.`,
      });
    }
  }

  return issues;
}

function topWrongTopic(attempts: LearningAttemptRecord[]) {
  const counts = new Map<string, { title: string; wrong: number; attempted: number }>();
  for (const attempt of attempts) {
    const title = asString(attempt.topicTitle, "보완 학습");
    const current = counts.get(title) ?? { title, wrong: 0, attempted: 0 };
    current.attempted += 1;
    if (!attempt.ok) current.wrong += 1;
    counts.set(title, current);
  }
  return [...counts.values()].sort((a, b) => b.wrong - a.wrong || b.attempted - a.attempted)[0]?.title ?? "개별 보완 학습";
}

function buildReportsForStudent(student: StudentRecord, attempts: LearningAttemptRecord[], generatedAt: string, periodKey: string) {
  const dayAttempts = attempts.filter((attempt) => kstDateKey(attempt.createdAt) === periodKey);
  const sourceAttempts = dayAttempts.length ? dayAttempts : attempts.slice(0, 20);
  const correct = sourceAttempts.filter((attempt) => attempt.ok).length;
  const wrong = Math.max(0, sourceAttempts.length - correct);
  const accuracy = percent(correct, sourceAttempts.length);
  const wrongRate = percent(wrong, sourceAttempts.length);
  const focusTitle = topWrongTopic(sourceAttempts);
  const recentWrong = sourceAttempts
    .filter((attempt) => !attempt.ok)
    .slice(0, 3)
    .map((attempt) => `${asString(attempt.topicTitle, "문항")}: 학생 답 ${asString(attempt.learnerAnswer, "무응답")}, 정답 ${asString(attempt.correctAnswer, "확인 필요")}`);
  const reportBase = {
    periodKey,
    periodLabel: reportDateLabel(periodKey),
    generatedAt,
    teacherId: student.teacherId,
    teacherName: student.teacherName,
    classId: student.classId,
    className: student.className,
    studentId: student.id,
    studentName: student.name,
    learnerId: student.learnerId,
    attempted: sourceAttempts.length,
    correct,
    wrong,
    accuracy,
    wrongRate,
    focusTitle,
  };
  const learningReportText = [
    `학습 보고서 | ${student.name} | ${reportDateLabel(periodKey)}`,
    `클래스: ${student.className}`,
    `풀이 수: ${sourceAttempts.length}문제`,
    `정답: ${correct}문제 / 오답: ${wrong}문제`,
    `정답률: ${accuracy}% / 오답률: ${wrongRate}%`,
    `다음 학습: ${focusTitle}`,
  ].join("\n");
  const diagnosisText = [
    `학습 진단서 | ${student.name} | ${reportDateLabel(periodKey)}`,
    `자료 범위: ${sourceAttempts.length}문제, 정답률 ${accuracy}%, 오답률 ${wrongRate}%`,
    `중점 보완: ${focusTitle}`,
    `대표 오답: ${recentWrong.length ? recentWrong.join(" / ") : "대표 오답 없음"}`,
    accuracy >= 80
      ? "진단: 현재 정확성이 안정적이므로 같은 유형의 속도와 설명력을 함께 높입니다."
      : "진단: 풀이 단계 확인과 유사 문항 반복으로 개념 연결을 보완합니다.",
  ].join("\n");
  const counselingText = [
    `학부모 상담서 | ${student.name} | ${reportDateLabel(periodKey)}`,
    `현재 학습 상태는 ${sourceAttempts.length}문제 기준 정답률 ${accuracy}%입니다.`,
    `가정 상담 핵심: ${focusTitle} 영역을 결과 지적보다 풀이 순서 확인 중심으로 도와주세요.`,
    "가정 실천: 하루 10분, 맞힌 문제 1개와 다시 볼 문제 1개를 학생이 직접 고르게 합니다.",
    "주의: 이 문서는 학습 데이터 기반 교육 상담 참고 자료입니다.",
  ].join("\n");

  return [
    {
      id: `learning-report-${student.id}-${periodKey}`,
      reportType: "learning-report" as const,
      text: learningReportText,
      title: "학습 보고서",
    },
    {
      id: `learning-diagnosis-${student.id}-${periodKey}`,
      reportType: "learning-diagnosis" as const,
      text: diagnosisText,
      title: "학습 진단서",
    },
    {
      id: `parent-counsel-${student.id}-${periodKey}`,
      reportType: "parent-counsel" as const,
      text: counselingText,
      title: "학부모 상담서",
    },
  ].map((report) => ({
    id: report.id,
    reportType: report.reportType,
    periodKey,
    teacherId: student.teacherId,
    teacherName: student.teacherName,
    classId: student.classId,
    className: student.className,
    studentId: student.id,
    studentName: student.name,
    learnerId: student.learnerId,
    generatedAt,
    payload: {
      ...reportBase,
      reportType: report.reportType,
      title: report.title,
      text: report.text,
    },
  })) satisfies ReportRecord[];
}

function reportStatement(db: D1Database, report: ReportRecord) {
  return db
    .prepare(
      `INSERT INTO learning_periodic_reports (
         id, report_type, period_key, teacher_id, teacher_name, class_id, class_name,
         student_id, student_name, learner_id, generated_at, payload
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(report_type, period_key, student_id) DO UPDATE SET
         teacher_id = excluded.teacher_id,
         teacher_name = excluded.teacher_name,
         class_id = excluded.class_id,
         class_name = excluded.class_name,
         student_name = excluded.student_name,
         learner_id = excluded.learner_id,
         generated_at = excluded.generated_at,
         payload = excluded.payload`,
    )
    .bind(
      report.id,
      report.reportType,
      report.periodKey,
      report.teacherId ?? null,
      report.teacherName ?? null,
      report.classId ?? null,
      report.className ?? null,
      report.studentId,
      report.studentName,
      report.learnerId,
      report.generatedAt,
      JSON.stringify(report.payload),
    );
}

export async function runLearningMaintenance(env: LearningMaintenanceEnv, trigger = "manual"): Promise<LearningMaintenanceResult> {
  const db = requireDb(env);
  const generatedAt = new Date().toISOString();
  const periodKey = kstDateKey(generatedAt);
  const [teachers, classes, students, teacherAccounts, studentAccounts, attempts, progressOverrides, tableCounts] = await Promise.all([
    readPayloadRows<TeacherRecord>(db, "teachers", "updated_at"),
    readPayloadRows<ClassRecord>(db, "classes", "updated_at"),
    readPayloadRows<StudentRecord>(db, "students", "updated_at"),
    readPayloadRows<JsonRecord>(db, "teacher_accounts", "updated_at"),
    readPayloadRows<JsonRecord>(db, "student_accounts", "updated_at"),
    readPayloadRows<LearningAttemptRecord>(db, "learning_attempts", "created_at"),
    readPayloadRows<ProgressOverrideRecord>(db, "student_progress_overrides", "updated_at"),
    countTables(db),
  ]);
  const issues = validateLearningData({
    teachers,
    classes,
    students,
    teacherAccounts,
    studentAccounts,
    attempts,
    progressOverrides,
  });
  const attemptsByLearner = new Map<string, LearningAttemptRecord[]>();
  for (const attempt of attempts) {
    const list = attemptsByLearner.get(attempt.learnerId) ?? [];
    list.push(attempt);
    attemptsByLearner.set(attempt.learnerId, list);
  }
  const reports = students.flatMap((student) =>
    buildReportsForStudent(
      student,
      (attemptsByLearner.get(student.learnerId) ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      generatedAt,
      periodKey,
    ),
  );
  const validationId = entityId("validation");
  const backupId = entityId("backup");
  const validationPayload = {
    trigger,
    generatedAt,
    tableCounts,
    issues,
  };
  const backupPayload = {
    trigger,
    generatedAt,
    periodKey,
    tableCounts,
    issueCount: issues.length,
    reportCount: reports.length,
    note: "Cloudflare D1 앱 내부 백업 manifest입니다. 전체 SQL 백업은 npm run db:backup 또는 D1 Time Travel export를 사용합니다.",
  };
  const statements = [
    db
      .prepare(
        `INSERT INTO learning_data_validations (id, trigger_name, status, issue_count, checked_at, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(validationId, trigger, issues.length ? "needs-review" : "ok", issues.length, generatedAt, JSON.stringify(validationPayload)),
    ...reports.map((report) => reportStatement(db, report)),
    db
      .prepare(
        `INSERT INTO learning_db_backups (id, backup_kind, period_key, created_at, table_counts, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(backupId, "manifest", periodKey, generatedAt, JSON.stringify(tableCounts), JSON.stringify(backupPayload)),
  ];
  if (statements.length) await db.batch(statements);
  return {
    ok: true,
    trigger,
    generatedAt,
    validationId,
    backupId,
    issueCount: issues.length,
    reportCount: reports.length,
    tableCounts,
    issues,
  };
}

export async function readLearningMaintenanceStatus(env: LearningMaintenanceEnv) {
  const db = requireDb(env);
  const [validations, backups, reports] = await Promise.all([
    db
      .prepare("SELECT id, trigger_name, status, issue_count, checked_at, payload FROM learning_data_validations ORDER BY checked_at DESC LIMIT 12")
      .all<JsonRecord>(),
    db.prepare("SELECT id, backup_kind, period_key, created_at, table_counts, payload FROM learning_db_backups ORDER BY created_at DESC LIMIT 12").all<JsonRecord>(),
    db
      .prepare(
        `SELECT id, report_type, period_key, teacher_id, class_id, student_id, student_name, learner_id, generated_at, payload
         FROM learning_periodic_reports
         ORDER BY generated_at DESC
         LIMIT 30`,
      )
      .all<JsonRecord>(),
  ]);
  return {
    validations: validations.results ?? [],
    backups: backups.results ?? [],
    reports: reports.results ?? [],
    checkedAt: new Date().toISOString(),
  };
}
