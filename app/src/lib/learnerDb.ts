import type { LearnerProfile } from "./readerPrefs";
import {
  canUseCloudLearningDb,
  loadCloudLearningSnapshot,
  saveCloudLearningSnapshot,
  type CloudLearningSnapshot,
  type CloudLearningSettingsRecord,
} from "./cloudLearningDb";

export interface LearnerAttemptRecord {
  id: string;
  learnerId: string;
  learnerName: string;
  grade: string;
  teacherId?: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  learningLevel?: string;
  learningArea?: string;
  unitId: string;
  unitNo: number;
  unitLabel?: string;
  unitTitle: string;
  topicId: string;
  topicTitle: string;
  problemKind: string;
  prompt: string;
  expression: string;
  learnerAnswer: string;
  correctAnswer: string;
  solution: string;
  ok: boolean;
  sessionTitle: string;
  createdAt: string;
}

export interface LearnerAttemptInput extends Omit<LearnerAttemptRecord, "id" | "createdAt"> {
  createdAt?: string;
}

export interface TopicInsight {
  unitId: string;
  unitNo: number;
  unitLabel?: string;
  unitTitle: string;
  topicId: string;
  topicTitle: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  wrongRate: number;
  lastStudiedAt?: string;
}

export interface LearnerPlan {
  level: "기초 다지기" | "안정 연습" | "심화 확장";
  dailyTarget: number;
  nextTitle: string;
  strategy: string;
  weaknessTitle: string;
  totalAttempts: number;
  accuracy: number;
  wrongRate: number;
  wrongNoteCount: number;
  generatedAt: string;
}

export interface LearnerDbSnapshot {
  storage: LearningStorage;
  attempts: LearnerAttemptRecord[];
  wrongNotes: LearnerAttemptRecord[];
  topics: TopicInsight[];
  plan: LearnerPlan;
}

export interface TeacherRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface StudentRecord {
  id: string;
  learnerId: string;
  name: string;
  grade: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountRole = "admin" | "teacher" | "student";

export interface LearningAccountAccess {
  canLogin: boolean;
  canStudy: boolean;
  canViewLearningData: boolean;
  canManageRoster: boolean;
  blockedReason?: string;
  updatedAt?: string;
}

export type LearningSecurityEventType = "failed-login" | "rapid-wrong-answer";

export interface LearningSecurityAlert {
  id: string;
  role: "teacher" | "student";
  accountId?: string;
  username: string;
  displayName?: string;
  eventType: LearningSecurityEventType;
  eventCount: number;
  severity: "watch" | "auto-blocked";
  message: string;
  emailSubject: string;
  emailBody: string;
  kakaoMessage: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface AdminAccountRecord {
  id: string;
  role: "admin";
  username: string;
  email: string;
  authProvider: "google" | "local";
  displayName: string;
  googleSub?: string;
  pictureUrl?: string;
  emailVerified?: boolean;
  tokenAud?: string;
  tokenExp?: number;
  passwordHash?: string;
  credentialScheme?: "sha256-v1";
  securityVersion?: number;
  passwordUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface TeacherAccountRecord {
  id: string;
  role: "teacher";
  username: string;
  passwordHash: string;
  displayName: string;
  teacherId: string;
  access?: LearningAccountAccess;
  credentialScheme?: "sha256-v1";
  securityVersion?: number;
  passwordUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface StudentAccountRecord {
  id: string;
  role: "student";
  username: string;
  passwordHash: string;
  displayName: string;
  studentId: string;
  learnerId: string;
  access?: LearningAccountAccess;
  credentialScheme?: "sha256-v1";
  securityVersion?: number;
  passwordUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type AuthAccountRecord = AdminAccountRecord | TeacherAccountRecord | StudentAccountRecord;

export type AuthAccountSummary =
  | Omit<AdminAccountRecord, "passwordHash">
  | Omit<TeacherAccountRecord, "passwordHash">
  | Omit<StudentAccountRecord, "passwordHash">;

interface RosterSettingsRecord {
  id: "active";
  teacherId?: string;
  classId?: string;
  studentId?: string;
  adminAccountId?: string;
  teacherAccountId?: string;
  studentAccountId?: string;
  updatedAt: string;
}

export interface LearningRosterSnapshot {
  storage: LearningStorage;
  teachers: TeacherRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  activeTeacher?: TeacherRecord;
  activeClass?: ClassRecord;
  activeStudent?: StudentRecord;
  settings: RosterSettingsRecord;
}

export interface LearningAuthSnapshot {
  storage: LearningStorage;
  adminAccounts: AuthAccountSummary[];
  teacherAccounts: AuthAccountSummary[];
  studentAccounts: AuthAccountSummary[];
  activeAdminAccount?: AuthAccountSummary;
  activeTeacherAccount?: AuthAccountSummary;
  activeStudentAccount?: AuthAccountSummary;
  settings: RosterSettingsRecord;
}

export interface StudentProgressMapItem {
  id: string;
  label: string;
  attempted: number;
  accuracy: number;
  wrongRate: number;
  status: "empty" | "watch" | "steady" | "strong";
}

export interface ClassStudentProgress {
  student: StudentRecord;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  wrongRate: number;
  lastStudiedAt?: string;
  actualAttempted?: number;
  actualCorrect?: number;
  progressEditedAt?: string;
  progressTargetDaily?: number;
  progressFocusTitle?: string;
  progressTeacherMemo?: string;
  coaching: string;
  nextTitle: string;
  progressMap: StudentProgressMapItem[];
  assignments: StudentLearningAssignmentRecord[];
  attempts: LearnerAttemptRecord[];
}

export type StudentLearningAssignmentType = "remedial" | "repeat-homework";
export type StudentLearningAssignmentStatus = "assigned" | "completed";

export interface StudentLearningAssignmentRecord {
  id: string;
  assignmentType: StudentLearningAssignmentType;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  studentId: string;
  learnerId: string;
  studentName: string;
  title: string;
  description: string;
  targetDaily?: number;
  focusTitle?: string;
  dueDate?: string;
  status: StudentLearningAssignmentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface StudentProgressOverrideRecord {
  id: string;
  studentId: string;
  learnerId: string;
  teacherId?: string;
  classId?: string;
  attempted: number;
  correct: number;
  targetDaily?: number;
  focusTitle?: string;
  teacherMemo?: string;
  updatedAt: string;
}

export interface ClassLearningProgressSnapshot {
  storage: LearningStorage;
  classRecord?: ClassRecord;
  teacherRecord?: TeacherRecord;
  students: ClassStudentProgress[];
  generatedAt: string;
}

export interface AdminLearningSnapshot {
  storage: LearningStorage;
  teachers: TeacherRecord[];
  classes: ClassRecord[];
  students: StudentRecord[];
  adminAccounts: AdminAccountRecord[];
  teacherAccounts: TeacherAccountRecord[];
  studentAccounts: StudentAccountRecord[];
  progressOverrides: StudentProgressOverrideRecord[];
  assignments: StudentLearningAssignmentRecord[];
  attempts: LearnerAttemptRecord[];
  securityAlerts: LearningSecurityAlert[];
  generatedAt: string;
}

export const ACCOUNT_APPROVAL_PENDING_REASON = "approval-pending";

export type LearningStorage = "cloudflare" | "indexedDB" | "localStorage";

const DB_NAME = "kang-taehoon-math-learner-db";
const DB_VERSION = 6;
const PROFILE_STORE = "profiles";
const ATTEMPT_STORE = "attempts";
const TEACHER_STORE = "teachers";
const CLASS_STORE = "classes";
const STUDENT_STORE = "students";
const ADMIN_ACCOUNT_STORE = "adminAccounts";
const TEACHER_ACCOUNT_STORE = "teacherAccounts";
const STUDENT_ACCOUNT_STORE = "studentAccounts";
const PROGRESS_OVERRIDE_STORE = "studentProgressOverrides";
const ASSIGNMENT_STORE = "studentLearningAssignments";
const SETTINGS_STORE = "settings";
const FALLBACK_PREFIX = "kang-math-learner-db";
const ROSTER_FALLBACK_KEY = `${FALLBACK_PREFIX}:roster`;
const AUTH_FALLBACK_KEY = `${FALLBACK_PREFIX}:auth`;
const PROGRESS_OVERRIDE_FALLBACK_KEY = `${FALLBACK_PREFIX}:progress-overrides`;
const ASSIGNMENT_FALLBACK_KEY = `${FALLBACK_PREFIX}:assignments`;
const SECURITY_ALERT_FALLBACK_KEY = `${FALLBACK_PREFIX}:security-alerts`;
const ACTIVE_SETTINGS_ID: RosterSettingsRecord["id"] = "active";
const SECURITY_FAILED_LOGIN_THRESHOLD = 5;
const SECURITY_FAILED_LOGIN_WINDOW_MS = 10 * 60 * 1000;
const SECURITY_RAPID_WRONG_THRESHOLD = 6;
const SECURITY_RAPID_WRONG_WINDOW_MS = 3 * 60 * 1000;

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function attemptId(learnerId: string) {
  const random = Math.random().toString(36).slice(2, 9);
  return `${learnerId}-${Date.now()}-${random}`;
}

function entityId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

function normalizeText(value: string, fallback: string) {
  return value.trim().replace(/\s+/g, " ") || fallback;
}

function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function defaultAccountAccess(role: "teacher" | "student", now = new Date().toISOString()): LearningAccountAccess {
  return {
    canLogin: true,
    canStudy: true,
    canViewLearningData: role === "teacher",
    canManageRoster: role === "teacher",
    updatedAt: now,
  };
}

function pendingApprovalAccess(role: "teacher" | "student", now = new Date().toISOString()): LearningAccountAccess {
  return {
    ...defaultAccountAccess(role, now),
    canLogin: false,
    canStudy: false,
    canViewLearningData: false,
    canManageRoster: false,
    blockedReason: ACCOUNT_APPROVAL_PENDING_REASON,
  };
}

function normalizeAccountAccess(
  role: "teacher" | "student",
  access?: Partial<LearningAccountAccess>,
  now = new Date().toISOString(),
): LearningAccountAccess {
  const defaults = defaultAccountAccess(role, now);
  return {
    canLogin: access?.canLogin ?? defaults.canLogin,
    canStudy: access?.canStudy ?? defaults.canStudy,
    canViewLearningData: access?.canViewLearningData ?? defaults.canViewLearningData,
    canManageRoster: role === "teacher" ? (access?.canManageRoster ?? defaults.canManageRoster) : false,
    blockedReason: access?.blockedReason,
    updatedAt: access?.updatedAt ?? defaults.updatedAt,
  };
}

function normalizeTeacherAccountSecurity(account: TeacherAccountRecord): TeacherAccountRecord {
  return {
    ...account,
    access: normalizeAccountAccess("teacher", account.access, account.updatedAt ?? account.createdAt),
    credentialScheme: account.credentialScheme ?? "sha256-v1",
    securityVersion: account.securityVersion ?? 2,
    passwordUpdatedAt: account.passwordUpdatedAt ?? account.updatedAt ?? account.createdAt,
  };
}

function normalizeStudentAccountSecurity(account: StudentAccountRecord): StudentAccountRecord {
  return {
    ...account,
    access: normalizeAccountAccess("student", account.access, account.updatedAt ?? account.createdAt),
    credentialScheme: account.credentialScheme ?? "sha256-v1",
    securityVersion: account.securityVersion ?? 2,
    passwordUpdatedAt: account.passwordUpdatedAt ?? account.updatedAt ?? account.createdAt,
  };
}

function assertAccountCanLogin(account: TeacherAccountRecord | StudentAccountRecord) {
  if (account.access?.canLogin === false) {
    const roleLabel = account.role === "teacher" ? "교사용" : "학생용";
    if (account.access.blockedReason === ACCOUNT_APPROVAL_PENDING_REASON) {
      throw new Error(`${roleLabel} 계정은 관리자 승인 후 로그인할 수 있습니다.`);
    }
    throw new Error(`${roleLabel} 계정 접근이 관리자에 의해 제한되었습니다.`);
  }
}

function isLearningAccountGateError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("맞지 않습니다") ||
    error.message.includes("접근이 관리자") ||
    error.message.includes("관리자 승인")
  );
}

function readSecurityAlerts() {
  try {
    if (typeof localStorage === "undefined") return [] as LearningSecurityAlert[];
    const raw = localStorage.getItem(SECURITY_ALERT_FALLBACK_KEY);
    if (!raw) return [] as LearningSecurityAlert[];
    const parsed = JSON.parse(raw) as LearningSecurityAlert[];
    return parsed
      .filter((item) => item && typeof item.id === "string")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [] as LearningSecurityAlert[];
  }
}

function writeSecurityAlerts(alerts: LearningSecurityAlert[], syncCloud = true) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SECURITY_ALERT_FALLBACK_KEY, JSON.stringify(alerts.slice(0, 300)));
  } catch {
    // 보안 알림 저장 실패가 학습 흐름 자체를 막지 않도록 합니다.
  }
  if (syncCloud) void syncCloudSnapshotFromIndexed();
}

function roleLabel(role: "teacher" | "student") {
  return role === "teacher" ? "교사용" : "학생용";
}

function securityEventLabel(eventType: LearningSecurityEventType) {
  return eventType === "failed-login" ? "반복 로그인 실패" : "빠른 연속 오답";
}

function buildSecurityMessage(input: {
  role: "teacher" | "student";
  username: string;
  displayName?: string;
  eventType: LearningSecurityEventType;
  eventCount: number;
  severity: LearningSecurityAlert["severity"];
}) {
  const who = `${roleLabel(input.role)} ${input.username}${input.displayName ? ` (${input.displayName})` : ""}`;
  const eventLabel = securityEventLabel(input.eventType);
  const action =
    input.severity === "auto-blocked"
      ? "기준을 초과해 사용 권한을 자동 제한했습니다."
      : "이상 징후를 감시 목록에 기록했습니다.";
  return `${who} 계정에서 ${eventLabel} ${input.eventCount}회가 감지되어 ${action}`;
}

function buildSecurityAlert(input: {
  role: "teacher" | "student";
  accountId?: string;
  username: string;
  displayName?: string;
  eventType: LearningSecurityEventType;
  eventCount: number;
  severity: LearningSecurityAlert["severity"];
  createdAt: string;
}): LearningSecurityAlert {
  const message = buildSecurityMessage(input);
  const subject = `[푸르넷수학 전자북] ${securityEventLabel(input.eventType)} ${input.severity === "auto-blocked" ? "자동 제한" : "감시"} 알림`;
  const body = [
    message,
    "",
    `역할: ${roleLabel(input.role)}`,
    `아이디: ${input.username}`,
    input.displayName ? `이름: ${input.displayName}` : undefined,
    `감지 유형: ${securityEventLabel(input.eventType)}`,
    `감지 횟수: ${input.eventCount}`,
    `처리 상태: ${input.severity === "auto-blocked" ? "자동 권한 제한" : "감시 기록"}`,
    `감지 시각: ${input.createdAt}`,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    id: entityId("security-alert"),
    role: input.role,
    accountId: input.accountId,
    username: input.username,
    displayName: input.displayName,
    eventType: input.eventType,
    eventCount: input.eventCount,
    severity: input.severity,
    message,
    emailSubject: subject,
    emailBody: body,
    kakaoMessage: `${subject}\n${body}`,
    createdAt: input.createdAt,
  };
}

function appendSecurityAlert(alert: LearningSecurityAlert) {
  const alerts = readSecurityAlerts();
  writeSecurityAlerts([alert, ...alerts.filter((item) => item.id !== alert.id)]);
  return alert;
}

function recentSecurityAlertCount(
  alerts: LearningSecurityAlert[],
  input: {
    role: "teacher" | "student";
    accountId?: string;
    username: string;
    eventType: LearningSecurityEventType;
    windowMs: number;
    nowMs: number;
  },
) {
  return alerts.filter((alert) => {
    const sameAccount = input.accountId ? alert.accountId === input.accountId : alert.username === input.username;
    return (
      alert.role === input.role &&
      sameAccount &&
      alert.eventType === input.eventType &&
      input.nowMs - new Date(alert.createdAt).getTime() <= input.windowMs
    );
  }).length;
}

async function monitorFailedLearningLogin(
  role: "teacher" | "student",
  username: string,
  account?: TeacherAccountRecord | StudentAccountRecord,
) {
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const alerts = readSecurityAlerts();
  const eventCount =
    recentSecurityAlertCount(alerts, {
      role,
      accountId: account?.id,
      username,
      eventType: "failed-login",
      windowMs: SECURITY_FAILED_LOGIN_WINDOW_MS,
      nowMs,
    }) + 1;
  const shouldBlock = Boolean(account?.id && eventCount >= SECURITY_FAILED_LOGIN_THRESHOLD);
  const alert = appendSecurityAlert(
    buildSecurityAlert({
      role,
      accountId: account?.id,
      username,
      displayName: account?.displayName,
      eventType: "failed-login",
      eventCount,
      severity: shouldBlock ? "auto-blocked" : "watch",
      createdAt: now,
    }),
  );
  if (shouldBlock && account) {
    await updateLearningAccountAccess({
      role,
      accountId: account.id,
      access: {
        canLogin: false,
        canStudy: false,
        canViewLearningData: false,
        canManageRoster: false,
        blockedReason: alert.message,
      },
    });
  }
}

async function monitorRapidWrongAttempts(record: LearnerAttemptRecord) {
  if (record.ok) return;
  let attempts: LearnerAttemptRecord[];
  try {
    attempts = await readIndexedDbAttempts(record.learnerId);
  } catch {
    attempts = readFallbackAttempts(record.learnerId);
  }
  const recentWrongAttempts = attempts.filter(
    (attempt) =>
      !attempt.ok &&
      attempt.learnerId === record.learnerId &&
      new Date(record.createdAt).getTime() - new Date(attempt.createdAt).getTime() <= SECURITY_RAPID_WRONG_WINDOW_MS,
  );
  if (recentWrongAttempts.length < SECURITY_RAPID_WRONG_THRESHOLD) return;

  const auth = await loadLearningAuthSnapshot();
  const account = auth.studentAccounts.find(
    (item): item is Omit<StudentAccountRecord, "passwordHash"> =>
      item.role === "student" && item.learnerId === record.learnerId,
  );
  if (!account || !account.access?.canStudy) return;
  const alert = appendSecurityAlert(
    buildSecurityAlert({
      role: "student",
      accountId: account.id,
      username: account.username,
      displayName: account.displayName,
      eventType: "rapid-wrong-answer",
      eventCount: recentWrongAttempts.length,
      severity: "auto-blocked",
      createdAt: record.createdAt,
    }),
  );
  await updateLearningAccountAccess({
    role: "student",
    accountId: account.id,
    access: {
      canLogin: true,
      canStudy: false,
      canViewLearningData: false,
      canManageRoster: false,
      blockedReason: alert.message,
    },
  });
}

export async function acknowledgeLearningSecurityAlert(alertId: string) {
  const now = new Date().toISOString();
  const alerts = readSecurityAlerts();
  writeSecurityAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, acknowledgedAt: now } : alert)));
  return readSecurityAlerts();
}

function learnerIdFromStudent(name: string, grade: string) {
  return encodeURIComponent(`${grade.trim()}__${name.trim()}`.toLowerCase());
}

function byteToHex(byte: number) {
  return byte.toString(16).padStart(2, "0");
}

function fallbackHashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

async function hashPassword(role: AccountRole, username: string, password: string) {
  const source = `${role}:${normalizeUsername(username)}:${password}`;
  try {
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(source);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return `sha256-${Array.from(new Uint8Array(digest), byteToHex).join("")}`;
    }
  } catch {
    // Web Crypto가 막힌 file 실행 환경에서는 로컬 대체 해시를 사용합니다.
  }
  return fallbackHashText(source);
}

function fallbackKey(learnerId: string) {
  return `${FALLBACK_PREFIX}:attempts:${learnerId}`;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ATTEMPT_STORE)) {
        const store = db.createObjectStore(ATTEMPT_STORE, { keyPath: "id" });
        store.createIndex("learnerId", "learnerId", { unique: false });
        store.createIndex("topicId", "topicId", { unique: false });
        store.createIndex("learnerTopic", ["learnerId", "topicId"], { unique: false });
        store.createIndex("learnerOk", ["learnerId", "ok"], { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("teacherId", "teacherId", { unique: false });
        store.createIndex("classId", "classId", { unique: false });
        store.createIndex("classStudent", ["classId", "learnerId"], { unique: false });
      } else {
        const store = request.transaction?.objectStore(ATTEMPT_STORE);
        if (store && !store.indexNames.contains("teacherId")) {
          store.createIndex("teacherId", "teacherId", { unique: false });
        }
        if (store && !store.indexNames.contains("classId")) {
          store.createIndex("classId", "classId", { unique: false });
        }
        if (store && !store.indexNames.contains("classStudent")) {
          store.createIndex("classStudent", ["classId", "learnerId"], { unique: false });
        }
      }
      if (!db.objectStoreNames.contains(TEACHER_STORE)) {
        db.createObjectStore(TEACHER_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CLASS_STORE)) {
        const store = db.createObjectStore(CLASS_STORE, { keyPath: "id" });
        store.createIndex("teacherId", "teacherId", { unique: false });
        store.createIndex("grade", "grade", { unique: false });
      }
      if (!db.objectStoreNames.contains(STUDENT_STORE)) {
        const store = db.createObjectStore(STUDENT_STORE, { keyPath: "id" });
        store.createIndex("learnerId", "learnerId", { unique: false });
        store.createIndex("classId", "classId", { unique: false });
        store.createIndex("teacherId", "teacherId", { unique: false });
      }
      if (!db.objectStoreNames.contains(ADMIN_ACCOUNT_STORE)) {
        const store = db.createObjectStore(ADMIN_ACCOUNT_STORE, { keyPath: "id" });
        store.createIndex("username", "username", { unique: true });
        store.createIndex("email", "email", { unique: true });
      } else {
        const store = request.transaction?.objectStore(ADMIN_ACCOUNT_STORE);
        if (store && !store.indexNames.contains("email")) {
          store.createIndex("email", "email", { unique: true });
        }
      }
      if (!db.objectStoreNames.contains(TEACHER_ACCOUNT_STORE)) {
        const store = db.createObjectStore(TEACHER_ACCOUNT_STORE, { keyPath: "id" });
        store.createIndex("username", "username", { unique: true });
        store.createIndex("teacherId", "teacherId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STUDENT_ACCOUNT_STORE)) {
        const store = db.createObjectStore(STUDENT_ACCOUNT_STORE, { keyPath: "id" });
        store.createIndex("username", "username", { unique: true });
        store.createIndex("studentId", "studentId", { unique: false });
        store.createIndex("learnerId", "learnerId", { unique: false });
      }
      if (!db.objectStoreNames.contains(PROGRESS_OVERRIDE_STORE)) {
        const store = db.createObjectStore(PROGRESS_OVERRIDE_STORE, { keyPath: "id" });
        store.createIndex("studentId", "studentId", { unique: true });
        store.createIndex("learnerId", "learnerId", { unique: false });
      }
      if (!db.objectStoreNames.contains(ASSIGNMENT_STORE)) {
        const store = db.createObjectStore(ASSIGNMENT_STORE, { keyPath: "id" });
        store.createIndex("studentId", "studentId", { unique: false });
        store.createIndex("teacherId", "teacherId", { unique: false });
        store.createIndex("classId", "classId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function normalizeAttempt(input: LearnerAttemptInput): LearnerAttemptRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    ...input,
    id: attemptId(input.learnerId),
    createdAt,
  };
}

async function readAllIndexedDirect<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  const transaction = db.transaction(storeName, "readonly");
  const records = await requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
  db.close();
  return records;
}

async function readIndexedDirect<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb();
  const transaction = db.transaction(storeName, "readonly");
  const record = await requestToPromise<T | undefined>(transaction.objectStore(storeName).get(key));
  db.close();
  return record;
}

async function readAllIndexed<T>(storeName: string): Promise<T[]> {
  await ensureCloudSnapshotHydrated();
  return readAllIndexedDirect<T>(storeName);
}

async function readIndexed<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  await ensureCloudSnapshotHydrated();
  return readIndexedDirect<T>(storeName, key);
}

async function writeIndexedRecords(storeNames: string[], writer: (transaction: IDBTransaction) => void) {
  const db = await openDb();
  const transaction = db.transaction(storeNames, "readwrite");
  writer(transaction);
  await transactionDone(transaction);
  db.close();
  await syncCloudSnapshotFromIndexed();
}

function readFallbackAttempts(learnerId: string): LearnerAttemptRecord[] {
  try {
    const raw = localStorage.getItem(fallbackKey(learnerId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function readAllFallbackAttempts(): LearnerAttemptRecord[] {
  const attempts: LearnerAttemptRecord[] = [];
  const attemptsPrefix = `${FALLBACK_PREFIX}:attempts:`;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(attemptsPrefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const records = JSON.parse(raw) as LearnerAttemptRecord[];
      attempts.push(...records);
    }
  } catch {
    return attempts;
  }
  return attempts;
}

function writeFallbackAttempt(record: LearnerAttemptRecord) {
  const attempts = [record, ...readFallbackAttempts(record.learnerId)].slice(0, 3000);
  localStorage.setItem(fallbackKey(record.learnerId), JSON.stringify(attempts));
}

function readFallbackProgressOverrides(): StudentProgressOverrideRecord[] {
  try {
    const raw = localStorage.getItem(PROGRESS_OVERRIDE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFallbackProgressOverrides(records: StudentProgressOverrideRecord[]) {
  localStorage.setItem(PROGRESS_OVERRIDE_FALLBACK_KEY, JSON.stringify(records));
}

function readFallbackAssignments(): StudentLearningAssignmentRecord[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFallbackAssignments(records: StudentLearningAssignmentRecord[]) {
  localStorage.setItem(ASSIGNMENT_FALLBACK_KEY, JSON.stringify(records.slice(0, 1000)));
}

function defaultRosterSettings(): RosterSettingsRecord {
  return { id: ACTIVE_SETTINGS_ID, updatedAt: new Date().toISOString() };
}

function emptyFallbackRoster() {
  return {
    teachers: [] as TeacherRecord[],
    classes: [] as ClassRecord[],
    students: [] as StudentRecord[],
    settings: defaultRosterSettings(),
  };
}

function readFallbackRoster() {
  try {
    const raw = localStorage.getItem(ROSTER_FALLBACK_KEY);
    if (!raw) return emptyFallbackRoster();
    const parsed = JSON.parse(raw) as Partial<ReturnType<typeof emptyFallbackRoster>>;
    return {
      teachers: parsed.teachers ?? [],
      classes: parsed.classes ?? [],
      students: parsed.students ?? [],
      settings: { ...defaultRosterSettings(), ...parsed.settings },
    };
  } catch {
    return emptyFallbackRoster();
  }
}

function writeFallbackRoster(roster: ReturnType<typeof emptyFallbackRoster>) {
  localStorage.setItem(ROSTER_FALLBACK_KEY, JSON.stringify(roster));
}

function emptyFallbackAuth() {
  return {
    adminAccounts: [] as AdminAccountRecord[],
    teacherAccounts: [] as TeacherAccountRecord[],
    studentAccounts: [] as StudentAccountRecord[],
    settings: defaultRosterSettings(),
  };
}

function readFallbackAuth() {
  try {
    const raw = localStorage.getItem(AUTH_FALLBACK_KEY);
    if (!raw) return emptyFallbackAuth();
    const parsed = JSON.parse(raw) as Partial<ReturnType<typeof emptyFallbackAuth>>;
    return {
      adminAccounts: parsed.adminAccounts ?? [],
      teacherAccounts: (parsed.teacherAccounts ?? []).map(normalizeTeacherAccountSecurity),
      studentAccounts: (parsed.studentAccounts ?? []).map(normalizeStudentAccountSecurity),
      settings: { ...defaultRosterSettings(), ...parsed.settings },
    };
  } catch {
    return emptyFallbackAuth();
  }
}

function writeFallbackAuth(auth: ReturnType<typeof emptyFallbackAuth>) {
  localStorage.setItem(AUTH_FALLBACK_KEY, JSON.stringify(auth));
  const roster = readFallbackRoster();
  roster.settings = { ...roster.settings, ...auth.settings };
  writeFallbackRoster(roster);
}

let cloudSnapshotHydrated = false;
let cloudSnapshotActive = false;
let cloudHydrationPromise: Promise<void> | null = null;
let cloudSavePromise: Promise<void> = Promise.resolve();
let cloudDisabledUntil = 0;
let applyingCloudSnapshot = false;

function currentIndexedStorage(): LearningStorage {
  return cloudSnapshotActive ? "cloudflare" : "indexedDB";
}

function cloudSettingsFromLocal(settings: RosterSettingsRecord): CloudLearningSettingsRecord {
  return {
    id: ACTIVE_SETTINGS_ID,
    teacherId: settings.teacherId,
    classId: settings.classId,
    studentId: settings.studentId,
    updatedAt: settings.updatedAt,
  };
}

function mergeCloudSettingsWithLocalSession(
  cloudSettings: CloudLearningSettingsRecord,
  localSettings?: RosterSettingsRecord,
): RosterSettingsRecord {
  return {
    ...cloudSettings,
    adminAccountId: localSettings?.adminAccountId,
    teacherAccountId: localSettings?.teacherAccountId,
    studentAccountId: localSettings?.studentAccountId,
    updatedAt: cloudSettings.updatedAt ?? localSettings?.updatedAt ?? new Date().toISOString(),
  };
}

function cloudSnapshotHasData(
  snapshot: Pick<
    CloudLearningSnapshot,
    | "teachers"
    | "classes"
    | "students"
    | "adminAccounts"
    | "teacherAccounts"
    | "studentAccounts"
    | "progressOverrides"
    | "assignments"
    | "attempts"
    | "securityAlerts"
  >,
) {
  return (
    snapshot.teachers.length > 0 ||
    snapshot.classes.length > 0 ||
    snapshot.students.length > 0 ||
    snapshot.adminAccounts.length > 0 ||
    snapshot.teacherAccounts.length > 0 ||
    snapshot.studentAccounts.length > 0 ||
    snapshot.progressOverrides.length > 0 ||
    (snapshot.assignments?.length ?? 0) > 0 ||
    snapshot.attempts.length > 0 ||
    snapshot.securityAlerts.length > 0
  );
}

function snapshotRecordCount(
  snapshot: Pick<
    CloudLearningSnapshot,
    | "teachers"
    | "classes"
    | "students"
    | "adminAccounts"
    | "teacherAccounts"
    | "studentAccounts"
    | "progressOverrides"
    | "assignments"
    | "attempts"
    | "securityAlerts"
  >,
) {
  return (
    snapshot.teachers.length +
    snapshot.classes.length +
    snapshot.students.length +
    snapshot.adminAccounts.length +
    snapshot.teacherAccounts.length +
    snapshot.studentAccounts.length +
    snapshot.progressOverrides.length +
    (snapshot.assignments?.length ?? 0) +
    snapshot.attempts.length +
    snapshot.securityAlerts.length
  );
}

function cloudSnapshotAppearsOlderThanLocal(
  cloudSnapshot: CloudLearningSnapshot,
  localSnapshot: CloudLearningSnapshot,
) {
  const localCount = snapshotRecordCount(localSnapshot);
  const cloudCount = snapshotRecordCount(cloudSnapshot);
  if (localCount > cloudCount) return true;

  const localUpdatedAt = Date.parse(localSnapshot.settings?.updatedAt ?? localSnapshot.syncedAt ?? "");
  const cloudUpdatedAt = Date.parse(cloudSnapshot.settings?.updatedAt ?? cloudSnapshot.syncedAt ?? "");
  if (Number.isFinite(localUpdatedAt) && Number.isFinite(cloudUpdatedAt) && localUpdatedAt > cloudUpdatedAt) {
    return true;
  }

  return false;
}

function cloudAvailableNow() {
  return canUseCloudLearningDb() && Date.now() >= cloudDisabledUntil;
}

function pauseCloudAfterError() {
  cloudDisabledUntil = Date.now() + 15_000;
}

async function readFullIndexedSnapshotDirect(): Promise<CloudLearningSnapshot> {
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
    settings,
  ] = await Promise.all([
    readAllIndexedDirect<TeacherRecord>(TEACHER_STORE),
    readAllIndexedDirect<ClassRecord>(CLASS_STORE),
    readAllIndexedDirect<StudentRecord>(STUDENT_STORE),
    readAllIndexedDirect<AdminAccountRecord>(ADMIN_ACCOUNT_STORE),
    readAllIndexedDirect<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE),
    readAllIndexedDirect<StudentAccountRecord>(STUDENT_ACCOUNT_STORE),
    readAllIndexedDirect<StudentProgressOverrideRecord>(PROGRESS_OVERRIDE_STORE),
    readAllIndexedDirect<StudentLearningAssignmentRecord>(ASSIGNMENT_STORE),
    readAllIndexedDirect<LearnerAttemptRecord>(ATTEMPT_STORE),
    readIndexedDirect<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID),
  ]);
  return {
    teachers,
    classes,
    students,
    adminAccounts,
    teacherAccounts: teacherAccounts.map(normalizeTeacherAccountSecurity),
    studentAccounts: studentAccounts.map(normalizeStudentAccountSecurity),
    progressOverrides,
    assignments,
    attempts,
    securityAlerts: readSecurityAlerts(),
    settings: cloudSettingsFromLocal(settings ?? defaultRosterSettings()),
    syncedAt: new Date().toISOString(),
  };
}

async function applyCloudSnapshotToIndexed(snapshot: CloudLearningSnapshot) {
  const localSettings = await readIndexedDirect<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID).catch(() => undefined);
  const settings = mergeCloudSettingsWithLocalSession(snapshot.settings, localSettings);
  const db = await openDb();
  const transaction = db.transaction(
    [
      TEACHER_STORE,
      CLASS_STORE,
      STUDENT_STORE,
      ADMIN_ACCOUNT_STORE,
      TEACHER_ACCOUNT_STORE,
      STUDENT_ACCOUNT_STORE,
      PROGRESS_OVERRIDE_STORE,
      ASSIGNMENT_STORE,
      ATTEMPT_STORE,
      SETTINGS_STORE,
    ],
    "readwrite",
  );
  for (const storeName of [
    TEACHER_STORE,
    CLASS_STORE,
    STUDENT_STORE,
    ADMIN_ACCOUNT_STORE,
    TEACHER_ACCOUNT_STORE,
    STUDENT_ACCOUNT_STORE,
    PROGRESS_OVERRIDE_STORE,
    ASSIGNMENT_STORE,
    ATTEMPT_STORE,
  ]) {
    transaction.objectStore(storeName).clear();
  }
  for (const teacher of snapshot.teachers) transaction.objectStore(TEACHER_STORE).put(teacher);
  for (const classRecord of snapshot.classes) transaction.objectStore(CLASS_STORE).put(classRecord);
  for (const student of snapshot.students) transaction.objectStore(STUDENT_STORE).put(student);
  for (const account of snapshot.adminAccounts) transaction.objectStore(ADMIN_ACCOUNT_STORE).put(account);
  for (const account of snapshot.teacherAccounts.map(normalizeTeacherAccountSecurity)) {
    transaction.objectStore(TEACHER_ACCOUNT_STORE).put(account);
  }
  for (const account of snapshot.studentAccounts.map(normalizeStudentAccountSecurity)) {
    transaction.objectStore(STUDENT_ACCOUNT_STORE).put(account);
  }
  for (const override of snapshot.progressOverrides) transaction.objectStore(PROGRESS_OVERRIDE_STORE).put(override);
  for (const assignment of snapshot.assignments ?? []) transaction.objectStore(ASSIGNMENT_STORE).put(assignment);
  for (const attempt of snapshot.attempts) transaction.objectStore(ATTEMPT_STORE).put(attempt);
  transaction.objectStore(SETTINGS_STORE).put(settings);
  await transactionDone(transaction);
  db.close();
  writeSecurityAlerts(snapshot.securityAlerts, false);
}

async function hydrateCloudSnapshotOnce() {
  if (!cloudAvailableNow()) return;
  try {
    const cloudSnapshot = await loadCloudLearningSnapshot();
    if (!cloudSnapshot) {
      cloudSnapshotHydrated = true;
      return;
    }

    const localSnapshot = await readFullIndexedSnapshotDirect().catch(() => null);
    if (!cloudSnapshotHasData(cloudSnapshot) && localSnapshot && cloudSnapshotHasData(localSnapshot)) {
      await saveCloudLearningSnapshot(localSnapshot);
      cloudSnapshotHydrated = true;
      cloudSnapshotActive = true;
      return;
    }

    if (localSnapshot && cloudSnapshotAppearsOlderThanLocal(cloudSnapshot, localSnapshot)) {
      await saveCloudLearningSnapshot(localSnapshot);
      cloudSnapshotHydrated = true;
      cloudSnapshotActive = true;
      return;
    }

    applyingCloudSnapshot = true;
    try {
      await applyCloudSnapshotToIndexed(cloudSnapshot);
    } finally {
      applyingCloudSnapshot = false;
    }
    cloudSnapshotHydrated = true;
    cloudSnapshotActive = true;
  } catch {
    pauseCloudAfterError();
  }
}

async function ensureCloudSnapshotHydrated() {
  if (cloudSnapshotHydrated || applyingCloudSnapshot || !cloudAvailableNow()) return;
  cloudHydrationPromise ??= hydrateCloudSnapshotOnce().finally(() => {
    cloudHydrationPromise = null;
  });
  await cloudHydrationPromise;
}

async function syncCloudSnapshotFromIndexed() {
  if (applyingCloudSnapshot || !cloudAvailableNow()) return;
  cloudSavePromise = cloudSavePromise
    .then(async () => {
      await ensureCloudSnapshotHydrated();
      const snapshot = await readFullIndexedSnapshotDirect();
      if (!cloudSnapshotHasData(snapshot)) return;
      await saveCloudLearningSnapshot(snapshot);
      cloudSnapshotActive = true;
    })
    .catch(() => {
      pauseCloudAfterError();
    });
  await cloudSavePromise;
}

function toAuthSummary(account: AdminAccountRecord): AuthAccountSummary;
function toAuthSummary(account: TeacherAccountRecord): AuthAccountSummary;
function toAuthSummary(account: StudentAccountRecord): AuthAccountSummary;
function toAuthSummary(account: AuthAccountRecord): AuthAccountSummary {
  const { passwordHash: _passwordHash, ...summary } = account;
  void _passwordHash;
  return summary;
}

function snapshotFromAuthParts(
  storage: LearningAuthSnapshot["storage"],
  adminAccounts: AdminAccountRecord[],
  teacherAccounts: TeacherAccountRecord[],
  studentAccounts: StudentAccountRecord[],
  settings: RosterSettingsRecord,
): LearningAuthSnapshot {
  const normalizedTeacherAccounts = teacherAccounts.map(normalizeTeacherAccountSecurity);
  const normalizedStudentAccounts = studentAccounts.map(normalizeStudentAccountSecurity);
  const adminSummaries = adminAccounts.map(toAuthSummary).sort((a, b) => a.username.localeCompare(b.username));
  const teacherSummaries = normalizedTeacherAccounts.map(toAuthSummary).sort((a, b) => a.username.localeCompare(b.username));
  const studentSummaries = normalizedStudentAccounts.map(toAuthSummary).sort((a, b) => a.username.localeCompare(b.username));
  return {
    storage,
    adminAccounts: adminSummaries,
    teacherAccounts: teacherSummaries,
    studentAccounts: studentSummaries,
    activeAdminAccount: adminSummaries.find((account) => account.id === settings.adminAccountId),
    activeTeacherAccount: teacherSummaries.find((account) => account.id === settings.teacherAccountId),
    activeStudentAccount: studentSummaries.find((account) => account.id === settings.studentAccountId),
    settings,
  };
}

function snapshotFromRosterParts(
  storage: LearningRosterSnapshot["storage"],
  teachers: TeacherRecord[],
  classes: ClassRecord[],
  students: StudentRecord[],
  settings: RosterSettingsRecord,
): LearningRosterSnapshot {
  const visibleClasses = classes.filter((classRecord) => !classRecord.deletedAt);
  const activeTeacher =
    teachers.find((teacher) => teacher.id === settings.teacherId) ??
    teachers.find((teacher) => visibleClasses.some((classRecord) => classRecord.teacherId === teacher.id)) ??
    teachers[0];
  const selectedClass = visibleClasses.find((classRecord) => classRecord.id === settings.classId);
  const activeClass =
    (selectedClass && (!activeTeacher || selectedClass.teacherId === activeTeacher.id) ? selectedClass : undefined) ??
    visibleClasses.find((classRecord) => classRecord.teacherId === activeTeacher?.id) ??
    visibleClasses[0];
  const selectedStudent = students.find((student) => student.id === settings.studentId);
  const activeStudent =
    (selectedStudent &&
    (!activeTeacher || selectedStudent.teacherId === activeTeacher.id) &&
    (!activeClass || selectedStudent.classId === activeClass.id)
      ? selectedStudent
      : undefined) ??
    students.find((student) => student.classId === activeClass?.id) ??
    students.find((student) => student.teacherId === activeTeacher?.id) ??
    students[0];
  return {
    storage,
    teachers: teachers.sort((a, b) => a.name.localeCompare(b.name, "ko")),
    classes: visibleClasses.sort((a, b) => a.name.localeCompare(b.name, "ko")),
    students: students.sort((a, b) => a.name.localeCompare(b.name, "ko")),
    activeTeacher,
    activeClass,
    activeStudent,
    settings: {
      ...settings,
      teacherId: activeTeacher?.id ?? settings.teacherId,
      classId: activeClass?.id ?? settings.classId,
      studentId: activeStudent?.id ?? settings.studentId,
    },
  };
}

export async function upsertLearnerDbProfile(profile: LearnerProfile) {
  try {
    const db = await openDb();
    const transaction = db.transaction(PROFILE_STORE, "readwrite");
    transaction.objectStore(PROFILE_STORE).put({ ...profile, savedAt: new Date().toISOString() });
    await transactionDone(transaction);
    db.close();
  } catch {
    localStorage.setItem(`${FALLBACK_PREFIX}:profile:${profile.id}`, JSON.stringify(profile));
  }
}

export async function loadLearningRosterSnapshot(): Promise<LearningRosterSnapshot> {
  try {
    const [teachers, classes, students, settings] = await Promise.all([
      readAllIndexed<TeacherRecord>(TEACHER_STORE),
      readAllIndexed<ClassRecord>(CLASS_STORE),
      readAllIndexed<StudentRecord>(STUDENT_STORE),
      readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID),
    ]);
    return snapshotFromRosterParts(
      currentIndexedStorage(),
      teachers,
      classes,
      students,
      settings ?? defaultRosterSettings(),
    );
  } catch {
    const roster = readFallbackRoster();
    return snapshotFromRosterParts("localStorage", roster.teachers, roster.classes, roster.students, roster.settings);
  }
}

export async function loadLearningAuthSnapshot(): Promise<LearningAuthSnapshot> {
  try {
    const [adminAccounts, teacherAccounts, studentAccounts, settings] = await Promise.all([
      readAllIndexed<AdminAccountRecord>(ADMIN_ACCOUNT_STORE),
      readAllIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE),
      readAllIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE),
      readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID),
    ]);
    return snapshotFromAuthParts(
      currentIndexedStorage(),
      adminAccounts,
      teacherAccounts,
      studentAccounts,
      settings ?? defaultRosterSettings(),
    );
  } catch {
    const auth = readFallbackAuth();
    return snapshotFromAuthParts("localStorage", auth.adminAccounts, auth.teacherAccounts, auth.studentAccounts, auth.settings);
  }
}

export async function registerLearningAccount(input: {
  role: AccountRole;
  username: string;
  password: string;
  displayName: string;
  teacherId?: string;
  studentId?: string;
  learnerId?: string;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const username = normalizeUsername(input.username);
  const defaultDisplayName = input.role === "admin" ? "관리자" : input.role === "teacher" ? "선생님" : "학생";
  const displayName = normalizeText(input.displayName, defaultDisplayName);
  if (!username || input.password.length < 4) {
    throw new Error("아이디와 4자리 이상 비밀번호를 입력하세요.");
  }
  const passwordHash = await hashPassword(input.role, username, input.password);

  if (input.role === "admin") {
    void passwordHash;
    throw new Error("관리자 모드는 Google 로그인으로만 사용할 수 있습니다.");
  } else if (input.role === "teacher") {
    if (!input.teacherId) throw new Error("교사용 계정은 선생님 등록 정보가 필요합니다.");
    const account: TeacherAccountRecord = {
      id: entityId("teacher-account"),
      role: "teacher",
      username,
      passwordHash,
      displayName,
      teacherId: input.teacherId,
      access: defaultAccountAccess("teacher", now),
      credentialScheme: "sha256-v1",
      securityVersion: 2,
      passwordUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const accounts = await readAllIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE);
      if (accounts.some((item) => item.username === username)) throw new Error("이미 등록된 교사용 아이디입니다.");
      const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
      const settings: RosterSettingsRecord = {
        ...currentSettings,
        teacherId: input.teacherId,
        updatedAt: now,
      };
      await writeIndexedRecords([TEACHER_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(TEACHER_ACCOUNT_STORE).put(account);
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("이미 등록된")) throw error;
      const auth = readFallbackAuth();
      if (auth.teacherAccounts.some((item) => item.username === username)) {
        throw new Error("이미 등록된 교사용 아이디입니다.", { cause: error });
      }
      auth.teacherAccounts = [account, ...auth.teacherAccounts];
      auth.settings = {
        ...auth.settings,
        teacherId: input.teacherId,
        updatedAt: now,
      };
      writeFallbackAuth(auth);
    }
  } else {
    if (!input.studentId || !input.learnerId) throw new Error("학생용 계정은 학생 등록 정보가 필요합니다.");
    const account: StudentAccountRecord = {
      id: entityId("student-account"),
      role: "student",
      username,
      passwordHash,
      displayName,
      studentId: input.studentId,
      learnerId: input.learnerId,
      access: pendingApprovalAccess("student", now),
      credentialScheme: "sha256-v1",
      securityVersion: 2,
      passwordUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const accounts = await readAllIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE);
      if (accounts.some((item) => item.username === username)) throw new Error("이미 등록된 학생용 아이디입니다.");
      const student = await readIndexed<StudentRecord>(STUDENT_STORE, input.studentId);
      const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
      const settings: RosterSettingsRecord = {
        ...currentSettings,
        teacherId: student?.teacherId ?? currentSettings.teacherId,
        classId: student?.classId ?? currentSettings.classId,
        studentId: input.studentId,
        updatedAt: now,
      };
      await writeIndexedRecords([STUDENT_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(STUDENT_ACCOUNT_STORE).put(account);
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("이미 등록된")) throw error;
      const auth = readFallbackAuth();
      if (auth.studentAccounts.some((item) => item.username === username)) {
        throw new Error("이미 등록된 학생용 아이디입니다.", { cause: error });
      }
      auth.studentAccounts = [account, ...auth.studentAccounts];
      const roster = readFallbackRoster();
      const student = roster.students.find((item) => item.id === input.studentId);
      auth.settings = {
        ...auth.settings,
        teacherId: student?.teacherId ?? auth.settings.teacherId,
        classId: student?.classId ?? auth.settings.classId,
        studentId: input.studentId,
        updatedAt: now,
      };
      writeFallbackAuth(auth);
    }
  }

  return loadLearningAuthSnapshot();
}

export async function loginGoogleAdminAccount(input: {
  email: string;
  allowedEmail: string;
  displayName: string;
  googleSub?: string;
  pictureUrl?: string;
  emailVerified?: boolean;
  tokenAud?: string;
  tokenExp?: number;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const email = normalizeUsername(input.email);
  const allowedEmail = normalizeUsername(input.allowedEmail);
  if (!email || email !== allowedEmail) {
    throw new Error(`${input.allowedEmail} 계정으로 Google 로그인해야 관리자 모드를 사용할 수 있습니다.`);
  }
  if (!input.emailVerified) {
    throw new Error("Google에서 이메일 소유 확인이 완료된 계정만 관리자 모드에 들어갈 수 있습니다.");
  }
  const accountPatch = {
    role: "admin" as const,
    username: email,
    email,
    authProvider: "google" as const,
    displayName: normalizeText(input.displayName, "관리자"),
    googleSub: input.googleSub,
    pictureUrl: input.pictureUrl,
    emailVerified: input.emailVerified,
    tokenAud: input.tokenAud,
    tokenExp: input.tokenExp,
    updatedAt: now,
    lastLoginAt: now,
  };

  try {
    const accounts = await readAllIndexed<AdminAccountRecord>(ADMIN_ACCOUNT_STORE);
    const existing =
      accounts.find((item) => normalizeUsername(item.email ?? item.username) === email) ??
      accounts.find((item) => normalizeUsername(item.username) === email);
    const account: AdminAccountRecord = {
      ...existing,
      ...accountPatch,
      id: existing?.id ?? entityId("admin-account"),
      createdAt: existing?.createdAt ?? now,
    };
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
    const settings: RosterSettingsRecord = {
      ...currentSettings,
      adminAccountId: account.id,
      updatedAt: now,
    };
    await writeIndexedRecords([ADMIN_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(ADMIN_ACCOUNT_STORE).put(account);
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("접근이 관리자")) throw error;
    const auth = readFallbackAuth();
    const existing =
      auth.adminAccounts.find((item) => normalizeUsername(item.email ?? item.username) === email) ??
      auth.adminAccounts.find((item) => normalizeUsername(item.username) === email);
    const account: AdminAccountRecord = {
      ...existing,
      ...accountPatch,
      id: existing?.id ?? entityId("admin-account"),
      createdAt: existing?.createdAt ?? now,
    };
    auth.adminAccounts = [account, ...auth.adminAccounts.filter((item) => item.id !== account.id)];
    auth.settings = {
      ...auth.settings,
      adminAccountId: account.id,
      updatedAt: now,
    };
    writeFallbackAuth(auth);
    if (!auth.adminAccounts.some((item) => item.id === account.id)) {
      throw new Error("관리자 Google 로그인 저장에 실패했습니다.", { cause: error });
    }
  }

  return loadLearningAuthSnapshot();
}

export async function setupLocalAdminAccount(input: {
  email: string;
  allowedEmail: string;
  password: string;
  displayName?: string;
  allowExistingAdmin?: boolean;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const email = normalizeUsername(input.email);
  const allowedEmail = normalizeUsername(input.allowedEmail);
  if (!email || email !== allowedEmail) {
    throw new Error(`${input.allowedEmail} 이메일로만 로컬 관리자 PIN을 등록할 수 있습니다.`);
  }
  if (input.password.length < 6) {
    throw new Error("로컬 관리자 PIN은 6자리 이상으로 입력하세요.");
  }
  const passwordHash = await hashPassword("admin", email, input.password);
  const accountPatch = {
    role: "admin" as const,
    username: email,
    email,
    authProvider: "local" as const,
    displayName: normalizeText(input.displayName ?? "로컬 관리자", "로컬 관리자"),
    emailVerified: true,
    passwordHash,
    credentialScheme: "sha256-v1" as const,
    securityVersion: 2,
    passwordUpdatedAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  try {
    const accounts = await readAllIndexed<AdminAccountRecord>(ADMIN_ACCOUNT_STORE);
    const existing =
      accounts.find((item) => normalizeUsername(item.email ?? item.username) === email) ??
      accounts.find((item) => normalizeUsername(item.username) === email);
    if (accounts.length > 0 && !input.allowExistingAdmin) {
      throw new Error("이미 관리자 계정이 있는 기기에서는 관리자 로그인 후 로컬 관리자 PIN을 변경하세요.");
    }
    const account: AdminAccountRecord = {
      ...existing,
      ...accountPatch,
      googleSub: existing?.googleSub,
      pictureUrl: existing?.pictureUrl,
      tokenAud: existing?.tokenAud,
      tokenExp: existing?.tokenExp,
      id: existing?.id ?? entityId("admin-account"),
      createdAt: existing?.createdAt ?? now,
    };
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
    const settings: RosterSettingsRecord = {
      ...currentSettings,
      adminAccountId: account.id,
      updatedAt: now,
    };
    await writeIndexedRecords([ADMIN_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(ADMIN_ACCOUNT_STORE).put(account);
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("이미 관리자 계정이 있는 기기")) throw error;
    const auth = readFallbackAuth();
    const existing =
      auth.adminAccounts.find((item) => normalizeUsername(item.email ?? item.username) === email) ??
      auth.adminAccounts.find((item) => normalizeUsername(item.username) === email);
    if (auth.adminAccounts.length > 0 && !input.allowExistingAdmin) {
      throw new Error("이미 관리자 계정이 있는 기기에서는 관리자 로그인 후 로컬 관리자 PIN을 변경하세요.", { cause: error });
    }
    const account: AdminAccountRecord = {
      ...existing,
      ...accountPatch,
      googleSub: existing?.googleSub,
      pictureUrl: existing?.pictureUrl,
      tokenAud: existing?.tokenAud,
      tokenExp: existing?.tokenExp,
      id: existing?.id ?? entityId("admin-account"),
      createdAt: existing?.createdAt ?? now,
    };
    auth.adminAccounts = [account, ...auth.adminAccounts.filter((item) => item.id !== account.id)];
    auth.settings = {
      ...auth.settings,
      adminAccountId: account.id,
      updatedAt: now,
    };
    writeFallbackAuth(auth);
    if (!auth.adminAccounts.some((item) => item.id === account.id)) {
      throw new Error("로컬 관리자 PIN 저장에 실패했습니다.", { cause: error });
    }
  }

  return loadLearningAuthSnapshot();
}

export async function loginLocalAdminAccount(input: {
  email: string;
  allowedEmail: string;
  password: string;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const email = normalizeUsername(input.email);
  const allowedEmail = normalizeUsername(input.allowedEmail);
  if (!email || email !== allowedEmail) {
    throw new Error(`${input.allowedEmail} 이메일로 등록된 로컬 관리자 PIN만 사용할 수 있습니다.`);
  }
  const passwordHash = await hashPassword("admin", email, input.password);

  try {
    const accounts = await readAllIndexed<AdminAccountRecord>(ADMIN_ACCOUNT_STORE);
    const account = accounts.find(
      (item) =>
        (normalizeUsername(item.email ?? item.username) === email || normalizeUsername(item.username) === email) &&
        item.passwordHash === passwordHash,
    );
    if (!account) throw new Error("로컬 관리자 PIN이 맞지 않습니다.");
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
    const updatedAccount: AdminAccountRecord = {
      ...account,
      emailVerified: true,
      credentialScheme: account.credentialScheme ?? "sha256-v1",
      securityVersion: account.securityVersion ?? 2,
      lastLoginAt: now,
      updatedAt: now,
    };
    const settings: RosterSettingsRecord = {
      ...currentSettings,
      adminAccountId: account.id,
      updatedAt: now,
    };
    await writeIndexedRecords([ADMIN_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(ADMIN_ACCOUNT_STORE).put(updatedAccount);
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("PIN이 맞지 않습니다")) throw error;
    const auth = readFallbackAuth();
    const account = auth.adminAccounts.find(
      (item) =>
        (normalizeUsername(item.email ?? item.username) === email || normalizeUsername(item.username) === email) &&
        item.passwordHash === passwordHash,
    );
    if (!account) throw new Error("로컬 관리자 PIN이 맞지 않습니다.", { cause: error });
    auth.adminAccounts = auth.adminAccounts.map((item) =>
      item.id === account.id
        ? {
            ...item,
            emailVerified: true,
            credentialScheme: item.credentialScheme ?? "sha256-v1",
            securityVersion: item.securityVersion ?? 2,
            lastLoginAt: now,
            updatedAt: now,
          }
        : item,
    );
    auth.settings = {
      ...auth.settings,
      adminAccountId: account.id,
      updatedAt: now,
    };
    writeFallbackAuth(auth);
  }

  return loadLearningAuthSnapshot();
}

export async function loginLearningAccount(role: AccountRole, usernameInput: string, password: string): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const username = normalizeUsername(usernameInput);
  if (role === "admin") {
    void username;
    void password;
    throw new Error("관리자 모드는 Google 로그인으로만 사용할 수 있습니다.");
  }
  const passwordHash = await hashPassword(role, username, password);

  try {
    if (role === "teacher") {
      const accounts = await readAllIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE);
      const normalizedAccounts = accounts.map(normalizeTeacherAccountSecurity);
      const accountByUsername = normalizedAccounts.find((item) => item.username === username);
      const account = accountByUsername?.passwordHash === passwordHash ? accountByUsername : undefined;
      if (!account) {
        await monitorFailedLearningLogin("teacher", username, accountByUsername);
        throw new Error("교사용 아이디 또는 비밀번호가 맞지 않습니다.");
      }
      assertAccountCanLogin(account);
      const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
      const updatedAccount = { ...account, lastLoginAt: now, updatedAt: now };
      const settings: RosterSettingsRecord = {
        ...currentSettings,
        teacherId: account.teacherId,
        classId: undefined,
        studentId: undefined,
        teacherAccountId: account.id,
        updatedAt: now,
      };
      await writeIndexedRecords([TEACHER_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(TEACHER_ACCOUNT_STORE).put(updatedAccount);
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    } else {
      const accounts = await readAllIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE);
      const normalizedAccounts = accounts.map(normalizeStudentAccountSecurity);
      const accountByUsername = normalizedAccounts.find((item) => item.username === username);
      const account = accountByUsername?.passwordHash === passwordHash ? accountByUsername : undefined;
      if (!account) {
        await monitorFailedLearningLogin("student", username, accountByUsername);
        throw new Error("학생용 아이디 또는 비밀번호가 맞지 않습니다.");
      }
      assertAccountCanLogin(account);
      const student = await readIndexed<StudentRecord>(STUDENT_STORE, account.studentId);
      const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
      const updatedAccount = { ...account, lastLoginAt: now, updatedAt: now };
      const settings: RosterSettingsRecord = {
        ...currentSettings,
        teacherId: student?.teacherId ?? currentSettings.teacherId,
        classId: student?.classId ?? currentSettings.classId,
        studentId: account.studentId,
        studentAccountId: account.id,
        updatedAt: now,
      };
      await writeIndexedRecords([STUDENT_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(STUDENT_ACCOUNT_STORE).put(updatedAccount);
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    }
  } catch (error) {
    if (isLearningAccountGateError(error)) throw error;
    const auth = readFallbackAuth();
    if (role === "teacher") {
      const normalizedAccounts = auth.teacherAccounts.map(normalizeTeacherAccountSecurity);
      const accountByUsername = normalizedAccounts.find((item) => item.username === username);
      const account = accountByUsername?.passwordHash === passwordHash ? accountByUsername : undefined;
      if (!account) {
        await monitorFailedLearningLogin("teacher", username, accountByUsername);
        throw new Error("교사용 아이디 또는 비밀번호가 맞지 않습니다.", { cause: error });
      }
      assertAccountCanLogin(account);
      auth.teacherAccounts = auth.teacherAccounts.map((item) =>
        item.id === account.id ? { ...account, lastLoginAt: now, updatedAt: now } : item,
      );
      auth.settings = {
        ...auth.settings,
        teacherId: account.teacherId,
        classId: undefined,
        studentId: undefined,
        teacherAccountId: account.id,
        updatedAt: now,
      };
    } else {
      const normalizedAccounts = auth.studentAccounts.map(normalizeStudentAccountSecurity);
      const accountByUsername = normalizedAccounts.find((item) => item.username === username);
      const account = accountByUsername?.passwordHash === passwordHash ? accountByUsername : undefined;
      if (!account) {
        await monitorFailedLearningLogin("student", username, accountByUsername);
        throw new Error("학생용 아이디 또는 비밀번호가 맞지 않습니다.", { cause: error });
      }
      assertAccountCanLogin(account);
      const roster = readFallbackRoster();
      const student = roster.students.find((item) => item.id === account.studentId);
      auth.studentAccounts = auth.studentAccounts.map((item) =>
        item.id === account.id ? { ...account, lastLoginAt: now, updatedAt: now } : item,
      );
      auth.settings = {
        ...auth.settings,
        teacherId: student?.teacherId ?? auth.settings.teacherId,
        classId: student?.classId ?? auth.settings.classId,
        studentId: account.studentId,
        studentAccountId: account.id,
        updatedAt: now,
      };
    }
    writeFallbackAuth(auth);
  }

  return loadLearningAuthSnapshot();
}

export async function activateLearningAccountByAdmin(input: {
  role: "teacher" | "student";
  accountId: string;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  try {
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
    if (input.role === "teacher") {
      const account = await readIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE, input.accountId);
      if (!account) throw new Error("대리 사용할 교사용 계정을 찾을 수 없습니다.");
      const secured = normalizeTeacherAccountSecurity(account);
      assertAccountCanLogin(secured);
      const settings: RosterSettingsRecord = {
        ...currentSettings,
        teacherId: secured.teacherId,
        teacherAccountId: secured.id,
        updatedAt: now,
      };
      await writeIndexedRecords([TEACHER_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(TEACHER_ACCOUNT_STORE).put({ ...secured, lastLoginAt: now, updatedAt: now });
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    } else {
      const account = await readIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE, input.accountId);
      if (!account) throw new Error("대리 사용할 학생용 계정을 찾을 수 없습니다.");
      const secured = normalizeStudentAccountSecurity(account);
      assertAccountCanLogin(secured);
      const student = await readIndexed<StudentRecord>(STUDENT_STORE, secured.studentId);
      const settings: RosterSettingsRecord = {
        ...currentSettings,
        teacherId: student?.teacherId ?? currentSettings.teacherId,
        classId: student?.classId ?? currentSettings.classId,
        studentId: secured.studentId,
        studentAccountId: secured.id,
        updatedAt: now,
      };
      await writeIndexedRecords([STUDENT_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(STUDENT_ACCOUNT_STORE).put({ ...secured, lastLoginAt: now, updatedAt: now });
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    }
  } catch (error) {
    if (isLearningAccountGateError(error)) throw error;
    const auth = readFallbackAuth();
    if (input.role === "teacher") {
      const account = auth.teacherAccounts.find((item) => item.id === input.accountId);
      if (!account) throw new Error("대리 사용할 교사용 계정을 찾을 수 없습니다.", { cause: error });
      const secured = normalizeTeacherAccountSecurity(account);
      assertAccountCanLogin(secured);
      auth.teacherAccounts = auth.teacherAccounts.map((item) =>
        item.id === secured.id ? { ...secured, lastLoginAt: now, updatedAt: now } : item,
      );
      auth.settings = {
        ...auth.settings,
        teacherId: secured.teacherId,
        teacherAccountId: secured.id,
        updatedAt: now,
      };
    } else {
      const account = auth.studentAccounts.find((item) => item.id === input.accountId);
      if (!account) throw new Error("대리 사용할 학생용 계정을 찾을 수 없습니다.", { cause: error });
      const secured = normalizeStudentAccountSecurity(account);
      assertAccountCanLogin(secured);
      const roster = readFallbackRoster();
      const student = roster.students.find((item) => item.id === secured.studentId);
      auth.studentAccounts = auth.studentAccounts.map((item) =>
        item.id === secured.id ? { ...secured, lastLoginAt: now, updatedAt: now } : item,
      );
      auth.settings = {
        ...auth.settings,
        teacherId: student?.teacherId ?? auth.settings.teacherId,
        classId: student?.classId ?? auth.settings.classId,
        studentId: secured.studentId,
        studentAccountId: secured.id,
        updatedAt: now,
      };
    }
    writeFallbackAuth(auth);
  }
  return loadLearningAuthSnapshot();
}

export async function updateLearningAccountAccess(input: {
  role: "teacher" | "student";
  accountId: string;
  access: Partial<LearningAccountAccess>;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();

  try {
    const storeName = input.role === "teacher" ? TEACHER_ACCOUNT_STORE : STUDENT_ACCOUNT_STORE;
    const settings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
    if (input.role === "teacher") {
      const account = await readIndexed<TeacherAccountRecord>(storeName, input.accountId);
      if (!account) throw new Error("수정할 교사용 계정을 찾을 수 없습니다.");
      const secured = normalizeTeacherAccountSecurity(account);
      const access = normalizeAccountAccess("teacher", { ...secured.access, ...input.access, updatedAt: now }, now);
      const nextSettings: RosterSettingsRecord = {
        ...settings,
        teacherAccountId: access.canLogin === false && settings.teacherAccountId === input.accountId ? undefined : settings.teacherAccountId,
        updatedAt: now,
      };
      await writeIndexedRecords([TEACHER_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(TEACHER_ACCOUNT_STORE).put({ ...secured, access, securityVersion: 2, updatedAt: now });
        transaction.objectStore(SETTINGS_STORE).put(nextSettings);
      });
    } else {
      const account = await readIndexed<StudentAccountRecord>(storeName, input.accountId);
      if (!account) throw new Error("수정할 학생용 계정을 찾을 수 없습니다.");
      const secured = normalizeStudentAccountSecurity(account);
      const access = normalizeAccountAccess("student", { ...secured.access, ...input.access, updatedAt: now }, now);
      const nextSettings: RosterSettingsRecord = {
        ...settings,
        studentAccountId: access.canLogin === false && settings.studentAccountId === input.accountId ? undefined : settings.studentAccountId,
        updatedAt: now,
      };
      await writeIndexedRecords([STUDENT_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(STUDENT_ACCOUNT_STORE).put({ ...secured, access, securityVersion: 2, updatedAt: now });
        transaction.objectStore(SETTINGS_STORE).put(nextSettings);
      });
    }
  } catch (error) {
    const auth = readFallbackAuth();
    if (input.role === "teacher") {
      const account = auth.teacherAccounts.find((item) => item.id === input.accountId);
      if (!account) throw new Error("수정할 교사용 계정을 찾을 수 없습니다.", { cause: error });
      const secured = normalizeTeacherAccountSecurity(account);
      const access = normalizeAccountAccess("teacher", { ...secured.access, ...input.access, updatedAt: now }, now);
      auth.teacherAccounts = auth.teacherAccounts.map((item) =>
        item.id === input.accountId ? { ...secured, access, securityVersion: 2, updatedAt: now } : item,
      );
      auth.settings = {
        ...auth.settings,
        teacherAccountId: access.canLogin === false && auth.settings.teacherAccountId === input.accountId ? undefined : auth.settings.teacherAccountId,
        updatedAt: now,
      };
    } else {
      const account = auth.studentAccounts.find((item) => item.id === input.accountId);
      if (!account) throw new Error("수정할 학생용 계정을 찾을 수 없습니다.", { cause: error });
      const secured = normalizeStudentAccountSecurity(account);
      const access = normalizeAccountAccess("student", { ...secured.access, ...input.access, updatedAt: now }, now);
      auth.studentAccounts = auth.studentAccounts.map((item) =>
        item.id === input.accountId ? { ...secured, access, securityVersion: 2, updatedAt: now } : item,
      );
      auth.settings = {
        ...auth.settings,
        studentAccountId: access.canLogin === false && auth.settings.studentAccountId === input.accountId ? undefined : auth.settings.studentAccountId,
        updatedAt: now,
      };
    }
    writeFallbackAuth(auth);
  }

  return loadLearningAuthSnapshot();
}

export async function upsertStudentLearningAccount(input: {
  username: string;
  password: string;
  displayName: string;
  studentId: string;
  learnerId: string;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const username = normalizeUsername(input.username);
  const displayName = normalizeText(input.displayName, "학생");
  if (!username || input.password.length < 4) {
    throw new Error("학생 아이디와 4자리 이상 비밀번호를 입력하세요.");
  }
  const passwordHash = await hashPassword("student", username, input.password);
  const accountPatch = {
    role: "student" as const,
    username,
    passwordHash,
    displayName,
    studentId: input.studentId,
    learnerId: input.learnerId,
    credentialScheme: "sha256-v1" as const,
    securityVersion: 2,
    passwordUpdatedAt: now,
    updatedAt: now,
  };

  try {
    const accounts = await readAllIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE);
    const duplicate = accounts.find((item) => item.username === username && item.studentId !== input.studentId);
    if (duplicate) throw new Error("이미 다른 학생에게 등록된 학생용 아이디입니다.");
    const existing = accounts.find((item) => item.studentId === input.studentId) ?? accounts.find((item) => item.username === username);
    const account: StudentAccountRecord = {
      ...existing,
      ...accountPatch,
      id: existing?.id ?? entityId("student-account"),
      access: existing?.access ?? pendingApprovalAccess("student", now),
      createdAt: existing?.createdAt ?? now,
    };
    await writeIndexedRecords([STUDENT_ACCOUNT_STORE], (transaction) => {
      transaction.objectStore(STUDENT_ACCOUNT_STORE).put(account);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("이미 다른 학생")) throw error;
    const auth = readFallbackAuth();
    const duplicate = auth.studentAccounts.find((item) => item.username === username && item.studentId !== input.studentId);
    if (duplicate) throw new Error("이미 다른 학생에게 등록된 학생용 아이디입니다.", { cause: error });
    const existing =
      auth.studentAccounts.find((item) => item.studentId === input.studentId) ??
      auth.studentAccounts.find((item) => item.username === username);
    const account: StudentAccountRecord = {
      ...existing,
      ...accountPatch,
      id: existing?.id ?? entityId("student-account"),
      access: existing?.access ?? pendingApprovalAccess("student", now),
      createdAt: existing?.createdAt ?? now,
    };
    auth.studentAccounts = [account, ...auth.studentAccounts.filter((item) => item.id !== account.id)];
    writeFallbackAuth(auth);
  }

  return loadLearningAuthSnapshot();
}

export async function upsertTeacherLearningAccount(input: {
  username: string;
  password: string;
  displayName: string;
  teacherId: string;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const username = normalizeUsername(input.username);
  const displayName = normalizeText(input.displayName, "선생님");
  if (!username || input.password.length < 4) {
    throw new Error("교사 아이디와 4자리 이상 비밀번호를 입력하세요.");
  }
  const passwordHash = await hashPassword("teacher", username, input.password);
  const accountPatch = {
    role: "teacher" as const,
    username,
    passwordHash,
    displayName,
    teacherId: input.teacherId,
    credentialScheme: "sha256-v1" as const,
    securityVersion: 2,
    passwordUpdatedAt: now,
    updatedAt: now,
  };

  try {
    const accounts = await readAllIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE);
    const duplicate = accounts.find((item) => item.username === username && item.teacherId !== input.teacherId);
    if (duplicate) throw new Error("이미 다른 교사에게 등록된 교사용 아이디입니다.");
    const existing = accounts.find((item) => item.teacherId === input.teacherId) ?? accounts.find((item) => item.username === username);
    const account: TeacherAccountRecord = {
      ...existing,
      ...accountPatch,
      id: existing?.id ?? entityId("teacher-account"),
      access: existing?.access ?? pendingApprovalAccess("teacher", now),
      createdAt: existing?.createdAt ?? now,
    };
    await writeIndexedRecords([TEACHER_ACCOUNT_STORE], (transaction) => {
      transaction.objectStore(TEACHER_ACCOUNT_STORE).put(account);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("이미 다른 교사")) throw error;
    const auth = readFallbackAuth();
    const duplicate = auth.teacherAccounts.find((item) => item.username === username && item.teacherId !== input.teacherId);
    if (duplicate) throw new Error("이미 다른 교사에게 등록된 교사용 아이디입니다.", { cause: error });
    const existing =
      auth.teacherAccounts.find((item) => item.teacherId === input.teacherId) ??
      auth.teacherAccounts.find((item) => item.username === username);
    const account: TeacherAccountRecord = {
      ...existing,
      ...accountPatch,
      id: existing?.id ?? entityId("teacher-account"),
      access: existing?.access ?? pendingApprovalAccess("teacher", now),
      createdAt: existing?.createdAt ?? now,
    };
    auth.teacherAccounts = [account, ...auth.teacherAccounts.filter((item) => item.id !== account.id)];
    writeFallbackAuth(auth);
  }

  return loadLearningAuthSnapshot();
}

export async function activateAccountWithHash(input: {
  role: "teacher" | "student";
  username: string;
  passwordHash: string;
  displayName: string;
  userId: string;
  learnerId?: string;
}): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  const username = normalizeUsername(input.username);

  if (input.role === "teacher") {
    const teacherId = input.userId || `ext-${username}`;
    const accounts = await readAllIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE).catch(() => []);
    const existing = accounts.find((a) => a.username === username) ?? accounts.find((a) => a.teacherId === teacherId);
    const account: TeacherAccountRecord = {
      ...(existing ?? {}),
      id: existing?.id ?? entityId("teacher-account"),
      role: "teacher",
      username,
      passwordHash: input.passwordHash,
      displayName: normalizeText(input.displayName, "선생님"),
      teacherId,
      access: defaultAccountAccess("teacher", now),
      credentialScheme: "sha256-v1",
      securityVersion: 2,
      passwordUpdatedAt: now,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
      lastLoginAt: now,
    };
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID).catch(() => undefined)) ?? defaultRosterSettings();
    const settings: RosterSettingsRecord = { ...currentSettings, teacherAccountId: account.id, teacherId: account.teacherId, classId: undefined, studentId: undefined, updatedAt: now };
    try {
      await writeIndexedRecords([TEACHER_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(TEACHER_ACCOUNT_STORE).put(account);
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    } catch {
      const auth = readFallbackAuth();
      auth.teacherAccounts = [account, ...auth.teacherAccounts.filter((a) => a.id !== account.id)];
      auth.settings = settings;
      writeFallbackAuth(auth);
    }
  } else {
    const studentId = input.userId || `ext-${username}`;
    const learnerId = input.learnerId || `ext-${username}`;
    const accounts = await readAllIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE).catch(() => []);
    const existing = accounts.find((a) => a.username === username) ?? accounts.find((a) => a.studentId === studentId);
    const account: StudentAccountRecord = {
      ...(existing ?? {}),
      id: existing?.id ?? entityId("student-account"),
      role: "student",
      username,
      passwordHash: input.passwordHash,
      displayName: normalizeText(input.displayName, "학생"),
      studentId,
      learnerId,
      access: defaultAccountAccess("student", now),
      credentialScheme: "sha256-v1",
      securityVersion: 2,
      passwordUpdatedAt: now,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
      lastLoginAt: now,
    };
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID).catch(() => undefined)) ?? defaultRosterSettings();
    const settings: RosterSettingsRecord = { ...currentSettings, studentId: account.studentId, studentAccountId: account.id, updatedAt: now };
    try {
      await writeIndexedRecords([STUDENT_ACCOUNT_STORE, SETTINGS_STORE], (transaction) => {
        transaction.objectStore(STUDENT_ACCOUNT_STORE).put(account);
        transaction.objectStore(SETTINGS_STORE).put(settings);
      });
    } catch {
      const auth = readFallbackAuth();
      auth.studentAccounts = [account, ...auth.studentAccounts.filter((a) => a.id !== account.id)];
      auth.settings = settings;
      writeFallbackAuth(auth);
    }
  }

  return loadLearningAuthSnapshot();
}

export async function updateStudentLearningProgress(input: {
  studentId: string;
  attempted?: number;
  correct?: number;
  targetDaily?: number;
  focusTitle?: string;
  teacherMemo?: string;
}): Promise<ClassLearningProgressSnapshot> {
  const now = new Date().toISOString();
  const roster = await loadLearningRosterSnapshot();
  const student = roster.students.find((item) => item.id === input.studentId);
  if (!student) throw new Error("진도를 수정할 학생을 찾을 수 없습니다.");
  const currentOverrides = await readAllIndexed<StudentProgressOverrideRecord>(PROGRESS_OVERRIDE_STORE).catch(() => readFallbackProgressOverrides());
  const currentOverride = currentOverrides.find((item) => item.studentId === student.id);
  const currentAttempts = await readIndexedDbAttempts(student.learnerId).catch(() => readFallbackAttempts(student.learnerId));
  const actualAttempted = currentAttempts.length;
  const actualCorrect = currentAttempts.filter((attempt) => attempt.ok).length;
  const attempted = Math.max(0, Math.floor(input.attempted ?? currentOverride?.attempted ?? actualAttempted));
  const correct = Math.min(attempted, Math.max(0, Math.floor(input.correct ?? currentOverride?.correct ?? actualCorrect)));
  const targetDaily = input.targetDaily === undefined ? currentOverride?.targetDaily : Math.max(0, Math.floor(input.targetDaily));
  const focusTitle = normalizeText(input.focusTitle ?? currentOverride?.focusTitle ?? "", "");
  const teacherMemo = normalizeText(input.teacherMemo ?? currentOverride?.teacherMemo ?? "", "");
  const override: StudentProgressOverrideRecord = {
    id: student.id,
    studentId: student.id,
    learnerId: student.learnerId,
    teacherId: student.teacherId,
    classId: student.classId,
    attempted,
    correct,
    targetDaily: targetDaily || undefined,
    focusTitle: focusTitle || undefined,
    teacherMemo: teacherMemo || undefined,
    updatedAt: now,
  };

  try {
    await writeIndexedRecords([PROGRESS_OVERRIDE_STORE], (transaction) => {
      transaction.objectStore(PROGRESS_OVERRIDE_STORE).put(override);
    });
  } catch {
    const overrides = readFallbackProgressOverrides();
    writeFallbackProgressOverrides([override, ...overrides.filter((item) => item.studentId !== student.id)]);
  }

  return loadAllLearningProgress();
}

export async function assignStudentLearningWork(input: {
  studentId: string;
  assignmentType: StudentLearningAssignmentType;
  title: string;
  description?: string;
  targetDaily?: number;
  focusTitle?: string;
  dueDate?: string;
}): Promise<ClassLearningProgressSnapshot> {
  const now = new Date().toISOString();
  const roster = await loadLearningRosterSnapshot();
  const student = roster.students.find((item) => item.id === input.studentId);
  if (!student) throw new Error("과제를 부여할 학생을 찾을 수 없습니다.");
  const title = normalizeText(input.title, input.assignmentType === "remedial" ? "보충수업" : "반복학습 숙제");
  const focusTitle = normalizeText(input.focusTitle ?? title, title);
  const defaultDescription =
    input.assignmentType === "remedial"
      ? `${focusTitle} 개념을 다시 설명하고 대표 유형을 천천히 확인합니다.`
      : `${focusTitle} 유형을 반복 풀이 숙제로 부여합니다.`;
  const assignment: StudentLearningAssignmentRecord = {
    id: entityId(input.assignmentType === "remedial" ? "remedial" : "homework"),
    assignmentType: input.assignmentType,
    teacherId: student.teacherId,
    teacherName: student.teacherName,
    classId: student.classId,
    className: student.className,
    studentId: student.id,
    learnerId: student.learnerId,
    studentName: student.name,
    title,
    description: normalizeText(input.description ?? defaultDescription, defaultDescription),
    targetDaily: input.targetDaily !== undefined ? Math.max(0, Math.floor(input.targetDaily)) : undefined,
    focusTitle,
    dueDate: input.dueDate,
    status: "assigned",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await writeIndexedRecords([ASSIGNMENT_STORE], (transaction) => {
      transaction.objectStore(ASSIGNMENT_STORE).put(assignment);
    });
  } catch {
    const assignments = readFallbackAssignments();
    writeFallbackAssignments([assignment, ...assignments]);
  }

  return loadAllLearningProgress();
}

async function readStudentLearningAssignmentRecord(assignmentId: string) {
  try {
    const record = await readIndexed<StudentLearningAssignmentRecord>(ASSIGNMENT_STORE, assignmentId);
    if (record) return record;
  } catch {
    // IndexedDB가 잠시 막히면 localStorage fallback에서 같은 과제 기록을 확인한다.
  }
  return readFallbackAssignments().find((assignment) => assignment.id === assignmentId);
}

async function putStudentLearningAssignmentRecord(assignment: StudentLearningAssignmentRecord) {
  try {
    await writeIndexedRecords([ASSIGNMENT_STORE], (transaction) => {
      transaction.objectStore(ASSIGNMENT_STORE).put(assignment);
    });
  } catch {
    const assignments = readFallbackAssignments();
    writeFallbackAssignments([assignment, ...assignments.filter((item) => item.id !== assignment.id)]);
  }
}

export async function updateStudentLearningAssignment(input: {
  assignmentId: string;
  title: string;
  description?: string;
  status?: StudentLearningAssignmentStatus;
}): Promise<ClassLearningProgressSnapshot> {
  const current = await readStudentLearningAssignmentRecord(input.assignmentId);
  if (!current || current.deletedAt) throw new Error("수정할 학습 코칭 기록을 찾을 수 없습니다.");
  const title = normalizeText(input.title, current.title);
  const updated: StudentLearningAssignmentRecord = {
    ...current,
    title,
    description: input.description !== undefined ? normalizeText(input.description, current.description) : current.description,
    status: input.status ?? current.status,
    focusTitle: title,
    updatedAt: new Date().toISOString(),
  };
  await putStudentLearningAssignmentRecord(updated);
  return loadAllLearningProgress();
}

export async function removeStudentLearningAssignment(assignmentId: string): Promise<ClassLearningProgressSnapshot> {
  const current = await readStudentLearningAssignmentRecord(assignmentId);
  if (!current || current.deletedAt) throw new Error("삭제할 학습 코칭 기록을 찾을 수 없습니다.");
  const now = new Date().toISOString();
  await putStudentLearningAssignmentRecord({
    ...current,
    status: "completed",
    deletedAt: now,
    updatedAt: now,
  });
  return loadAllLearningProgress();
}

export async function logoutLearningAccount(role: AccountRole): Promise<LearningAuthSnapshot> {
  const now = new Date().toISOString();
  try {
    const currentSettings = (await readIndexed<RosterSettingsRecord>(SETTINGS_STORE, ACTIVE_SETTINGS_ID)) ?? defaultRosterSettings();
    const settings: RosterSettingsRecord = {
      ...currentSettings,
      adminAccountId: role === "admin" ? undefined : currentSettings.adminAccountId,
      teacherAccountId: role === "teacher" ? undefined : currentSettings.teacherAccountId,
      studentAccountId: role === "student" ? undefined : currentSettings.studentAccountId,
      updatedAt: now,
    };
    await writeIndexedRecords([SETTINGS_STORE], (transaction) => {
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const auth = readFallbackAuth();
    auth.settings = {
      ...auth.settings,
      adminAccountId: role === "admin" ? undefined : auth.settings.adminAccountId,
      teacherAccountId: role === "teacher" ? undefined : auth.settings.teacherAccountId,
      studentAccountId: role === "student" ? undefined : auth.settings.studentAccountId,
      updatedAt: now,
    };
    writeFallbackAuth(auth);
  }
  return loadLearningAuthSnapshot();
}

export async function registerTeacherName(name: string, teacherId?: string): Promise<LearningRosterSnapshot> {
  const now = new Date().toISOString();
  const snapshot = await loadLearningRosterSnapshot();
  const normalizedName = normalizeText(name, "강태훈샘");
  const existing =
    (teacherId ? snapshot.teachers.find((teacher) => teacher.id === teacherId) : undefined) ??
    snapshot.teachers.find((teacher) => teacher.name === normalizedName);
  const teacher: TeacherRecord = {
    id: existing?.id ?? entityId("teacher"),
    name: normalizedName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const settings: RosterSettingsRecord = {
    ...snapshot.settings,
    id: ACTIVE_SETTINGS_ID,
    teacherId: teacher.id,
    classId: snapshot.activeClass?.teacherId === teacher.id ? snapshot.activeClass.id : undefined,
    studentId: snapshot.activeStudent?.teacherId === teacher.id ? snapshot.activeStudent.id : undefined,
    updatedAt: now,
  };
  const updatedClasses = snapshot.classes
    .filter((classRecord) => classRecord.teacherId === teacher.id)
    .map((classRecord) => ({ ...classRecord, teacherName: teacher.name, updatedAt: now }));
  const updatedStudents = snapshot.students
    .filter((student) => student.teacherId === teacher.id)
    .map((student) => ({ ...student, teacherName: teacher.name, updatedAt: now }));

  try {
    await writeIndexedRecords([TEACHER_STORE, CLASS_STORE, STUDENT_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(TEACHER_STORE).put(teacher);
      for (const classRecord of updatedClasses) {
        transaction.objectStore(CLASS_STORE).put(classRecord);
      }
      for (const student of updatedStudents) {
        transaction.objectStore(STUDENT_STORE).put(student);
      }
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const roster = readFallbackRoster();
    roster.teachers = [teacher, ...roster.teachers.filter((item) => item.id !== teacher.id)];
    roster.classes = roster.classes.map((classRecord) =>
      classRecord.teacherId === teacher.id ? { ...classRecord, teacherName: teacher.name, updatedAt: now } : classRecord,
    );
    roster.students = roster.students.map((student) =>
      student.teacherId === teacher.id ? { ...student, teacherName: teacher.name, updatedAt: now } : student,
    );
    roster.settings = settings;
    writeFallbackRoster(roster);
  }

  return loadLearningRosterSnapshot();
}

export async function registerClassRecord(input: {
  classId?: string;
  name: string;
  grade: string;
  teacherId: string;
}): Promise<LearningRosterSnapshot> {
  const now = new Date().toISOString();
  const snapshot = await loadLearningRosterSnapshot();
  const teacher = snapshot.teachers.find((item) => item.id === input.teacherId) ?? snapshot.activeTeacher;
  if (!teacher) return snapshot;
  const normalizedName = normalizeText(input.name, `${normalizeText(input.grade, "학년 미지정")} 클래스`);
  const normalizedGrade = normalizeText(input.grade, "학년 미지정");
  const existing =
    (input.classId ? snapshot.classes.find((classRecord) => classRecord.id === input.classId) : undefined) ??
    snapshot.classes.find(
      (classRecord) =>
        classRecord.teacherId === teacher.id &&
        classRecord.name === normalizedName &&
        classRecord.grade === normalizedGrade,
    );
  const classRecord: ClassRecord = {
    id: existing?.id ?? entityId("class"),
    name: normalizedName,
    grade: normalizedGrade,
    teacherId: teacher.id,
    teacherName: teacher.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const settings: RosterSettingsRecord = {
    ...snapshot.settings,
    id: ACTIVE_SETTINGS_ID,
    teacherId: teacher.id,
    classId: classRecord.id,
    studentId: undefined,
    updatedAt: now,
  };
  const updatedStudents = snapshot.students
    .filter((student) => student.classId === classRecord.id)
    .map((student) => ({
      ...student,
      className: classRecord.name,
      teacherId: classRecord.teacherId,
      teacherName: classRecord.teacherName,
      updatedAt: now,
    }));

  try {
    await writeIndexedRecords([CLASS_STORE, STUDENT_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(CLASS_STORE).put(classRecord);
      for (const student of updatedStudents) {
        transaction.objectStore(STUDENT_STORE).put(student);
      }
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const roster = readFallbackRoster();
    roster.classes = [classRecord, ...roster.classes.filter((item) => item.id !== classRecord.id)];
    roster.students = roster.students.map((student) =>
      student.classId === classRecord.id
        ? {
            ...student,
            className: classRecord.name,
            teacherId: classRecord.teacherId,
            teacherName: classRecord.teacherName,
            updatedAt: now,
          }
        : student,
    );
    roster.settings = settings;
    writeFallbackRoster(roster);
  }

  return loadLearningRosterSnapshot();
}

export async function registerStudentRecord(input: {
  studentId?: string;
  learnerId?: string;
  name: string;
  grade: string;
  classId: string;
}): Promise<LearningRosterSnapshot> {
  const now = new Date().toISOString();
  const snapshot = await loadLearningRosterSnapshot();
  const classRecord = snapshot.classes.find((item) => item.id === input.classId) ?? snapshot.activeClass;
  if (!classRecord) return snapshot;
  const normalizedName = normalizeText(input.name, "학습자");
  const normalizedGrade = normalizeText(input.grade, classRecord.grade);
  const existing =
    (input.studentId ? snapshot.students.find((student) => student.id === input.studentId) : undefined) ??
    snapshot.students.find(
      (student) =>
        student.classId === classRecord.id &&
        student.name === normalizedName &&
        student.grade === normalizedGrade,
    );
  const student: StudentRecord = {
    id: existing?.id ?? entityId("student"),
    learnerId: existing?.learnerId ?? input.learnerId ?? learnerIdFromStudent(normalizedName, normalizedGrade),
    name: normalizedName,
    grade: normalizedGrade,
    classId: classRecord.id,
    className: classRecord.name,
    teacherId: classRecord.teacherId,
    teacherName: classRecord.teacherName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const settings: RosterSettingsRecord = {
    ...snapshot.settings,
    id: ACTIVE_SETTINGS_ID,
    teacherId: student.teacherId,
    classId: student.classId,
    studentId: student.id,
    updatedAt: now,
  };

  try {
    await writeIndexedRecords([STUDENT_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(STUDENT_STORE).put(student);
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const roster = readFallbackRoster();
    roster.students = [student, ...roster.students.filter((item) => item.id !== student.id)];
    roster.settings = settings;
    writeFallbackRoster(roster);
  }

  return loadLearningRosterSnapshot();
}

export async function removeClassRecord(classId: string): Promise<LearningRosterSnapshot> {
  const now = new Date().toISOString();
  const snapshot = await loadLearningRosterSnapshot();
  const classRecord = snapshot.classes.find((item) => item.id === classId);
  if (!classRecord) throw new Error("제거할 클래스를 찾을 수 없습니다.");
  const classStudents = snapshot.students.filter((student) => student.classId === classRecord.id);
  if (classStudents.length > 0) {
    throw new Error("등록 학생이 있는 클래스는 제거할 수 없습니다. 먼저 학생을 다른 클래스로 이동한 뒤 다시 시도하세요.");
  }
  const deletedClass: ClassRecord = { ...classRecord, deletedAt: now, updatedAt: now };
  const nextClass =
    snapshot.classes.find((item) => item.id !== classRecord.id && item.teacherId === classRecord.teacherId) ??
    snapshot.classes.find((item) => item.id !== classRecord.id);
  const nextStudent = nextClass ? snapshot.students.find((student) => student.classId === nextClass.id) : undefined;
  const settings: RosterSettingsRecord = {
    ...snapshot.settings,
    id: ACTIVE_SETTINGS_ID,
    teacherId: nextClass?.teacherId ?? classRecord.teacherId,
    classId: nextClass?.id,
    studentId: nextStudent?.id,
    updatedAt: now,
  };

  try {
    await writeIndexedRecords([CLASS_STORE, SETTINGS_STORE], (transaction) => {
      transaction.objectStore(CLASS_STORE).put(deletedClass);
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const roster = readFallbackRoster();
    roster.classes = [deletedClass, ...roster.classes.filter((item) => item.id !== deletedClass.id)];
    roster.settings = settings;
    writeFallbackRoster(roster);
  }

  return loadLearningRosterSnapshot();
}

export async function selectLearningRosterClass(classId: string): Promise<LearningRosterSnapshot> {
  const now = new Date().toISOString();
  const snapshot = await loadLearningRosterSnapshot();
  const classRecord = snapshot.classes.find((item) => item.id === classId);
  if (!classRecord) return snapshot;
  const activeStudent = snapshot.students.find((student) => student.classId === classRecord.id);
  const settings: RosterSettingsRecord = {
    ...snapshot.settings,
    id: ACTIVE_SETTINGS_ID,
    teacherId: classRecord.teacherId,
    classId: classRecord.id,
    studentId: activeStudent?.id,
    updatedAt: now,
  };

  try {
    await writeIndexedRecords([SETTINGS_STORE], (transaction) => {
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const roster = readFallbackRoster();
    roster.settings = settings;
    writeFallbackRoster(roster);
  }

  return loadLearningRosterSnapshot();
}

export async function selectLearningRosterStudent(studentId: string): Promise<LearningRosterSnapshot> {
  const now = new Date().toISOString();
  const snapshot = await loadLearningRosterSnapshot();
  const student = snapshot.students.find((item) => item.id === studentId);
  if (!student) return snapshot;
  const settings: RosterSettingsRecord = {
    ...snapshot.settings,
    id: ACTIVE_SETTINGS_ID,
    teacherId: student.teacherId,
    classId: student.classId,
    studentId: student.id,
    updatedAt: now,
  };

  try {
    await writeIndexedRecords([SETTINGS_STORE], (transaction) => {
      transaction.objectStore(SETTINGS_STORE).put(settings);
    });
  } catch {
    const roster = readFallbackRoster();
    roster.settings = settings;
    writeFallbackRoster(roster);
  }

  return loadLearningRosterSnapshot();
}

export async function recordLearnerAttempt(input: LearnerAttemptInput) {
  const record = normalizeAttempt(input);
  try {
    const db = await openDb();
    const transaction = db.transaction(ATTEMPT_STORE, "readwrite");
    transaction.objectStore(ATTEMPT_STORE).add(record);
    await transactionDone(transaction);
    db.close();
    await syncCloudSnapshotFromIndexed();
  } catch {
    writeFallbackAttempt(record);
  }
  try {
    await monitorRapidWrongAttempts(record);
  } catch {
    // 자동 감시 실패가 풀이 저장을 되돌리지 않도록 합니다.
  }
  return record;
}

async function readIndexedDbAttempts(learnerId: string) {
  await ensureCloudSnapshotHydrated();
  const db = await openDb();
  const transaction = db.transaction(ATTEMPT_STORE, "readonly");
  const index = transaction.objectStore(ATTEMPT_STORE).index("learnerId");
  const attempts = await requestToPromise(index.getAll(learnerId));
  db.close();
  return attempts;
}

function buildTopicInsights(attempts: LearnerAttemptRecord[]): TopicInsight[] {
  const buckets = new Map<string, TopicInsight>();
  for (const attempt of attempts) {
    const bucket = buckets.get(attempt.topicId) ?? {
      unitId: attempt.unitId,
      unitNo: attempt.unitNo,
      unitLabel: attempt.unitLabel,
      unitTitle: attempt.unitTitle,
      topicId: attempt.topicId,
      topicTitle: attempt.topicTitle,
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      wrongRate: 0,
      lastStudiedAt: attempt.createdAt,
    };
    bucket.attempted += 1;
    bucket.correct += attempt.ok ? 1 : 0;
    bucket.wrong += attempt.ok ? 0 : 1;
    if (!bucket.lastStudiedAt || attempt.createdAt > bucket.lastStudiedAt) {
      bucket.lastStudiedAt = attempt.createdAt;
    }
    bucket.accuracy = percent(bucket.correct, bucket.attempted);
    bucket.wrongRate = percent(bucket.wrong, bucket.attempted);
    buckets.set(attempt.topicId, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.wrongRate - a.wrongRate || b.wrong - a.wrong);
}

function buildLearnerPlan(attempts: LearnerAttemptRecord[], topics: TopicInsight[]): LearnerPlan {
  const totalAttempts = attempts.length;
  const correct = attempts.filter((attempt) => attempt.ok).length;
  const wrong = totalAttempts - correct;
  const accuracy = percent(correct, totalAttempts);
  const wrongRate = percent(wrong, totalAttempts);
  const weakest = topics.find((topic) => topic.wrong > 0) ?? topics[0];
  const level: LearnerPlan["level"] =
    totalAttempts < 30 || accuracy < 65 ? "기초 다지기" : accuracy < 85 ? "안정 연습" : "심화 확장";
  const dailyTarget = level === "기초 다지기" ? 10 : level === "안정 연습" ? 20 : 30;
  const nextTitle = weakest
    ? `${weakest.unitLabel ?? `${weakest.unitNo}단원`} ${weakest.topicTitle}`
    : "오늘의 10문제부터 시작";
  const strategy =
    level === "기초 다지기"
      ? "새 문제보다 오답 풀이를 먼저 보고, 같은 유형 10문제를 짧게 반복하세요."
      : level === "안정 연습"
        ? "오답률이 높은 유형을 먼저 보완한 뒤 같은 단원의 다른 유형으로 넓혀가세요."
        : "정답률은 안정적입니다. 하루 목표를 늘리고 여러 단원을 섞어 심화 연습하세요.";

  return {
    level,
    dailyTarget,
    nextTitle,
    strategy,
    weaknessTitle: weakest ? `${weakest.unitLabel ?? `${weakest.unitNo}단원`} ${weakest.topicTitle}` : "기록 대기",
    totalAttempts,
    accuracy,
    wrongRate,
    wrongNoteCount: wrong,
    generatedAt: new Date().toISOString(),
  };
}

export async function loadLearnerDbSnapshot(learnerId: string): Promise<LearnerDbSnapshot> {
  try {
    const attempts = (await readIndexedDbAttempts(learnerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const topics = buildTopicInsights(attempts);
    return {
      storage: currentIndexedStorage(),
      attempts,
      wrongNotes: attempts.filter((attempt) => !attempt.ok),
      topics,
      plan: buildLearnerPlan(attempts, topics),
    };
  } catch {
    const attempts = readFallbackAttempts(learnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const topics = buildTopicInsights(attempts);
    return {
      storage: "localStorage",
      attempts,
      wrongNotes: attempts.filter((attempt) => !attempt.ok),
      topics,
      plan: buildLearnerPlan(attempts, topics),
    };
  }
}

function progressStatus(item: TopicInsight): StudentProgressMapItem["status"] {
  if (item.attempted === 0) return "empty";
  if (item.accuracy >= 85 && item.attempted >= 5) return "strong";
  if (item.wrongRate >= 35 || item.accuracy < 65) return "watch";
  return "steady";
}

function buildStudentProgress(
  student: StudentRecord,
  attempts: LearnerAttemptRecord[],
  override?: StudentProgressOverrideRecord,
  assignments: StudentLearningAssignmentRecord[] = [],
): ClassStudentProgress {
  const sortedAttempts = attempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sortedAssignments = assignments
    .filter((assignment) => !assignment.deletedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const topics = buildTopicInsights(sortedAttempts);
  const plan = buildLearnerPlan(sortedAttempts, topics);
  const actualCorrect = sortedAttempts.filter((attempt) => attempt.ok).length;
  const actualAttempted = sortedAttempts.length;
  const correct = override ? override.correct : actualCorrect;
  const attempted = override ? override.attempted : actualAttempted;
  const wrong = Math.max(0, attempted - correct);
  const customFocusMap: StudentProgressMapItem[] = override?.focusTitle
    ? [
        {
          id: `${student.id}-teacher-focus`,
          label: override.focusTitle,
          attempted,
          accuracy: percent(correct, attempted),
          wrongRate: percent(wrong, attempted),
          status: "watch",
        },
      ]
    : [];
  const progressMap = [
    ...customFocusMap,
    ...topics.slice(0, 8).map((topic) => ({
    id: topic.topicId,
    label: topic.unitLabel ?? `${topic.unitNo}단원`,
    attempted: topic.attempted,
    accuracy: topic.accuracy,
    wrongRate: topic.wrongRate,
    status: progressStatus(topic),
    })),
  ].slice(0, 8);
  const nextTitle = override?.focusTitle ?? plan.nextTitle;
  const coaching = override?.teacherMemo ? `${override.teacherMemo} ${plan.strategy}` : plan.strategy;
  return {
    student,
    attempted,
    correct,
    wrong,
    accuracy: percent(correct, attempted),
    wrongRate: percent(wrong, attempted),
    lastStudiedAt: override?.updatedAt ?? sortedAttempts[0]?.createdAt,
    actualAttempted: override ? actualAttempted : undefined,
    actualCorrect: override ? actualCorrect : undefined,
    progressEditedAt: override?.updatedAt,
    progressTargetDaily: override?.targetDaily,
    progressFocusTitle: override?.focusTitle,
    progressTeacherMemo: override?.teacherMemo,
    coaching,
    nextTitle,
    progressMap,
    assignments: sortedAssignments,
    attempts: sortedAttempts,
  };
}

export async function loadClassLearningProgress(classId?: string): Promise<ClassLearningProgressSnapshot> {
  const roster = await loadLearningRosterSnapshot();
  const classRecord = roster.classes.find((item) => item.id === classId) ?? roster.activeClass;
  const teacherRecord =
    roster.teachers.find((teacher) => teacher.id === classRecord?.teacherId) ?? roster.activeTeacher;
  const classStudents = classRecord
    ? roster.students.filter((student) => student.classId === classRecord.id)
    : roster.students;

  try {
    const overrides = await readAllIndexed<StudentProgressOverrideRecord>(PROGRESS_OVERRIDE_STORE);
    const assignments = await readAllIndexed<StudentLearningAssignmentRecord>(ASSIGNMENT_STORE);
    const overrideByStudent = new Map(overrides.map((override) => [override.studentId, override]));
    const assignmentsByStudent = new Map<string, StudentLearningAssignmentRecord[]>();
    for (const assignment of assignments) {
      assignmentsByStudent.set(assignment.studentId, [...(assignmentsByStudent.get(assignment.studentId) ?? []), assignment]);
    }
    const students = await Promise.all(
      classStudents.map(async (student) =>
        buildStudentProgress(
          student,
          await readIndexedDbAttempts(student.learnerId),
          overrideByStudent.get(student.id),
          assignmentsByStudent.get(student.id) ?? [],
        ),
      ),
    );
    return {
      storage: currentIndexedStorage(),
      classRecord,
      teacherRecord,
      students,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    const overrideByStudent = new Map(readFallbackProgressOverrides().map((override) => [override.studentId, override]));
    const assignmentsByStudent = new Map<string, StudentLearningAssignmentRecord[]>();
    for (const assignment of readFallbackAssignments()) {
      assignmentsByStudent.set(assignment.studentId, [...(assignmentsByStudent.get(assignment.studentId) ?? []), assignment]);
    }
    return {
      storage: "localStorage",
      classRecord,
      teacherRecord,
      students: classStudents.map((student) =>
        buildStudentProgress(
          student,
          readFallbackAttempts(student.learnerId),
          overrideByStudent.get(student.id),
          assignmentsByStudent.get(student.id) ?? [],
        ),
      ),
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function loadAllLearningProgress(teacherId?: string): Promise<ClassLearningProgressSnapshot> {
  const roster = await loadLearningRosterSnapshot();
  const progressStudents = teacherId
    ? roster.students.filter((student) => student.teacherId === teacherId)
    : roster.students;
  try {
    const overrides = await readAllIndexed<StudentProgressOverrideRecord>(PROGRESS_OVERRIDE_STORE);
    const assignments = await readAllIndexed<StudentLearningAssignmentRecord>(ASSIGNMENT_STORE);
    const overrideByStudent = new Map(overrides.map((override) => [override.studentId, override]));
    const assignmentsByStudent = new Map<string, StudentLearningAssignmentRecord[]>();
    for (const assignment of assignments) {
      assignmentsByStudent.set(assignment.studentId, [...(assignmentsByStudent.get(assignment.studentId) ?? []), assignment]);
    }
    const students = await Promise.all(
      progressStudents.map(async (student) =>
        buildStudentProgress(
          student,
          await readIndexedDbAttempts(student.learnerId),
          overrideByStudent.get(student.id),
          assignmentsByStudent.get(student.id) ?? [],
        ),
      ),
    );
    return {
      storage: currentIndexedStorage(),
      students,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    const overrideByStudent = new Map(readFallbackProgressOverrides().map((override) => [override.studentId, override]));
    const assignmentsByStudent = new Map<string, StudentLearningAssignmentRecord[]>();
    for (const assignment of readFallbackAssignments()) {
      assignmentsByStudent.set(assignment.studentId, [...(assignmentsByStudent.get(assignment.studentId) ?? []), assignment]);
    }
    return {
      storage: "localStorage",
      students: progressStudents.map((student) =>
        buildStudentProgress(
          student,
          readFallbackAttempts(student.learnerId),
          overrideByStudent.get(student.id),
          assignmentsByStudent.get(student.id) ?? [],
        ),
      ),
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function loadLearningAdminSnapshot(): Promise<AdminLearningSnapshot> {
  try {
    const [teachers, classes, students, adminAccounts, teacherAccounts, studentAccounts, progressOverrides, assignments, attempts] = await Promise.all([
      readAllIndexed<TeacherRecord>(TEACHER_STORE),
      readAllIndexed<ClassRecord>(CLASS_STORE),
      readAllIndexed<StudentRecord>(STUDENT_STORE),
      readAllIndexed<AdminAccountRecord>(ADMIN_ACCOUNT_STORE),
      readAllIndexed<TeacherAccountRecord>(TEACHER_ACCOUNT_STORE),
      readAllIndexed<StudentAccountRecord>(STUDENT_ACCOUNT_STORE),
      readAllIndexed<StudentProgressOverrideRecord>(PROGRESS_OVERRIDE_STORE),
      readAllIndexed<StudentLearningAssignmentRecord>(ASSIGNMENT_STORE),
      readAllIndexed<LearnerAttemptRecord>(ATTEMPT_STORE),
    ]);
    return {
      storage: currentIndexedStorage(),
      teachers: teachers.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      classes: classes.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      students: students.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      adminAccounts: adminAccounts.sort((a, b) => a.username.localeCompare(b.username)),
      teacherAccounts: teacherAccounts.map(normalizeTeacherAccountSecurity).sort((a, b) => a.username.localeCompare(b.username)),
      studentAccounts: studentAccounts.map(normalizeStudentAccountSecurity).sort((a, b) => a.username.localeCompare(b.username)),
      progressOverrides: progressOverrides.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      assignments: assignments.filter((assignment) => !assignment.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      attempts: attempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      securityAlerts: readSecurityAlerts(),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    const roster = readFallbackRoster();
    const auth = readFallbackAuth();
    return {
      storage: "localStorage",
      teachers: roster.teachers.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      classes: roster.classes.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      students: roster.students.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      adminAccounts: auth.adminAccounts.sort((a, b) => a.username.localeCompare(b.username)),
      teacherAccounts: auth.teacherAccounts.map(normalizeTeacherAccountSecurity).sort((a, b) => a.username.localeCompare(b.username)),
      studentAccounts: auth.studentAccounts.map(normalizeStudentAccountSecurity).sort((a, b) => a.username.localeCompare(b.username)),
      progressOverrides: readFallbackProgressOverrides().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      assignments: readFallbackAssignments().filter((assignment) => !assignment.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      attempts: readAllFallbackAttempts().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      securityAlerts: readSecurityAlerts(),
      generatedAt: new Date().toISOString(),
    };
  }
}
