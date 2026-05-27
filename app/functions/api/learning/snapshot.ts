// Cloudflare D1에 학습 계정과 풀이 기록 스냅샷을 저장하고 읽는 Pages Function.
type D1Value = string | number | null;

interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

export interface Env {
  LEARNING_DB?: D1Database;
}

type JsonRecord = Record<string, unknown>;

interface LearningCloudSnapshot {
  teachers: JsonRecord[];
  classes: JsonRecord[];
  students: JsonRecord[];
  adminAccounts: JsonRecord[];
  teacherAccounts: JsonRecord[];
  studentAccounts: JsonRecord[];
  progressOverrides: JsonRecord[];
  assignments: JsonRecord[];
  attempts: JsonRecord[];
  securityAlerts: JsonRecord[];
  settings: JsonRecord;
  syncedAt?: string;
}

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

export function sameOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export function requireDb(env: Env) {
  if (!env.LEARNING_DB) throw new Error("Cloudflare D1 LEARNING_DB binding이 설정되지 않았습니다.");
  return env.LEARNING_DB;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBooleanInt(value: unknown) {
  return value === false ? 0 : 1;
}

function accountAccess(record: JsonRecord) {
  const access = typeof record.access === "object" && record.access ? (record.access as JsonRecord) : {};
  return {
    canLogin: asBooleanInt(access.canLogin),
    canStudy: asBooleanInt(access.canStudy),
    canViewLearningData: asBooleanInt(access.canViewLearningData),
    canManageRoster: asBooleanInt(access.canManageRoster),
    blockedReason: typeof access.blockedReason === "string" ? access.blockedReason : null,
  };
}

function parsePayloadRow(row: { payload: string }) {
  return JSON.parse(row.payload) as JsonRecord;
}

async function readPayloadRows(db: D1Database, table: string, orderColumn: string) {
  const rows = await db.prepare(`SELECT payload FROM ${table} ORDER BY ${orderColumn} DESC`).all<{ payload: string }>();
  return (rows.results ?? []).map(parsePayloadRow);
}

async function readSnapshot(db: D1Database): Promise<LearningCloudSnapshot> {
  const [
    teachers,
    classes,
    students,
    adminAccounts,
    teacherAccounts,
    studentAccounts,
    progressOverrides,
    assignments,
    attempts,
    securityAlerts,
    settingsRows,
  ] = await Promise.all([
    readPayloadRows(db, "teachers", "updated_at"),
    readPayloadRows(db, "classes", "updated_at"),
    readPayloadRows(db, "students", "updated_at"),
    readPayloadRows(db, "admin_accounts", "updated_at"),
    readPayloadRows(db, "teacher_accounts", "updated_at"),
    readPayloadRows(db, "student_accounts", "updated_at"),
    readPayloadRows(db, "student_progress_overrides", "updated_at"),
    readPayloadRows(db, "learning_assignments", "updated_at"),
    readPayloadRows(db, "learning_attempts", "created_at"),
    readPayloadRows(db, "learning_security_alerts", "created_at"),
    db.prepare("SELECT payload FROM app_settings WHERE id = 'active'").all<{ payload: string }>(),
  ]);

  return {
    teachers,
    classes,
    students,
    adminAccounts,
    teacherAccounts,
    studentAccounts,
    progressOverrides,
    assignments,
    attempts,
    securityAlerts,
    settings: settingsRows.results?.[0] ? parsePayloadRow(settingsRows.results[0]) : { id: "active", updatedAt: new Date().toISOString() },
    syncedAt: new Date().toISOString(),
  };
}

export function batchTeachers(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO teachers (id, name, created_at, updated_at, payload)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.name, "선생님"),
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

export function batchClasses(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO classes (id, name, grade, teacher_id, teacher_name, created_at, updated_at, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           grade = excluded.grade,
           teacher_id = excluded.teacher_id,
           teacher_name = excluded.teacher_name,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.name, "클래스"),
        asString(record.grade, "학년 미지정"),
        asString(record.teacherId),
        asString(record.teacherName, "선생님"),
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

function batchStudents(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO students (id, learner_id, name, grade, class_id, class_name, teacher_id, teacher_name, created_at, updated_at, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           learner_id = excluded.learner_id,
           name = excluded.name,
           grade = excluded.grade,
           class_id = excluded.class_id,
           class_name = excluded.class_name,
           teacher_id = excluded.teacher_id,
           teacher_name = excluded.teacher_name,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.learnerId),
        asString(record.name, "학습자"),
        asString(record.grade, "학년 미지정"),
        asString(record.classId),
        asString(record.className, "클래스"),
        asString(record.teacherId),
        asString(record.teacherName, "선생님"),
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

function batchAdminAccounts(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO admin_accounts (id, username, email, auth_provider, display_name, google_sub, created_at, updated_at, last_login_at, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           username = excluded.username,
           email = excluded.email,
           auth_provider = excluded.auth_provider,
           display_name = excluded.display_name,
           google_sub = excluded.google_sub,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           last_login_at = excluded.last_login_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.username),
        asString(record.email, asString(record.username)),
        asString(record.authProvider, "local"),
        asString(record.displayName, "관리자"),
        typeof record.googleSub === "string" ? record.googleSub : null,
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        typeof record.lastLoginAt === "string" ? record.lastLoginAt : null,
        JSON.stringify(record),
      ),
  );
}

function batchTeacherAccounts(db: D1Database, records: JsonRecord[]) {
  return records.map((record) => {
    const access = accountAccess(record);
    return db
      .prepare(
        `INSERT INTO teacher_accounts (
           id, username, teacher_id, display_name, can_login, can_study, can_view_learning_data,
           can_manage_roster, blocked_reason, created_at, updated_at, last_login_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           username = excluded.username,
           teacher_id = excluded.teacher_id,
           display_name = excluded.display_name,
           can_login = excluded.can_login,
           can_study = excluded.can_study,
           can_view_learning_data = excluded.can_view_learning_data,
           can_manage_roster = excluded.can_manage_roster,
           blocked_reason = excluded.blocked_reason,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           last_login_at = excluded.last_login_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.username),
        asString(record.teacherId),
        asString(record.displayName, "선생님"),
        access.canLogin,
        access.canStudy,
        access.canViewLearningData,
        access.canManageRoster,
        access.blockedReason,
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        typeof record.lastLoginAt === "string" ? record.lastLoginAt : null,
        JSON.stringify(record),
      );
  });
}

function batchStudentAccounts(db: D1Database, records: JsonRecord[]) {
  return records.map((record) => {
    const access = accountAccess(record);
    return db
      .prepare(
        `INSERT INTO student_accounts (
           id, username, student_id, learner_id, display_name, can_login, can_study,
           can_view_learning_data, can_manage_roster, blocked_reason, created_at,
           updated_at, last_login_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           username = excluded.username,
           student_id = excluded.student_id,
           learner_id = excluded.learner_id,
           display_name = excluded.display_name,
           can_login = excluded.can_login,
           can_study = excluded.can_study,
           can_view_learning_data = excluded.can_view_learning_data,
           can_manage_roster = excluded.can_manage_roster,
           blocked_reason = excluded.blocked_reason,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           last_login_at = excluded.last_login_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.username),
        asString(record.studentId),
        asString(record.learnerId),
        asString(record.displayName, "학생"),
        access.canLogin,
        access.canStudy,
        access.canViewLearningData,
        access.canManageRoster,
        access.blockedReason,
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        typeof record.lastLoginAt === "string" ? record.lastLoginAt : null,
        JSON.stringify(record),
      );
  });
}

export function batchAttempts(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO learning_attempts (
           id, learner_id, learner_name, grade, teacher_id, class_id, learning_level,
           learning_area, unit_id, topic_id, ok, created_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           learner_id = excluded.learner_id,
           learner_name = excluded.learner_name,
           grade = excluded.grade,
           teacher_id = excluded.teacher_id,
           class_id = excluded.class_id,
           learning_level = excluded.learning_level,
           learning_area = excluded.learning_area,
           unit_id = excluded.unit_id,
           topic_id = excluded.topic_id,
           ok = excluded.ok,
           created_at = excluded.created_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.learnerId),
        asString(record.learnerName, "학습자"),
        asString(record.grade, "학년 미지정"),
        typeof record.teacherId === "string" ? record.teacherId : null,
        typeof record.classId === "string" ? record.classId : null,
        typeof record.learningLevel === "string" ? record.learningLevel : null,
        typeof record.learningArea === "string" ? record.learningArea : null,
        asString(record.unitId),
        asString(record.topicId),
        record.ok === true ? 1 : 0,
        asString(record.createdAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

export function batchProgressOverrides(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO student_progress_overrides (id, student_id, learner_id, attempted, correct, updated_at, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           student_id = excluded.student_id,
           learner_id = excluded.learner_id,
           attempted = excluded.attempted,
           correct = excluded.correct,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.studentId),
        asString(record.learnerId),
        asNumber(record.attempted) ?? 0,
        asNumber(record.correct) ?? 0,
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

function batchProgressMapSettings(db: D1Database, records: JsonRecord[]) {
  return records
    .filter((record) => record.targetDaily !== undefined || record.focusTitle !== undefined || record.teacherMemo !== undefined)
    .map((record) =>
      db
        .prepare(
          `INSERT INTO student_progress_map_settings (
             id, student_id, learner_id, teacher_id, class_id, target_daily, focus_title,
             teacher_memo, updated_at, payload
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(student_id) DO UPDATE SET
             learner_id = excluded.learner_id,
             teacher_id = excluded.teacher_id,
             class_id = excluded.class_id,
             target_daily = excluded.target_daily,
             focus_title = excluded.focus_title,
             teacher_memo = excluded.teacher_memo,
             updated_at = excluded.updated_at,
             payload = excluded.payload`,
        )
        .bind(
          `${asString(record.studentId)}-progress-map`,
          asString(record.studentId),
          asString(record.learnerId),
          typeof record.teacherId === "string" ? record.teacherId : null,
          typeof record.classId === "string" ? record.classId : null,
          asNumber(record.targetDaily) ?? null,
          typeof record.focusTitle === "string" ? record.focusTitle : null,
          typeof record.teacherMemo === "string" ? record.teacherMemo : null,
          asString(record.updatedAt, new Date().toISOString()),
          JSON.stringify(record),
        ),
    );
}

export function batchAssignments(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO learning_assignments (
           id, assignment_type, teacher_id, class_id, student_id, learner_id,
           title, status, due_date, created_at, updated_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           assignment_type = excluded.assignment_type,
           teacher_id = excluded.teacher_id,
           class_id = excluded.class_id,
           student_id = excluded.student_id,
           learner_id = excluded.learner_id,
           title = excluded.title,
           status = excluded.status,
           due_date = excluded.due_date,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.assignmentType, "repeat-homework"),
        asString(record.teacherId),
        asString(record.classId),
        asString(record.studentId),
        asString(record.learnerId),
        asString(record.title, "반복학습 숙제"),
        asString(record.status, "assigned"),
        typeof record.dueDate === "string" ? record.dueDate : null,
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

function batchSecurityAlerts(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO learning_security_alerts (
           id, role, account_id, username, event_type, severity, created_at, acknowledged_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           role = excluded.role,
           account_id = excluded.account_id,
           username = excluded.username,
           event_type = excluded.event_type,
           severity = excluded.severity,
           created_at = excluded.created_at,
           acknowledged_at = excluded.acknowledged_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.role),
        typeof record.accountId === "string" ? record.accountId : null,
        asString(record.username),
        asString(record.eventType),
        asString(record.severity),
        asString(record.createdAt, new Date().toISOString()),
        typeof record.acknowledgedAt === "string" ? record.acknowledgedAt : null,
        JSON.stringify(record),
      ),
  );
}

function batchSettings(db: D1Database, record: JsonRecord) {
  return db
    .prepare(
      `INSERT INTO app_settings (id, teacher_id, class_id, student_id, updated_at, payload)
       VALUES ('active', ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         teacher_id = excluded.teacher_id,
         class_id = excluded.class_id,
         student_id = excluded.student_id,
         updated_at = excluded.updated_at,
         payload = excluded.payload`,
    )
    .bind(
      typeof record.teacherId === "string" ? record.teacherId : null,
      typeof record.classId === "string" ? record.classId : null,
      typeof record.studentId === "string" ? record.studentId : null,
      asString(record.updatedAt, new Date().toISOString()),
      JSON.stringify({ id: "active", ...record }),
    );
}

async function writeSnapshot(db: D1Database, snapshot: LearningCloudSnapshot) {
  const statements = [
    ...batchTeachers(db, snapshot.teachers ?? []),
    ...batchClasses(db, snapshot.classes ?? []),
    ...batchStudents(db, snapshot.students ?? []),
    ...batchAdminAccounts(db, snapshot.adminAccounts ?? []),
    ...batchTeacherAccounts(db, snapshot.teacherAccounts ?? []),
    ...batchStudentAccounts(db, snapshot.studentAccounts ?? []),
    ...batchProgressOverrides(db, snapshot.progressOverrides ?? []),
    ...batchProgressMapSettings(db, snapshot.progressOverrides ?? []),
    ...batchAssignments(db, snapshot.assignments ?? []),
    ...batchAttempts(db, snapshot.attempts ?? []),
    ...batchSecurityAlerts(db, snapshot.securityAlerts ?? []),
    batchSettings(db, snapshot.settings ?? { id: "active", updatedAt: new Date().toISOString() }),
  ];
  if (statements.length) await db.batch(statements);
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    return jsonResponse(await readSnapshot(requireDb(env)));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "학습 서버 데이터를 읽지 못했습니다." }, 500);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  if (!sameOriginAllowed(request)) return jsonResponse({ error: "같은 Cloudflare Pages origin에서만 저장할 수 있습니다." }, 403);
  try {
    const snapshot = (await request.json()) as LearningCloudSnapshot;
    await writeSnapshot(requireDb(env), snapshot);
    return jsonResponse({ ok: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "학습 서버 데이터를 저장하지 못했습니다." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}
