// 앱 진입점: 1·2·3·4·5·6학년 3월~다음 해 2월, 1·2·3·4·5·6학년 연산 인터랙티브 익힘책 목차와 연습 화면

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UNITS } from "./lib/curriculum";
import type { LearningArea, LearningLevel, Problem, Unit } from "./lib/types";
import Practice from "./components/Practice";
import MathVisual from "./components/MathVisual";
import OperationDrillHub from "./components/OperationDrillHub";
import storybookHero from "./assets/storybook-hero.svg";
import { buildStemStoryChapters, type StemStoryChapter } from "./lib/story";
import { formatAnswer } from "./lib/check";
import {
  loadLearningContentSnapshot,
  syncLearningContentDb,
  type LearningContentSnapshot,
} from "./lib/contentDb";
import {
  loadCloudLearningMaintenanceStatus,
  runCloudLearningMaintenance,
  type LearningMaintenanceResult,
  type LearningMaintenanceStatus,
} from "./lib/cloudMaintenance";
import {
  acknowledgeLearningSecurityAlert,
  activateLearningAccountByAdmin,
  assignStudentLearningWork,
  loadAllLearningProgress,
  loadLearningAuthSnapshot,
  loadClassLearningProgress,
  loadLearningAdminSnapshot,
  loadLearningRosterSnapshot,
  loginLocalAdminAccount,
  loginGoogleAdminAccount,
  loginLearningAccount,
  logoutLearningAccount,
  loadLearnerDbSnapshot,
  recordLearnerAttempt,
  registerLearningAccount,
  registerClassRecord,
  registerStudentRecord,
  registerTeacherName,
  removeClassRecord,
  removeStudentLearningAssignment,
  setupLocalAdminAccount,
  selectLearningRosterClass,
  selectLearningRosterStudent,
  updateLearningAccountAccess,
  updateStudentLearningAssignment,
  updateStudentLearningProgress,
  upsertStudentLearningAccount,
  upsertTeacherLearningAccount,
  upsertLearnerDbProfile,
  ACCOUNT_APPROVAL_PENDING_REASON,
  type AccountRole,
  type AdminLearningSnapshot,
  type ClassLearningProgressSnapshot,
  type LearningAuthSnapshot,
  type LearningRosterSnapshot,
  type LearnerDbSnapshot,
  type StudentLearningAssignmentRecord,
  type StudentRecord,
} from "./lib/learnerDb";
import {
  loadReaderPrefs,
  loadLearnerProfile,
  loadStudyStats,
  saveReaderPrefs,
  saveLearnerProfile,
  saveStudyStats,
  type LearnerProfile,
  type ReaderPrefs,
  type StudyBucket,
  type StudyStats,
} from "./lib/readerPrefs";

type ProblemSetSize = 10 | 20 | 30 | 40 | 50;

type Screen =
  | { name: "home" }
  | { name: "operation-drill" }
  | { name: "practice"; title: string; accent: string; problems: Problem[]; problemSetSize: ProblemSetSize };

type ManagedLearningAccount =
  | Extract<LearningAuthSnapshot["teacherAccounts"][number], { role: "teacher" }>
  | Extract<LearningAuthSnapshot["studentAccounts"][number], { role: "student" }>;

type ProblemSheetMode = "worksheet" | "answer";

type ProblemSheetDraft = {
  key: string;
  title: string;
  problemSetSize: ProblemSetSize;
  problems: Problem[];
  createdAt: string;
};

type ProblemSheetMeta = {
  title: string;
  teacherName: string;
  learnerName: string;
  className: string;
  dateLabel: string;
  problemSetSize: ProblemSetSize;
};

const PROBLEMS_PER_TOPIC: ProblemSetSize = 10;
const PROBLEM_SET_OPTIONS: Array<{ value: ProblemSetSize; label: string; desc: string }> = [
  { value: 10, label: "10문제 세트", desc: "짧게 확인" },
  { value: 20, label: "20문제 세트", desc: "충분히 연습" },
  { value: 30, label: "30문제 세트", desc: "집중 반복" },
];
const FULL_UNIT_SELECTION = "__unit__";
const LEARNER_GRADE_OPTIONS = ["1학년", "1학년 연산", "2학년", "2학년 연산", "3학년", "3학년 연산", "4학년", "4학년 연산", "5학년", "5학년 연산", "6학년", "6학년 연산"] as const;
const OPERATION_GRADE_OPTIONS = ["1학년 연산", "2학년 연산", "3학년 연산", "4학년 연산", "5학년 연산", "6학년 연산"] as const;
const LEARNING_SETTINGS_KEY = "kang-math-learning-settings-v1";
const ADMIN_GOOGLE_EMAIL = "purunetkangtaehun@gmail.com";
const GOOGLE_CLIENT_ID_STORAGE_KEY = "kang-math-google-client-id";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DEFAULT_TEACHER_ACCESS = {
  canLogin: true,
  canStudy: true,
  canViewLearningData: true,
  canManageRoster: true,
};
const DEFAULT_STUDENT_ACCESS = {
  canLogin: true,
  canStudy: true,
  canViewLearningData: false,
  canManageRoster: false,
};
const LEARNING_LEVEL_OPTIONS: Array<{ id: LearningLevel; label: string; desc: string }> = [
  { id: "beginner", label: "초급", desc: "업로드 교재 기반 기본 단계" },
  { id: "intermediate", label: "중급", desc: "확장 유형 준비 단계" },
  { id: "advanced", label: "고급", desc: "심화 응용 준비 단계" },
];
const LEARNING_AREA_OPTIONS: Array<{ id: LearningArea; label: string; desc: string }> = [
  { id: "basic", label: "기초연산", desc: "계산을 빠르고 정확하게" },
  { id: "concept", label: "개념", desc: "교과서식 개념·스토리·STEM 설명" },
  { id: "type", label: "유형", desc: "중간 단계 적용·풀이 전략" },
  { id: "challenge", label: "고난이도", desc: "현실 문제·창의 응용" },
];

type LearningSettings = {
  level: LearningLevel;
  area: LearningArea;
  problemSetSize: ProblemSetSize;
};

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleIdTokenPayload = {
  aud?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            login_hint?: string;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              locale?: string;
              width?: number;
            },
          ) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type RosterMenu =
  | "adminLogin"
  | "teacherLogin"
  | "studentLogin"
  | "signup"
  | "teacher"
  | "class"
  | "student"
  | "studentManage"
  | "classManage";

type TopicMeta = {
  unitId: string;
  unitNo: number;
  unitLabel?: string;
  unitTitle: string;
  topicTitle: string;
  learningLevel: LearningLevel;
  learningArea: LearningArea;
};

type TopicEntry = {
  unit: Unit;
  topic: Unit["topics"][number];
  topicIndex: number;
};

type UnitProgress = {
  id: string;
  no: number;
  label?: string;
  course?: string;
  month?: string;
  title: string;
  accent: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  wrongRate: number;
  target: number;
  progress: number;
  lastStudiedAt?: string;
};

type StudentDailyCounselReport = {
  id: string;
  dateKey: string;
  dateLabel: string;
  attempted: number;
  accuracy: number;
  focusTitle: string;
  diagnosisText: string;
  counselingText: string;
  combinedText: string;
};

type StudentProgressPeriodSummary = {
  id: "daily" | "weekly" | "monthly";
  label: string;
  attempted: number;
  accuracy: number;
  progress: number;
};

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function updateBucket(bucket: StudyBucket | undefined, ok: boolean, now: string): StudyBucket {
  return {
    attempted: (bucket?.attempted ?? 0) + 1,
    correct: (bucket?.correct ?? 0) + (ok ? 1 : 0),
    lastStudiedAt: now,
  };
}

function studyLabel(attempted: number) {
  if (attempted >= 120) return "충분";
  if (attempted >= 60) return "안정";
  if (attempted >= 30) return "진행";
  return "시작";
}

function shortDate(iso?: string) {
  if (!iso) return "기록 없음";
  return new Date(iso).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function learnerLabel(profile: LearnerProfile) {
  return `${profile.grade} ${profile.name}`;
}

function learnerProfileFromStudent(student: StudentRecord): LearnerProfile {
  return {
    id: student.learnerId,
    name: student.name,
    grade: student.grade,
    teacherId: student.teacherId,
    teacherName: student.teacherName,
    classId: student.classId,
    className: student.className,
  };
}

function accessForAccount(account: ManagedLearningAccount) {
  const defaults = account.role === "teacher" ? DEFAULT_TEACHER_ACCESS : DEFAULT_STUDENT_ACCESS;
  return {
    ...defaults,
    ...account.access,
    canManageRoster: account.role === "teacher" ? (account.access?.canManageRoster ?? defaults.canManageRoster) : false,
  };
}

function isApprovalPendingAccount(account: ManagedLearningAccount) {
  const access = accessForAccount(account);
  return !access.canLogin && access.blockedReason === ACCOUNT_APPROVAL_PENDING_REASON;
}

function approvedAccessForAccount(account: ManagedLearningAccount) {
  return {
    ...(account.role === "teacher" ? DEFAULT_TEACHER_ACCESS : DEFAULT_STUDENT_ACCESS),
    blockedReason: undefined,
  };
}

function pendingAccessForAccount() {
  return {
    canLogin: false,
    canStudy: false,
    canViewLearningData: false,
    canManageRoster: false,
    blockedReason: ACCOUNT_APPROVAL_PENDING_REASON,
  };
}

function accessStatusLabel(account: ManagedLearningAccount) {
  const access = accessForAccount(account);
  if (isApprovalPendingAccount(account)) return "승인 대기";
  if (!access.canLogin) return "계정 차단";
  if (!access.canStudy) return "학습 차단";
  if (account.role === "teacher" && (!access.canViewLearningData || !access.canManageRoster)) return "일부 제한";
  return "정상 권한";
}

function adminCredentialStatusLabel(account: AdminLearningSnapshot["adminAccounts"][number]) {
  if (account.authProvider === "local") return "로컬 PIN · 해시 비노출";
  if (account.passwordHash) return "Google + 로컬 PIN · 해시 비노출";
  return "Google 로그인";
}

function sanitizedAccountForBackup<T extends { role: AccountRole; authProvider?: "google" | "local"; passwordHash?: string }>(account: T) {
  const { passwordHash: _passwordHash, ...safeAccount } = account;
  void _passwordHash;
  const credential =
    account.role === "admin"
      ? account.authProvider === "local"
        ? "local-admin-pin-redacted"
        : account.passwordHash
          ? "google-oauth-local-pin-redacted"
          : "google-oauth"
      : "password-hash-redacted";
  return {
    ...safeAccount,
    credential,
  };
}

function studentIdFromActiveAccount(auth: LearningAuthSnapshot | null) {
  const account = auth?.activeStudentAccount;
  return account?.role === "student" ? account.studentId : undefined;
}

function activeStudentForAuth(snapshot: LearningRosterSnapshot, auth: LearningAuthSnapshot | null) {
  const accountStudentId = studentIdFromActiveAccount(auth);
  if (accountStudentId) {
    return snapshot.students.find((student) => student.id === accountStudentId) ?? snapshot.activeStudent;
  }
  return snapshot.activeStudent;
}

function classStudentCountLabel(count: number) {
  return count === 0 ? "등록 학생 없음" : `${count}명 등록`;
}

function unitLabel(unit: Pick<Unit, "no" | "label" | "course" | "month"> | Pick<UnitProgress, "no" | "label" | "course" | "month">) {
  if (unit.label) return unit.label;
  if (unit.course && unit.month) return `${unit.course} ${unit.month}`;
  return `${unit.no}단원`;
}

function unitSelectionLabel(
  unit: Pick<Unit, "no" | "label" | "course" | "month" | "title"> | Pick<UnitProgress, "no" | "label" | "course" | "month" | "title">,
) {
  const label = unitLabel(unit);
  const normalizedCourse = `${unit.course ?? ""} ${unit.title ?? ""}`.replace(/\s+/g, "");
  const normalizedLabel = label.replace(/\s+/g, "");
  if (normalizedCourse.includes("연산") && !normalizedLabel.includes("연산")) return `${label} 연산`;
  return label;
}

function normalizedGrade(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function fullGradeForAccess(value: string) {
  const grade = normalizedGrade(value);
  if ((grade.includes("예비") && grade.includes("2")) || grade.includes("1") || grade.includes("pre2")) return "1학년";
  if ((grade.includes("예비") && grade.includes("3")) || grade.includes("2") || grade.includes("pre3")) return "2학년";
  if ((grade.includes("예비") && grade.includes("4")) || grade.includes("3") || grade.includes("pre4")) return "3학년";
  if ((grade.includes("예비") && grade.includes("5")) || grade.includes("4") || grade.includes("pre5")) return "4학년";
  if (grade.includes("5")) return "5학년";
  if (grade.includes("6")) return "6학년";
  return value;
}

function sameGradeLabel(left?: string, right?: string) {
  return Boolean(left && right && normalizedGrade(left) === normalizedGrade(right));
}

function gradeSortIndex(value: string) {
  const index = LEARNER_GRADE_OPTIONS.findIndex((grade) => sameGradeLabel(grade, value));
  return index === -1 ? LEARNER_GRADE_OPTIONS.length : index;
}

function uniqueGradeSelections(grades: string[]) {
  const seen = new Set<string>();
  return grades
    .map((grade) => grade.trim())
    .filter(Boolean)
    .filter((grade) => {
      const key = normalizedGrade(grade);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function classGradeSelections(primaryGrade: string, grades: string[]) {
  return uniqueGradeSelections([primaryGrade, ...grades]);
}

function gradeFromLaunchUrl() {
  if (typeof window === "undefined") return undefined;
  const raw = new URLSearchParams(window.location.search).get("grade");
  if (!raw) return undefined;
  const grade = normalizedGrade(raw);
  if (grade.includes("1") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"))) return "1학년 연산";
  if (grade.includes("2") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"))) return "2학년 연산";
  if (grade.includes("3") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"))) return "3학년 연산";
  if (grade.includes("4") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"))) return "4학년 연산";
  if (grade.includes("5") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"))) return "5학년 연산";
  if (grade.includes("6") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"))) return "6학년 연산";
  if ((grade.includes("예비") && grade.includes("2")) || grade.includes("pre2")) return "1학년";
  if ((grade.includes("예비") && grade.includes("3")) || grade.includes("pre3")) return "2학년";
  if ((grade.includes("예비") && grade.includes("5")) || grade.includes("pre5")) return "4학년";
  if ((grade.includes("예비") && grade.includes("4")) || grade.includes("pre4")) return "3학년";
  if (grade.includes("1")) return "1학년";
  if (grade.includes("2")) return "2학년";
  if (grade.includes("3")) return "3학년";
  if (grade.includes("6")) return "6학년";
  if (grade.includes("4")) return "4학년";
  if (grade.includes("5")) return "5학년";
  return undefined;
}

function loadLaunchLearnerProfile() {
  const profile = loadLearnerProfile();
  const launchGrade = gradeFromLaunchUrl();
  if (!launchGrade || normalizedGrade(profile.grade) === normalizedGrade(launchGrade)) return profile;
  return saveLearnerProfile({ ...profile, grade: launchGrade });
}

function isSecondGradeLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("2") || (grade.includes("예비") && grade.includes("3"));
}

function isSecondGradeOperationLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("2") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"));
}

function isThirdGradeOperationLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("3") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"));
}

function isFourthGradeOperationLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("4") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"));
}

function isFifthGradeOperationLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("5") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"));
}

function isSixthGradeOperationLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("6") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"));
}

function isFirstGradeOperationLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("1") && (grade.includes("연산") || grade.includes("op") || grade.includes("operation"));
}

function isFirstGradeLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("1") || (grade.includes("예비") && grade.includes("2"));
}

function isFourthGradeLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("4") || (grade.includes("예비") && grade.includes("5"));
}

function isThirdGradeLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("3") || (grade.includes("예비") && grade.includes("4"));
}

function isFifthGradeLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("5") && !(grade.includes("예비") && grade.includes("5"));
}

function isSixthGradeLearner(profile: Pick<LearnerProfile, "grade">) {
  const grade = normalizedGrade(profile.grade);
  return grade.includes("6");
}

function isSecondGradeUnit(unit: Unit) {
  return unit.id.startsWith("g2-");
}

function isFirstGradeUnit(unit: Unit) {
  return unit.id.startsWith("g1-");
}

function isFourthGradeUnit(unit: Unit) {
  return unit.id.startsWith("g4-");
}

function isThirdGradeUnit(unit: Unit) {
  return unit.id.startsWith("g3-");
}

function isSixthGradeUnit(unit: Unit) {
  return unit.id.startsWith("g6-");
}

function firstGradeOperationUnits(units: Unit[]) {
  return units
    .filter(isFirstGradeUnit)
    .map((unit) => ({
      ...unit,
      title: "수학연산",
      subtitle: `${unitLabel(unit)} 연산 전용 과정`,
      topics: unit.topics.filter((topic) => topic.id.startsWith("g1-op-")),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function secondGradeOperationUnits(units: Unit[]) {
  return units
    .filter(isSecondGradeUnit)
    .map((unit) => ({
      ...unit,
      title: "수학연산",
      subtitle: `${unitLabel(unit)} 연산 전용 과정`,
      topics: unit.topics.filter((topic) => topic.id.startsWith("g2-op-")),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function thirdGradeOperationUnits(units: Unit[]) {
  return units
    .filter(isThirdGradeUnit)
    .map((unit) => ({
      ...unit,
      title: "수학연산",
      subtitle: `${unitLabel(unit)} 연산 전용 과정`,
      topics: unit.topics.filter((topic) => topic.id.startsWith("g3-op-")),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function fourthGradeOperationUnits(units: Unit[]) {
  return units
    .filter(isFourthGradeUnit)
    .map((unit) => ({
      ...unit,
      title: "수학연산",
      subtitle: `${unitLabel(unit)} 연산 전용 과정`,
      topics: unit.topics.filter((topic) => topic.id.startsWith("g4-op-")),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function fifthGradeOperationUnits(units: Unit[]) {
  return units
    .filter((unit) => !isFirstGradeUnit(unit) && !isSecondGradeUnit(unit) && !isThirdGradeUnit(unit) && !isFourthGradeUnit(unit) && !isSixthGradeUnit(unit))
    .map((unit) => ({
      ...unit,
      title: "수학연산",
      subtitle: `${unitLabel(unit)} 연산 전용 과정`,
      topics: unit.topics.filter((topic) => topic.id.startsWith("g5-op-")),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function sixthGradeOperationUnits(units: Unit[]) {
  return units
    .filter(isSixthGradeUnit)
    .map((unit) => ({
      ...unit,
      title: "수학연산",
      subtitle: `${unitLabel(unit)} 연산 전용 과정`,
      topics: unit.topics.filter((topic) => topic.id.startsWith("g6-op-")),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function unitsForLearner(units: Unit[], profile: Pick<LearnerProfile, "grade">) {
  const filtered = isFirstGradeOperationLearner(profile)
    ? firstGradeOperationUnits(units)
    : isSecondGradeOperationLearner(profile)
    ? secondGradeOperationUnits(units)
    : isThirdGradeOperationLearner(profile)
    ? thirdGradeOperationUnits(units)
    : isFourthGradeOperationLearner(profile)
    ? fourthGradeOperationUnits(units)
    : isFifthGradeOperationLearner(profile)
    ? fifthGradeOperationUnits(units)
    : isSixthGradeOperationLearner(profile)
    ? sixthGradeOperationUnits(units)
    : isFirstGradeLearner(profile)
    ? units.filter(isFirstGradeUnit)
    : isSecondGradeLearner(profile)
    ? units.filter(isSecondGradeUnit)
    : isThirdGradeLearner(profile)
    ? units.filter(isThirdGradeUnit)
    : isFourthGradeLearner(profile)
      ? units.filter(isFourthGradeUnit)
      : isSixthGradeLearner(profile)
      ? units.filter(isSixthGradeUnit)
    : isFifthGradeLearner(profile)
      ? units.filter((unit) => !isFirstGradeUnit(unit) && !isSecondGradeUnit(unit) && !isThirdGradeUnit(unit) && !isFourthGradeUnit(unit) && !isSixthGradeUnit(unit))
      : units;
  return filtered.length ? filtered : units;
}

function courseRangeLabel(profile: Pick<LearnerProfile, "grade">) {
  if (isFirstGradeOperationLearner(profile)) return "1학년 수학연산 3월~11월";
  if (isSecondGradeOperationLearner(profile)) return "2학년 수학연산 3월~2월";
  if (isThirdGradeOperationLearner(profile)) return "3학년 수학연산 3월~2월";
  if (isFourthGradeOperationLearner(profile)) return "4학년 수학연산 3월~2월";
  if (isFifthGradeOperationLearner(profile)) return "5학년 수학연산 3월~2월";
  if (isSixthGradeOperationLearner(profile)) return "6학년 수학연산 3월~2월";
  if (isFirstGradeLearner(profile)) return "1학년 3월~1학년 2월";
  if (isSecondGradeLearner(profile)) return "2학년 3월~2학년 2월";
  if (isThirdGradeLearner(profile)) return "3학년 3월~3학년 2월";
  if (isFourthGradeLearner(profile)) return "4학년 3월~4학년 2월";
  if (isSixthGradeLearner(profile)) return "6학년 3월~중등 준비 2월";
  if (isFifthGradeLearner(profile)) return "5학년 3월~6학년 준비 2월";
  return "1·2·3·4·5·6학년 통합 과정";
}

function isLearningLevel(value: string): value is LearningLevel {
  return LEARNING_LEVEL_OPTIONS.some((option) => option.id === value);
}

function isLearningArea(value: string): value is LearningArea {
  return LEARNING_AREA_OPTIONS.some((option) => option.id === value);
}

function isProblemSetSize(value: unknown): value is ProblemSetSize {
  return PROBLEM_SET_OPTIONS.some((option) => option.value === value);
}

function parseProblemSetSize(value: unknown): ProblemSetSize {
  const numeric = Number(value);
  return isProblemSetSize(numeric) ? numeric : PROBLEMS_PER_TOPIC;
}

function problemSetSizeLabel(size: ProblemSetSize) {
  return PROBLEM_SET_OPTIONS.find((option) => option.value === size)?.label ?? "10문제 세트";
}

function learningLevelLabel(level: LearningLevel) {
  return LEARNING_LEVEL_OPTIONS.find((option) => option.id === level)?.label ?? "초급";
}

function learningAreaLabel(area: LearningArea) {
  return LEARNING_AREA_OPTIONS.find((option) => option.id === area)?.label ?? "기초연산";
}

function loadLearningSettings(): LearningSettings {
  try {
    const raw = window.localStorage.getItem(LEARNING_SETTINGS_KEY);
    if (!raw) return { level: "beginner", area: "basic", problemSetSize: PROBLEMS_PER_TOPIC };
    const parsed = JSON.parse(raw) as Partial<LearningSettings>;
    return {
      level: parsed.level && isLearningLevel(parsed.level) ? parsed.level : "beginner",
      area: parsed.area && isLearningArea(parsed.area) ? parsed.area : "basic",
      problemSetSize: parseProblemSetSize(parsed.problemSetSize),
    };
  } catch {
    return { level: "beginner", area: "basic", problemSetSize: PROBLEMS_PER_TOPIC };
  }
}

function saveLearningSettings(settings: LearningSettings) {
  try {
    window.localStorage.setItem(LEARNING_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 설정 저장을 못 해도 현재 세션의 필터는 계속 사용할 수 있습니다.
  }
}

function loadGoogleClientId() {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (envClientId) return envClientId;
  try {
    return window.localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function saveGoogleClientId(clientId: string) {
  try {
    window.localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE_KEY, clientId.trim());
  } catch {
    // 저장에 실패해도 현재 입력값으로 Google 버튼 초기화는 계속 시도합니다.
  }
}

function decodeGoogleCredential(token: string): GoogleIdTokenPayload {
  const [, payload] = token.split(".");
  if (!payload) throw new Error("Google 인증 응답을 해석할 수 없습니다.");
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
  const decoded = decodeURIComponent(
    Array.from(atob(base64), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
  );
  return JSON.parse(decoded) as GoogleIdTokenPayload;
}

function topicLearningLevel(topic: Unit["topics"][number]): LearningLevel {
  return topic.learningLevel ?? "beginner";
}

function topicLearningArea(topic: Unit["topics"][number]): LearningArea {
  if (topic.learningArea) return topic.learningArea;
  const text = `${topic.id} ${topic.title} ${topic.desc}`;
  if (/고난|심화|복합|활용|문장제|추론|전체 구하기|거꾸로|빈칸|미지수|응용/.test(text)) return "challenge";
  if (/개념|성질|관계|비율|백분율|원주율|대칭|합동|종류|나타내기|알아보기|읽기/.test(text)) return "concept";
  if (/유형|선택|표|그래프|도형|비례식|비교|분류|순서|패턴|규칙/.test(text)) return "type";
  return "basic";
}

function filterUnitsByLearningSettings(units: Unit[], settings: LearningSettings): Unit[] {
  return units
    .map((unit) => ({
      ...unit,
      topics: unit.topics.filter((topic) => topicLearningLevel(topic) === settings.level && topicLearningArea(topic) === settings.area),
    }))
    .filter((unit) => unit.topics.length > 0);
}

function firstUnitIdForLearnerAndSettings(units: Unit[], profile: Pick<LearnerProfile, "grade">, settings: LearningSettings) {
  const courseUnits = unitsForLearner(units, profile);
  return filterUnitsByLearningSettings(courseUnits, settings)[0]?.id ?? courseUnits[0]?.id ?? units[0]?.id ?? "";
}

function buildStudyReport(stats: StudyStats, rows: UnitProgress[], learner: LearnerProfile) {
  const wrong = Math.max(0, stats.attempted - stats.correct);
  const accuracy = percent(stats.correct, stats.attempted);
  const wrongRate = percent(wrong, stats.attempted);
  const studiedRows = rows.filter((row) => row.attempted > 0);
  const reportDate = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const header = [
    "학습 보고서",
    `선생님: ${learner.teacherName ?? "미등록"}`,
    `클래스: ${learner.className ?? "미등록"}`,
    `학습자: ${learnerLabel(learner)}`,
    `작성일: ${reportDate}`,
  ];

  if (stats.attempted === 0) {
    return [
      ...header,
      "아직 풀이 기록이 없습니다. 단원별 연습을 시작하면 학습량, 정답률, 오답률이 학습자별로 자동 정리됩니다.",
    ].join("\n");
  }

  const focus = [...studiedRows].sort((a, b) => b.wrongRate - a.wrongRate || b.wrong - a.wrong)[0];
  const top = [...studiedRows].sort((a, b) => b.accuracy - a.accuracy || b.attempted - a.attempted)[0];
  const unitLines = rows
    .filter((row) => row.attempted > 0)
    .map(
      (row) =>
        `- ${unitLabel(row)} ${row.title}: ${row.attempted}문제, 정답률 ${row.accuracy}%, 오답률 ${row.wrongRate}%`,
    );

  return [
    ...header,
    `학습량: ${stats.attempted}문제`,
    `정답: ${stats.correct}문제 / 오답: ${wrong}문제`,
    `정답률: ${accuracy}% / 오답률: ${wrongRate}%`,
    `복습 저장: ${stats.bookmarks}개`,
    `강점 단원: ${top ? `${unitLabel(top)} ${top.title} (${top.accuracy}%)` : "기록 부족"}`,
    `보완 단원: ${focus ? `${unitLabel(focus)} ${focus.title} (${focus.wrongRate}%)` : "기록 부족"}`,
    `다음 학습: ${focus ? `${focus.title} 유형 문제 세트 더 풀기` : "세부 유형 문제 세트 시작"}`,
    "단원별 기록:",
    ...(unitLines.length ? unitLines : ["- 아직 단원별 기록이 충분하지 않습니다."]),
  ].join("\n");
}

function reportDateKey(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString("sv-SE");
  return date.toLocaleDateString("sv-SE");
}

function reportDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function labelLearningArea(area?: string) {
  if (area === "basic") return "기초연산";
  if (area === "concept") return "개념 이해";
  if (area === "type") return "유형 적용";
  if (area === "challenge") return "고난이도 사고";
  return "혼합 영역";
}

function labelLearningLevel(level?: string) {
  if (level === "beginner") return "초급";
  if (level === "intermediate") return "중급";
  if (level === "advanced") return "고급";
  return "기본";
}

function topGroupedLabels<T>(items: T[], labelOf: (item: T) => string, limit = 3) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const label = labelOf(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, limit)
    .map(([label, count]) => `${label} ${count}회`);
}

function buildStudentProgressPeriodSummary(row: ClassLearningProgressSnapshot["students"][number]): StudentProgressPeriodSummary[] {
  const now = Date.now();
  const windows = [
    { id: "daily" as const, label: "일간", days: 1, target: row.progressTargetDaily ?? 10 },
    { id: "weekly" as const, label: "주간", days: 7, target: (row.progressTargetDaily ?? 10) * 5 },
    { id: "monthly" as const, label: "월간", days: 30, target: (row.progressTargetDaily ?? 10) * 20 },
  ];
  return windows.map((windowInfo) => {
    const from = now - windowInfo.days * 24 * 60 * 60 * 1000;
    const attempts = row.attempts.filter((attempt) => new Date(attempt.createdAt).getTime() >= from);
    const correct = attempts.filter((attempt) => attempt.ok).length;
    return {
      id: windowInfo.id,
      label: windowInfo.label,
      attempted: attempts.length,
      accuracy: percent(correct, attempts.length),
      progress: Math.min(100, percent(attempts.length, windowInfo.target)),
    };
  });
}

function buildStudentDailyCounselReports(
  row: ClassLearningProgressSnapshot["students"][number],
  todayKey: string,
): StudentDailyCounselReport[] {
  const sortedAttempts = [...row.attempts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentKeys = [...new Set(sortedAttempts.map((attempt) => reportDateKey(attempt.createdAt)))].filter(
    (dateKey) => dateKey !== todayKey,
  );
  const dateKeys = [todayKey, ...recentKeys].slice(0, 4);
  return dateKeys.map((dateKey) => {
    const dayAttempts = sortedAttempts.filter((attempt) => reportDateKey(attempt.createdAt) === dateKey);
    const priorAttempts = sortedAttempts.filter((attempt) => reportDateKey(attempt.createdAt) < dateKey);
    const correct = dayAttempts.filter((attempt) => attempt.ok).length;
    const wrong = Math.max(0, dayAttempts.length - correct);
    const accuracy = percent(correct, dayAttempts.length);
    const wrongRate = percent(wrong, dayAttempts.length);
    const priorAccuracy = percent(priorAttempts.filter((attempt) => attempt.ok).length, priorAttempts.length);
    const focusTopic =
      topGroupedLabels(
        dayAttempts.filter((attempt) => !attempt.ok),
        (attempt) => attempt.topicTitle,
        1,
      )[0]?.replace(/\s\d+회$/, "") ??
      row.progressMap.find((item) => item.status === "watch")?.label ??
      row.nextTitle;
    const strongTopic =
      topGroupedLabels(
        dayAttempts.filter((attempt) => attempt.ok),
        (attempt) => attempt.topicTitle,
        1,
      )[0]?.replace(/\s\d+회$/, "") ?? "풀이 지속성";
    const areaLabels = topGroupedLabels(dayAttempts, (attempt) => labelLearningArea(attempt.learningArea));
    const levelLabels = topGroupedLabels(dayAttempts, (attempt) => labelLearningLevel(attempt.learningLevel));
    const wrongExamples = dayAttempts
      .filter((attempt) => !attempt.ok)
      .slice(0, 2)
      .map((attempt) => `${attempt.topicTitle}: 학생 답 ${attempt.learnerAnswer}, 정답 ${attempt.correctAnswer}`);
    const volumeBand = dayAttempts.length >= 15 ? "충분" : dayAttempts.length >= 8 ? "적정" : dayAttempts.length > 0 ? "시작" : "미실시";
    const accuracyBand = accuracy >= 85 ? "강점 안정" : accuracy >= 65 ? "형성 중" : dayAttempts.length > 0 ? "집중 보완" : "관찰 대기";
    const consistency =
      priorAttempts.length === 0
        ? "기준 형성 중"
        : accuracy >= priorAccuracy
          ? `이전 평균 ${priorAccuracy}% 대비 유지·상승`
          : `이전 평균 ${priorAccuracy}% 대비 하락 관찰`;
    const selfManagement =
      dayAttempts.length >= 10
        ? "학습량 기준을 채워 자기관리 루틴 형성이 관찰됩니다."
        : dayAttempts.length > 0
          ? "짧은 성공 경험을 반복해 학습 착수 저항을 낮추는 단계입니다."
          : "오늘 기록이 없어 학습 착수 환경과 시간대 확인이 우선입니다.";
    const emotionSupport =
      wrongRate >= 35
        ? "오답을 능력 문제가 아니라 전략 수정 신호로 재해석하도록 정서적 안전감을 먼저 확보합니다."
        : "성취 경험을 구체적으로 언어화해 자기효능감과 다음 도전 의지를 연결합니다.";
    const diagnosisText = [
      `학습 진단서 | ${row.student.name} | ${reportDateLabel(dateKey)}`,
      `자료 범위: ${dayAttempts.length}문제, 정답 ${correct}문제, 오답 ${wrong}문제, 정답률 ${accuracy}%, 오답률 ${wrongRate}%`,
      `누적 맥락: 전체 ${row.attempted}문제, 누적 정답률 ${row.accuracy}%, 최근 기록 ${shortDate(row.lastStudiedAt)}`,
      "",
      "1. 인지·개념 이해",
      `- 주요 학습 영역: ${areaLabels.length ? areaLabels.join(", ") : "오늘 풀이 기록 없음"}`,
      `- 난이도 분포: ${levelLabels.length ? levelLabels.join(", ") : "오늘 풀이 기록 없음"}`,
      `- 강점 신호: ${dayAttempts.length ? strongTopic : "학습 시작 전이므로 강점 단원은 다음 풀이 후 판정"}`,
      "",
      "2. 절차 정확성·오류 패턴",
      `- 정확성 상태: ${accuracyBand}`,
      `- 집중 보완 축: ${focusTopic}`,
      `- 대표 오답: ${wrongExamples.length ? wrongExamples.join(" / ") : "대표 오답 없음"}`,
      "",
      "3. 자기조절·정서 지원",
      `- 학습량 상태: ${volumeBand}`,
      `- 변화 흐름: ${consistency}`,
      `- SEL 관점: ${selfManagement} ${emotionSupport}`,
      "",
      "4. 다음 수업 처방",
      `- 1단계: ${focusTopic} 핵심 개념을 2분 안에 말로 설명하게 합니다.`,
      "- 2단계: 유사 문항 3문제를 천천히 풀며 풀이 순서를 체크합니다.",
      "- 3단계: 마지막 5문제는 시간보다 정확성을 우선해 성공 경험을 마무리합니다.",
    ].join("\n");
    const counselingText = [
      `학부모 상담서 | ${row.student.name} | ${reportDateLabel(dateKey)}`,
      "상담 목적: 오늘 학습 데이터를 바탕으로 가정에서 바로 도울 수 있는 관찰 포인트와 대화 문장을 정리합니다.",
      "",
      "1. 보호자에게 먼저 전달할 강점",
      `- ${dayAttempts.length ? `${strongTopic}에서 긍정 신호가 확인되었습니다.` : "오늘 풀이 기록은 없지만 학습 시작 조건을 함께 정비하면 루틴 형성 여지가 있습니다."}`,
      `- 현재 누적 정답률은 ${row.accuracy}%이며, 학생에게는 결과보다 풀이 과정과 재도전 행동을 먼저 인정하는 방식이 적합합니다.`,
      "",
      "2. 오늘의 상담 핵심",
      `- ${focusTopic} 영역은 반복 훈련보다 원인 확인이 먼저 필요합니다.`,
      `- 가정에서는 오답을 지적하기보다 '어느 단계에서 헷갈렸는지'를 묻는 방식이 자기인식과 자기관리 역량을 높입니다.`,
      "",
      "3. 가정 실천 제안",
      "- 하루 10분, 같은 시간대에 짧게 시작해 학습 착수 루틴을 고정합니다.",
      "- 맞힌 문제 1개와 다시 볼 문제 1개를 학생이 직접 고르게 해 책임 있는 선택 경험을 줍니다.",
      "- 보호자 피드백은 '왜 틀렸어'보다 '어떤 방법을 다시 써볼까'로 전환합니다.",
      "",
      "4. 다음 상담 질문",
      "- 아이가 문제를 풀기 전 가장 부담스러워하는 순간은 언제인가요?",
      "- 가정에서 집중이 잘 되는 시간대와 방해 요인은 무엇인가요?",
      "- 이번 주에는 정확성, 속도, 꾸준함 중 무엇을 우선 목표로 둘까요?",
      "",
      "주의: 이 문서는 학습 데이터 기반 교육 상담 참고 자료이며 임상적 심리 진단 문서가 아닙니다.",
    ].join("\n");
    return {
      id: `${row.student.id}-${dateKey}`,
      dateKey,
      dateLabel: reportDateLabel(dateKey),
      attempted: dayAttempts.length,
      accuracy,
      focusTitle: focusTopic,
      diagnosisText,
      counselingText,
      combinedText: `${diagnosisText}\n\n${counselingText}`,
    };
  });
}

function makeTemporaryPassword() {
  const random = Math.random().toString(36).slice(2, 8);
  return `Math${random}${new Date().getDate()}`;
}

function safeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-") || "learning-report";
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

function printReportDocument(title: string, text: string, mode: "pdf" | "printer" = "printer") {
  const popup = window.open("", "_blank", "popup=yes,width=920,height=1200");
  if (!popup) return false;
  popup.opener = null;
  const escapedTitle = escapeHtml(title);
  const escapedText = escapeHtml(text);
  const actionLabel = mode === "pdf" ? "PDF 저장" : "프린터 출력";
  popup.document.write(`
    <html lang="ko">
      <head>
        <title>${escapedTitle}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          body { font-family: "Malgun Gothic", system-ui, sans-serif; margin: 0; line-height: 1.7; color: #111827; background: #ffffff; }
          main { max-width: 840px; margin: 0 auto; padding: 24px; }
          h1 { font-size: 24px; margin: 0 0 18px; line-height: 1.35; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 17px; font-weight: 700; line-height: 1.72; }
          .print-note { margin: 0 0 16px; color: #4b5563; font-size: 13px; font-weight: 800; }
          @media print {
            main { max-width: none; padding: 0; }
            .print-note { display: none; }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${escapedTitle}</h1>
          <p class="print-note">${actionLabel} 창입니다. 브라우저 인쇄 대상에서 원하는 출력 방식을 선택하세요.</p>
          <pre>${escapedText}</pre>
        </main>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.setTimeout(() => popup.print(), 160);
  return true;
}

function printableFractionHtml(numerator: string, denominator: string, whole?: string) {
  const fraction = `<span class="print-frac"><span>${numerator}</span><span>${denominator}</span></span>`;
  return whole ? `<span class="print-mixed"><span>${whole}</span>${fraction}</span>` : fraction;
}

function printableTextHtml(value: string) {
  return escapeHtml(value)
    .replace(/\s+\/\s+/g, " ÷ ")
    .replace(/\\frac\{(-?\d+|□)\}\{(-?\d+|□)\}/g, (_match, numerator: string, denominator: string) =>
      printableFractionHtml(numerator, denominator),
    )
    .replace(/(\d+)\s+(\d+)\/(\d+)/g, (_match, whole: string, numerator: string, denominator: string) =>
      printableFractionHtml(numerator, denominator, whole),
    )
    .replace(/(\d+|□)\/(\d+|□)/g, (_match, numerator: string, denominator: string) =>
      printableFractionHtml(numerator, denominator),
    )
    .replace(/\n/g, "<br />");
}

const PRINT_VISUAL_CSS = `
          .print-visual { margin: 10px 0 2px; }
          .print-visual .math-visual { width: min(100%, 340px); margin: 0 auto; padding: 8px 10px 6px; border: 1.5px solid #bfd7dd; border-radius: 7px; background: #f8fafc; color: #111827; }
          .print-visual .math-visual svg { display: block; width: 100%; height: auto; max-height: 220px; }
          .print-visual figure { break-inside: avoid; page-break-inside: avoid; }
          .print-visual figcaption { margin-bottom: 4px; color: #111827; font-size: 13px; font-weight: 900; text-align: center; }
          .print-visual .table-visual { overflow-x: auto; }
          .print-visual .table-visual table { width: 100%; border-collapse: separate; border-spacing: 0; color: #111827; font-size: 14px; font-weight: 900; }
          .print-visual .table-visual th, .print-visual .table-visual td { min-width: 42px; padding: 7px; border-right: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; text-align: center; }
          .print-visual .table-visual th { background: #eaf6f8; }
          .print-visual .table-visual th:first-child, .print-visual .table-visual td:first-child { border-left: 1.5px solid #cbd5e1; }
          .print-visual .table-visual thead th { border-top: 1.5px solid #cbd5e1; }
          .print-visual .visual-shape, .print-visual .cuboid-front { fill: #dff3f2; stroke: #2f6f7b; stroke-width: 4; stroke-linejoin: round; }
          .print-visual .visual-shape.twin { fill: #eef2ff; }
          .print-visual .visual-cut { fill: #ffffff; stroke: #64748b; stroke-width: 3; stroke-dasharray: 6 5; }
          .print-visual .visual-guide { stroke: #64748b; stroke-width: 3; stroke-dasharray: 7 5; fill: none; }
          .print-visual .visual-label { fill: #111827; font-size: 15px; font-weight: 900; paint-order: stroke; stroke: #ffffff; stroke-width: 5px; }
          .print-visual .cuboid-top { fill: #edf7d8; stroke: #2f6f7b; stroke-width: 4; stroke-linejoin: round; }
          .print-visual .cuboid-side { fill: #c8e7df; stroke: #2f6f7b; stroke-width: 4; stroke-linejoin: round; }
          .print-visual .cube-top, .print-visual .cube-left, .print-visual .cube-right { stroke: #475569; stroke-width: 1.8; stroke-linejoin: round; }
          .print-visual .cube-top { fill: #eff6ff; }
          .print-visual .cube-left { fill: #bae6fd; }
          .print-visual .cube-right { fill: #7dd3fc; }
          .print-visual .chart-axis, .print-visual .coord-axis { stroke: #475569; stroke-width: 3; stroke-linecap: round; }
          .print-visual .chart-grid-line, .print-visual .coord-grid { stroke: #cbd5e1; stroke-width: 1.5; }
          .print-visual .chart-reference { stroke: #dc6b5a; stroke-width: 3; stroke-dasharray: 7 5; }
          .print-visual .chart-bar { fill: #79c7d3; stroke: #2f6f7b; stroke-width: 2; }
          .print-visual .chart-line, .print-visual .congruent-arrow, .print-visual .rotation-path { fill: none; stroke: #2f6f7b; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
          .print-visual .chart-point { fill: #ffffff; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .chart-reference-label, .print-visual .chart-value, .print-visual .chart-label, .print-visual .chart-unit, .print-visual .coord-label, .print-visual .coin-label { fill: #111827; font-size: 12px; font-weight: 900; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; }
          .print-visual .chart-value { font-size: 13px; }
          .print-visual .pictograph-panel { display: grid; gap: 10px; min-width: 250px; padding: 4px 2px 2px; }
          .print-visual .pictograph-key, .print-visual .pictograph-row { display: grid; grid-template-columns: auto auto auto auto; align-items: center; justify-content: center; gap: 7px; color: #111827; font-size: 13px; font-weight: 900; }
          .print-visual .pictograph-rows { display: grid; gap: 8px; }
          .print-visual .pictograph-row { grid-template-columns: minmax(52px, 72px) 1fr; justify-content: stretch; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 7px; background: #ffffff; }
          .print-visual .pictograph-label { text-align: center; }
          .print-visual .pictograph-symbols { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; min-height: 26px; }
          .print-visual .pictograph-icon { display: inline-grid; place-items: center; flex: 0 0 auto; }
          .print-visual .pictograph-icon.big { width: 22px; height: 22px; background: #f2b66d; clip-path: polygon(50% 0%, 62% 34%, 98% 34%, 69% 55%, 80% 92%, 50% 70%, 20% 92%, 31% 55%, 2% 34%, 38% 34%); }
          .print-visual .pictograph-icon.small { width: 12px; height: 12px; border-radius: 999px; background: #69b8c8; box-shadow: inset 0 0 0 2px rgba(70, 51, 36, 0.18); }
          .print-visual .ten-frame-cell, .print-visual .fraction-cell { fill: #ffffff; stroke: #94a3b8; stroke-width: 2; }
          .print-visual .ten-frame-counter { fill: #f2b66d; stroke: #475569; stroke-width: 2; }
          .print-visual .ten-frame-counter.second { fill: #66b7c9; }
          .print-visual .fraction-cell.shaded { fill: #8bcfd1; }
          .print-visual .fraction-cut-line { stroke: #dc6b5a; stroke-width: 3; stroke-dasharray: 7 5; }
          .print-visual .number-bond-line, .print-visual .number-line-axis, .print-visual .number-line-tick { stroke: #475569; stroke-width: 4; stroke-linecap: round; }
          .print-visual .number-bond-total, .print-visual .number-bond-part { fill: #f8fafc; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .number-bond-part.second { fill: #e0f2fe; }
          .print-visual .number-bond-text, .print-visual .number-line-label { fill: #111827; font-size: 20px; font-weight: 900; }
          .print-visual .number-line-missing { fill: #ffffff; stroke: #2f6f7b; stroke-width: 3; stroke-dasharray: 6 4; }
          .print-visual .place-value-rod, .print-visual .base-ten-rod { fill: #f2b66d; stroke: #475569; stroke-width: 1.8; }
          .print-visual .place-value-rod-tick, .print-visual .base-ten-flat-line, .print-visual .base-ten-rod-line { stroke: rgba(71, 85, 105, 0.28); stroke-width: 1.4; }
          .print-visual .place-value-one, .print-visual .base-ten-one { fill: #66b7c9; stroke: #475569; stroke-width: 1.8; }
          .print-visual .base-ten-flat { fill: #bde8ff; stroke: #475569; stroke-width: 1.8; }
          .print-visual .ratio-strip-left { fill: #69b8c8; stroke: #475569; stroke-width: 2; }
          .print-visual .ratio-strip-right { fill: #f2b66d; stroke: #475569; stroke-width: 2; }
          .print-visual .ratio-dot { stroke: #475569; stroke-width: 1.5; }
          .print-visual .ratio-dot.left { fill: #69b8c8; }
          .print-visual .ratio-dot.right { fill: #f2b66d; }
          .print-visual .circle-chart-ring, .print-visual .circle-diagram-base { fill: #ffffff; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .circle-chart-wedge { stroke: #475569; stroke-width: 2.2; stroke-linejoin: round; }
          .print-visual .circle-chart-hole { fill: #ffffff; stroke: #cbd5e1; stroke-width: 2; }
          .print-visual .circle-chart-legend-chip { stroke: #475569; stroke-width: 1.5; }
          .print-visual .circle-chart-percent { fill: #111827; font-size: 12px; font-weight: 900; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; }
          .print-visual .circle-area-fill, .print-visual .circle-diagram-fill { fill: #a9d9c6; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .circle-square { fill: #fff7d8; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .circle-measure-line { stroke: #dc6b5a; stroke-width: 4; stroke-linecap: round; }
          .print-visual .circle-circumference { fill: none; stroke: #dc6b5a; stroke-width: 4; stroke-dasharray: 8 6; }
          .print-visual .circle-pattern-center { fill: #fff6c8; stroke: #475569; stroke-width: 3; }
          .print-visual .circle-pattern-petal { fill: #bde8ff; stroke: #475569; stroke-width: 2.5; }
          .print-visual .angle-ray, .print-visual .line-type-main { stroke: #2f6f7b; stroke-width: 5; stroke-linecap: round; }
          .print-visual .angle-arc { fill: none; stroke: #dc6b5a; stroke-width: 4; stroke-linecap: round; }
          .print-visual .clock-face, .print-visual .ruler-body { fill: #ffffff; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .clock-tick { stroke: #64748b; stroke-width: 1.8; stroke-linecap: round; }
          .print-visual .clock-tick.major { stroke: #334155; stroke-width: 3; }
          .print-visual .clock-number, .print-visual .ruler-number { fill: #111827; font-size: 13px; font-weight: 900; }
          .print-visual .clock-hand { stroke-linecap: round; }
          .print-visual .clock-hand.hour { stroke: #2f6f7b; stroke-width: 7; }
          .print-visual .clock-hand.minute { stroke: #dc6b5a; stroke-width: 4; }
          .print-visual .clock-center, .print-visual .ruler-end-dot { fill: #dc6b5a; stroke: #475569; stroke-width: 2; }
          .print-visual .ruler-tick { stroke: #475569; stroke-linecap: round; }
          .print-visual .ruler-tick.major { stroke-width: 3; }
          .print-visual .ruler-tick.minor { stroke-width: 1.6; }
          .print-visual .ruler-highlight { stroke: #dc6b5a; stroke-width: 6; stroke-linecap: round; }
          .print-visual .line-arrow, .print-visual .rotation-tip { fill: #2f6f7b; stroke: none; }
          .print-visual .line-endpoint, .print-visual .array-dot, .print-visual .coord-point { fill: #66b7c9; stroke: #ffffff; stroke-width: 3; }
          .print-visual .right-angle-marker { fill: none; stroke: #dc6b5a; stroke-width: 4; stroke-linejoin: round; }
          .print-visual .pattern-triangle, .print-visual .pattern-circle, .print-visual .pattern-square, .print-visual .pattern-color { stroke: #475569; stroke-width: 3; }
          .print-visual .pattern-triangle { fill: #f2b66d; }
          .print-visual .pattern-circle { fill: #69b8c8; }
          .print-visual .pattern-square { fill: #91c788; }
          .print-visual .pattern-color.red { fill: #f08f74; }
          .print-visual .pattern-color.blue { fill: #69b8c8; }
          .print-visual .pattern-color.yellow { fill: #f2d36b; }
          .print-visual .pattern-placeholder { fill: #ffffff; stroke: #dc6b5a; stroke-width: 3; stroke-dasharray: 7 5; }
          .print-visual .pattern-question, .print-visual .pattern-label { fill: #111827; font-size: 13px; font-weight: 900; paint-order: stroke; stroke: #ffffff; stroke-width: 4px; }
          .print-visual .pattern-question { font-size: 23px; }
          .print-visual .coord-symmetry { stroke: #dc6b5a; stroke-width: 4; stroke-dasharray: 8 6; }
          .print-visual .coord-reflected { fill: #e97953; stroke: #ffffff; stroke-width: 3; }
          .print-visual .bag-shape { fill: #f8fafc; stroke: #2f6f7b; stroke-width: 4; }
          .print-visual .bag-neck { fill: none; stroke: #2f6f7b; stroke-width: 5; stroke-linecap: round; }
          .print-visual .prob-ball { stroke: #ffffff; stroke-width: 2; }
          .print-visual .prob-ball.red { fill: #e86756; }
          .print-visual .prob-ball.blue { fill: #4e9ed6; }
          .print-visual .coin-face { stroke: #8a693d; stroke-width: 4; }
          .print-visual .coin-face.front { fill: #f7d56b; }
          .print-visual .coin-face.back { fill: #f0bc50; }
`;

function visualToPrintableText(visual?: Problem["visual"]) {
  if (!visual) return "";
  switch (visual.type) {
    case "rectangle":
      return `직사각형 그림: 가로 ${visual.width}${visual.unit ?? "cm"}, 세로 ${visual.height}${visual.unit ?? "cm"}`;
    case "square":
      return `정사각형 그림: 한 변 ${visual.side}${visual.unit ?? "cm"}`;
    case "parallelogram":
      return `평행사변형 그림: 밑변 ${visual.base}${visual.unit ?? "cm"}, 높이 ${visual.height}${visual.unit ?? "cm"}`;
    case "triangle":
      return `삼각형 그림: 밑변 ${visual.base}${visual.unit ?? "cm"}, 높이 ${visual.height}${visual.unit ?? "cm"}`;
    case "trapezoid":
      return `사다리꼴 그림: 윗변 ${visual.top}${visual.unit ?? "cm"}, 아랫변 ${visual.bottom}${visual.unit ?? "cm"}, 높이 ${visual.height}${visual.unit ?? "cm"}`;
    case "composite-rect":
      return `복합도형 그림: 전체 ${visual.width}×${visual.height}${visual.unit ?? "cm"}, 잘린 부분 ${visual.cutWidth}×${visual.cutHeight}${visual.unit ?? "cm"}`;
    case "cuboid":
      return `직육면체 그림: 가로 ${visual.width}, 세로 ${visual.depth}, 높이 ${visual.height}${visual.unit ? ` ${visual.unit}` : ""}`;
    case "solid-shape":
      return `입체도형 그림: ${visual.kind}${visual.label ? `, ${visual.label}` : ""}${visual.height ? `, 높이 ${visual.height}` : ""}${visual.radius ? `, 반지름 ${visual.radius}` : ""}${visual.unit ? ` ${visual.unit}` : ""}`;
    case "net-diagram":
      return `전개도 그림${visual.label ? `(${visual.label})` : ""}: ${visual.kind}${visual.sides ? ` ${visual.sides}면` : ""}`;
    case "cube-stack":
      return `쌓기나무 그림: 가로 ${visual.cols}개, 세로 ${visual.rows}개, 층 ${visual.layers}개`;
    case "data-table":
      return [
        visual.caption ? `표: ${visual.caption}` : "표",
        visual.headers.join(" | "),
        ...visual.rows.map((row) => row.join(" | ")),
      ].join("\n");
    case "bar-chart":
      return `막대그래프${visual.title ? `(${visual.title})` : ""}: ${visual.items.map((item) => `${item.label} ${item.value}${visual.unit ?? ""}`).join(", ")}${visual.referenceValue !== undefined ? `, 기준 ${visual.referenceValue}` : ""}`;
    case "line-chart":
      return `꺾은선그래프${visual.title ? `(${visual.title})` : ""}: ${visual.points.map((point) => `${point.label} ${point.value}${visual.unit ?? ""}`).join(", ")}${visual.referenceValue !== undefined ? `, 기준 ${visual.referenceValue}` : ""}`;
    case "clock":
      return `시계 그림${visual.title ? `(${visual.title})` : ""}: ${visual.hour}시 ${String(visual.minute).padStart(2, "0")}분`;
    case "ruler":
      return `자 그림${visual.title ? `(${visual.title})` : ""}: ${visual.length}${visual.unit ?? "cm"}${visual.max ? `, 전체 눈금 ${visual.max}${visual.unit ?? "cm"}` : ""}`;
    case "line-type":
      return `선 그림${visual.title ? `(${visual.title})` : ""}: ${visual.kind}`;
    case "right-angle":
      return `직각 표시 그림${visual.title ? `(${visual.title})` : ""}: ${visual.shape}`;
    case "ten-frame":
      return `십틀 그림${visual.title ? `(${visual.title})` : ""}: ${visual.total ?? 10}칸 중 ${visual.filled}칸`;
    case "number-bond":
      return `수 모으기 그림${visual.title ? `(${visual.title})` : ""}: 전체 ${visual.total}, 왼쪽 ${visual.left}, 오른쪽 ${visual.right}`;
    case "place-value-blocks":
      return `십 모형 그림${visual.title ? `(${visual.title})` : ""}: 십 ${visual.tens}개, 일 ${visual.ones}개`;
    case "base-ten-blocks":
      return `백·십·일 모형 그림${visual.title ? `(${visual.title})` : ""}: 백 ${visual.hundreds}개, 십 ${visual.tens}개, 일 ${visual.ones}개`;
    case "number-line":
      return `수직선 그림${visual.title ? `(${visual.title})` : ""}: ${visual.values.join(", ")}${visual.missingIndex !== undefined ? `, 빈칸 위치 ${visual.missingIndex + 1}번째` : ""}`;
    case "range-line":
      return `범위 수직선 그림${visual.title ? `(${visual.title})` : ""}: ${visual.leftInclusive ? "[" : "("}${visual.start}, ${visual.end}${visual.rightInclusive ? "]" : ")"}`;
    case "object-array":
      return `배열 그림${visual.title ? `(${visual.title})` : ""}: ${visual.rows}행 ${visual.cols}열${visual.unit ? ` ${visual.unit}` : ""}`;
    case "shape-pattern":
      return `도형 패턴${visual.title ? `(${visual.title})` : ""}: ${visual.items.join(" ")}`;
    case "pictograph":
      return [
        `그림그래프${visual.title ? `(${visual.title})` : ""}: 큰 그림=${visual.bigValue}${visual.unit ?? ""}, 작은 그림=${visual.smallValue}${visual.unit ?? ""}`,
        ...visual.items.map((item) => `${item.label}: 큰 그림 ${item.bigCount}개, 작은 그림 ${item.smallCount}개`),
      ].join("\n");
    case "ratio-strip":
      return `비 띠 그림${visual.title ? `(${visual.title})` : ""}: ${visual.leftLabel} ${visual.left}${visual.unit ?? ""}, ${visual.rightLabel} ${visual.right}${visual.unit ?? ""}${visual.total ? `, 전체 ${visual.total}${visual.unit ?? ""}` : ""}`;
    case "circle-chart":
      return `원그래프${visual.title ? `(${visual.title})` : ""}: ${visual.items.map((item) => `${item.label} ${item.value}${visual.unit ?? ""}`).join(", ")}`;
    case "circle-diagram":
      return `원 그림${visual.title ? `(${visual.title})` : ""}: ${visual.mode}${visual.radius ? `, 반지름 ${visual.radius}` : ""}${visual.diameter ? `, 지름 ${visual.diameter}` : ""}${visual.squareSide ? `, 정사각형 한 변 ${visual.squareSide}` : ""}${visual.unit ? ` ${visual.unit}` : ""}`;
    case "circle-pattern":
      return `원 패턴 그림${visual.title ? `(${visual.title})` : ""}: 원 ${visual.circles}개, 반지름 ${visual.radius}${visual.unit ?? ""}`;
    case "angle-diagram":
      return `각도 그림${visual.title ? `(${visual.title})` : ""}: ${visual.degrees}도`;
    case "parallel-lines":
      return `평행·수선 그림${visual.title ? `(${visual.title})` : ""}: ${visual.mode}`;
    case "quadrilateral-diagram":
      return `사각형 그림${visual.title ? `(${visual.title})` : ""}: ${visual.kind}`;
    case "polygon-diagram":
      return `다각형 그림${visual.title ? `(${visual.title})` : ""}: ${visual.sides}각형${visual.regular ? ", 정다각형" : ""}${visual.showDiagonal ? ", 대각선 표시" : ""}`;
    case "fraction-strip":
      return `분수 막대${visual.title ? `(${visual.title})` : ""}: ${visual.denominator}칸 중 ${visual.numerator}칸${visual.divisorNumerator ? `, 나누는 분자 ${visual.divisorNumerator}` : ""}`;
    case "probability-bag":
      return `주머니 그림: 빨간 공 ${visual.red}개, 파란 공 ${visual.blue}개`;
    case "coin-chance":
      return "동전 가능성 그림";
    case "coordinate-plane":
      return `좌표평면 그림: 점 (${visual.point[0]}, ${visual.point[1]}), 기준축 ${visual.axis}${visual.reflected ? `, 이동한 점 (${visual.reflected[0]}, ${visual.reflected[1]})` : ""}`;
    case "congruent-triangles":
      return `합동 삼각형 그림: 기준 ${visual.target}${visual.sides ? `, 변 ${visual.sides.join(", ")}` : ""}${visual.angles ? `, 각 ${visual.angles.join(", ")}` : ""}${visual.unit ? ` ${visual.unit}` : ""}`;
    case "symmetry-shape":
      return `대칭 도형 그림: ${visual.shape}`;
    case "rotation-180":
      return "180도 돌리기 그림";
    default:
      return "참고 그림이 포함된 문제입니다.";
  }
}

function printableVisualHtml(visual?: Problem["visual"]) {
  if (!visual) return "";
  const fallbackLabel = visualToPrintableText(visual);
  return `<div class="print-visual" aria-label="${escapeHtml(fallbackLabel)}">${renderToStaticMarkup(<MathVisual visual={visual} />)}</div>`;
}

function printableProblemHtml(problem: Problem, index: number, mode: ProblemSheetMode) {
  const choiceHtml = problem.choices?.length
    ? `<ol class="choice-list">${problem.choices.map((choice) => `<li>${printableTextHtml(choice)}</li>`).join("")}</ol>`
    : "";
  const hintHtml = problem.hint ? `<p class="hint-line">입력 안내: ${printableTextHtml(problem.hint)}</p>` : "";
  const visualHtml = printableVisualHtml(problem.visual);
  const answerHtml =
    mode === "answer"
      ? `<div class="answer-box filled"><strong>정답</strong><span>${printableTextHtml(formatAnswer(problem))}</span><p>${printableTextHtml(problem.solution)}</p></div>`
      : `<div class="answer-box"><strong>답</strong><span></span></div>`;

  return `
    <article class="problem-card">
      <div class="problem-title">
        <strong>${index + 1}번</strong>
        <span>${problem.kind === "choice" ? "선택형" : "입력형"}</span>
      </div>
      <p class="prompt">${printableTextHtml(problem.prompt)}</p>
      <p class="expression">${printableTextHtml(problem.expression)}</p>
      ${visualHtml}
      ${choiceHtml}
      ${hintHtml}
      ${answerHtml}
    </article>
  `;
}

function printProblemSheetDocument(meta: ProblemSheetMeta, problems: Problem[], mode: ProblemSheetMode) {
  if (problems.length === 0) return false;
  const popup = window.open("", "_blank", "popup=yes,width=920,height=1200");
  if (!popup) return false;
  popup.opener = null;
  const modeTitle = mode === "answer" ? "답안지" : "문제지";
  const escapedTitle = escapeHtml(`${meta.title} ${modeTitle}`);
  const problemHtml = problems.map((problem, index) => printableProblemHtml(problem, index, mode)).join("");
  popup.document.write(`
    <html lang="ko">
      <head>
        <title>${escapedTitle}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { margin: 0; background: #ffffff; color: #111827; font-family: "Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif; line-height: 1.5; }
          main { max-width: 900px; margin: 0 auto; padding: 22px; }
          .sheet-head { display: grid; gap: 12px; padding-bottom: 14px; border-bottom: 3px solid #111827; }
          .sheet-head h1 { margin: 0; font-size: 25px; line-height: 1.25; }
          .sheet-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
          .sheet-meta div { min-height: 54px; padding: 9px 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; }
          .sheet-meta span { display: block; color: #475569; font-size: 11px; font-weight: 800; }
          .sheet-meta strong { display: block; margin-top: 4px; color: #111827; font-size: 15px; word-break: keep-all; }
          .sheet-note { margin: 0; color: #475569; font-size: 12px; font-weight: 800; }
          .problem-list { display: grid; gap: 12px; margin-top: 16px; }
          .problem-card { break-inside: avoid; page-break-inside: avoid; padding: 12px; border: 1.5px solid #d1d5db; border-radius: 7px; }
          .problem-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; color: #334155; font-size: 12px; font-weight: 900; }
          .problem-title strong { color: #111827; font-size: 16px; }
          .prompt { margin: 0 0 6px; font-size: 15px; font-weight: 800; }
          .expression { margin: 0; color: #0f172a; font-size: 18px; font-weight: 900; white-space: normal; }
          .print-mixed { display: inline-flex; align-items: center; gap: 0.16em; vertical-align: middle; }
          .print-frac { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 1.2em; margin: 0 0.08em; vertical-align: middle; line-height: 1; font-weight: 900; }
          .print-frac span:first-child { display: block; width: 100%; padding: 0 0.18em 2px; border-bottom: 1.5px solid #111827; text-align: center; }
          .print-frac span:last-child { display: block; width: 100%; padding: 2px 0.18em 0; text-align: center; }
          .visual-text { margin: 8px 0 0; padding: 8px; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc; color: #334155; font-family: inherit; font-size: 13px; white-space: pre-wrap; }
${PRINT_VISUAL_CSS}
          .choice-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 14px; margin: 8px 0 0; padding-left: 24px; font-size: 14px; font-weight: 700; }
          .hint-line { margin: 8px 0 0; color: #475569; font-size: 12px; font-weight: 800; }
          .answer-box { display: grid; grid-template-columns: 40px minmax(0, 1fr); align-items: end; gap: 8px; margin-top: 12px; }
          .answer-box strong { color: #111827; font-size: 14px; }
          .answer-box > span { min-height: 24px; border-bottom: 1.5px solid #111827; }
          .answer-box.filled { display: block; padding-top: 10px; border-top: 1px solid #e5e7eb; }
          .answer-box.filled > span { display: inline-block; min-width: 180px; margin-left: 8px; border-bottom: 0; color: #0f172a; font-size: 16px; font-weight: 900; }
          .answer-box.filled p { margin: 6px 0 0; color: #334155; font-size: 13px; font-weight: 700; }
          @media print {
            main { max-width: none; padding: 0; }
            .sheet-note { display: none; }
          }
        </style>
      </head>
      <body>
        <main>
          <section class="sheet-head">
            <h1>${escapedTitle}</h1>
            <div class="sheet-meta">
              <div><span>선생님 이름</span><strong>${escapeHtml(meta.teacherName)}</strong></div>
              <div><span>학생 이름</span><strong>${escapeHtml(meta.learnerName)}</strong></div>
              <div><span>반</span><strong>${escapeHtml(meta.className)}</strong></div>
              <div><span>문제풀이 날짜</span><strong>${escapeHtml(meta.dateLabel)}</strong></div>
            </div>
            <p class="sheet-note">${problemSetSizeLabel(meta.problemSetSize)} · 총 ${problems.length}문제 · 인쇄 창에서 프린터 또는 PDF 저장을 선택하세요.</p>
          </section>
          <section class="problem-list">
            ${problemHtml}
          </section>
        </main>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.setTimeout(() => popup.print(), 180);
  return true;
}

function allGenerators(unit: Unit): Array<() => Problem> {
  return unit.topics.map((topic) => topic.generate);
}

function topicLearningContext(meta: TopicMeta | undefined, problem: Problem) {
  const topicTitle = meta?.topicTitle ?? problem.topicId;
  const unitTitle = meta?.unitTitle ?? "이번 단원";
  const unitLabelText = meta?.unitLabel ? `${meta.unitLabel} ` : "";
  return {
    topicTitle,
    unitTitle,
    unitLabelText,
    fullTitle: `${unitLabelText}${unitTitle} ${topicTitle}`.trim(),
  };
}

function textbookConceptProblem(problem: Problem, meta?: TopicMeta): Problem {
  const context = topicLearningContext(meta, problem);
  return {
    ...problem,
    prompt: "교과서식 개념 설명을 읽고 확인 문제를 해결하세요.",
    expression: [
      `[개념 설명] ${context.topicTitle}은 ${context.unitTitle}에서 꼭 알아야 할 핵심 원리입니다. 먼저 무엇을 기준으로 보고, 어떤 양이나 도형이 서로 어떻게 연결되는지 말로 설명합니다.`,
      `[스토리텔링 수학] 학급 탐구팀이 ${context.topicTitle}을 활용해 생활 속 문제를 해결한다고 생각합니다. 문제 속 대상, 조건, 구해야 할 값을 차례대로 표시합니다.`,
      `[STEM 연결] 자료를 관찰하고, 표·그림·식으로 모델링한 뒤, 계산 결과가 실제 상황에 맞는지 검증합니다. 이 과정은 과학의 관찰, 기술의 도구 사용, 공학의 설계, 수학의 식 세우기를 함께 쓰는 연습입니다.`,
      `[교과서 예제] ${problem.prompt}`,
      problem.expression,
    ].join("\n"),
    hint: `${problem.hint ?? "정답을 입력하세요."} 먼저 기준, 조건, 구해야 할 값을 표시하세요.`,
    solution: `개념 정리: ${context.topicTitle}은 조건을 기준에 맞게 정리하고 식이나 그림으로 확인하는 학습입니다. 예제 풀이: ${problem.solution}`,
  };
}

function appliedTypeProblem(problem: Problem, meta?: TopicMeta): Problem {
  const context = topicLearningContext(meta, problem);
  return {
    ...problem,
    prompt: "기초연산보다 한 단계 높은 유형 문제를 풀이 전략으로 해결하세요.",
    expression: [
      `[유형 목표] ${context.topicTitle}은 단순 계산을 넘어서 조건을 읽고 필요한 풀이 방법을 고르는 중간 단계 문제입니다.`,
      "[풀이 전략] 1단계로 주어진 정보를 표시합니다. 2단계로 필요한 식이나 관계를 세웁니다. 3단계로 계산합니다. 4단계로 답이 문제 조건에 맞는지 검산합니다.",
      `[문제 상황] ${problem.prompt}`,
      problem.expression,
      "[설명 과제] 답을 구한 뒤 어떤 유형으로 풀었는지 한 문장으로 설명해 보세요.",
    ].join("\n"),
    hint: `${problem.hint ?? "정답을 입력하세요."} 식을 바로 계산하기 전에 문제 유형과 필요한 관계를 먼저 고르세요.`,
    solution: `유형 풀이: ${context.topicTitle} 문제는 정보 표시, 관계식 세우기, 계산, 검산 순서로 해결합니다. 실제 계산은 ${problem.solution}`,
  };
}

function creativeChallengeProblem(problem: Problem, meta?: TopicMeta): Problem {
  const context = topicLearningContext(meta, problem);
  return {
    ...problem,
    prompt: "스토리텔링 STEM 상황을 수학 모델로 바꾸어 해결하세요.",
    expression: [
      `[현실 문제 해결] ${context.fullTitle}을 활용해 학급 설계팀이 실제 생활 문제를 해결합니다. 예산, 시간, 재료, 거리, 수량처럼 현실 조건을 수학 정보로 바꿉니다.`,
      `[창의력 수학] 조건을 모두 만족하는지 확인하고, 답을 구한 뒤 더 효율적인 방법이 있는지 생각합니다.`,
      `[STEM 미션] 관찰한 자료를 표나 그림으로 정리하고, 식으로 예측한 뒤, 결과가 현실적으로 가능한지 검증합니다.`,
      `[응용 문제] ${problem.prompt}`,
      problem.expression,
      "[확장 질문] 같은 조건에서 수량이 달라지면 풀이 방법도 유지되는지 설명해 보세요.",
    ].join("\n"),
    hint: `${problem.hint ?? "정답을 입력하세요."} 현실 조건을 먼저 수학 기호와 식으로 바꾼 뒤 계산하세요.`,
    solution: `STEM 모델링: 현실 조건을 수학 정보로 바꾸고, 식으로 계산한 뒤 조건에 맞는지 확인합니다. 문제 풀이: ${problem.solution}`,
  };
}

function enhanceProblemForLearningArea(problem: Problem, area?: LearningArea, meta?: TopicMeta): Problem {
  if (area === "concept") return textbookConceptProblem(problem, meta);
  if (area === "type") return appliedTypeProblem(problem, meta);
  if (area === "challenge") return creativeChallengeProblem(problem, meta);
  return problem;
}

function buildTopicProblemSet(
  generators: Array<() => Problem>,
  problemsPerTopic: ProblemSetSize = PROBLEMS_PER_TOPIC,
  area?: LearningArea,
  topicMeta?: Map<string, TopicMeta>,
): Problem[] {
  if (generators.length === 0) return [];
  return generators.flatMap((generate) =>
    Array.from({ length: problemsPerTopic }, () => {
      const problem = generate();
      const meta = topicMeta?.get(problem.topicId);
      return enhanceProblemForLearningArea(problem, meta?.learningArea ?? area, meta);
    }),
  );
}

function sequentialTopicGenerators(entry: TopicEntry, problemTarget: number): Array<() => Problem> {
  const topicCount = Math.max(1, Math.ceil(problemTarget / PROBLEMS_PER_TOPIC));
  return Array.from({ length: topicCount }, (_, offset) => {
    const topic = entry.unit.topics[(entry.topicIndex + offset) % entry.unit.topics.length]!;
    return topic.generate;
  });
}

function StoryAdventureVector({ chapter }: { chapter: StemStoryChapter }) {
  const bars = chapter.chartItems.slice(0, 4);
  const maxBar = Math.max(1, ...bars.map((item) => item.value));
  const maxLine = Math.max(1, ...chapter.linePoints.map((point) => point.value));
  const lineStep = 164 / Math.max(1, chapter.linePoints.length - 1);
  const linePoints = chapter.linePoints.map((point, index) => ({
    ...point,
    x: 78 + index * lineStep,
    y: 138 - (point.value / maxLine) * 58,
  }));
  const linePath = linePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className={`story-vector story-vector-${chapter.visualKind}`} aria-hidden="true">
      <svg viewBox="0 0 300 180">
        <rect className="story-vector-sky" x="10" y="10" width="280" height="160" rx="18" />
        <path className="story-vector-ground" d="M22 145c38-22 70-18 104-7 38 12 72 7 140-18v40H22z" />
        <circle className="story-vector-orbit" cx="62" cy="58" r="31" />
        <path className="story-vector-route" d="M38 116C70 80 96 92 126 62s70-22 104 5" />
        <g className="story-vector-badge">
          <rect x="35" y="36" width="54" height="44" rx="12" />
          <text x="62" y="64">{chapter.icon}</text>
        </g>
        <g className="story-vector-bars">
          {bars.map((item, index) => {
            const height = Math.max(8, (item.value / maxBar) * 54);
            const x = 114 + index * 26;
            return (
              <g key={item.label}>
                <rect x={x} y={123 - height} width="15" height={height} rx="5" />
                <text x={x + 7.5} y="140">{item.value}</text>
              </g>
            );
          })}
        </g>
        <g className="story-vector-line">
          <path d={linePath} />
          {linePoints.map((point) => (
            <circle key={point.label} cx={point.x} cy={point.y} r="4" />
          ))}
        </g>
        <g className="story-vector-formula">
          <rect x="170" y="28" width="78" height="26" rx="8" />
          <text x="209" y="46">STEM</text>
        </g>
      </svg>
    </div>
  );
}

function UnitScene({ no }: { no: number }) {
  const symbols = ["+", "×", "÷", "="];
  return (
    <div className={`unit-scene unit-scene-${no}`} aria-hidden="true">
      <svg viewBox="0 0 180 118">
        <path className="scene-hill back" d="M0 86c34-28 62-22 90-8 34 17 58 9 90-10v50H0z" />
        <path className="scene-hill front" d="M0 96c42-20 76-14 108 2 24 12 48 8 72-8v28H0z" />
        <circle className="scene-sun" cx="142" cy="28" r="17" />
        <path className="scene-star" d="M42 18l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" />
        <g className="scene-character" transform="translate(70 34)">
          <path d="M18 18c10-18 34-18 44 0l-10 16H28z" />
          <circle cx="40" cy="38" r="20" />
          <path className="hair" d="M20 36c6-22 38-26 44-3-15-2-28-8-44 3z" />
          <circle className="eye" cx="33" cy="39" r="2.5" />
          <circle className="eye" cx="47" cy="39" r="2.5" />
          <path className="smile" d="M34 49c4 4 8 4 12 0" />
          <path className="body" d="M18 92c3-34 41-34 44 0z" />
        </g>
        <text x="22" y="99">{symbols[(no - 1) % symbols.length]}</text>
      </svg>
    </div>
  );
}

export default function App() {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [launchProfile] = useState(() => loadLaunchLearnerProfile());
  const [screen, setScreen] = useState<Screen>(() => {
    return { name: "operation-drill" };
  });
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => loadReaderPrefs());
  const [learner, setLearner] = useState<LearnerProfile>(launchProfile);
  const [learnerForm, setLearnerForm] = useState(() => ({ name: launchProfile.name, grade: launchProfile.grade }));
  const [learningSettings, setLearningSettings] = useState<LearningSettings>(() => loadLearningSettings());
  const [studyStats, setStudyStats] = useState<StudyStats>(() => loadStudyStats(launchProfile.id));
  const [reportCopied, setReportCopied] = useState(false);
  const [learnerSnapshot, setLearnerSnapshot] = useState<LearnerDbSnapshot | null>(null);
  const [contentSnapshot, setContentSnapshot] = useState<LearningContentSnapshot | null>(null);
  const [rosterSnapshot, setRosterSnapshot] = useState<LearningRosterSnapshot | null>(null);
  const [authSnapshot, setAuthSnapshot] = useState<LearningAuthSnapshot | null>(null);
  const [classProgressSnapshot, setClassProgressSnapshot] = useState<ClassLearningProgressSnapshot | null>(null);
  const [allProgressSnapshot, setAllProgressSnapshot] = useState<ClassLearningProgressSnapshot | null>(null);
  const [adminSnapshot, setAdminSnapshot] = useState<AdminLearningSnapshot | null>(null);
  const [maintenanceResult, setMaintenanceResult] = useState<LearningMaintenanceResult | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState<LearningMaintenanceStatus | null>(null);
  const [activeRosterMenu, setActiveRosterMenu] = useState<RosterMenu>("studentLogin");
  const [rosterPanelOpen, setRosterPanelOpen] = useState(false);
  const [teacherNameForm, setTeacherNameForm] = useState("");
  const [googleClientId, setGoogleClientId] = useState(() => loadGoogleClientId());
  const [googleClientIdForm, setGoogleClientIdForm] = useState(() => loadGoogleClientId());
  const [googleLoginReady, setGoogleLoginReady] = useState(false);
  const [localAdminLoginForm, setLocalAdminLoginForm] = useState({ password: "" });
  const [localAdminSetupForm, setLocalAdminSetupForm] = useState({
    displayName: "로컬 관리자",
    password: "",
    passwordConfirm: "",
  });
  const [teacherLoginForm, setTeacherLoginForm] = useState({ username: "", password: "" });
  const [studentLoginForm, setStudentLoginForm] = useState({ username: "", password: "" });
  const [adminBackupCopied, setAdminBackupCopied] = useState(false);
  const [signupForm, setSignupForm] = useState({
    role: "student" as AccountRole,
    username: "",
    password: "",
    passwordConfirm: "",
    displayName: "",
    grade: launchProfile.grade,
    classId: "",
    termsAccepted: false,
  });
  const [authMessage, setAuthMessage] = useState("");
  const [studentPasswordNotice, setStudentPasswordNotice] = useState("");
  const [classForm, setClassForm] = useState({ id: "", name: "", grade: launchProfile.grade, grades: [launchProfile.grade], teacherId: "" });
  const [studentForm, setStudentForm] = useState({
    id: "",
    name: launchProfile.name === "학습자" ? "" : launchProfile.name,
    grade: launchProfile.grade,
    classId: "",
    accountUsername: "",
    accountPassword: "",
    accountPasswordConfirm: "",
    progressAttempted: "",
    progressCorrect: "",
    progressTargetDaily: "",
    progressFocusTitle: "",
    progressTeacherMemo: "",
  });
  const [selectedUnitId, setSelectedUnitId] = useState(() => firstUnitIdForLearnerAndSettings(UNITS, launchProfile, loadLearningSettings()));
  const [selectedTopicId, setSelectedTopicId] = useState(FULL_UNIT_SELECTION);
  const [worksheetDraft, setWorksheetDraft] = useState<ProblemSheetDraft | null>(null);
  const allContentUnits = contentSnapshot?.units.length ? contentSnapshot.units : UNITS;
  const courseUnits = useMemo(() => unitsForLearner(allContentUnits, learner), [allContentUnits, learner]);
  const filteredContentUnits = useMemo(
    () => filterUnitsByLearningSettings(courseUnits, learningSettings),
    [courseUnits, learningSettings],
  );
  const activeFilterHasMatches = filteredContentUnits.length > 0;
  const contentUnits = activeFilterHasMatches ? filteredContentUnits : courseUnits;
  const stemStoryChapters = useMemo(() => buildStemStoryChapters(contentUnits), [contentUnits]);
  const activeCourseRange = courseRangeLabel(learner);
  const activeLearningLabel = `${learningLevelLabel(learningSettings.level)} · ${learningAreaLabel(learningSettings.area)}`;
  const selectedProblemSetSize = learningSettings.problemSetSize;
  const selectedProblemSetLabel = problemSetSizeLabel(selectedProblemSetSize);
  const adminLoggedIn = Boolean(authSnapshot?.activeAdminAccount);
  const teacherLoggedIn = Boolean(authSnapshot?.activeTeacherAccount);
  const studentLoggedIn = Boolean(authSnapshot?.activeStudentAccount);
  const activeTeacherAccount =
    authSnapshot?.activeTeacherAccount?.role === "teacher" ? authSnapshot.activeTeacherAccount : undefined;
  const activeStudentAccount =
    authSnapshot?.activeStudentAccount?.role === "student" ? authSnapshot.activeStudentAccount : undefined;
  const teacherScopedId = teacherLoggedIn && !adminLoggedIn ? activeTeacherAccount?.teacherId : undefined;
  const visibleTeachers = useMemo(
    () => {
      const teachers = rosterSnapshot?.teachers ?? [];
      return teacherScopedId ? teachers.filter((teacher) => teacher.id === teacherScopedId) : teachers;
    },
    [rosterSnapshot?.teachers, teacherScopedId],
  );
  const visibleClasses = useMemo(
    () => {
      const classes = rosterSnapshot?.classes ?? [];
      return teacherScopedId ? classes.filter((classRecord) => classRecord.teacherId === teacherScopedId) : classes;
    },
    [rosterSnapshot?.classes, teacherScopedId],
  );
  const visibleClassIds = useMemo(() => new Set(visibleClasses.map((classRecord) => classRecord.id)), [visibleClasses]);
  const registeredStudents = useMemo(
    () => {
      const students = rosterSnapshot?.students ?? [];
      return teacherScopedId
        ? students.filter((student) => student.teacherId === teacherScopedId && visibleClassIds.has(student.classId))
        : students;
    },
    [rosterSnapshot?.students, teacherScopedId, visibleClassIds],
  );
  const visibleStudentIds = useMemo(() => new Set(registeredStudents.map((student) => student.id)), [registeredStudents]);
  const visibleStudentAccounts = useMemo(
    () => {
      const accounts = authSnapshot?.studentAccounts ?? [];
      return teacherScopedId
        ? accounts.filter((account) => account.role === "student" && visibleStudentIds.has(account.studentId))
        : accounts;
    },
    [authSnapshot?.studentAccounts, teacherScopedId, visibleStudentIds],
  );
  const activeTeacherAccess = activeTeacherAccount ? accessForAccount(activeTeacherAccount) : DEFAULT_TEACHER_ACCESS;
  const activeStudentAccess = activeStudentAccount ? accessForAccount(activeStudentAccount) : DEFAULT_STUDENT_ACCESS;
  const activeStudentAccountId = studentIdFromActiveAccount(authSnapshot);
  const activeAccountStudent = studentLoggedIn
    ? registeredStudents.find((student) => student.id === activeStudentAccountId)
    : undefined;
  const activeStudentHomeGrade = activeAccountStudent?.grade;
  const activeStudentFullGrade = activeStudentHomeGrade ? fullGradeForAccess(activeStudentHomeGrade) : undefined;
  const studentViewingOtherGrade = Boolean(
    studentLoggedIn &&
      activeStudentFullGrade &&
      !sameGradeLabel(learner.grade, activeStudentFullGrade) &&
      !sameGradeLabel(learner.grade, activeStudentHomeGrade),
  );
  const activeCourseScopeLabel =
    studentLoggedIn && activeStudentFullGrade
      ? studentViewingOtherGrade
        ? `${learner.grade} 선택 학습`
        : `${activeStudentFullGrade} 전체 접근`
      : activeCourseRange;
  const activeVisibleClass =
    rosterSnapshot?.activeClass && visibleClassIds.has(rosterSnapshot.activeClass.id)
      ? rosterSnapshot.activeClass
      : undefined;
  const activeTeacherName = activeAccountStudent?.teacherName ?? rosterSnapshot?.activeTeacher?.name ?? learner.teacherName ?? "강태훈샘";
  const activeClassName = activeAccountStudent?.className ?? activeVisibleClass?.name ?? learner.className ?? "클래스 미등록";
  const activeClassStudents = activeVisibleClass
    ? registeredStudents.filter((student) => student.classId === activeVisibleClass.id)
    : registeredStudents;
  const managedClassGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        name: string;
        teacherId: string;
        teacherName: string;
        classes: LearningRosterSnapshot["classes"];
      }
    >();
    for (const classRecord of visibleClasses) {
      const key = `${classRecord.teacherId}::${classRecord.name}`;
      const group =
        groups.get(key) ??
        {
          key,
          name: classRecord.name,
          teacherId: classRecord.teacherId,
          teacherName: classRecord.teacherName,
          classes: [],
        };
      group.classes.push(classRecord);
      groups.set(key, group);
    }
    return Array.from(groups.values())
      .map((group) => {
        const classes = [...group.classes].sort((a, b) => gradeSortIndex(a.grade) - gradeSortIndex(b.grade));
        const activeClass = classes.find((classRecord) => classRecord.id === rosterSnapshot?.activeClass?.id);
        return { ...group, classes, primaryClass: activeClass ?? classes[0]! };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [rosterSnapshot?.activeClass?.id, visibleClasses]);
  const selectedClassDeleteIds = useMemo(() => {
    const selectedClass = classForm.id ? visibleClasses.find((classRecord) => classRecord.id === classForm.id) : undefined;
    if (!selectedClass) return [];
    return visibleClasses
      .filter((classRecord) => classRecord.teacherId === selectedClass.teacherId && classRecord.name === selectedClass.name)
      .map((classRecord) => classRecord.id);
  }, [classForm.id, visibleClasses]);
  const canManageRoster = adminLoggedIn || (teacherLoggedIn && activeTeacherAccess.canManageRoster);
  const canViewAllStudentLearningData = adminLoggedIn || (teacherLoggedIn && activeTeacherAccess.canViewLearningData);
  const canStartLearning = studentLoggedIn ? activeStudentAccess.canStudy : teacherLoggedIn && activeTeacherAccess.canStudy;
  const activeAdminAccountLabel = authSnapshot?.activeAdminAccount
    ? `${authSnapshot.activeAdminAccount.username} 로그인`
    : "관리자 미로그인";
  const activeTeacherAccountLabel = authSnapshot?.activeTeacherAccount
    ? `${authSnapshot.activeTeacherAccount.username} 로그인`
    : "교사용 미로그인";
  const activeStudentAccountLabel = authSnapshot?.activeStudentAccount
    ? `${authSnapshot.activeStudentAccount.username} 로그인`
    : "학생용 미로그인";
  const activeModeLabel = adminLoggedIn
    ? "관리자 전체 관리 모드"
    : teacherLoggedIn
      ? "교사용 관리 모드"
      : studentLoggedIn
        ? "학생용 학습 모드"
        : "로그인 대기";
  const currentLearnerLabel = learner.className
    ? `${learner.className} · ${learnerLabel(learner)}`
    : learnerLabel(learner);
  const currentTeacherLearnerLabel = `${activeTeacherName} · ${currentLearnerLabel}`;
  const quickGradeLabel = isFirstGradeOperationLearner({ grade: learnerForm.grade })
    ? "1학년 연산"
    : isSecondGradeOperationLearner({ grade: learnerForm.grade })
    ? "2학년 연산"
    : isThirdGradeOperationLearner({ grade: learnerForm.grade })
    ? "3학년 연산"
    : isFourthGradeOperationLearner({ grade: learnerForm.grade })
    ? "4학년 연산"
    : isFifthGradeOperationLearner({ grade: learnerForm.grade })
    ? "5학년 연산"
    : isSixthGradeOperationLearner({ grade: learnerForm.grade })
    ? "6학년 연산"
    : isFirstGradeLearner({ grade: learnerForm.grade })
    ? "1학년"
    : isSecondGradeLearner({ grade: learnerForm.grade })
    ? "2학년"
    : isThirdGradeLearner({ grade: learnerForm.grade })
      ? "3학년"
      : isFourthGradeLearner({ grade: learnerForm.grade })
      ? "4학년"
      : isSixthGradeLearner({ grade: learnerForm.grade })
      ? "6학년"
      : learnerForm.grade;
  const studentGradeAccessLabel =
    studentLoggedIn && activeStudentFullGrade
      ? sameGradeLabel(learner.grade, activeStudentFullGrade)
        ? `${activeStudentFullGrade} 전체 학습 데이터 학습 중`
        : sameGradeLabel(learner.grade, activeStudentHomeGrade)
          ? `${activeStudentHomeGrade} 등록 과정 학습 중`
          : `${activeStudentFullGrade} 학생 계정으로 ${learner.grade} 선택 학습 중`
      : `${quickGradeLabel} 과정으로 학습 차례가 정리됩니다.`;
  const selectedClassGrades = classGradeSelections(classForm.grade, classForm.grades);
  const totalTopics = useMemo(() => contentUnits.reduce((sum, unit) => sum + unit.topics.length, 0), [contentUnits]);
  const totalProblemTarget = totalTopics * selectedProblemSetSize;
  const topicEntries = useMemo<TopicEntry[]>(
    () =>
      contentUnits.flatMap((unit) =>
        unit.topics.map((topic, topicIndex) => ({
          unit,
          topic,
          topicIndex,
        })),
      ),
    [contentUnits],
  );
  const topicMeta = useMemo(() => {
    const entries = contentUnits.flatMap((unit) =>
      unit.topics.map((topic) => [
        topic.id,
        {
          unitId: unit.id,
          unitNo: unit.no,
          unitLabel: unitLabel(unit),
          unitTitle: unit.title,
          topicTitle: topic.title,
          learningLevel: topicLearningLevel(topic),
          learningArea: topicLearningArea(topic),
        } satisfies TopicMeta,
      ] as const),
    );
    return new Map(entries);
  }, [contentUnits]);
  const totalAccuracy = useMemo(
    () => (studyStats.attempted === 0 ? 0 : Math.round((studyStats.correct / studyStats.attempted) * 100)),
    [studyStats],
  );
  const totalWrong = Math.max(0, studyStats.attempted - studyStats.correct);
  const totalWrongRate = percent(totalWrong, studyStats.attempted);
  const unitProgress = useMemo<UnitProgress[]>(
    () =>
      contentUnits.map((unit) => {
        const bucket = studyStats.units[unit.id];
        const attempted = bucket?.attempted ?? 0;
        const correct = bucket?.correct ?? 0;
        const wrong = Math.max(0, attempted - correct);
        const target = unit.topics.length * selectedProblemSetSize;
        return {
          id: unit.id,
          no: unit.no,
          label: unit.label,
          course: unit.course,
          month: unit.month,
          title: unit.title,
          accent: unit.accent,
          attempted,
          correct,
          wrong,
          accuracy: percent(correct, attempted),
          wrongRate: percent(wrong, attempted),
          target,
          progress: Math.min(100, percent(attempted, target)),
          lastStudiedAt: bucket?.lastStudiedAt,
        };
      }),
    [contentUnits, selectedProblemSetSize, studyStats.units],
  );
  const studiedUnitRows = unitProgress.filter((row) => row.attempted > 0);
  const focusUnit = [...studiedUnitRows].sort((a, b) => b.wrongRate - a.wrongRate || b.wrong - a.wrong)[0];
  const strongestUnit = [...studiedUnitRows].sort((a, b) => b.accuracy - a.accuracy || b.attempted - a.attempted)[0];
  const learnerProgress = Math.min(100, percent(studyStats.attempted, totalProblemTarget));
  const calendarTopic = topicEntries[(new Date().getDate() - 1) % topicEntries.length]!;
  const firstOpenTopic =
    topicEntries.find(({ topic }) => (studyStats.topics[topic.id]?.attempted ?? 0) < selectedProblemSetSize) ??
    calendarTopic;
  const focusTopic = [...topicEntries]
    .map((entry) => {
      const bucket = studyStats.topics[entry.topic.id];
      const attempted = bucket?.attempted ?? 0;
      const correct = bucket?.correct ?? 0;
      const wrong = Math.max(0, attempted - correct);
      return {
        ...entry,
        attempted,
        wrong,
        wrongRate: percent(wrong, attempted),
      };
    })
    .filter((entry) => entry.attempted >= 3 && entry.wrong > 0)
    .sort((a, b) => b.wrongRate - a.wrongRate || b.wrong - a.wrong)[0];
  const dailyTopic = focusTopic ?? firstOpenTopic;
  const dailyBucket = studyStats.topics[dailyTopic.topic.id];
  const dailyAttempted = dailyBucket?.attempted ?? 0;
  const dailyCorrect = dailyBucket?.correct ?? 0;
  const dailyProgress = Math.min(100, percent(dailyAttempted, selectedProblemSetSize));
  const dailyAccuracy = percent(dailyCorrect, dailyAttempted);
  const dbFocusTopic = learnerSnapshot?.topics.find((topic) => topic.wrong > 0) ?? learnerSnapshot?.topics[0];
  const personalizedTopic =
    (dbFocusTopic && topicEntries.find((entry) => entry.topic.id === dbFocusTopic.topicId)) ?? dailyTopic;
  const personalizedTarget = learnerSnapshot?.plan.dailyTarget ?? PROBLEMS_PER_TOPIC;
  const personalizedGenerators = sequentialTopicGenerators(personalizedTopic, personalizedTarget);
  const dbStorageLabel = learnerSnapshot
    ? learnerSnapshot.storage === "cloudflare"
      ? "Cloudflare D1"
      : learnerSnapshot.storage === "indexedDB"
      ? "IndexedDB"
      : "localStorage"
    : "준비 중";
  const contentStorageLabel = contentSnapshot
    ? contentSnapshot.storage === "cloudflare"
      ? "Cloudflare D1"
      : contentSnapshot.storage === "indexedDB"
      ? "IndexedDB"
      : "localStorage"
    : "준비 중";
  const contentTopicTotal = totalTopics;
  const contentCatalogTotal = contentSnapshot?.catalogRecords.length ?? 0;
  const matchedTopicTotal = filteredContentUnits.reduce((sum, unit) => sum + unit.topics.length, 0);
  const dbWrongNotes = learnerSnapshot?.wrongNotes.slice(0, 3) ?? [];
  const dbWeakTopics = learnerSnapshot?.topics.slice(0, 3) ?? [];
  const monitorProgressSnapshot = allProgressSnapshot ?? classProgressSnapshot;
  const classProgressRows = useMemo(
    () => {
      if (!canViewAllStudentLearningData) return [];
      const rows = monitorProgressSnapshot?.students ?? [];
      return teacherScopedId
        ? rows.filter((row) => row.student.teacherId === teacherScopedId && visibleClassIds.has(row.student.classId))
        : rows;
    },
    [canViewAllStudentLearningData, monitorProgressSnapshot?.students, teacherScopedId, visibleClassIds],
  );
  const classTotalAttempts = classProgressRows.reduce((sum, row) => sum + row.attempted, 0);
  const classTotalCorrect = classProgressRows.reduce((sum, row) => sum + row.correct, 0);
  const classAverageAccuracy = percent(classTotalCorrect, classTotalAttempts);
  const classCoachingTargets = classProgressRows.filter((row) => row.wrongRate >= 35 || row.accuracy < 65).length;
  const todayReportKey = reportDateKey();
  const studentDailyReportMap = useMemo(
    () =>
      new Map(
        classProgressRows.map((row) => [
          row.student.id,
          buildStudentDailyCounselReports(row, todayReportKey),
        ]),
      ),
    [classProgressRows, todayReportKey],
  );
  const managerReportRows = useMemo(
    () =>
      classProgressRows.map((row) => ({
        row,
        periods: buildStudentProgressPeriodSummary(row),
        reports: studentDailyReportMap.get(row.student.id) ?? [],
      })),
    [classProgressRows, studentDailyReportMap],
  );
  const todayStudentReportCount = [...studentDailyReportMap.values()].filter((reports) => reports[0]?.dateKey === todayReportKey).length;
  const adminAccountTotal =
    (adminSnapshot?.adminAccounts.length ?? 0) +
    (adminSnapshot?.teacherAccounts.length ?? 0) +
    (adminSnapshot?.studentAccounts.length ?? 0);
  const adminCredentialRows = [
    ...(adminSnapshot?.adminAccounts ?? []).map((account) => ({ roleLabel: "관리자", relation: "전체", account })),
    ...(adminSnapshot?.teacherAccounts ?? []).map((account) => ({ roleLabel: "교사", relation: account.teacherId, account })),
    ...(adminSnapshot?.studentAccounts ?? []).map((account) => ({ roleLabel: "학생", relation: account.studentId, account })),
  ];
  const managedAccessAccounts: ManagedLearningAccount[] = [
    ...(adminSnapshot?.teacherAccounts ?? []),
    ...(adminSnapshot?.studentAccounts ?? []),
  ];
  const pendingApprovalAccounts = managedAccessAccounts.filter(isApprovalPendingAccount);
  const pendingTeacherApprovalCount = pendingApprovalAccounts.filter((account) => account.role === "teacher").length;
  const pendingStudentApprovalCount = pendingApprovalAccounts.filter((account) => account.role === "student").length;
  const approvedManagedAccountCount = managedAccessAccounts.filter((account) => accessForAccount(account).canLogin).length;
  const securityAlerts = adminSnapshot?.securityAlerts ?? [];
  const pendingSecurityAlerts = securityAlerts.filter((alert) => !alert.acknowledgedAt);
  const latestMaintenanceValidation = maintenanceStatus?.validations[0];
  const latestMaintenanceBackup = maintenanceStatus?.backups[0];
  const latestMaintenanceIssueCount =
    typeof latestMaintenanceValidation?.issue_count === "number"
      ? latestMaintenanceValidation.issue_count
      : maintenanceResult?.issueCount;
  const latestMaintenanceReportCount = maintenanceResult?.reportCount ?? maintenanceStatus?.reports.length ?? 0;
  const recentLearningAttempts = [...(adminSnapshot?.attempts ?? classProgressRows.flatMap((row) => row.attempts))]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const recentAdminAttempts = recentLearningAttempts;
  const activeStudentAccountForForm = visibleStudentAccounts.find(
    (account) => account.role === "student" && account.studentId === studentForm.id,
  );
  const selectedUnit = contentUnits.find((unit) => unit.id === selectedUnitId) ?? contentUnits[0]!;
  const selectedTopic =
    selectedTopicId === FULL_UNIT_SELECTION
      ? undefined
      : selectedUnit.topics.find((topic) => topic.id === selectedTopicId);
  const selectedStudyTitle = !activeFilterHasMatches
    ? `${activeLearningLabel} 학습 준비 중`
    : selectedTopic
    ? selectedTopic.title
    : `${unitSelectionLabel(selectedUnit)} ${selectedUnit.title} 전체`;
  const selectedStudyDesc = !activeFilterHasMatches
    ? "현재까지 업로드해 구성한 1·2·3·4·5·6학년 문제와 1·2·3·4·5·6학년 연산 과정은 초급 단계로 지정되어 있습니다. 중급·고급 자료를 추가하면 이 메뉴에서 바로 분리됩니다."
    : selectedTopic?.desc ?? selectedUnit.subtitle;
  const selectedStudyGenerators = activeFilterHasMatches ? (selectedTopic ? [selectedTopic.generate] : allGenerators(selectedUnit)) : [];
  const selectedStudyTotalProblems = selectedStudyGenerators.length * selectedProblemSetSize;
  const selectedStudySetSummary = selectedTopic
    ? selectedProblemSetLabel
    : `세부 내용마다 ${selectedProblemSetLabel}`;
  const selectedStudyPrintKey = [
    learner.id,
    selectedUnit.id,
    selectedTopicId,
    selectedProblemSetSize,
    learningSettings.level,
    learningSettings.area,
  ].join("::");
  const studySequenceLabel = studentLoggedIn ? "학생 선택 학습" : "학습 차례 선택";
  const selectedStudyButtonLabel = studentLoggedIn
    ? selectedTopic
      ? "선택한 목차 학습"
      : "선택한 단원 학습"
    : "선택한 내용 학습";
  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const dailyReason = focusTopic
    ? "최근 오답이 있어 다시 잡아주면 좋은 유형입니다."
    : dailyAttempted > 0
      ? `아직 오늘 목표 ${selectedProblemSetSize}문제가 남아 있는 유형입니다.`
      : "새로 시작하기 좋은 오늘의 유형입니다.";
  const baseReportText = useMemo(
    () => buildStudyReport(studyStats, unitProgress, learner),
    [learner, studyStats, unitProgress],
  );
  const reportText = useMemo(
    () =>
      learnerSnapshot
        ? [
            baseReportText,
            "",
            "개인화 학습 플래너",
            `현재 레벨: ${learnerSnapshot.plan.level}`,
            `DB 기록: ${learnerSnapshot.plan.totalAttempts}문제`,
            `오답노트: ${learnerSnapshot.plan.wrongNoteCount}문제`,
            `다음 추천: ${learnerSnapshot.plan.nextTitle}`,
            `전략: ${learnerSnapshot.plan.strategy}`,
          ].join("\n")
        : baseReportText,
    [baseReportText, learnerSnapshot],
  );

  const applyStudentRecordToLearner = useCallback(
    (student: StudentRecord) => {
      const next = saveLearnerProfile(learnerProfileFromStudent(student));
      setLearner(next);
      setLearnerForm({ name: next.name, grade: next.grade });
      setStudyStats(loadStudyStats(next.id));
      setSelectedUnitId(firstUnitIdForLearnerAndSettings(allContentUnits, next, learningSettings));
      setSelectedTopicId(FULL_UNIT_SELECTION);
      setReportCopied(false);
    },
    [allContentUnits, learningSettings],
  );

  const syncRosterForms = useCallback(
    (snapshot: LearningRosterSnapshot) => {
      setTeacherNameForm(snapshot.activeTeacher?.name ?? "");
      setClassForm({
        id: snapshot.activeClass?.id ?? "",
        name: snapshot.activeClass?.name ?? "",
        grade: snapshot.activeClass?.grade ?? launchProfile.grade,
        grades: [snapshot.activeClass?.grade ?? launchProfile.grade],
        teacherId: snapshot.activeTeacher?.id ?? snapshot.activeClass?.teacherId ?? "",
      });
      setStudentForm((prev) => ({
        ...prev,
        id: snapshot.activeStudent?.id ?? "",
        name: snapshot.activeStudent?.name ?? "",
        grade: snapshot.activeStudent?.grade ?? snapshot.activeClass?.grade ?? launchProfile.grade,
        classId: snapshot.activeClass?.id ?? snapshot.activeStudent?.classId ?? "",
      }));
    },
    [launchProfile.grade],
  );

  const refreshAdminData = useCallback(async (includeAdminSnapshot: boolean) => {
    const shouldLoadAdminSnapshot = includeAdminSnapshot && adminLoggedIn;
    const [nextProgress, nextAdminSnapshot] = await Promise.all([
      loadAllLearningProgress(teacherScopedId),
      shouldLoadAdminSnapshot ? loadLearningAdminSnapshot() : Promise.resolve(null),
    ]);
    setAllProgressSnapshot(nextProgress);
    if (nextAdminSnapshot) setAdminSnapshot(nextAdminSnapshot);
    return { nextProgress, nextAdminSnapshot };
  }, [adminLoggedIn, teacherScopedId]);

  const refreshMaintenanceStatus = useCallback(async () => {
    const status = await loadCloudLearningMaintenanceStatus();
    if (status) setMaintenanceStatus(status);
    return status;
  }, []);

  const runServerMaintenanceNow = async () => {
    try {
      const result = await runCloudLearningMaintenance(adminLoggedIn ? "admin-manual" : "teacher-manual");
      if (!result) {
        setAuthMessage("운영 Cloudflare HTTPS 화면에서 서버 데이터 검증과 백업 기록을 실행할 수 있습니다.");
        return;
      }
      setMaintenanceResult(result);
      await refreshMaintenanceStatus();
      setAuthMessage(
        `서버 데이터 유효성 검사 완료: 문제 ${result.issueCount}건, 보고서 ${result.reportCount}건, 백업 기록 ${result.backupId}`,
      );
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "서버 데이터 유지보수 실행에 실패했습니다.");
    }
  };

  useEffect(() => {
    let alive = true;
    void syncLearningContentDb()
      .then((snapshot) => {
        if (alive) setContentSnapshot(snapshot);
      })
      .catch(() => {
        void loadLearningContentSnapshot().then((snapshot) => {
          if (alive) setContentSnapshot(snapshot);
        });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void Promise.all([loadLearningRosterSnapshot(), loadLearningAuthSnapshot()]).then(([snapshot, auth]) => {
      if (!alive) return;
      setRosterSnapshot(snapshot);
      setAuthSnapshot(auth);
      syncRosterForms(snapshot);
      const activeStudent = activeStudentForAuth(snapshot, auth);
      if (auth.activeStudentAccount && activeStudent) {
        applyStudentRecordToLearner(activeStudent);
      }
    });
    return () => {
      alive = false;
    };
  }, [applyStudentRecordToLearner, syncRosterForms]);

  useEffect(() => {
    let alive = true;
    void upsertLearnerDbProfile(learner);
    void loadLearnerDbSnapshot(learner.id).then((snapshot) => {
      if (alive) setLearnerSnapshot(snapshot);
    });
    return () => {
      alive = false;
    };
  }, [learner]);

  useEffect(() => {
    let alive = true;
    if (!rosterSnapshot?.activeClass) {
      return () => {
        alive = false;
      };
    }
    void loadClassLearningProgress(rosterSnapshot.activeClass.id).then((snapshot) => {
      if (alive) setClassProgressSnapshot(snapshot);
    });
    return () => {
      alive = false;
    };
  }, [learnerSnapshot?.plan.totalAttempts, rosterSnapshot?.activeClass]);

  useEffect(() => {
    if (!canViewAllStudentLearningData) {
      return undefined;
    }
    let alive = true;
    const refresh = async () => {
      const [nextProgress, nextAdminSnapshot] = await Promise.all([
        loadAllLearningProgress(teacherScopedId),
        adminLoggedIn ? loadLearningAdminSnapshot() : Promise.resolve(null),
      ]);
      if (!alive) return;
      setAllProgressSnapshot(nextProgress);
      if (nextAdminSnapshot) setAdminSnapshot(nextAdminSnapshot);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [
    canViewAllStudentLearningData,
    adminLoggedIn,
    teacherScopedId,
    learnerSnapshot?.plan.totalAttempts,
    visibleClasses.length,
    registeredStudents.length,
  ]);

  useEffect(() => {
    if (!canViewAllStudentLearningData) return undefined;
    let alive = true;
    const runPeriodicMaintenance = () => {
      void refreshMaintenanceStatus().catch(() => {
        if (alive) setMaintenanceStatus(null);
      });
      void runCloudLearningMaintenance("app-periodic").then((result) => {
        if (!alive || !result) return;
        setMaintenanceResult(result);
        void refreshMaintenanceStatus();
      }).catch(() => undefined);
    };
    const initialTimer = window.setTimeout(runPeriodicMaintenance, 0);
    const timer = window.setInterval(runPeriodicMaintenance, 60 * 60 * 1000);
    return () => {
      alive = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [canViewAllStudentLearningData, refreshMaintenanceStatus]);

  useEffect(() => {
    document.title = `${activeTeacherName} 수학 익힘책`;
  }, [activeTeacherName]);

  const openRosterMenu = useCallback((menu: RosterMenu) => {
    setActiveRosterMenu(menu);
    setRosterPanelOpen(true);
  }, []);

  const problemSheetMeta = (title: string, problemSetSize: ProblemSetSize): ProblemSheetMeta => ({
    title,
    teacherName: activeTeacherName || "미등록",
    learnerName: learner.name || currentLearnerLabel,
    className: activeClassName || "미등록",
    dateLabel: new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
    problemSetSize,
  });

  const printProblemSet = (title: string, problems: Problem[], problemSetSize: ProblemSetSize, mode: ProblemSheetMode) => {
    const printed = printProblemSheetDocument(problemSheetMeta(title, problemSetSize), problems, mode);
    if (!printed) {
      setAuthMessage("출력 창을 열 수 없습니다. 브라우저 팝업 차단을 해제한 뒤 다시 시도하세요.");
    }
  };

  const makeSelectedProblemSheetDraft = (): ProblemSheetDraft => ({
    key: selectedStudyPrintKey,
    title: selectedStudyTitle,
    problemSetSize: selectedProblemSetSize,
    problems: buildTopicProblemSet(selectedStudyGenerators, selectedProblemSetSize, learningSettings.area, topicMeta),
    createdAt: new Date().toISOString(),
  });

  const ensureSelectedProblemSheetDraft = () => {
    const draft = worksheetDraft?.key === selectedStudyPrintKey ? worksheetDraft : makeSelectedProblemSheetDraft();
    if (draft !== worksheetDraft) setWorksheetDraft(draft);
    return draft;
  };

  const printSelectedProblemSheet = (mode: ProblemSheetMode) => {
    if (!activeFilterHasMatches || selectedStudyGenerators.length === 0) return;
    const draft = ensureSelectedProblemSheetDraft();
    printProblemSet(draft.title, draft.problems, draft.problemSetSize, mode);
  };

  const start = (
    title: string,
    accent: string,
    generators: Array<() => Problem>,
    problemsPerTopic: ProblemSetSize = selectedProblemSetSize,
  ) => {
    if (!generators.length) return;
    if (!canStartLearning) {
      openRosterMenu(studentLoggedIn ? "studentLogin" : "teacherLogin");
      setAuthMessage(
        studentLoggedIn || teacherLoggedIn
          ? "관리자가 현재 계정의 학습 실행 권한을 제한했습니다."
          : "학생용 또는 교사용 아이디로 로그인한 뒤 학습을 시작할 수 있습니다.",
      );
      return;
    }
    setScreen({
      name: "practice",
      title,
      accent,
      problems: buildTopicProblemSet(generators, problemsPerTopic, learningSettings.area, topicMeta),
      problemSetSize: problemsPerTopic,
    });
  };

  const updatePrefs = (next: ReaderPrefs) => {
    setPrefs(next);
    saveReaderPrefs(next);
  };

  const chooseUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedTopicId(FULL_UNIT_SELECTION);
    setWorksheetDraft(null);
  };

  const applyLearnerState = (profile: Pick<LearnerProfile, "name" | "grade">) => {
    const next = saveLearnerProfile(
      studentLoggedIn && activeAccountStudent
        ? { ...learnerProfileFromStudent(activeAccountStudent), grade: profile.grade }
        : profile,
    );
    setLearner(next);
    setLearnerForm({ name: next.name, grade: next.grade });
    setStudyStats(loadStudyStats(next.id));
    setSelectedUnitId(firstUnitIdForLearnerAndSettings(allContentUnits, next, learningSettings));
    setSelectedTopicId(FULL_UNIT_SELECTION);
    setReportCopied(false);
  };

  const applyLearnerProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyLearnerState(learnerForm);
  };

  const applyQuickGrade = (grade: string) => {
    const nextForm = { ...learnerForm, grade };
    setLearnerForm(nextForm);
    applyLearnerState(nextForm);
  };

  const toggleClassGradeSelection = (grade: string) => {
    setClassForm((prev) => {
      const currentGrades = classGradeSelections(prev.grade, prev.grades);
      const alreadySelected = currentGrades.some((item) => sameGradeLabel(item, grade));
      const nextGrades = alreadySelected
        ? currentGrades.filter((item) => !sameGradeLabel(item, grade))
        : [...currentGrades, grade];
      const safeGrades = nextGrades.length ? nextGrades : [grade];
      return { ...prev, grade: safeGrades[0], grades: safeGrades };
    });
  };

  const applyLearningSettings = (next: LearningSettings) => {
    setLearningSettings(next);
    saveLearningSettings(next);
    setWorksheetDraft(null);
    setSelectedUnitId(firstUnitIdForLearnerAndSettings(allContentUnits, learner, next));
    setSelectedTopicId(FULL_UNIT_SELECTION);
  };

  const applyProblemSetSize = (problemSetSize: ProblemSetSize) => {
    const next = { ...learningSettings, problemSetSize };
    setLearningSettings(next);
    saveLearningSettings(next);
    setWorksheetDraft(null);
  };

  const refreshRosterAndAuthState = async () => {
    const [nextRoster, nextAuth] = await Promise.all([loadLearningRosterSnapshot(), loadLearningAuthSnapshot()]);
    setRosterSnapshot(nextRoster);
    setAuthSnapshot(nextAuth);
    syncRosterForms(nextRoster);
    const activeStudent = activeStudentForAuth(nextRoster, nextAuth);
    if (nextAuth.activeStudentAccount && activeStudent) applyStudentRecordToLearner(activeStudent);
    return { nextRoster, nextAuth };
  };

  const applyGoogleClientId = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextClientId = googleClientIdForm.trim();
    if (!nextClientId.endsWith(".apps.googleusercontent.com")) {
      setAuthMessage("Google OAuth 웹 클라이언트 ID를 입력해야 관리자 Google 로그인을 초기화할 수 있습니다.");
      return;
    }
    saveGoogleClientId(nextClientId);
    setGoogleClientId(nextClientId);
    setGoogleLoginReady(false);
    setAuthMessage("Google OAuth Client ID를 저장했습니다. 관리자 Google 로그인 버튼을 다시 준비합니다.");
  };

  const handleGoogleAdminCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setAuthMessage("Google 인증 응답이 없습니다. 다시 로그인해 주세요.");
        return;
      }
      if (!googleClientId) {
        setAuthMessage("Google OAuth Client ID를 먼저 설정해 주세요.");
        return;
      }
      try {
        const payload = decodeGoogleCredential(response.credential);
        const email = payload.email?.toLowerCase() ?? "";
        const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : 0;
        if (payload.aud && payload.aud !== googleClientId) {
          throw new Error("Google 인증 토큰의 Client ID가 현재 설정과 다릅니다.");
        }
        if (!expiresAt || expiresAt <= Date.now()) {
          throw new Error("Google 인증 토큰이 만료되었습니다. 다시 로그인해 주세요.");
        }
        const nextAuth = await loginGoogleAdminAccount({
          email,
          allowedEmail: ADMIN_GOOGLE_EMAIL,
          displayName: payload.name ?? ADMIN_GOOGLE_EMAIL,
          googleSub: payload.sub,
          pictureUrl: payload.picture,
          emailVerified: payload.email_verified,
          tokenAud: payload.aud,
          tokenExp: payload.exp,
        });
        setAuthSnapshot(nextAuth);
        await refreshAdminData(true);
        setAuthMessage(`${ADMIN_GOOGLE_EMAIL} Google 인증으로 관리자 모드에 로그인했습니다.`);
        openRosterMenu("adminLogin");
      } catch (error) {
        setAuthMessage(error instanceof Error ? error.message : "관리자 Google 로그인에 실패했습니다.");
      }
    },
    [googleClientId, openRosterMenu, refreshAdminData],
  );

  useEffect(() => {
    if (!rosterPanelOpen || activeRosterMenu !== "adminLogin" || adminLoggedIn || !googleClientId) return undefined;
    let cancelled = false;
    const googleButtonHost = googleButtonRef.current;
    const mountGoogleButton = () => {
      if (cancelled || !window.google?.accounts.id || !googleButtonHost) return;
      googleButtonHost.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => void handleGoogleAdminCredential(response),
        login_hint: ADMIN_GOOGLE_EMAIL,
        ux_mode: "popup",
        auto_select: false,
      });
      window.google.accounts.id.renderButton(googleButtonHost, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with",
        shape: "rectangular",
        locale: "ko",
        width: 260,
      });
      setGoogleLoginReady(true);
    };

    if (window.google?.accounts.id) {
      mountGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);
    const script = existingScript ?? document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = mountGoogleButton;
    script.onerror = () => {
      if (!cancelled) setAuthMessage("Google 로그인 스크립트를 불러오지 못했습니다. 네트워크와 Client ID를 확인해 주세요.");
    };
    if (!existingScript) document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (googleButtonHost) googleButtonHost.innerHTML = "";
    };
  }, [activeRosterMenu, adminLoggedIn, googleClientId, handleGoogleAdminCredential, rosterPanelOpen]);

  const applyLocalAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const nextAuth = await loginLocalAdminAccount({
        email: ADMIN_GOOGLE_EMAIL,
        allowedEmail: ADMIN_GOOGLE_EMAIL,
        password: localAdminLoginForm.password,
      });
      setAuthSnapshot(nextAuth);
      setLocalAdminLoginForm({ password: "" });
      await refreshAdminData(true);
      setAuthMessage("로컬 관리자 PIN으로 관리자 모드에 로그인했습니다.");
      openRosterMenu("adminLogin");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "로컬 관리자 PIN 로그인에 실패했습니다.");
    }
  };

  const applyLocalAdminSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (localAdminSetupForm.password !== localAdminSetupForm.passwordConfirm) {
        throw new Error("로컬 관리자 PIN 확인이 일치하지 않습니다.");
      }
      const nextAuth = await setupLocalAdminAccount({
        email: ADMIN_GOOGLE_EMAIL,
        allowedEmail: ADMIN_GOOGLE_EMAIL,
        displayName: localAdminSetupForm.displayName,
        password: localAdminSetupForm.password,
        allowExistingAdmin: adminLoggedIn,
      });
      setAuthSnapshot(nextAuth);
      setLocalAdminSetupForm((prev) => ({ ...prev, password: "", passwordConfirm: "" }));
      await refreshAdminData(true);
      setAuthMessage("로컬 관리자 PIN을 저장하고 관리자 모드로 로그인했습니다.");
      openRosterMenu("adminLogin");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "로컬 관리자 PIN 저장에 실패했습니다.");
    }
  };

  const applyTeacherLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const nextAuth = await loginLearningAccount("teacher", teacherLoginForm.username, teacherLoginForm.password);
      setAuthSnapshot(nextAuth);
      const nextRoster = await loadLearningRosterSnapshot();
      setRosterSnapshot(nextRoster);
      syncRosterForms(nextRoster);
      setTeacherLoginForm((prev) => ({ ...prev, password: "" }));
      await refreshAdminData(true);
      setAuthMessage("교사용 관리 모드로 로그인했습니다.");
      openRosterMenu("teacher");
    } catch (error) {
      await refreshAdminData(adminLoggedIn);
      setAuthMessage(error instanceof Error ? error.message : "교사용 로그인에 실패했습니다.");
    }
  };

  const applyStudentLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const nextAuth = await loginLearningAccount("student", studentLoginForm.username, studentLoginForm.password);
      setAuthSnapshot(nextAuth);
      const nextRoster = await loadLearningRosterSnapshot();
      setRosterSnapshot(nextRoster);
      syncRosterForms(nextRoster);
      const activeStudent = activeStudentForAuth(nextRoster, nextAuth);
      if (activeStudent) applyStudentRecordToLearner(activeStudent);
      setStudentLoginForm((prev) => ({ ...prev, password: "" }));
      setAuthMessage("학생용 학습 모드로 로그인했습니다.");
    } catch (error) {
      await refreshAdminData(adminLoggedIn);
      setAuthMessage(error instanceof Error ? error.message : "학생용 로그인에 실패했습니다.");
    }
  };

  const applyLogout = async (role: AccountRole) => {
    const nextAuth = await logoutLearningAccount(role);
    setAuthSnapshot(nextAuth);
    if (role === "student" && screen.name === "practice") setScreen({ name: "home" });
    if (role === "admin") {
      window.google?.accounts.id.disableAutoSelect();
      setAdminSnapshot(null);
      setAuthMessage("관리자 계정에서 로그아웃했습니다.");
      openRosterMenu("adminLogin");
    } else {
      setAuthMessage(role === "teacher" ? "교사용 계정에서 로그아웃했습니다." : "학생용 계정에서 로그아웃했습니다.");
      openRosterMenu(role === "teacher" ? "teacherLogin" : "studentLogin");
    }
  };

  const buildAdminBackupPayload = (
    sourceAdminSnapshot: AdminLearningSnapshot | null = adminSnapshot,
    sourceProgressSnapshot: ClassLearningProgressSnapshot | null = allProgressSnapshot,
  ) => {
    const payload = {
      exportedAt: new Date().toISOString(),
      storage: sourceAdminSnapshot?.storage ?? sourceProgressSnapshot?.storage ?? "indexedDB",
      note: "교사와 학생 비밀번호 평문은 저장하지 않으며 관리자 백업에는 passwordHash와 로컬 관리자 PIN 해시도 제외합니다. 계정별 접근 권한, Google 로그인 식별 정보, 로컬 PIN 사용 여부만 보관합니다.",
      roster: {
        teachers: sourceAdminSnapshot?.teachers ?? rosterSnapshot?.teachers ?? [],
        classes: sourceAdminSnapshot?.classes ?? rosterSnapshot?.classes ?? [],
        students: sourceAdminSnapshot?.students ?? rosterSnapshot?.students ?? [],
      },
      accounts: {
        admins: (sourceAdminSnapshot?.adminAccounts ?? []).map(sanitizedAccountForBackup),
        teachers: (sourceAdminSnapshot?.teacherAccounts ?? []).map(sanitizedAccountForBackup),
        students: (sourceAdminSnapshot?.studentAccounts ?? []).map(sanitizedAccountForBackup),
      },
      progress: sourceProgressSnapshot?.students ?? [],
      progressOverrides: sourceAdminSnapshot?.progressOverrides ?? [],
      assignments: sourceAdminSnapshot?.assignments ?? [],
      attempts: sourceAdminSnapshot?.attempts ?? [],
      securityAlerts: sourceAdminSnapshot?.securityAlerts ?? [],
    };
    return JSON.stringify(payload, null, 2);
  };

  const applyAccountAccess = async (
    account: ManagedLearningAccount,
    accessPatch: Partial<ReturnType<typeof accessForAccount>>,
    successMessage = `${account.username} 계정 접근 권한을 저장했습니다.`,
  ) => {
    try {
      const nextAuth = await updateLearningAccountAccess({
        role: account.role,
        accountId: account.id,
        access: { ...accessForAccount(account), ...accessPatch },
      });
      setAuthSnapshot(nextAuth);
      await refreshAdminData(true);
      setAuthMessage(successMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "계정 접근 권한 저장에 실패했습니다.");
    }
  };

  const applyAdminAccountUse = async (account: ManagedLearningAccount) => {
    if (!adminLoggedIn) {
      setAuthMessage("관리자 로그인 후 교사·학생 계정을 대리 사용할 수 있습니다.");
      return;
    }
    try {
      const nextAuth = await activateLearningAccountByAdmin({ role: account.role, accountId: account.id });
      setAuthSnapshot(nextAuth);
      const { nextRoster } = await refreshRosterAndAuthState();
      if (account.role === "student") {
        const student = nextRoster.students.find((item) => item.id === account.studentId);
        if (student) applyStudentRecordToLearner(student);
      }
      await refreshAdminData(true);
      setAuthMessage(`${account.username} 계정을 관리자 권한으로 대리 사용합니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "관리자 대리 사용에 실패했습니다.");
    }
  };

  const openSecurityEmail = (alert: AdminLearningSnapshot["securityAlerts"][number]) => {
    const subject = encodeURIComponent(alert.emailSubject);
    const body = encodeURIComponent(alert.emailBody);
    window.open(`mailto:${ADMIN_GOOGLE_EMAIL}?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
    setAuthMessage("관리자 이메일 알림 작성 창을 열었습니다.");
  };

  const copySecurityKakaoMessage = async (alert: AdminLearningSnapshot["securityAlerts"][number]) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(alert.kakaoMessage);
      setAuthMessage("카카오톡으로 보낼 관리자 알림 문구를 복사했습니다.");
    } catch {
      setAuthMessage(alert.kakaoMessage);
    }
  };

  const acknowledgeSecurityAlert = async (alertId: string) => {
    await acknowledgeLearningSecurityAlert(alertId);
    await refreshAdminData(true);
    setAuthMessage("보안 알림을 확인 처리했습니다.");
  };

  const copyAdminBackup = async () => {
    const { nextProgress, nextAdminSnapshot } = await refreshAdminData(true);
    const backupText = buildAdminBackupPayload(nextAdminSnapshot, nextProgress);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(backupText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = backupText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setAdminBackupCopied(true);
    window.setTimeout(() => setAdminBackupCopied(false), 2500);
  };

  const downloadAdminBackup = async () => {
    const { nextProgress, nextAdminSnapshot } = await refreshAdminData(true);
    const blob = new Blob([buildAdminBackupPayload(nextAdminSnapshot, nextProgress)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kang-math-learning-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const applySignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!signupForm.termsAccepted) throw new Error("회원가입 약관에 동의해야 가입할 수 있습니다.");
      if (signupForm.password !== signupForm.passwordConfirm) throw new Error("비밀번호 확인이 일치하지 않습니다.");

      if (signupForm.role === "teacher") {
        const rosterAfterTeacher = await registerTeacherName(signupForm.displayName || "선생님", rosterSnapshot?.activeTeacher?.id);
        const teacher = rosterAfterTeacher.activeTeacher;
        if (!teacher) throw new Error("선생님 등록 정보를 만들 수 없습니다.");
        await registerLearningAccount({
          role: "teacher",
          username: signupForm.username,
          password: signupForm.password,
          displayName: teacher.name,
          teacherId: teacher.id,
        });
        await refreshRosterAndAuthState();
        await refreshAdminData(canViewAllStudentLearningData);
        setAuthMessage("교사용 회원가입을 완료했습니다. 관리자 승인 후 로그인할 수 있습니다.");
        openRosterMenu("teacherLogin");
      } else {
        const classId = signupForm.classId || rosterSnapshot?.activeClass?.id;
        if (!classId) throw new Error("학생용 회원가입은 먼저 클래스가 필요합니다.");
        const rosterAfterStudent = await registerStudentRecord({
          name: signupForm.displayName,
          grade: signupForm.grade,
          classId,
        });
        const student = rosterAfterStudent.activeStudent;
        if (!student) throw new Error("학생 등록 정보를 만들 수 없습니다.");
        await registerLearningAccount({
          role: "student",
          username: signupForm.username,
          password: signupForm.password,
          displayName: student.name,
          studentId: student.id,
          learnerId: student.learnerId,
        });
        await refreshRosterAndAuthState();
        await refreshAdminData(canViewAllStudentLearningData);
        setAuthMessage("학생용 회원가입을 완료했습니다. 관리자 승인 후 로그인할 수 있습니다.");
        openRosterMenu("studentLogin");
      }

      setSignupForm((prev) => ({
        ...prev,
        username: "",
        password: "",
        passwordConfirm: "",
        displayName: "",
        termsAccepted: false,
      }));
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    }
  };

  const applyTeacherRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 선생님 정보를 수정할 수 있습니다.");
      return;
    }
    const snapshot = await registerTeacherName(teacherNameForm, rosterSnapshot?.activeTeacher?.id);
    setRosterSnapshot(snapshot);
    syncRosterForms(snapshot);
    await refreshAdminData(canViewAllStudentLearningData);
    openRosterMenu("class");
  };

  const applyClassRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!canManageRoster) {
        openRosterMenu("teacherLogin");
        setAuthMessage("교사용 또는 관리자 로그인 후 클래스를 등록할 수 있습니다.");
        return;
      }
      const teacherId = teacherScopedId || classForm.teacherId || rosterSnapshot?.activeTeacher?.id;
      if (!teacherId) {
        setAuthMessage("클래스를 저장하려면 담당 선생님을 먼저 선택하세요.");
        return;
      }
      if (teacherScopedId && classForm.id && !visibleClassIds.has(classForm.id)) {
        setAuthMessage("현재 교사용 계정이 만든 클래스만 수정할 수 있습니다.");
        return;
      }
      let snapshot: LearningRosterSnapshot | null = null;
      let primaryClassId = "";
      for (const [index, grade] of selectedClassGrades.entries()) {
        snapshot = await registerClassRecord({
          classId: index === 0 ? classForm.id || undefined : undefined,
          name: classForm.name,
          grade,
          teacherId,
        });
        if (index === 0) primaryClassId = snapshot.activeClass?.id ?? primaryClassId;
      }
      if (!snapshot) return;
      if (primaryClassId) snapshot = await selectLearningRosterClass(primaryClassId);
      setRosterSnapshot(snapshot);
      syncRosterForms(snapshot);
      setStudentForm((prev) => ({
        ...prev,
        id: "",
        name: "",
        grade: snapshot.activeClass?.grade ?? selectedClassGrades[0] ?? prev.grade,
        classId: snapshot.activeClass?.id ?? prev.classId,
        accountUsername: "",
        accountPassword: "",
        accountPasswordConfirm: "",
      }));
      await refreshAdminData(canViewAllStudentLearningData);
      setAuthMessage(`${classForm.name || "클래스"} ${selectedClassGrades.length}개 과정 클래스를 저장했습니다. 바로 학생을 등록할 수 있습니다.`);
      openRosterMenu("student");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "클래스 저장에 실패했습니다.");
    }
  };

  const applyStudentRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!canManageRoster) {
        openRosterMenu("teacherLogin");
        setAuthMessage("교사용 또는 관리자 로그인 후 학생을 등록할 수 있습니다.");
        return;
      }
      const classId = studentForm.classId || rosterSnapshot?.activeClass?.id;
      if (!classId) {
        setAuthMessage("학생을 저장하려면 먼저 연결할 클래스를 선택하세요.");
        return;
      }
      const targetClass = visibleClasses.find((classRecord) => classRecord.id === classId);
      if (!targetClass) {
        setAuthMessage("선택한 클래스를 찾지 못했습니다. 클래스 관리에서 다시 선택한 뒤 저장하세요.");
        return;
      }
      if (teacherScopedId && studentForm.id && !visibleStudentIds.has(studentForm.id)) {
        setAuthMessage("현재 교사용 계정에 등록된 학생만 수정할 수 있습니다.");
        return;
      }
      const shouldPreserveLearnerId =
        studentForm.name.trim() === learner.name &&
        normalizedGrade(studentForm.grade) === normalizedGrade(learner.grade);
      let snapshot = await registerStudentRecord({
        studentId: studentForm.id || undefined,
        learnerId: shouldPreserveLearnerId ? learner.id : undefined,
        name: studentForm.name,
        grade: studentForm.grade || targetClass.grade,
        classId,
      });
      const savedStudent = snapshot.activeStudent;
      if (!savedStudent) throw new Error("학생 등록 정보를 저장하지 못했습니다.");
      const accountUsername = studentForm.accountUsername.trim();
      const accountPasswordEntered = Boolean(studentForm.accountPassword || studentForm.accountPasswordConfirm);
      const existingStudentAccount = visibleStudentAccounts.find(
        (item) => item.role === "student" && item.studentId === savedStudent.id,
      );
      const keepingExistingAccount = Boolean(
        existingStudentAccount &&
          accountUsername === existingStudentAccount.username &&
          !accountPasswordEntered,
      );
      const accountRequested = Boolean(accountUsername && accountPasswordEntered);
      const progressNumberRequested = Boolean(studentForm.progressAttempted || studentForm.progressCorrect);
      const progressMapRequested = Boolean(
        studentForm.progressTargetDaily ||
          studentForm.progressFocusTitle.trim() ||
          studentForm.progressTeacherMemo.trim(),
      );
      const progressRequested = progressNumberRequested || progressMapRequested;
      if ((accountUsername || accountPasswordEntered) && !accountRequested && !keepingExistingAccount) {
        throw new Error("학생 계정을 등록하거나 변경하려면 아이디와 새 비밀번호를 함께 입력하세요.");
      }
      let nextAuth: LearningAuthSnapshot | null = null;
      if (accountRequested) {
        if (studentForm.accountPassword !== studentForm.accountPasswordConfirm) {
          throw new Error("학생 계정 비밀번호 확인이 일치하지 않습니다.");
        }
        nextAuth = await upsertStudentLearningAccount({
          username: accountUsername,
          password: studentForm.accountPassword,
          displayName: savedStudent.name,
          studentId: savedStudent.id,
          learnerId: savedStudent.learnerId,
        });
      }
      if (progressNumberRequested && (!studentForm.progressAttempted || !studentForm.progressCorrect)) {
        throw new Error("학생 진도 숫자를 수정하려면 전체 풀이 수와 정답 수를 함께 입력하세요.");
      }
      if (progressRequested) {
        const attempted = progressNumberRequested ? Number(studentForm.progressAttempted) : undefined;
        const correct = progressNumberRequested ? Number(studentForm.progressCorrect) : undefined;
        const targetDaily = studentForm.progressTargetDaily ? Number(studentForm.progressTargetDaily) : undefined;
        if (
          progressNumberRequested &&
          (!Number.isFinite(attempted) ||
            !Number.isFinite(correct) ||
            (attempted ?? 0) < 0 ||
            (correct ?? 0) < 0 ||
            (correct ?? 0) > (attempted ?? 0))
        ) {
          throw new Error("학생 진도는 전체 풀이 수보다 정답 수가 크지 않은 0 이상의 숫자로 입력하세요.");
        }
        if (targetDaily !== undefined && (!Number.isFinite(targetDaily) || targetDaily < 0)) {
          throw new Error("하루 목표 문제 수는 0 이상의 숫자로 입력하세요.");
        }
        await updateStudentLearningProgress({
          studentId: savedStudent.id,
          attempted,
          correct,
          targetDaily,
          focusTitle: studentForm.progressFocusTitle,
          teacherMemo: studentForm.progressTeacherMemo,
        });
      }
      snapshot = await selectLearningRosterStudent(savedStudent.id);
      setRosterSnapshot(snapshot);
      syncRosterForms(snapshot);
      applyStudentRecordToLearner(savedStudent);
      setAuthSnapshot(nextAuth ?? (await loadLearningAuthSnapshot()));
      setStudentForm((prev) => ({
        ...prev,
        id: savedStudent.id,
        name: savedStudent.name,
        grade: savedStudent.grade,
        classId: savedStudent.classId,
        accountPassword: "",
        accountPasswordConfirm: "",
      }));
      await refreshAdminData(canViewAllStudentLearningData);
      setAuthMessage(
        [
          `${savedStudent.className}에 ${savedStudent.name} 학생 정보를 저장했습니다.`,
          accountRequested ? "학생 로그인 아이디와 비밀번호를 등록했습니다. 관리자 승인 후 로그인할 수 있습니다." : "",
          progressRequested ? "학생 진도를 수정했습니다." : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "학생 저장에 실패했습니다.");
    }
  };

  const chooseRosterClass = async (classId: string) => {
    if (teacherScopedId && !visibleClassIds.has(classId)) {
      setAuthMessage("현재 교사용 계정이 만든 클래스만 선택할 수 있습니다.");
      return;
    }
    const snapshot = await selectLearningRosterClass(classId);
    setRosterSnapshot(snapshot);
    syncRosterForms(snapshot);
    if (snapshot.activeStudent) applyStudentRecordToLearner(snapshot.activeStudent);
  };

  const chooseRosterStudent = async (studentId: string) => {
    if (teacherScopedId && !visibleStudentIds.has(studentId)) {
      setAuthMessage("현재 교사용 계정에 등록된 학생만 선택할 수 있습니다.");
      return;
    }
    const snapshot = await selectLearningRosterStudent(studentId);
    setRosterSnapshot(snapshot);
    syncRosterForms(snapshot);
    if (snapshot.activeStudent) applyStudentRecordToLearner(snapshot.activeStudent);
  };

  const selectClassForManagement = async (classId: string) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 클래스 관리를 사용할 수 있습니다.");
      return undefined;
    }
    if (teacherScopedId && !visibleClassIds.has(classId)) {
      setAuthMessage("현재 교사용 계정이 만든 클래스만 관리할 수 있습니다.");
      return undefined;
    }
    const snapshot = await selectLearningRosterClass(classId);
    setRosterSnapshot(snapshot);
    syncRosterForms(snapshot);
    if (snapshot.activeStudent) applyStudentRecordToLearner(snapshot.activeStudent);
    return snapshot.classes.find((classRecord) => classRecord.id === classId);
  };

  const chooseManagedClass = async (classId: string) => {
    const classRecord = await selectClassForManagement(classId);
    if (classRecord) setAuthMessage(`${classRecord.name} 클래스를 현재 관리 대상으로 선택했습니다.`);
  };

  const editManagedClass = async (classId: string) => {
    const classRecord = await selectClassForManagement(classId);
    if (!classRecord) return;
    const relatedClasses = visibleClasses
      .filter((item) => item.teacherId === classRecord.teacherId && item.name === classRecord.name)
      .sort((a, b) => gradeSortIndex(a.grade) - gradeSortIndex(b.grade));
    const relatedGrades = relatedClasses.length ? relatedClasses.map((item) => item.grade) : [classRecord.grade];
    setClassForm({
      id: classRecord.id,
      name: classRecord.name,
      grade: classRecord.grade,
      grades: relatedGrades,
      teacherId: classRecord.teacherId,
    });
    openRosterMenu("class");
    setAuthMessage(`${classRecord.name} ${relatedGrades.length}개 과정 클래스 정보를 수정할 수 있습니다.`);
  };

  const removeManagedClassGroup = async (classIds: string[]) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 클래스를 제거할 수 있습니다.");
      return;
    }
    const targetClasses = visibleClasses.filter((classRecord) => classIds.includes(classRecord.id));
    if (!targetClasses.length) {
      setAuthMessage("제거할 클래스를 찾을 수 없습니다.");
      return;
    }
    const targetIdSet = new Set(targetClasses.map((classRecord) => classRecord.id));
    const studentCount = registeredStudents.filter((student) => targetIdSet.has(student.classId)).length;
    if (studentCount > 0) {
      setAuthMessage("등록 학생이 있는 클래스는 제거할 수 없습니다. 먼저 학생을 다른 클래스로 이동한 뒤 다시 시도하세요.");
      return;
    }
    const targetLabel = `${targetClasses[0]?.name ?? "클래스"} ${targetClasses.length}개 과정`;
    if (!window.confirm(`${targetLabel}을 제거할까요? 서버에는 복구용 기록을 남기고 화면 목록에서 숨깁니다.`)) return;
    try {
      let snapshot: LearningRosterSnapshot | null = null;
      for (const classRecord of targetClasses) {
        snapshot = await removeClassRecord(classRecord.id);
      }
      const nextRoster = snapshot ?? (await loadLearningRosterSnapshot());
      setRosterSnapshot(nextRoster);
      syncRosterForms(nextRoster);
      await refreshAdminData(canViewAllStudentLearningData);
      setAuthMessage(`${targetLabel}을 클래스 목록에서 제거했습니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "클래스 제거에 실패했습니다.");
    }
  };

  const removeSelectedClassFromForm = async () => {
    if (!selectedClassDeleteIds.length) {
      setAuthMessage("삭제할 클래스를 먼저 선택하세요.");
      return;
    }
    await removeManagedClassGroup(selectedClassDeleteIds);
  };

  const addStudentToManagedClass = async (classId: string) => {
    const classRecord = await selectClassForManagement(classId);
    if (!classRecord) return;
    setStudentForm({
      id: "",
      name: "",
      grade: classRecord.grade,
      classId: classRecord.id,
      accountUsername: "",
      accountPassword: "",
      accountPasswordConfirm: "",
      progressAttempted: "",
      progressCorrect: "",
      progressTargetDaily: "",
      progressFocusTitle: "",
      progressTeacherMemo: "",
    });
    openRosterMenu("student");
    setAuthMessage(`${classRecord.name} 클래스에 새 학생을 추가할 수 있습니다.`);
  };

  const editStudentRecordManagement = async (
    student: StudentRecord,
    mode: "account" | "progressMap" = "account",
    progressRow?: ClassLearningProgressSnapshot["students"][number],
  ) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 학생 계정과 진도맵을 수정할 수 있습니다.");
      return;
    }
    if (teacherScopedId && !visibleStudentIds.has(student.id)) {
      setAuthMessage("현재 교사용 계정에 등록된 학생만 관리할 수 있습니다.");
      return;
    }
    try {
      const snapshot = await selectLearningRosterStudent(student.id);
      setRosterSnapshot(snapshot);
      syncRosterForms(snapshot);
      if (snapshot.activeStudent) applyStudentRecordToLearner(snapshot.activeStudent);
    } catch {
      setAuthMessage("학생 관리 정보를 불러오지 못했습니다. 현재 화면의 기록으로 수정 폼을 엽니다.");
    }
    const account = visibleStudentAccounts.find(
      (item) => item.role === "student" && item.studentId === student.id,
    );
    const row = progressRow ?? classProgressRows.find((item) => item.student.id === student.id);
    setStudentForm({
      id: student.id,
      name: student.name,
      grade: student.grade,
      classId: student.classId,
      accountUsername: account?.username ?? "",
      accountPassword: "",
      accountPasswordConfirm: "",
      progressAttempted: row ? String(row.attempted) : "",
      progressCorrect: row ? String(row.correct) : "",
      progressTargetDaily: row?.progressTargetDaily ? String(row.progressTargetDaily) : "",
      progressFocusTitle: row?.progressFocusTitle ?? row?.nextTitle ?? "",
      progressTeacherMemo: row?.progressTeacherMemo ?? "",
    });
    openRosterMenu("student");
    setAuthMessage(
      mode === "progressMap"
        ? `${student.name} 학생 진도맵 목표와 중점 내용을 수정할 수 있습니다.`
        : `${student.name} 학생의 계정과 진도를 수정할 수 있습니다.`,
    );
  };

  const editStudentManagement = async (
    row: ClassLearningProgressSnapshot["students"][number],
    mode: "account" | "progressMap" = "account",
  ) => {
    await editStudentRecordManagement(row.student, mode, row);
  };

  const resetStudentPasswordForRecord = async (student: StudentRecord) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 학생 비밀번호를 초기화할 수 있습니다.");
      return;
    }
    if (teacherScopedId && !visibleStudentIds.has(student.id)) {
      setAuthMessage("현재 교사용 계정에 등록된 학생만 관리할 수 있습니다.");
      return;
    }
    const account = visibleStudentAccounts.find(
      (item) => item.role === "student" && item.studentId === student.id,
    );
    if (!account) {
      await editStudentRecordManagement(student, "account");
      setAuthMessage(`${student.name} 학생 계정이 아직 없습니다. 학생 등록 메뉴에서 아이디와 비밀번호를 먼저 저장하세요.`);
      return;
    }
    const temporaryPassword = makeTemporaryPassword();
    try {
      const nextAuth = await upsertStudentLearningAccount({
        username: account.username,
        password: temporaryPassword,
        displayName: student.name,
        studentId: student.id,
        learnerId: student.learnerId,
      });
      setAuthSnapshot(nextAuth);
      await refreshAdminData(canViewAllStudentLearningData);
      setStudentPasswordNotice(`${student.name} 학생 임시 비밀번호: ${temporaryPassword}`);
      openRosterMenu("studentManage");
      setAuthMessage(`${student.name} 학생 비밀번호를 임시 비밀번호로 초기화했습니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "학생 비밀번호 초기화에 실패했습니다.");
    }
  };

  const resetTeacherPassword = async (account: Extract<ManagedLearningAccount, { role: "teacher" }>) => {
    const teacher = adminSnapshot?.teachers.find((item) => item.id === account.teacherId);
    const temporaryPassword = makeTemporaryPassword();
    try {
      const nextAuth = await upsertTeacherLearningAccount({
        username: account.username,
        password: temporaryPassword,
        displayName: account.displayName,
        teacherId: account.teacherId,
      });
      setAuthSnapshot(nextAuth);
      await refreshAdminData(true);
      setStudentPasswordNotice(`${teacher?.name ?? account.displayName} 선생님 임시 비밀번호: ${temporaryPassword}`);
      setAuthMessage(`${teacher?.name ?? account.displayName} 선생님 비밀번호를 임시 비밀번호로 초기화했습니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "교사 비밀번호 초기화에 실패했습니다.");
    }
  };

  const assignStudentWork = async (
    row: ClassLearningProgressSnapshot["students"][number],
    assignmentType: "remedial" | "repeat-homework",
  ) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 보충수업과 반복학습 숙제를 부여할 수 있습니다.");
      return;
    }
    const focusTitle = row.progressFocusTitle ?? row.nextTitle;
    const title = assignmentType === "remedial" ? `${focusTitle} 보충수업` : `${focusTitle} 반복학습 숙제`;
    try {
      const nextProgress = await assignStudentLearningWork({
        studentId: row.student.id,
        assignmentType,
        title,
        focusTitle,
        targetDaily: row.progressTargetDaily ?? (assignmentType === "remedial" ? 10 : 20),
      });
      setAllProgressSnapshot(nextProgress);
      if (rosterSnapshot?.activeClass?.id) {
        const nextClassProgress = await loadClassLearningProgress(rosterSnapshot.activeClass.id);
        setClassProgressSnapshot(nextClassProgress);
      }
      await refreshAdminData(canViewAllStudentLearningData);
      setAuthMessage(`${row.student.name} 학생에게 ${title}을 부여했습니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "보충수업 또는 반복학습 숙제 부여에 실패했습니다.");
    }
  };

  const refreshStudentMonitoringData = async (nextProgress?: ClassLearningProgressSnapshot) => {
    if (nextProgress) setAllProgressSnapshot(nextProgress);
    await refreshAdminData(canViewAllStudentLearningData);
    if (rosterSnapshot?.activeClass?.id) {
      const nextClassProgress = await loadClassLearningProgress(rosterSnapshot.activeClass.id);
      setClassProgressSnapshot(nextClassProgress);
    }
  };

  const editStudentAssignment = async (
    row: ClassLearningProgressSnapshot["students"][number],
    assignment: StudentLearningAssignmentRecord,
  ) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 학습 코칭 문구를 수정할 수 있습니다.");
      return;
    }
    const nextTitle = window.prompt("학습 코칭 문구 수정", assignment.title)?.trim();
    if (!nextTitle || nextTitle === assignment.title) return;
    try {
      const nextProgress = await updateStudentLearningAssignment({
        assignmentId: assignment.id,
        title: nextTitle,
      });
      await refreshStudentMonitoringData(nextProgress);
      setAuthMessage(`${row.student.name} 학생 학습 코칭 문구를 수정했습니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "학습 코칭 문구 수정에 실패했습니다.");
    }
  };

  const removeStudentAssignment = async (
    row: ClassLearningProgressSnapshot["students"][number],
    assignment: StudentLearningAssignmentRecord,
  ) => {
    if (!canManageRoster) {
      openRosterMenu("teacherLogin");
      setAuthMessage("교사용 또는 관리자 로그인 후 학습 코칭 문구를 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm(`${row.student.name} 학생의 "${assignment.title}" 코칭 기록을 화면에서 삭제할까요?`)) return;
    try {
      const nextProgress = await removeStudentLearningAssignment(assignment.id);
      await refreshStudentMonitoringData(nextProgress);
      setAuthMessage(`${row.student.name} 학생 학습 코칭 문구를 삭제했습니다.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "학습 코칭 문구 삭제에 실패했습니다.");
    }
  };

  const saveStudentReportText = (studentName: string, report: StudentDailyCounselReport) => {
    downloadTextFile(`${safeFileName(studentName)}-${report.dateKey}-학습진단-상담서.txt`, report.combinedText);
    setAuthMessage(`${studentName} 학생 진단서와 상담서를 파일로 저장했습니다.`);
  };

  const printStudentReport = (studentName: string, report: StudentDailyCounselReport) => {
    const printed = printReportDocument(`${studentName} ${report.dateLabel} 학습 진단서·학부모 상담서`, report.combinedText, "printer");
    setAuthMessage(printed ? "프린터 출력 창을 열었습니다." : "팝업이 차단되어 프린터 출력 창을 열지 못했습니다.");
  };

  const saveStudentReportPdf = (studentName: string, report: StudentDailyCounselReport) => {
    const opened = printReportDocument(`${studentName} ${report.dateLabel} 학습 진단서·학부모 상담서`, report.combinedText, "pdf");
    setAuthMessage(opened ? "PDF 저장 창을 열었습니다. 인쇄 대상에서 PDF로 저장을 선택하세요." : "팝업이 차단되어 PDF 저장 창을 열지 못했습니다.");
  };

  const emailStudentReport = (studentName: string, report: StudentDailyCounselReport) => {
    const subject = encodeURIComponent(`[푸르넷수학 전자북] ${studentName} ${report.dateLabel} 학습 진단서와 상담서`);
    const body = encodeURIComponent(report.combinedText);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
    setAuthMessage("이메일 작성 창을 열었습니다.");
  };

  const shareStudentReportToKakao = async (studentName: string, report: StudentDailyCounselReport) => {
    const text = `${studentName} ${report.dateLabel} 학습 진단서·상담서\n\n${report.combinedText}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${studentName} 학습 상담서`, text });
        setAuthMessage("공유 창을 열었습니다. 카카오톡을 선택해 전송할 수 있습니다.");
        return;
      }
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      setAuthMessage("카카오톡으로 보낼 상담서 문구를 복사했습니다.");
    } catch {
      setAuthMessage(text);
    }
  };

  const recordAttempt = (ok: boolean, problem: Problem, learnerAnswer: string) => {
    const meta = topicMeta.get(problem.topicId);
    void recordLearnerAttempt({
      learnerId: learner.id,
      learnerName: learner.name,
      grade: learner.grade,
      teacherId: rosterSnapshot?.activeTeacher?.id ?? learner.teacherId,
      teacherName: activeTeacherName,
      classId: rosterSnapshot?.activeClass?.id ?? learner.classId,
      className: rosterSnapshot?.activeClass?.name ?? learner.className,
      learningLevel: learningLevelLabel(meta?.learningLevel ?? learningSettings.level),
      learningArea: learningAreaLabel(meta?.learningArea ?? learningSettings.area),
      unitId: meta?.unitId ?? "unknown",
      unitNo: meta?.unitNo ?? 0,
      unitLabel: meta?.unitLabel,
      unitTitle: meta?.unitTitle ?? "미분류",
      topicId: problem.topicId,
      topicTitle: meta?.topicTitle ?? problem.topicId,
      problemKind: problem.kind,
      prompt: problem.prompt,
      expression: problem.expression,
      learnerAnswer,
      correctAnswer: formatAnswer(problem),
      solution: problem.solution,
      ok,
      sessionTitle: screen.name === "practice" ? screen.title : "학습",
    }).then(async () => {
      const [nextSnapshot, nextAuth] = await Promise.all([
        loadLearnerDbSnapshot(learner.id),
        loadLearningAuthSnapshot(),
      ]);
      setLearnerSnapshot(nextSnapshot);
      setAuthSnapshot(nextAuth);
      await refreshAdminData(canViewAllStudentLearningData);
    });

    setStudyStats((prev) => {
      const now = new Date().toISOString();
      const unitId = meta?.unitId ?? "unknown";
      const next = {
        ...prev,
        attempted: prev.attempted + 1,
        correct: prev.correct + (ok ? 1 : 0),
        units: {
          ...prev.units,
          [unitId]: updateBucket(prev.units[unitId], ok, now),
        },
        topics: {
          ...prev.topics,
          [problem.topicId]: updateBucket(prev.topics[problem.topicId], ok, now),
        },
      };
      saveStudyStats(next, learner.id);
      return next;
    });
  };

  const recordBookmark = () => {
    setStudyStats((prev) => {
      const next = { ...prev, bookmarks: prev.bookmarks + 1 };
      saveStudyStats(next, learner.id);
      return next;
    });
  };

  const copyReport = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(reportText);
      setReportCopied(true);
      window.setTimeout(() => setReportCopied(false), 1600);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = reportText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      setReportCopied(copied);
      if (copied) window.setTimeout(() => setReportCopied(false), 1600);
      return copied;
    }
  };

  if (screen.name === "operation-drill") {
    return (
      <main className="app">
        <OperationDrillHub
          units={allContentUnits}
          onStart={(title, accent, generators, size) => {
            setScreen({
              name: "practice",
              title,
              accent,
              problems: buildTopicProblemSet(generators, size),
              problemSetSize: size,
            });
          }}
          onPrint={(title, generators, size) => {
            printProblemSet(title, buildTopicProblemSet(generators, size), size, "worksheet");
          }}
          onExit={() => setScreen({ name: "home" })}
        />
      </main>
    );
  }

  if (screen.name === "practice") {
    return (
      <main className="app">
        <Practice
          title={screen.title}
          accent={screen.accent}
          problems={screen.problems}
          problemSetSize={screen.problemSetSize}
          prefs={prefs}
          learnerLabel={currentTeacherLearnerLabel}
          onPrefsChange={updatePrefs}
          onAttempt={recordAttempt}
          onBookmark={recordBookmark}
          onPrintWorksheet={() => printProblemSet(screen.title, screen.problems, screen.problemSetSize, "worksheet")}
          onPrintAnswerSheet={() => printProblemSet(screen.title, screen.problems, screen.problemSetSize, "answer")}
          onExit={() => setScreen({ name: "operation-drill" })}
        />
      </main>
    );
  }

  return (
    <main className="app home-app">
      <section className="reader-shell fade-in">
        <header className="reader-top">
          <div>
            <span className="eyebrow">{activeTeacherName} · {activeClassName} · {activeCourseScopeLabel} · {activeLearningLabel}</span>
            <h1>{activeTeacherName} 수학 익힘책</h1>
          </div>
          <div className="reader-actions">
            {adminLoggedIn && (
              <>
                <button
                  className="secondary-btn compact management-toggle-btn approval-shortcut-btn"
                  type="button"
                  onClick={() => {
                    void refreshAdminData(true);
                    openRosterMenu("adminLogin");
                  }}
                >
                  교사 승인
                  <small>{pendingTeacherApprovalCount ? `${pendingTeacherApprovalCount}건 대기` : "대기 없음"}</small>
                </button>
                <button
                  className="secondary-btn compact management-toggle-btn approval-shortcut-btn"
                  type="button"
                  onClick={() => {
                    void refreshAdminData(true);
                    openRosterMenu("adminLogin");
                  }}
                >
                  학생 승인
                  <small>{pendingStudentApprovalCount ? `${pendingStudentApprovalCount}건 대기` : "대기 없음"}</small>
                </button>
              </>
            )}
            <button
              className={rosterPanelOpen ? "secondary-btn compact management-toggle-btn active" : "secondary-btn compact management-toggle-btn"}
              type="button"
              aria-expanded={rosterPanelOpen}
              aria-controls="registration-drawer"
              onClick={() => setRosterPanelOpen((prev) => !prev)}
            >
              관리 메뉴
              <small>{activeModeLabel}</small>
            </button>
            <button
              className="secondary-btn compact management-toggle-btn op-drill-entry-btn"
              type="button"
              onClick={() => setScreen({ name: "operation-drill" })}
            >
              집중 연산반
              <small>1~6학년 연산 훈련</small>
            </button>
            <button
              className="primary-btn compact"
              disabled={!activeFilterHasMatches}
              onClick={() => start(`오늘의 ${selectedProblemSetSize}문제 · ${dailyTopic.topic.title}`, dailyTopic.unit.accent, [dailyTopic.topic.generate])}
            >
              오늘 학습
            </button>
          </div>
        </header>

        {rosterPanelOpen && (
          <section id="registration-drawer" className="registration-drawer" aria-label="관리 메뉴">
            <div className="registration-drawer-head">
              <div>
                <span className="eyebrow">로그인·등록 관리</span>
                <strong>{activeModeLabel}</strong>
              </div>
              <button className="secondary-btn compact" type="button" onClick={() => setRosterPanelOpen(false)}>
                닫기
              </button>
            </div>

        <nav className="registration-menu-bar" aria-label="선생님 클래스 학생 등록 메뉴">
          {([
            ["adminLogin", adminLoggedIn ? "관리자 로그아웃" : "관리자 로그인"],
            ["teacherLogin", teacherLoggedIn ? "교사용 로그아웃" : "교사용 로그인"],
            ["studentLogin", studentLoggedIn ? "학생용 로그아웃" : "학생용 로그인"],
            ["signup", "회원가입/약관"],
            ["teacher", "선생님 이름 등록"],
            ["class", "클래스 등록"],
            ["student", "학생 등록"],
            ["studentManage", "학생 관리"],
            ["classManage", "클래스 관리"],
          ] as Array<[RosterMenu, string]>).map(([id, label]) => (
            <button
              key={id}
              className={activeRosterMenu === id ? "active" : ""}
              type="button"
              onClick={() => openRosterMenu(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="registration-panel" aria-label="선생님 클래스 학생 등록">
          <div className="mode-status-strip" aria-label="현재 로그인 모드">
            <div>
              <span>현재 모드</span>
              <strong>{activeModeLabel}</strong>
            </div>
            <div>
              <span>관리자</span>
              <strong>{activeAdminAccountLabel}</strong>
            </div>
            <div>
              <span>교사용</span>
              <strong>{activeTeacherAccountLabel}</strong>
            </div>
            <div>
              <span>학생용</span>
              <strong>{activeStudentAccountLabel}</strong>
            </div>
            <small>{authMessage || "교사용 관리와 학생용 학습은 각각 다른 아이디와 비밀번호로 로그인합니다."}</small>
          </div>

          {activeRosterMenu === "adminLogin" && (
            <section className="admin-management-panel" aria-label="관리자 전체 학습 데이터 관리">
              {!adminLoggedIn ? (
                <div className="admin-google-login-panel">
                  <div className="auth-session-card">
                    <span>관리자 Google 계정</span>
                    <strong>{ADMIN_GOOGLE_EMAIL}</strong>
                    <small>이 Google 이메일로 로그인해야 관리자 모드가 열립니다.</small>
                  </div>
                  <form className="registration-form google-client-form" onSubmit={applyGoogleClientId}>
                    <label className="learner-field" htmlFor="google-client-id">
                      <span>Google OAuth Client ID</span>
                      <input
                        id="google-client-id"
                        value={googleClientIdForm}
                        onChange={(event) => setGoogleClientIdForm(event.target.value)}
                        placeholder="000000000000-xxxx.apps.googleusercontent.com"
                        autoComplete="off"
                      />
                    </label>
                    <button className="primary-btn compact" type="submit">
                      Client ID 저장
                    </button>
                    <small>승인된 JavaScript 원본에 https://purunet-math-ebook.pages.dev, http://127.0.0.1:4174, http://localhost:4174를 등록해야 합니다.</small>
                  </form>
                  {googleClientId ? (
                    <div className="google-login-box">
                      <div ref={googleButtonRef} aria-label="Google 관리자 로그인 버튼" />
                      <button
                        className="secondary-btn compact"
                        type="button"
                        disabled={!googleLoginReady}
                        onClick={() => window.google?.accounts.id.prompt()}
                      >
                        Google 로그인 다시 표시
                      </button>
                      <small>{googleLoginReady ? "Google 로그인 준비 완료" : "Google 로그인 버튼을 준비하는 중입니다."}</small>
                    </div>
                  ) : (
                    <p className="auth-lock-note">Google OAuth Client ID가 없어도 아래 로컬 관리자 PIN으로 복구 로그인할 수 있습니다.</p>
                  )}
                  <div className="local-admin-panel" aria-label="로컬 관리자 PIN 로그인">
                    <p className="auth-lock-note">Google 승인 오류나 Windows 보안 패스키 오류가 나면 로컬 관리자 PIN으로 이 기기에서 관리자 모드를 복구합니다.</p>
                    <form className="registration-form local-admin-login-form" onSubmit={applyLocalAdminLogin}>
                      <label className="learner-field" htmlFor="local-admin-login-password">
                        <span>로컬 관리자 PIN</span>
                        <input
                          id="local-admin-login-password"
                          type="password"
                          value={localAdminLoginForm.password}
                          onChange={(event) => setLocalAdminLoginForm({ password: event.target.value })}
                          autoComplete="current-password"
                          minLength={6}
                          required
                        />
                      </label>
                      <button className="primary-btn compact" type="submit">
                        로컬 PIN 로그인
                      </button>
                      <small>PIN은 평문 저장 없이 해시로 확인합니다.</small>
                    </form>
                    <form className="registration-form local-admin-setup-form" onSubmit={applyLocalAdminSetup}>
                      <label className="learner-field" htmlFor="local-admin-display-name">
                        <span>표시 이름</span>
                        <input
                          id="local-admin-display-name"
                          value={localAdminSetupForm.displayName}
                          onChange={(event) => setLocalAdminSetupForm((prev) => ({ ...prev, displayName: event.target.value }))}
                          autoComplete="name"
                        />
                      </label>
                      <label className="learner-field" htmlFor="local-admin-setup-password">
                        <span>새 로컬 PIN</span>
                        <input
                          id="local-admin-setup-password"
                          type="password"
                          value={localAdminSetupForm.password}
                          onChange={(event) => setLocalAdminSetupForm((prev) => ({ ...prev, password: event.target.value }))}
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </label>
                      <label className="learner-field" htmlFor="local-admin-setup-password-confirm">
                        <span>PIN 확인</span>
                        <input
                          id="local-admin-setup-password-confirm"
                          type="password"
                          value={localAdminSetupForm.passwordConfirm}
                          onChange={(event) => setLocalAdminSetupForm((prev) => ({ ...prev, passwordConfirm: event.target.value }))}
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </label>
                      <button className="secondary-btn compact" type="submit">
                        로컬 관리자 PIN 저장
                      </button>
                      <small>최초 관리자 등록용입니다. 기존 관리자 계정이 있으면 관리자 로그인 후 변경합니다.</small>
                    </form>
                  </div>
                </div>
              ) : (
                <>
                  <div className="admin-session-row">
                    <div className="auth-session-card">
                      <span>관리자 로그인 상태</span>
                      <strong>{authSnapshot?.activeAdminAccount?.username}</strong>
                      <small>{authSnapshot?.activeAdminAccount?.displayName ?? "관리자"} root 전체 관리 계정입니다.</small>
                    </div>
                    <button className="secondary-btn compact" type="button" onClick={() => void applyLogout("admin")}>
                      관리자 로그아웃
                    </button>
                    <small>관리자 모드는 Google 인증 또는 로컬 관리자 PIN으로 유지됩니다.</small>
                  </div>

                  <section className="root-permission-panel" aria-label="관리자 root 전체 권한">
                    <div className="admin-section-head">
                      <span className="eyebrow">ROOT 권한</span>
                      <strong>전체 프로그램 기능 관리</strong>
                    </div>
                    <div className="root-permission-grid">
                      {[
                        "교사 아이디·비밀번호 관리",
                        "학생 아이디·비밀번호 관리",
                        "학습 데이터 관리",
                        "유저별 학습 접근 관리",
                        "교사·학생 사용자 승인",
                        "서버 DB 검증·백업 관리",
                      ].map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                    <div className="root-quick-actions">
                      <button className="primary-btn compact" type="button" onClick={() => openRosterMenu("teacher")}>
                        교사 아이디 관리
                      </button>
                      <button className="primary-btn compact" type="button" onClick={() => openRosterMenu("student")}>
                        학생 아이디 관리
                      </button>
                      <button className="secondary-btn compact" type="button" onClick={() => void refreshAdminData(true)}>
                        학습 데이터 새로고침
                      </button>
                      <button className="secondary-btn compact" type="button" onClick={() => void runServerMaintenanceNow()}>
                        DB 유효성 검사
                      </button>
                    </div>
                  </section>

                  <section className="approval-management-panel" aria-label="교사 학생 아이디 사용 승인 관리">
                    <div className="admin-section-head">
                      <span className="eyebrow">사용 승인 관리</span>
                      <strong>교사용·학생용 아이디 승인 {pendingApprovalAccounts.length}건</strong>
                    </div>
                    <div className="approval-summary-strip">
                      <div>
                        <span>승인 대기</span>
                        <strong>{pendingApprovalAccounts.length}</strong>
                      </div>
                      <div>
                        <span>승인 완료</span>
                        <strong>{approvedManagedAccountCount}</strong>
                      </div>
                      <div>
                        <span>등록 계정</span>
                        <strong>{managedAccessAccounts.length}</strong>
                      </div>
                    </div>
                    <div className="approval-account-list">
                      {managedAccessAccounts.length ? (
                        managedAccessAccounts.map((account) => {
                          const access = accessForAccount(account);
                          const pendingApproval = isApprovalPendingAccount(account);
                          return (
                            <article
                              key={`approval-${account.id}`}
                              className={pendingApproval ? "approval-account-card pending" : "approval-account-card"}
                            >
                              <div>
                                <span>{account.role === "teacher" ? "교사용 아이디" : "학생용 아이디"}</span>
                                <strong>{account.username}</strong>
                                <small>{account.displayName} · 등록 {new Date(account.createdAt).toLocaleDateString("ko-KR")}</small>
                              </div>
                              <div className="account-access-flags">
                                <span className={pendingApproval ? "blocked" : "allowed"}>
                                  {pendingApproval ? "승인 대기" : "승인 완료"}
                                </span>
                                <span className={access.canLogin ? "allowed" : "blocked"}>
                                  로그인 {access.canLogin ? "허용" : "차단"}
                                </span>
                                <span className={access.canStudy ? "allowed" : "blocked"}>
                                  학습 {access.canStudy ? "허용" : "차단"}
                                </span>
                              </div>
                              <div className="approval-actions">
                                <button
                                  className="primary-btn compact"
                                  type="button"
                                  disabled={access.canLogin && !pendingApproval}
                                  onClick={() =>
                                    void applyAccountAccess(
                                      account,
                                      approvedAccessForAccount(account),
                                      `${account.username} 계정을 승인했습니다.`,
                                    )
                                  }
                                >
                                  승인 인증
                                </button>
                                <button
                                  className="secondary-btn compact"
                                  type="button"
                                  disabled={pendingApproval}
                                  onClick={() =>
                                    void applyAccountAccess(
                                      account,
                                      pendingAccessForAccount(),
                                      `${account.username} 계정을 승인 대기로 돌렸습니다.`,
                                    )
                                  }
                                >
                                  승인 보류
                                </button>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <p className="empty-filter-note">교사용 또는 학생용 아이디가 등록되면 이곳에서 사용 승인을 처리합니다.</p>
                      )}
                    </div>
                  </section>

                  <div className="local-admin-panel" aria-label="로컬 관리자 PIN 재설정">
                    <form className="registration-form local-admin-setup-form" onSubmit={applyLocalAdminSetup}>
                      <label className="learner-field" htmlFor="local-admin-display-name">
                        <span>표시 이름</span>
                        <input
                          id="local-admin-display-name"
                          value={localAdminSetupForm.displayName}
                          onChange={(event) => setLocalAdminSetupForm((prev) => ({ ...prev, displayName: event.target.value }))}
                          autoComplete="name"
                        />
                      </label>
                      <label className="learner-field" htmlFor="local-admin-setup-password">
                        <span>새 로컬 PIN</span>
                        <input
                          id="local-admin-setup-password"
                          type="password"
                          value={localAdminSetupForm.password}
                          onChange={(event) => setLocalAdminSetupForm((prev) => ({ ...prev, password: event.target.value }))}
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </label>
                      <label className="learner-field" htmlFor="local-admin-setup-password-confirm">
                        <span>PIN 확인</span>
                        <input
                          id="local-admin-setup-password-confirm"
                          type="password"
                          value={localAdminSetupForm.passwordConfirm}
                          onChange={(event) => setLocalAdminSetupForm((prev) => ({ ...prev, passwordConfirm: event.target.value }))}
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </label>
                      <button className="secondary-btn compact" type="submit">
                        로컬 관리자 PIN 저장
                      </button>
                      <small>PIN은 백업에 포함하지 않고 이 브라우저 저장소에서만 해시로 확인합니다.</small>
                    </form>
                  </div>

                  <div className="admin-summary-grid">
                    <article>
                      <span>교사</span>
                      <strong>{adminSnapshot?.teachers.length ?? 0}</strong>
                    </article>
                    <article>
                      <span>클래스</span>
                      <strong>{adminSnapshot?.classes.length ?? 0}</strong>
                    </article>
                    <article>
                      <span>학생</span>
                      <strong>{adminSnapshot?.students.length ?? 0}</strong>
                    </article>
                    <article>
                      <span>계정</span>
                      <strong>{adminAccountTotal}</strong>
                    </article>
                    <article>
                      <span>학습 기록</span>
                      <strong>{adminSnapshot?.attempts.length ?? 0}</strong>
                    </article>
                    <article>
                      <span>보충·숙제</span>
                      <strong>{adminSnapshot?.assignments.length ?? 0}</strong>
                    </article>
                    <article>
                      <span>보안 알림</span>
                      <strong>{pendingSecurityAlerts.length}</strong>
                    </article>
                  </div>

                  <div className="admin-backup-actions">
                    <button className="primary-btn compact" type="button" onClick={() => void copyAdminBackup()}>
                      백업 JSON 복사
                    </button>
                    <button className="secondary-btn compact" type="button" onClick={() => void downloadAdminBackup()}>
                      백업 파일 저장
                    </button>
                    <button className="secondary-btn compact" type="button" onClick={() => void refreshAdminData(true)}>
                      새로고침
                    </button>
                    <small>{adminBackupCopied ? "백업 JSON을 클립보드에 복사했습니다." : "백업에는 계정별 접근 권한, 교사, 클래스, 학생, 풀이 기록이 포함되며 비밀번호 해시는 제외됩니다."}</small>
                  </div>

                  <section className="maintenance-panel" aria-label="서버 데이터 유효성 검사와 백업 기록">
                    <div className="admin-section-head">
                      <span className="eyebrow">서버 데이터 보호</span>
                      <strong>유효성 검사·보고서·백업 기록</strong>
                    </div>
                    <div className="maintenance-summary-grid">
                      <article>
                        <span>최근 검사</span>
                        <strong>{latestMaintenanceIssueCount ?? "대기"}</strong>
                        <small>문제 건수</small>
                      </article>
                      <article>
                        <span>보고서 기록</span>
                        <strong>{latestMaintenanceReportCount}</strong>
                        <small>서버 DB 누적</small>
                      </article>
                      <article>
                        <span>최근 백업</span>
                        <strong>{latestMaintenanceBackup ? "완료" : "대기"}</strong>
                        <small>{String(latestMaintenanceBackup?.created_at ?? "운영 HTTPS에서 실행")}</small>
                      </article>
                    </div>
                    <div className="admin-backup-actions">
                      <button className="primary-btn compact" type="button" onClick={() => void runServerMaintenanceNow()}>
                        서버 검사·보고서·백업 실행
                      </button>
                      <button className="secondary-btn compact" type="button" onClick={() => void refreshMaintenanceStatus()}>
                        서버 유지보수 상태 조회
                      </button>
                      <small>
                        Cloudflare Cron Worker가 주기적으로 실행하고, 이 버튼은 즉시 점검이 필요할 때 사용합니다.
                      </small>
                    </div>
                  </section>

                  <section className="security-alert-panel" aria-label="이상행동 자동 제한 알림">
                    <div className="admin-section-head">
                      <span className="eyebrow">실시간 이상행동 감시</span>
                      <strong>자동 제한 알림 {pendingSecurityAlerts.length}건</strong>
                    </div>
                    {securityAlerts.length ? (
                      <div className="security-alert-list">
                        {securityAlerts.slice(0, 8).map((alert) => (
                          <article key={alert.id} className={`security-alert-card ${alert.severity}`}>
                            <div>
                              <span>{alert.role === "teacher" ? "교사" : "학생"} · {alert.eventType === "failed-login" ? "반복 로그인 실패" : "빠른 연속 오답"}</span>
                              <strong>{alert.message}</strong>
                              <small>{new Date(alert.createdAt).toLocaleString("ko-KR")} · {alert.acknowledgedAt ? "확인됨" : "관리자 확인 필요"}</small>
                            </div>
                            <div className="security-alert-actions">
                              <button className="secondary-btn compact" type="button" onClick={() => openSecurityEmail(alert)}>
                                이메일 열기
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void copySecurityKakaoMessage(alert)}>
                                카카오톡 문구 복사
                              </button>
                              {!alert.acknowledgedAt && (
                                <button className="primary-btn compact" type="button" onClick={() => void acknowledgeSecurityAlert(alert.id)}>
                                  확인 처리
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-filter-note">반복 로그인 실패나 빠른 연속 오답이 감지되면 이곳에 관리자 알림이 뜹니다.</p>
                    )}
                  </section>

                  <div className="admin-data-grid">
                    <section className="admin-data-section" aria-label="계정 데이터">
                      <div className="admin-section-head">
                        <span className="eyebrow">계정 데이터</span>
                        <strong>아이디와 인증 정보</strong>
                      </div>
                      <div className="admin-table compact-account-table">
                        <div className="admin-table-head">
                          <span>역할</span>
                          <span>아이디</span>
                          <span>이름</span>
                          <span>연결</span>
                          <span>인증 정보</span>
                        </div>
                        {adminCredentialRows.length ? (
                          adminCredentialRows.map(({ roleLabel, relation, account }) => (
                            <div key={`${roleLabel}-${account.id}`} className="admin-table-row">
                              <span>{roleLabel}</span>
                              <strong>{account.username}</strong>
                              <span>{account.displayName}</span>
                              <span>{relation}</span>
                              <code>
                                {account.role === "admin"
                                  ? adminCredentialStatusLabel(account)
                                  : `${accessStatusLabel(account)} · 해시 비노출`}
                              </code>
                            </div>
                          ))
                        ) : (
                          <p className="empty-filter-note">등록된 계정이 없습니다.</p>
                        )}
                      </div>
                    </section>

                    <section className="admin-data-section account-access-section" aria-label="교사 학생 접근 권한">
                      <div className="admin-section-head">
                        <span className="eyebrow">접근 권한</span>
                        <strong>교사·학생 개별 제한</strong>
                      </div>
                      <div className="account-access-list">
                        {managedAccessAccounts.length ? (
                          managedAccessAccounts.map((account) => {
                            const access = accessForAccount(account);
                            const pendingApproval = isApprovalPendingAccount(account);
                            return (
                              <article key={`access-${account.id}`} className="account-access-card">
                                <div>
                                  <span>{account.role === "teacher" ? "교사" : "학생"}</span>
                                  <strong>{account.username}</strong>
                                  <small>{account.displayName} · {accessStatusLabel(account)}</small>
                                </div>
                                <div className="account-access-flags">
                                  <span className={pendingApproval ? "blocked" : "allowed"}>
                                    {pendingApproval ? "승인 대기" : "승인 완료"}
                                  </span>
                                  <span className={access.canLogin ? "allowed" : "blocked"}>로그인 {access.canLogin ? "허용" : "차단"}</span>
                                  <span className={access.canStudy ? "allowed" : "blocked"}>학습 {access.canStudy ? "허용" : "차단"}</span>
                                  {account.role === "teacher" && (
                                    <>
                                      <span className={access.canViewLearningData ? "allowed" : "blocked"}>
                                        데이터 {access.canViewLearningData ? "조회" : "차단"}
                                      </span>
                                      <span className={access.canManageRoster ? "allowed" : "blocked"}>
                                        관리 {access.canManageRoster ? "허용" : "차단"}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="account-access-actions">
                                  <button
                                    className="primary-btn compact"
                                    type="button"
                                    disabled={!access.canLogin}
                                    onClick={() => void applyAdminAccountUse(account)}
                                  >
                                    관리자 대리 사용
                                  </button>
                                  {account.role === "teacher" && (
                                    <button
                                      className="secondary-btn compact"
                                      type="button"
                                      onClick={() => void resetTeacherPassword(account)}
                                    >
                                      교사 비번 초기화
                                    </button>
                                  )}
                                  <button
                                    className="secondary-btn compact"
                                    type="button"
                                    onClick={() =>
                                      void applyAccountAccess(
                                        account,
                                        approvedAccessForAccount(account),
                                      )
                                    }
                                  >
                                    전체 허용
                                  </button>
                                  {account.role === "teacher" && (
                                    <button
                                      className="secondary-btn compact"
                                      type="button"
                                      onClick={() =>
                                        void applyAccountAccess(account, {
                                          canLogin: true,
                                          canStudy: access.canStudy,
                                          canViewLearningData: false,
                                          canManageRoster: false,
                                          blockedReason: undefined,
                                        })
                                      }
                                    >
                                      학습 데이터 차단
                                    </button>
                                  )}
                                  <button
                                    className="secondary-btn compact"
                                    type="button"
                                    onClick={() =>
                                      void applyAccountAccess(account, {
                                        canLogin: true,
                                        canStudy: false,
                                        canViewLearningData: account.role === "teacher" ? access.canViewLearningData : false,
                                        canManageRoster: account.role === "teacher" ? access.canManageRoster : false,
                                        blockedReason: undefined,
                                      })
                                    }
                                  >
                                    학습 차단
                                  </button>
                                  <button
                                    className="secondary-btn compact danger"
                                    type="button"
                                    onClick={() =>
                                      void applyAccountAccess(account, {
                                        canLogin: false,
                                        canStudy: false,
                                        canViewLearningData: false,
                                        canManageRoster: false,
                                        blockedReason: "관리자 계정 차단",
                                      })
                                    }
                                  >
                                    계정 차단
                                  </button>
                                </div>
                              </article>
                            );
                          })
                        ) : (
                          <p className="empty-filter-note">교사 또는 학생 계정을 등록하면 권한을 제한할 수 있습니다.</p>
                        )}
                      </div>
                    </section>

                    <section className="admin-data-section" aria-label="전체 학습자 진도">
                      <div className="admin-section-head">
                        <span className="eyebrow">전체 학습자 진도</span>
                        <strong>{classProgressRows.length}명 실시간 모니터링</strong>
                      </div>
                      <div className="admin-progress-list">
                        {classProgressRows.length ? (
                          classProgressRows.map((row) => (
                            <article key={row.student.id}>
                              <button className="student-select-btn" type="button" onClick={() => void chooseRosterStudent(row.student.id)}>
                                <strong>{row.student.name}</strong>
                                <small>{row.student.className} · {row.student.grade} · 최근 {shortDate(row.lastStudiedAt)}</small>
                              </button>
                              <span>{row.attempted}문제</span>
                              <span>정답률 {row.accuracy}%</span>
                              <span>오답률 {row.wrongRate}%</span>
                              <button className="secondary-btn compact" type="button" onClick={() => void editStudentManagement(row, "account")}>
                                계정·진도 수정
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void editStudentManagement(row, "progressMap")}>
                                진도맵 설정
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void assignStudentWork(row, "remedial")}>
                                보충수업
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void assignStudentWork(row, "repeat-homework")}>
                                반복숙제
                              </button>
                            </article>
                          ))
                        ) : (
                          <p className="empty-filter-note">등록된 학생 학습 기록이 아직 없습니다.</p>
                        )}
                      </div>
                    </section>
                  </div>

                  <section className="admin-recent-attempts" aria-label="최근 학습 데이터">
                    <div className="admin-section-head">
                      <span className="eyebrow">최근 학습 데이터</span>
                      <strong>{recentAdminAttempts.length}건 표시</strong>
                    </div>
                    {recentAdminAttempts.length ? (
                      <div className="admin-table recent-attempt-table">
                        <div className="admin-table-head">
                          <span>학생</span>
                          <span>클래스</span>
                          <span>단원</span>
                          <span>결과</span>
                          <span>일시</span>
                        </div>
                        {recentAdminAttempts.map((attempt) => (
                          <div key={attempt.id} className="admin-table-row">
                            <strong>{attempt.learnerName}</strong>
                            <span>{attempt.className ?? "미지정"}</span>
                            <span>{attempt.unitLabel ?? `${attempt.unitNo}단원`} {attempt.topicTitle}</span>
                            <span>{attempt.ok ? "정답" : "오답"}</span>
                            <span>{shortDate(attempt.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-filter-note">아직 저장된 풀이 기록이 없습니다.</p>
                    )}
                  </section>
                </>
              )}
            </section>
          )}

          {activeRosterMenu === "teacherLogin" && (
            <form className="registration-form auth-login-form" onSubmit={applyTeacherLogin}>
              {teacherLoggedIn ? (
                <>
                  <div className="auth-session-card">
                    <span>교사용 로그인 상태</span>
                    <strong>{authSnapshot?.activeTeacherAccount?.username}</strong>
                    <small>{activeTeacherName} 관리 계정입니다.</small>
                  </div>
                  <button className="secondary-btn compact" type="button" onClick={() => void applyLogout("teacher")}>
                    교사용 로그아웃
                  </button>
                  <small>로그아웃해도 등록한 클래스와 학생 데이터는 삭제되지 않습니다.</small>
                </>
              ) : (
                <>
                  <label className="learner-field" htmlFor="teacher-login-id">
                    <span>교사용 아이디</span>
                    <input
                      id="teacher-login-id"
                      value={teacherLoginForm.username}
                      onChange={(event) => setTeacherLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                      placeholder="교사용 아이디"
                      autoComplete="username"
                    />
                  </label>
                  <label className="learner-field" htmlFor="teacher-login-password">
                    <span>교사용 비밀번호</span>
                    <input
                      id="teacher-login-password"
                      type="password"
                      value={teacherLoginForm.password}
                      onChange={(event) => setTeacherLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="비밀번호"
                      autoComplete="current-password"
                    />
                  </label>
                  <button className="primary-btn compact" type="submit">
                    교사용 로그인
                  </button>
                  <button className="secondary-btn compact" type="button" onClick={() => openRosterMenu("signup")}>
                    회원가입
                  </button>
                </>
              )}
            </form>
          )}

          {activeRosterMenu === "studentLogin" && (
            <form className="registration-form auth-login-form" onSubmit={applyStudentLogin}>
              {studentLoggedIn ? (
                <>
                  <div className="auth-session-card">
                    <span>학생용 로그인 상태</span>
                    <strong>{authSnapshot?.activeStudentAccount?.username}</strong>
                    <small>{currentLearnerLabel} 학습 계정입니다.</small>
                  </div>
                  <button className="secondary-btn compact" type="button" onClick={() => void applyLogout("student")}>
                    학생용 로그아웃
                  </button>
                  <small>로그아웃해도 풀이 기록과 오답노트는 삭제되지 않습니다.</small>
                </>
              ) : (
                <>
                  <label className="learner-field" htmlFor="student-login-id">
                    <span>학생용 아이디</span>
                    <input
                      id="student-login-id"
                      value={studentLoginForm.username}
                      onChange={(event) => setStudentLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                      placeholder="학생용 아이디"
                      autoComplete="username"
                    />
                  </label>
                  <label className="learner-field" htmlFor="student-login-password">
                    <span>학생용 비밀번호</span>
                    <input
                      id="student-login-password"
                      type="password"
                      value={studentLoginForm.password}
                      onChange={(event) => setStudentLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="비밀번호"
                      autoComplete="current-password"
                    />
                  </label>
                  <button className="primary-btn compact" type="submit">
                    학생용 로그인
                  </button>
                  <button className="secondary-btn compact" type="button" onClick={() => openRosterMenu("signup")}>
                    회원가입
                  </button>
                </>
              )}
            </form>
          )}

          {activeRosterMenu === "signup" && (
            <form className="registration-form signup-registration-form" onSubmit={applySignup}>
              <label className="learner-field" htmlFor="signup-role">
                <span>가입 구분</span>
                <select
                  id="signup-role"
                  value={signupForm.role}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, role: event.target.value as AccountRole }))}
                >
                  <option value="teacher">교사용 계정</option>
                  <option value="student">학생용 계정</option>
                </select>
              </label>
              <label className="learner-field" htmlFor="signup-id">
                <span>아이디</span>
                <input
                  id="signup-id"
                  value={signupForm.username}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="로그인 아이디"
                  autoComplete="username"
                />
              </label>
              <label className="learner-field" htmlFor="signup-password">
                <span>비밀번호</span>
                <input
                  id="signup-password"
                  type="password"
                  value={signupForm.password}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="4자리 이상"
                  autoComplete="new-password"
                />
              </label>
              <label className="learner-field" htmlFor="signup-password-confirm">
                <span>비밀번호 확인</span>
                <input
                  id="signup-password-confirm"
                  type="password"
                  value={signupForm.passwordConfirm}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, passwordConfirm: event.target.value }))}
                  placeholder="다시 입력"
                  autoComplete="new-password"
                />
              </label>
              <label className="learner-field" htmlFor="signup-display-name">
                <span>{signupForm.role === "teacher" ? "선생님 이름" : "학생 이름"}</span>
                <input
                  id="signup-display-name"
                  value={signupForm.displayName}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, displayName: event.target.value }))}
                  placeholder={signupForm.role === "teacher" ? "예: 강태훈샘" : "예: 김민준"}
                  autoComplete="name"
                />
              </label>
              {signupForm.role === "student" && (
                <>
                  <label className="learner-field" htmlFor="signup-class">
                    <span>학생 클래스</span>
                    <select
                      id="signup-class"
                      value={signupForm.classId}
                      onChange={(event) => setSignupForm((prev) => ({ ...prev, classId: event.target.value }))}
                    >
                      <option value="">클래스 선택</option>
                      {visibleClasses.map((classRecord) => (
                        <option key={classRecord.id} value={classRecord.id}>
                          {classRecord.name} · {classRecord.grade}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="learner-field" htmlFor="signup-grade">
                    <span>학생 학년</span>
                    <input
                      id="signup-grade"
                      value={signupForm.grade}
                      onChange={(event) => setSignupForm((prev) => ({ ...prev, grade: event.target.value }))}
                      placeholder="예: 6학년 연산"
                      list="learner-grade-options"
                    />
                  </label>
                </>
              )}
              <details className="terms-box">
                <summary>회원가입 약관 보기</summary>
                <p>
                  이 전자북은 선생님과 학생의 아이디, 비밀번호 해시, 접근 권한, 이름, 클래스, 학습 기록을 이 기기 안에 저장합니다.
                  저장된 데이터는 학습 진도 확인, 오답 관리, 클래스 코칭을 위해서만 사용됩니다.
                </p>
              </details>
              <label className="terms-check">
                <input
                  type="checkbox"
                  checked={signupForm.termsAccepted}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, termsAccepted: event.target.checked }))}
                />
                <span>회원가입 약관에 동의합니다.</span>
              </label>
              <button className="primary-btn compact" type="submit">
                회원가입
              </button>
            </form>
          )}

          {activeRosterMenu === "teacher" && (
            <form className="registration-form" onSubmit={applyTeacherRegistration}>
              <label className="learner-field" htmlFor="teacher-name">
                <span>선생님 이름</span>
                <input
                  id="teacher-name"
                  value={teacherNameForm}
                  onChange={(event) => setTeacherNameForm(event.target.value)}
                  placeholder="예: 강태훈샘"
                  autoComplete="name"
                />
              </label>
              <button className="primary-btn compact" type="submit" disabled={!canManageRoster}>
                선생님 이름 저장
              </button>
              <small>{canManageRoster ? `${activeTeacherName} 이름이 메인창 제목과 학습 기록에 저장됩니다.` : "교사용 또는 관리자 로그인 후 선생님 정보를 수정할 수 있습니다."}</small>
            </form>
          )}

          {activeRosterMenu === "class" && (
            <form className="registration-form class-registration-form" onSubmit={applyClassRegistration}>
              <label className="learner-field" htmlFor="class-teacher">
                <span>담당 선생님</span>
                <select
                  id="class-teacher"
                  value={classForm.teacherId}
                  onChange={(event) => setClassForm((prev) => ({ ...prev, teacherId: event.target.value }))}
                >
                  <option value="">선생님을 먼저 등록하세요</option>
                  {visibleTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="learner-field" htmlFor="class-name">
                <span>클래스 이름</span>
                <input
                  id="class-name"
                  value={classForm.name}
                  onChange={(event) => setClassForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="예: 월수 6학년 연산반"
                />
              </label>
              <label className="learner-field" htmlFor="class-grade">
                <span>학년</span>
                <input
                  id="class-grade"
                  value={classForm.grade}
                  onChange={(event) => {
                    const grade = event.target.value;
                    setClassForm((prev) => ({ ...prev, grade, grades: grade.trim() ? [grade] : [] }));
                  }}
                  placeholder="예: 6학년 연산"
                  list="class-grade-options"
                />
                <datalist id="class-grade-options">
                  {LEARNER_GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade} />
                  ))}
                </datalist>
              </label>
              <div className="class-grade-menu" aria-label="클래스 학년 과정 빠른 선택">
                <span>클래스 학년·과정 빠른 선택</span>
                <div>
                  {LEARNER_GRADE_OPTIONS.map((grade) => (
                    <button
                      key={grade}
                      className={selectedClassGrades.some((item) => sameGradeLabel(item, grade)) ? "active" : ""}
                      type="button"
                      onClick={() => toggleClassGradeSelection(grade)}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
                <small>
                  {selectedClassGrades.length}개 과정 저장 예정: {selectedClassGrades.join(", ")}
                </small>
              </div>
              <button className="primary-btn compact" type="submit" disabled={!(teacherScopedId || classForm.teacherId) || !canManageRoster || selectedClassGrades.length === 0}>
                {selectedClassGrades.length > 1 ? `${selectedClassGrades.length}개 과정 저장` : "클래스 저장"}
              </button>
              <button
                className="secondary-btn compact"
                type="button"
                disabled={!canManageRoster}
                onClick={() => setClassForm({ id: "", name: "", grade: learner.grade, grades: [learner.grade], teacherId: teacherScopedId || rosterSnapshot?.activeTeacher?.id || "" })}
              >
                새 클래스
              </button>
              <button
                className="secondary-btn compact danger"
                type="button"
                disabled={!canManageRoster || selectedClassDeleteIds.length === 0}
                onClick={() => void removeSelectedClassFromForm()}
              >
                클래스 삭제
              </button>
            </form>
          )}

          {activeRosterMenu === "student" && (
            <form className="registration-form student-registration-form" onSubmit={applyStudentRegistration}>
              <label className="learner-field" htmlFor="student-class">
                <span>클래스</span>
                <select
                  id="student-class"
                  value={studentForm.classId}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, classId: event.target.value }))}
                >
                  <option value="">클래스를 먼저 등록하세요</option>
                  {visibleClasses.map((classRecord) => (
                    <option key={classRecord.id} value={classRecord.id}>
                      {classRecord.name} · {classRecord.grade}
                    </option>
                  ))}
                </select>
              </label>
              <label className="learner-field" htmlFor="student-name">
                <span>학생 이름</span>
                <input
                  id="student-name"
                  value={studentForm.name}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="예: 김민준"
                  autoComplete="name"
                />
              </label>
              <label className="learner-field" htmlFor="student-grade">
                <span>학년</span>
                <input
                  id="student-grade"
                  value={studentForm.grade}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, grade: event.target.value }))}
                  placeholder="예: 6학년 연산"
                  list="learner-grade-options"
                />
              </label>
              <label className="learner-field" htmlFor="student-account-username">
                <span>학생 로그인 아이디</span>
                <input
                  id="student-account-username"
                  value={studentForm.accountUsername}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, accountUsername: event.target.value }))}
                  placeholder={activeStudentAccountForForm?.username ?? "예: student01"}
                  autoComplete="username"
                />
              </label>
              <label className="learner-field" htmlFor="student-account-password">
                <span>학생 비밀번호</span>
                <input
                  id="student-account-password"
                  type="password"
                  value={studentForm.accountPassword}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, accountPassword: event.target.value }))}
                  placeholder="등록 또는 변경 시 입력"
                  autoComplete="new-password"
                />
              </label>
              <label className="learner-field" htmlFor="student-account-password-confirm">
                <span>비밀번호 확인</span>
                <input
                  id="student-account-password-confirm"
                  type="password"
                  value={studentForm.accountPasswordConfirm}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, accountPasswordConfirm: event.target.value }))}
                  placeholder="다시 입력"
                  autoComplete="new-password"
                />
              </label>
              <label className="learner-field" htmlFor="student-progress-attempted">
                <span>수정 진도</span>
                <input
                  id="student-progress-attempted"
                  type="number"
                  min="0"
                  value={studentForm.progressAttempted}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, progressAttempted: event.target.value }))}
                  placeholder="전체 풀이 수"
                />
              </label>
              <label className="learner-field" htmlFor="student-progress-correct">
                <span>수정 정답 수</span>
                <input
                  id="student-progress-correct"
                  type="number"
                  min="0"
                  value={studentForm.progressCorrect}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, progressCorrect: event.target.value }))}
                  placeholder="정답 수"
                />
              </label>
              <label className="learner-field" htmlFor="student-progress-target">
                <span>하루 목표 문제</span>
                <input
                  id="student-progress-target"
                  type="number"
                  min="0"
                  value={studentForm.progressTargetDaily}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, progressTargetDaily: event.target.value }))}
                  placeholder="예: 20"
                />
              </label>
              <label className="learner-field" htmlFor="student-progress-focus">
                <span>진도맵 보완 목표</span>
                <input
                  id="student-progress-focus"
                  value={studentForm.progressFocusTitle}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, progressFocusTitle: event.target.value }))}
                  placeholder="예: 분수 덧셈 보완"
                />
              </label>
              <label className="learner-field wide-field" htmlFor="student-progress-memo">
                <span>교사용 진도 메모</span>
                <textarea
                  id="student-progress-memo"
                  value={studentForm.progressTeacherMemo}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, progressTeacherMemo: event.target.value }))}
                  placeholder="학생별 진도맵 안내와 학습 처방을 적어둡니다."
                />
              </label>
              {studentPasswordNotice && <small className="password-reset-note">{studentPasswordNotice}</small>}
              <button className="primary-btn compact" type="submit" disabled={!studentForm.classId || !canManageRoster}>
                학생·계정·진도 저장
              </button>
              <button
                className="secondary-btn compact"
                type="button"
                disabled={!canManageRoster}
                onClick={() =>
                  setStudentForm({
                    id: "",
                    name: "",
                    grade: classForm.grade || learner.grade,
                    classId: activeVisibleClass?.id ?? "",
                    accountUsername: "",
                    accountPassword: "",
                    accountPasswordConfirm: "",
                    progressAttempted: "",
                    progressCorrect: "",
                    progressTargetDaily: "",
                    progressFocusTitle: "",
                    progressTeacherMemo: "",
                  })
                }
              >
                새 학생
              </button>
            </form>
          )}

          {activeRosterMenu === "studentManage" && (
            <section className="student-management-panel" aria-label="학생 관리">
              {!canManageRoster ? (
                <div className="auth-lock-note student-management-lock">
                  <strong>관리 권한 로그인 필요</strong>
                  <span>학생 아이디와 비밀번호 관리는 교사용 또는 관리자 모드에서 사용할 수 있습니다.</span>
                  <button className="primary-btn compact" type="button" onClick={() => openRosterMenu("teacherLogin")}>
                    교사용 로그인
                  </button>
                </div>
              ) : registeredStudents.length > 0 ? (
                <div className="student-management-list">
                  {registeredStudents.map((student) => {
                    const account = visibleStudentAccounts.find(
                      (item) => item.role === "student" && item.studentId === student.id,
                    );
                    const progressRow = classProgressRows.find((row) => row.student.id === student.id);
                    return (
                      <article
                        key={student.id}
                        className={rosterSnapshot?.activeStudent?.id === student.id ? "student-management-card active" : "student-management-card"}
                      >
                        <div className="student-management-main">
                          <span>{student.className || "클래스 미지정"}</span>
                          <strong>{student.name}</strong>
                          <small>{student.grade} · {account?.username ?? "학생 아이디 미등록"}</small>
                          <div className="student-management-meta">
                            <b>{progressRow ? `${progressRow.attempted}문제` : "진도 대기"}</b>
                            <b>{progressRow ? `정답률 ${progressRow.accuracy}%` : "정답률 대기"}</b>
                            <b>{student.teacherName}</b>
                          </div>
                        </div>
                        <div className="student-management-actions">
                          <button className="primary-btn compact" type="button" onClick={() => void editStudentRecordManagement(student, "account", progressRow)}>
                            아이디·비번 수정
                          </button>
                          <button className="secondary-btn compact" type="button" onClick={() => void resetStudentPasswordForRecord(student)}>
                            비번 초기화
                          </button>
                          <button className="secondary-btn compact" type="button" onClick={() => void editStudentRecordManagement(student, "progressMap", progressRow)}>
                            진도맵 설정
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-class-management">
                  <strong>등록된 학생이 없습니다.</strong>
                  <span>먼저 학생을 등록하면 아이디와 비밀번호를 관리할 수 있습니다.</span>
                  <button className="primary-btn compact" type="button" onClick={() => openRosterMenu("student")}>
                    학생 등록
                  </button>
                </div>
              )}
              {studentPasswordNotice && <small className="password-reset-note">{studentPasswordNotice}</small>}
            </section>
          )}

          {activeRosterMenu === "classManage" && (
            <section className="class-management-panel" aria-label="클래스 관리">
              {!canManageRoster ? (
                <div className="auth-lock-note class-management-lock">
                  <strong>관리 권한 로그인 필요</strong>
                  <span>클래스 관리는 교사용 또는 관리자 모드에서 사용할 수 있습니다.</span>
                  <button className="primary-btn compact" type="button" onClick={() => openRosterMenu("teacherLogin")}>
                    교사용 로그인
                  </button>
                </div>
              ) : managedClassGroups.length > 0 ? (
                managedClassGroups.map((classGroup) => {
                  const groupClassIds = classGroup.classes.map((classRecord) => classRecord.id);
                  const groupClassIdSet = new Set(groupClassIds);
                  const studentCount = registeredStudents.filter((student) => groupClassIdSet.has(student.classId)).length;
                  const isActiveClass = groupClassIds.includes(rosterSnapshot?.activeClass?.id ?? "");
                  const primaryClass = classGroup.primaryClass;
                  const gradeList = classGroup.classes.map((classRecord) => classRecord.grade);
                  return (
                    <article key={classGroup.key} className={isActiveClass ? "class-management-card active" : "class-management-card"}>
                      <button
                        className="class-management-main class-management-edit-btn"
                        type="button"
                        onClick={() => void editManagedClass(primaryClass.id)}
                      >
                        <span>{gradeList.length > 1 ? `${gradeList.length}개 과정` : gradeList[0]}</span>
                        <strong>{classGroup.name}</strong>
                        <small>{classGroup.teacherName} · {classStudentCountLabel(studentCount)}</small>
                        <div className="class-management-grade-list" aria-label={`${classGroup.name} 과정 목록`}>
                          {gradeList.map((grade) => (
                            <b key={grade}>{grade}</b>
                          ))}
                        </div>
                      </button>
                      <div className="class-management-actions">
                        <button className="secondary-btn compact" type="button" onClick={() => void chooseManagedClass(primaryClass.id)}>
                          선택
                        </button>
                        <button className="primary-btn compact" type="button" onClick={() => void editManagedClass(primaryClass.id)}>
                          수정
                        </button>
                        <button className="secondary-btn compact" type="button" onClick={() => void addStudentToManagedClass(primaryClass.id)}>
                          학생 추가
                        </button>
                        <button className="secondary-btn compact danger" type="button" onClick={() => void removeManagedClassGroup(groupClassIds)}>
                          클래스 제거
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-class-management">
                  <strong>등록된 클래스가 없습니다.</strong>
                  <span>먼저 클래스를 만든 뒤 학생을 연결할 수 있습니다.</span>
                  <button className="primary-btn compact" type="button" onClick={() => openRosterMenu("class")}>
                    클래스 등록
                  </button>
                </div>
              )}
            </section>
          )}

          <div className="registration-roster-strip" aria-label="등록된 클래스와 학생">
            {visibleClasses.map((classRecord) => {
              const isActiveClass = rosterSnapshot?.activeClass?.id === classRecord.id;
              const studentCount = registeredStudents.filter((student) => student.classId === classRecord.id).length;
              return (
                <article key={classRecord.id} className={isActiveClass ? "registration-roster-card active" : "registration-roster-card"}>
                  <button
                    className={isActiveClass ? "registration-roster-main active" : "registration-roster-main"}
                    type="button"
                    onClick={() => void chooseRosterClass(classRecord.id)}
                  >
                    <strong>{classRecord.name}</strong>
                    <small>{classRecord.grade} · {classStudentCountLabel(studentCount)}</small>
                  </button>
                  {activeRosterMenu === "class" && canManageRoster && (
                    <button
                      className="registration-roster-delete secondary-btn compact danger"
                      type="button"
                      onClick={() => void removeManagedClassGroup([classRecord.id])}
                    >
                      삭제
                    </button>
                  )}
                </article>
              );
            })}
            {activeClassStudents.map((student) => (
              <button
                key={student.id}
                className={rosterSnapshot?.activeStudent?.id === student.id ? "active student-chip" : "student-chip"}
                type="button"
                onClick={() => void chooseRosterStudent(student.id)}
              >
                <strong>{student.name}</strong>
                <small>{student.grade}</small>
              </button>
            ))}
          </div>
        </section>
          </section>
        )}

        <div className="learning-layout">
          <aside className="learning-control-panel" aria-label="학습 제어패널">
            <section className="control-card learner-control">
              <span className="eyebrow">학습자</span>
              <strong>{currentLearnerLabel}</strong>
              <div className="learner-progress" aria-label={`${currentLearnerLabel} 전체 진행률 ${learnerProgress}%`}>
                <span style={{ width: `${learnerProgress}%` }} />
              </div>
              <small>
                {activeTeacherName} · {activeClassName} · 전체 {learnerProgress}% · {studyStats.attempted}/{totalProblemTarget}문제
              </small>
              <form className="side-learner-form" onSubmit={applyLearnerProfile}>
                <label className="learner-field" htmlFor="learner-name">
                  <span>이름</span>
                  <input
                    id="learner-name"
                    value={learnerForm.name}
                    onChange={(event) => setLearnerForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="예: 강태훈"
                    autoComplete="name"
                    readOnly={studentLoggedIn}
                  />
                </label>
                <label className="learner-field" htmlFor="learner-grade">
                  <span>학년</span>
                  <input
                    id="learner-grade"
                    value={learnerForm.grade}
                    onChange={(event) => setLearnerForm((prev) => ({ ...prev, grade: event.target.value }))}
                    placeholder="예: 1학년"
                    list="learner-grade-options"
                    inputMode="text"
                  />
                  <datalist id="learner-grade-options">
                    {LEARNER_GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade} />
                    ))}
                  </datalist>
                </label>
                <div className="grade-quick-select" role="group" aria-label="학년 바로 선택">
                  {LEARNER_GRADE_OPTIONS.map((grade) => (
                    <button
                      key={grade}
                      className={normalizedGrade(learnerForm.grade) === normalizedGrade(grade) ? "active" : ""}
                      type="button"
                      onClick={() => applyQuickGrade(grade)}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
                <small className="grade-helper">{studentGradeAccessLabel}</small>
                {studentLoggedIn && activeStudentFullGrade && !sameGradeLabel(learner.grade, activeStudentFullGrade) && (
                  <button className="secondary-btn compact" type="button" onClick={() => applyQuickGrade(activeStudentFullGrade)}>
                    내 학년 전체
                  </button>
                )}
                <div className="operation-quick-select" aria-label="연산 과정 바로 선택">
                  <span>연산 과정 바로 선택</span>
                  <div>
                    {OPERATION_GRADE_OPTIONS.map((grade) => (
                      <button
                        key={grade}
                        className={normalizedGrade(learnerForm.grade) === normalizedGrade(grade) ? "active" : ""}
                        type="button"
                        onClick={() => applyQuickGrade(grade)}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="learning-filter-menu" aria-label="학습 단계와 문제 수준 선택">
                  <div className="learning-filter-block">
                    <span>학습 단계</span>
                    <div className="learning-pill-group" role="group" aria-label="초급 중급 고급 선택">
                      {LEARNING_LEVEL_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          className={learningSettings.level === option.id ? "active" : ""}
                          type="button"
                          title={option.desc}
                          onClick={() => applyLearningSettings({ ...learningSettings, level: option.id })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="learning-filter-block">
                    <span>문제 수준</span>
                    <div className="learning-pill-group area-grid" role="group" aria-label="기초연산 개념 유형 고난이도 선택">
                      {LEARNING_AREA_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          className={learningSettings.area === option.id ? "active" : ""}
                          type="button"
                          title={option.desc}
                          onClick={() => applyLearningSettings({ ...learningSettings, area: option.id })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <small className="filter-helper">
                    {activeFilterHasMatches
                      ? `${activeLearningLabel} 유형 ${matchedTopicTotal}개가 자동 분류되었습니다.`
                      : "현재 업로드한 자료는 초급 단계입니다. 중급·고급 자료를 추가하면 자동 분류됩니다."}
                  </small>
                </div>
                <button className="primary-btn compact" type="submit">
                  {studentLoggedIn ? "학습 학년 적용" : "적용"}
                </button>
              </form>

              <div className={studentLoggedIn ? "study-sequence-menu student-study-selector" : "study-sequence-menu"} aria-label={studentLoggedIn ? "학생용 개별 학습 내용 선택" : "학습 차례 메뉴바 선택"}>
                <span className="eyebrow">{studySequenceLabel}</span>
                <div className="unit-menu-strip" role="tablist" aria-label="단원 빠른 선택">
                  {contentUnits.map((unit) => (
                    <button
                      key={unit.id}
                      className={unit.id === selectedUnit.id ? "active" : ""}
                      style={{ ["--accent" as string]: unit.accent }}
                      onClick={() => chooseUnit(unit.id)}
                      type="button"
                    >
                      {unitSelectionLabel(unit)}
                    </button>
                  ))}
                </div>
                <label className="learner-field" htmlFor="study-unit-select">
                  <span>단원</span>
                  <select
                    id="study-unit-select"
                    value={selectedUnit.id}
                    onChange={(event) => chooseUnit(event.target.value)}
                  >
                    {contentUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unitSelectionLabel(unit)} {unit.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="learner-field" htmlFor="study-topic-select">
                  <span>공부할 내용</span>
                  <select
                    id="study-topic-select"
                    value={selectedTopicId}
                    onChange={(event) => {
                      setSelectedTopicId(event.target.value);
                      setWorksheetDraft(null);
                    }}
                  >
                    <option value={FULL_UNIT_SELECTION}>단원 전체 {selectedProblemSetSize}문제씩</option>
                    {selectedUnit.topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="learner-field problem-set-field" htmlFor="problem-set-select">
                  <span>문제 세트</span>
                  <select
                    id="problem-set-select"
                    value={selectedProblemSetSize}
                    onChange={(event) => applyProblemSetSize(parseProblemSetSize(event.target.value))}
                  >
                    {PROBLEM_SET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="selected-study-preview">
                  <strong>{selectedStudyTitle}</strong>
                  <small>{selectedStudyDesc}</small>
                  <small>{selectedStudySetSummary} · 총 {selectedStudyTotalProblems}문제 출력 가능</small>
                </div>
                <div className="worksheet-action-row" aria-label="문제지와 답안지 출력">
                  <button
                    className="secondary-btn compact"
                    type="button"
                    disabled={!activeFilterHasMatches}
                    onClick={() => printSelectedProblemSheet("worksheet")}
                  >
                    문제지 출력
                  </button>
                  <button
                    className="secondary-btn compact"
                    type="button"
                    disabled={!activeFilterHasMatches}
                    onClick={() => printSelectedProblemSheet("answer")}
                  >
                    답안지 출력
                  </button>
                </div>
                <button
                  className="primary-btn study-start-btn"
                  type="button"
                  disabled={!activeFilterHasMatches}
                  onClick={() => start(selectedStudyTitle, selectedUnit.accent, selectedStudyGenerators)}
                >
                  {selectedStudyButtonLabel}
                </button>
              </div>
            </section>

            <section className="control-card learner-db-card" aria-label="전용 학습자 데이터베이스">
              <span className="eyebrow">학습 DB</span>
              <strong>전용 학습자 데이터베이스</strong>
              <div className="db-mini-grid">
                <div>
                  <span>저장소</span>
                  <b>{dbStorageLabel}</b>
                </div>
                <div>
                  <span>기록</span>
                  <b>{learnerSnapshot?.plan.totalAttempts ?? 0}</b>
                </div>
                <div>
                  <span>오답</span>
                  <b>{learnerSnapshot?.plan.wrongNoteCount ?? 0}</b>
                </div>
              </div>
              <small>
                학습자별 풀이, 정답률, 오답률을 저장하고 개인화 플래너에 반영합니다.
              </small>
            </section>

            <section className="control-card content-db-card" aria-label="학습 내용 데이터베이스">
              <span className="eyebrow">콘텐츠 DB</span>
              <strong>학습 내용 데이터베이스</strong>
              <div className="db-mini-grid">
                <div>
                  <span>저장소</span>
                  <b>{contentStorageLabel}</b>
                </div>
                <div>
                  <span>단원</span>
                  <b>{contentUnits.length}</b>
                </div>
                <div>
                  <span>유형</span>
                  <b>{contentTopicTotal}</b>
                </div>
                <div>
                  <span>분리 DB</span>
                  <b>{contentCatalogTotal}</b>
                </div>
              </div>
              <small>
                초등 수학, 중등 수학, 초등 영어, 중등 영어, 내신 출판사별 콘텐츠를 학습자·교사 DB와 분리해서 저장합니다.
              </small>
            </section>

            <section className="control-card">
              <span className="eyebrow">읽기 설정</span>
              <div className="side-toggle-group" role="group" aria-label="읽기 설정">
                <button
                  className={prefs.theme === "night" ? "active" : ""}
                  onClick={() => updatePrefs({ ...prefs, theme: prefs.theme === "night" ? "storybook" : "night" })}
                >
                  야간
                </button>
                <button
                  className={prefs.density === "focus" ? "active" : ""}
                  onClick={() => updatePrefs({ ...prefs, density: prefs.density === "focus" ? "story" : "focus" })}
                >
                  집중
                </button>
                <button
                  className={prefs.textSize === "large" ? "active" : ""}
                  onClick={() => updatePrefs({ ...prefs, textSize: prefs.textSize === "large" ? "normal" : "large" })}
                >
                  큰 글자
                </button>
              </div>
            </section>

            <section className="control-card quick-starts">
              <span className="eyebrow">빠른 시작</span>
              <button
                className="primary-btn"
                disabled={!activeFilterHasMatches}
                onClick={() => start(`오늘의 ${selectedProblemSetSize}문제 · ${dailyTopic.topic.title}`, dailyTopic.unit.accent, [dailyTopic.topic.generate])}
              >
                오늘 {selectedProblemSetSize}문제
              </button>
              <button
                className="secondary-btn"
                disabled={!activeFilterHasMatches}
                onClick={() => start(`${unitLabel(dailyTopic.unit)} ${dailyTopic.unit.title} 전체`, dailyTopic.unit.accent, allGenerators(dailyTopic.unit))}
              >
                오늘 단원 전체
              </button>
              <button
                className="secondary-btn"
                disabled={!activeFilterHasMatches}
                onClick={() => start(`${activeCourseRange} 전체 학습`, "var(--indigo)", contentUnits.flatMap(allGenerators))}
              >
                전체 학습
              </button>
            </section>

            <section className="control-card hidden-index">
              <details>
                <summary>
                  <span className="eyebrow">숨긴 차례</span>
                  <strong>단원·유형 선택</strong>
                </summary>
                <div className="control-unit-list">
                  {activeFilterHasMatches ? (
                    contentUnits.map((unit) => (
                      <details className="control-unit" key={unit.id}>
                        <summary>
                          <span>{unitLabel(unit)}</span>
                          <strong>{unit.title}</strong>
                        </summary>
                        <button
                          className="control-topic unit-start"
                          onClick={() => start(`${unitLabel(unit)} ${unit.title} 전체`, unit.accent, allGenerators(unit))}
                        >
                          단원 전체 {selectedProblemSetSize}문제씩
                        </button>
                        {unit.topics.map((topic) => (
                          <button
                            key={topic.id}
                            className="control-topic"
                            onClick={() => start(topic.title, unit.accent, [topic.generate])}
                          >
                            <strong>{topic.title}</strong>
                            <small>{topic.desc}</small>
                          </button>
                        ))}
                      </details>
                    ))
                  ) : (
                    <p className="empty-filter-note">선택한 단계와 문제 수준에 맞는 학습 데이터가 아직 없습니다.</p>
                  )}
                </div>
              </details>
            </section>

          </aside>

          <section className="daily-workspace" aria-label="매일 학습 중심 화면">
            <section className="daily-hero" style={{ ["--accent" as string]: dailyTopic.unit.accent }}>
              <div className="daily-copy">
                <span className="status-pill">{todayLabel} {activeLearningLabel}</span>
                <h2>{activeFilterHasMatches ? `${unitLabel(dailyTopic.unit)} ${dailyTopic.topic.title} ${selectedProblemSetSize}문제` : `${activeLearningLabel} 학습 준비 중`}</h2>
                <p>{activeFilterHasMatches ? `${dailyTopic.topic.desc}. ${dailyReason}` : "선택한 단계와 문제 수준에 맞는 자료가 아직 없습니다. 현재 업로드한 1·2·3·4·5·6학년 문제와 1·2·3·4·5·6학년 연산 과정은 초급 단계로 지정되어 있습니다."}</p>
                <div className="daily-actions">
                  <button
                    className="primary-btn"
                    disabled={!activeFilterHasMatches}
                    onClick={() => start(`오늘의 ${selectedProblemSetSize}문제 · ${dailyTopic.topic.title}`, dailyTopic.unit.accent, [dailyTopic.topic.generate])}
                  >
                    오늘 학습 시작
                  </button>
                  <button
                    className="secondary-btn"
                    disabled={!activeFilterHasMatches}
                    onClick={() => start(`${unitLabel(dailyTopic.unit)} ${dailyTopic.unit.title} 전체`, dailyTopic.unit.accent, allGenerators(dailyTopic.unit))}
                  >
                    같은 단원 더 풀기
                  </button>
                </div>
              </div>
              <div className="daily-visual">
                <UnitScene no={dailyTopic.unit.no} />
                <img src={storybookHero} alt="" />
              </div>
            </section>

            <section className="daily-card-grid" aria-label="오늘 학습 요약">
              <article>
                <span>오늘 목표</span>
                <strong>{selectedProblemSetSize - Math.min(selectedProblemSetSize, dailyAttempted)}문제 남음</strong>
                <div className="study-progress-line" aria-label={`${dailyTopic.topic.title} 진행률 ${dailyProgress}%`}>
                  <span style={{ width: `${dailyProgress}%` }} />
                </div>
                <small>{dailyAttempted}/{selectedProblemSetSize}문제 완료</small>
              </article>
              <article>
                <span>오늘 유형 정답률</span>
                <strong>{dailyAccuracy}%</strong>
                <small>{dailyCorrect}/{dailyAttempted || 0} 정답</small>
              </article>
              <article>
                <span>전체 정답률</span>
                <strong>{totalAccuracy}%</strong>
                <small>{studyStats.correct}/{studyStats.attempted} 정답</small>
              </article>
              <article>
                <span>복습 저장</span>
                <strong>{studyStats.bookmarks}</strong>
                <small>다시 볼 문제</small>
              </article>
            </section>

            <section className="op-drill-promo" aria-label="초등 집중 연산반 바로가기">
              <div className="op-drill-promo-copy">
                <span className="eyebrow">뇌과학·인지과학 기반</span>
                <h2>초등 집중 연산반</h2>
                <p>1학년부터 6학년까지 학년별 연산 유형을 집중 훈련합니다. 혼합 연습·스프린트·단원별 집중 모드로 연산 자동화를 완성하세요.</p>
                <div className="op-drill-promo-tags">
                  <span>🌱 1학년</span><span>🌿 2학년</span><span>🌳 3학년</span>
                  <span>🔵 4학년</span><span>🔷 5학년</span><span>⭐ 6학년</span>
                </div>
              </div>
              <button
                className="op-drill-promo-btn"
                type="button"
                onClick={() => setScreen({ name: "operation-drill" })}
              >
                집중 연산반 입장
                <small>학년 선택 → 연산 유형 → 바로 시작</small>
              </button>
            </section>

            {(adminLoggedIn || teacherLoggedIn) && (
              <section className="class-monitor-panel" aria-label="클래스 학습 진도와 코칭 모니터링">
              <div className="section-title">
                <div>
                  <span className="eyebrow">학습자 모니터링</span>
                  <h2>{adminLoggedIn ? "전체 학습자 실시간 진도맵" : "담당 학습자 실시간 진도맵"}</h2>
                </div>
                <span className="study-level">5초 자동 갱신</span>
              </div>
              {!canViewAllStudentLearningData ? (
                <p className="auth-lock-note">
                  {teacherLoggedIn && !activeTeacherAccess.canViewLearningData
                    ? "관리자가 현재 교사용 계정의 학생 학습 데이터 조회 권한을 제한했습니다."
                    : "교사용 또는 관리자 아이디로 로그인하면 모든 학생의 학습 진도와 코칭을 볼 수 있습니다."}
                </p>
              ) : (
                <>
                  <div className="class-monitor-summary">
                    <article>
                      <span>권한</span>
                      <strong>{adminLoggedIn ? "관리자 전체" : "담당 교사 범위"}</strong>
                    </article>
                    <article>
                      <span>등록 학생</span>
                      <strong>{classProgressRows.length}</strong>
                    </article>
                    <article>
                      <span>전체 풀이</span>
                      <strong>{classTotalAttempts}</strong>
                      <small>평균 정답률 {classAverageAccuracy}%</small>
                    </article>
                    <article>
                      <span>코칭 필요</span>
                      <strong>{classCoachingTargets}</strong>
                      <small>오답률 35% 이상 또는 정답률 65% 미만</small>
                    </article>
                    <article>
                      <span>오늘 진단서</span>
                      <strong>{todayStudentReportCount}</strong>
                      <small>학생별 자동 생성</small>
                    </article>
                  </div>
                  <div className="teacher-maintenance-actions">
                    <button className="secondary-btn compact" type="button" onClick={() => void runServerMaintenanceNow()}>
                      서버 검사·보고서 기록
                    </button>
                    <small>
                      최근 서버 검사 {latestMaintenanceIssueCount ?? "대기"}건 · 서버 보고서 {latestMaintenanceReportCount}건
                    </small>
                  </div>

                  {classProgressRows.length ? (
                    <div className="class-progress-list">
                      {classProgressRows.map((row) => (
                          <article key={row.student.id}>
                            <div className="class-student-head">
                              <button
                                className="student-select-btn"
                                type="button"
                                onClick={() => void chooseRosterStudent(row.student.id)}
                              >
                                <strong>{row.student.name}</strong>
                                <small>{row.student.grade} · 최근 {shortDate(row.lastStudiedAt)}</small>
                              </button>
                              <div>
                                <span>진도</span>
                                <b>{row.attempted}문제</b>
                              </div>
                              <div>
                                <span>정답률</span>
                                <b>{row.accuracy}%</b>
                              </div>
                              <div>
                                <span>오답률</span>
                                <b>{row.wrongRate}%</b>
                              </div>
                              <button className="secondary-btn compact" type="button" onClick={() => void editStudentManagement(row, "account")}>
                                계정·진도 수정
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void editStudentManagement(row, "progressMap")}>
                                진도맵 설정
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void assignStudentWork(row, "remedial")}>
                                보충수업 추가
                              </button>
                              <button className="secondary-btn compact" type="button" onClick={() => void assignStudentWork(row, "repeat-homework")}>
                                반복숙제 부여
                              </button>
                            </div>
                            <div className="student-progress-map" aria-label={`${row.student.name} 학습 진도맵`}>
                              {row.progressMap.length ? (
                                row.progressMap.map((item) => (
                                  <span key={item.id} className={`progress-map-node ${item.status}`}>
                                    {item.label}
                                    <small>{item.accuracy}%</small>
                                  </span>
                                ))
                              ) : (
                                <span className="progress-map-node empty">
                                  시작 전
                                  <small>0%</small>
                                </span>
                              )}
                            </div>
                            <div className="coaching-note">
                              <span>학습 코칭</span>
                              <p>{row.attempted === 0 ? "학생을 선택해 오늘 문제 세트를 시작하면 진도맵과 코칭이 자동으로 쌓입니다." : row.coaching}</p>
                              <small>
                                다음 추천: {row.nextTitle}
                                {row.progressTargetDaily ? ` · 하루 목표 ${row.progressTargetDaily}문제` : ""}
                              </small>
                              {row.assignments.length > 0 && (
                                <div className="assignment-chip-list" aria-label={`${row.student.name} 부여 과제`}>
                                  {row.assignments.slice(0, 3).map((assignment) => (
                                    <span key={assignment.id} className="assignment-chip">
                                      <b>{assignment.assignmentType === "remedial" ? "보충" : "숙제"}</b>
                                      <em>{assignment.title}</em>
                                      <button type="button" onClick={() => void editStudentAssignment(row, assignment)}>
                                        수정
                                      </button>
                                      <button type="button" onClick={() => void removeStudentAssignment(row, assignment)}>
                                        삭제
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                    </div>
                  ) : (
                    <p className="empty-filter-note">클래스와 학생을 등록하면 이곳에 학생별 학습 진도와 코칭이 표시됩니다.</p>
                  )}

                  <section className="admin-recent-attempts teacher-recent-attempts" aria-label="교사용 최근 학습 데이터">
                    <div className="admin-section-head">
                      <span className="eyebrow">최근 학습 데이터</span>
                      <strong>{recentLearningAttempts.length}건 표시</strong>
                    </div>
                    {recentLearningAttempts.length ? (
                      <div className="admin-table recent-attempt-table">
                        <div className="admin-table-head">
                          <span>학생</span>
                          <span>클래스</span>
                          <span>단원</span>
                          <span>결과</span>
                          <span>일시</span>
                        </div>
                        {recentLearningAttempts.map((attempt) => (
                          <div key={attempt.id} className="admin-table-row">
                            <strong>{attempt.learnerName}</strong>
                            <span>{attempt.className ?? "미지정"}</span>
                            <span>{attempt.unitLabel ?? `${attempt.unitNo}단원`} {attempt.topicTitle}</span>
                            <span>{attempt.ok ? "정답" : "오답"}</span>
                            <span>{shortDate(attempt.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-filter-note">아직 저장된 학생 학습 데이터가 없습니다.</p>
                    )}
                  </section>
                </>
              )}
              </section>
            )}

            {learnerSnapshot && (
              <section className="personal-plan-panel" aria-label="개인화 학습 플래너">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">개인화 학습 플래너</span>
                    <h2>{learnerSnapshot.plan.level} 단계로 다음 학습을 정합니다</h2>
                  </div>
                  <button
                    className="primary-btn compact"
                    disabled={!activeFilterHasMatches}
                    onClick={() =>
                      start(
                        `${learnerSnapshot.plan.level} · ${personalizedTopic.topic.title}`,
                        personalizedTopic.unit.accent,
                        personalizedGenerators,
                        PROBLEMS_PER_TOPIC,
                      )
                    }
                  >
                    플랜 시작
                  </button>
                </div>

                <div className="planner-grid">
                  <article>
                    <span>추천 순서</span>
                    <strong>{learnerSnapshot.plan.nextTitle}</strong>
                    <small>{personalizedTarget}문제 목표</small>
                  </article>
                  <article>
                    <span>DB 정답률</span>
                    <strong>{learnerSnapshot.plan.accuracy}%</strong>
                    <small>오답률 {learnerSnapshot.plan.wrongRate}%</small>
                  </article>
                  <article>
                    <span>오답노트</span>
                    <strong>{learnerSnapshot.plan.wrongNoteCount}</strong>
                    <small>다시 볼 문제</small>
                  </article>
                </div>

                <div className="strategy-card">
                  <span>개인화 전략</span>
                  <p>{learnerSnapshot.plan.strategy}</p>
                </div>

                <div className="db-learning-grid">
                  <div className="weak-topic-box">
                    <span className="panel-label">보완 우선순위</span>
                    {dbWeakTopics.length ? (
                      <ol>
                        {dbWeakTopics.map((topic) => (
                          <li key={topic.topicId}>
                            <strong>{topic.unitLabel ?? `${topic.unitNo}단원`} {topic.topicTitle}</strong>
                            <small>{topic.attempted}문제 · 정답률 {topic.accuracy}% · 오답률 {topic.wrongRate}%</small>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>아직 DB에 저장된 풀이 기록이 없습니다.</p>
                    )}
                  </div>

                  <div className="wrong-note-box">
                    <span className="panel-label">최근 오답노트</span>
                    {dbWrongNotes.length ? (
                      <ol>
                        {dbWrongNotes.map((note) => (
                          <li key={note.id}>
                            <strong>{note.topicTitle}</strong>
                            <small>내 답 {note.learnerAnswer || "무응답"} · 정답 {note.correctAnswer}</small>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>오답이 생기면 이곳에 자동으로 정리됩니다.</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="daily-path-panel" aria-label="하루 학습 순서">
              <div className="section-title">
                <div>
                  <span className="eyebrow">하루 학습 순서</span>
                  <h2>많이 보지 않고, 하나씩 풀어갑니다</h2>
                </div>
                <span className="study-level">{studyLabel(studyStats.attempted)}</span>
              </div>
              <div className="daily-step-grid">
                <button
                  disabled={!activeFilterHasMatches}
                  onClick={() => start(`오늘의 ${selectedProblemSetSize}문제 · ${dailyTopic.topic.title}`, dailyTopic.unit.accent, [dailyTopic.topic.generate])}
                >
                  <span>1</span>
                  <strong>오늘 {selectedProblemSetSize}문제</strong>
                  <small>{dailyTopic.topic.title}</small>
                </button>
                <button
                  disabled={!activeFilterHasMatches}
                  onClick={() => start(focusUnit ? `${unitLabel(focusUnit)} ${focusUnit.title} 보완` : `${unitLabel(dailyTopic.unit)} ${dailyTopic.unit.title} 보완`, focusUnit?.accent ?? dailyTopic.unit.accent, focusUnit ? allGenerators(contentUnits.find((unit) => unit.id === focusUnit.id) ?? dailyTopic.unit) : allGenerators(dailyTopic.unit))}
                >
                  <span>2</span>
                  <strong>보완 학습</strong>
                  <small>{focusUnit ? `${focusUnit.title} 다시 보기` : "오늘 단원 한 번 더"}</small>
                </button>
                <button onClick={copyReport}>
                  <span>3</span>
                  <strong>{reportCopied ? "복사됨" : "보고서 복사"}</strong>
                  <small>학습량과 정답률 저장</small>
                </button>
              </div>
            </section>

            <section className="compact-progress-board" aria-label="단원별 진행률">
              <div className="section-title">
                <div>
                  <span className="eyebrow">진행판</span>
                  <h2>단원별 상태만 간단히 확인합니다</h2>
                </div>
              </div>
              <div className="progress-row-list">
                {unitProgress.map((row) => (
                  <article key={row.id} style={{ ["--accent" as string]: row.accent }}>
                    <div>
                      <span>{unitLabel(row)}</span>
                      <strong>{row.title}</strong>
                    </div>
                    <div className="study-progress-line" aria-label={`${row.title} 진행률 ${row.progress}%`}>
                      <span style={{ width: `${row.progress}%` }} />
                    </div>
                    <small>{row.attempted}/{row.target}문제 · 정답률 {row.accuracy}% · 최근 {shortDate(row.lastStudiedAt)}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="story-map hidden-index">
              <details>
                <summary>
                  <span className="eyebrow">모험 지도</span>
                  <strong>스토리 단원 보기</strong>
                </summary>
                <div className="control-map-list">
                  {activeFilterHasMatches ? (
                    stemStoryChapters.map((chapter) => {
                      const unit = contentUnits.find((item) => item.id === chapter.unitId);
                      if (!unit) return null;
                      return (
                        <details
                          key={chapter.unitId}
                          className="story-chapter-card"
                          style={{ ["--accent" as string]: unit.accent }}
                        >
                          <summary>
                            <span className="story-chapter-icon">{chapter.icon}</span>
                            <span className="story-chapter-title">
                              <strong>{chapter.title}</strong>
                              <small>{chapter.scene}</small>
                            </span>
                          </summary>
                          <StoryAdventureVector chapter={chapter} />
                          <p className="story-chapter-narrative">{chapter.narrative}</p>
                          <div className="story-stem-tags" aria-label={`${chapter.title} STEM 연결 역량`}>
                            {chapter.stemFocus.map((focus) => (
                              <span key={focus}>{focus}</span>
                            ))}
                          </div>
                          <div className="story-stem-panel">
                            <article>
                              <span>핵심 수식</span>
                              <code>{chapter.formula}</code>
                              <small>{chapter.formulaMeaning}</small>
                            </article>
                            <article>
                              <span>STEM 설계 과제</span>
                              <p>{chapter.engineeringChallenge}</p>
                            </article>
                            <article>
                              <span>데이터 질문</span>
                              <p>{chapter.dataQuestion}</p>
                            </article>
                          </div>
                          <div className="story-data-grid">
                            <article className="story-bar-card">
                              <strong>{chapter.chartTitle}</strong>
                              {chapter.chartItems.map((item) => (
                                <div key={item.label}>
                                  <span>{item.label}</span>
                                  <b style={{ width: `${Math.max(12, item.value * 24)}px` }} />
                                  <small>{item.value}</small>
                                </div>
                              ))}
                            </article>
                            <article className="story-line-card">
                              <strong>{chapter.lineTitle}</strong>
                              <svg viewBox="0 0 180 90" aria-hidden="true">
                                <polyline
                                  points={chapter.linePoints
                                    .map((point, index) => {
                                      const x = 12 + index * (156 / Math.max(1, chapter.linePoints.length - 1));
                                      const y = 78 - (point.value / Math.max(1, ...chapter.linePoints.map((item) => item.value))) * 58;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")}
                                />
                                {chapter.linePoints.map((point, index) => {
                                  const x = 12 + index * (156 / Math.max(1, chapter.linePoints.length - 1));
                                  const y = 78 - (point.value / Math.max(1, ...chapter.linePoints.map((item) => item.value))) * 58;
                                  return <circle key={point.label} cx={x} cy={y} r="3.5" />;
                                })}
                              </svg>
                            </article>
                          </div>
                          <div className="story-topic-missions">
                            <strong>목차별 탐구 미션</strong>
                            {chapter.topicMissions.map((mission) => {
                              const topic = unit.topics.find((item) => item.id === mission.topicId);
                              if (!topic) return null;
                              return (
                                <button
                                  key={mission.topicId}
                                  className="control-topic story-topic-mission"
                                  type="button"
                                  onClick={() => start(`${chapter.unitLabel} ${topic.title}`, unit.accent, [topic.generate])}
                                >
                                  <strong>{mission.title}</strong>
                                  <small>{mission.narrative}</small>
                                  <em>{mission.stemSkill} · {mission.dataPrompt}</em>
                                </button>
                              );
                            })}
                          </div>
                          <button
                            className="control-topic unit-start story-unit-start"
                            type="button"
                            onClick={() => start(`${unitLabel(unit)} ${unit.title} 전체`, unit.accent, allGenerators(unit))}
                          >
                            이 스토리 단원 전체 학습 시작
                          </button>
                        </details>
                      );
                    })
                  ) : (
                    <p className="empty-filter-note">초급 외 단계는 자료를 추가한 뒤 모험 지도가 열립니다.</p>
                  )}
                </div>
              </details>
            </section>

            <section className="learning-report daily-report" aria-label="학습 보고서">
              <div className="report-head">
                <div>
                  <span className="eyebrow">학습 보고서</span>
                  <h2>{currentLearnerLabel} 오늘 확인할 내용</h2>
                </div>
                <div className="report-actions" aria-label="학습 보고서 복사">
                  <button className="secondary-btn compact" onClick={copyReport}>
                    {reportCopied ? "복사됨" : "보고서 복사"}
                  </button>
                </div>
              </div>
              <div className="report-stat-grid">
                <div>
                  <span>학습량</span>
                  <strong>{studyStats.attempted}</strong>
                  <small>누적 풀이</small>
                </div>
                <div>
                  <span>정답률</span>
                  <strong>{totalAccuracy}%</strong>
                  <small>{studyStats.correct}문제 정답</small>
                </div>
                <div>
                  <span>오답률</span>
                  <strong>{totalWrongRate}%</strong>
                  <small>{totalWrong}문제 오답</small>
                </div>
                <div>
                  <span>다음 학습</span>
                  <strong>{focusUnit ? unitLabel(focusUnit) : unitLabel(dailyTopic.unit)}</strong>
                  <small>{focusUnit?.title ?? dailyTopic.unit.title}</small>
                </div>
              </div>
              <div className="report-summary">
                <p>
                  {studyStats.attempted === 0
                    ? "오늘 문제 세트를 먼저 풀면 학습 보고서가 자동으로 채워집니다."
                    : `현재 ${studyStats.attempted}문제를 풀었고 정답률은 ${totalAccuracy}%, 오답률은 ${totalWrongRate}%입니다.`}
                </p>
                <div>
                  <span>강점 단원</span>
                  <strong>{strongestUnit ? `${unitLabel(strongestUnit)} ${strongestUnit.title}` : "기록 대기"}</strong>
                </div>
                <div>
                  <span>보완 단원</span>
                  <strong>{focusUnit ? `${unitLabel(focusUnit)} ${focusUnit.title}` : "기록 대기"}</strong>
                </div>
                <div>
                  <span>오늘 추천</span>
                  <strong>{dailyTopic.topic.title}</strong>
                </div>
              </div>
              <details className="report-detail">
                <summary>보고서 자세히 보기</summary>
                <textarea readOnly value={reportText} aria-label={`${currentLearnerLabel} 학습 보고서`} />
              </details>
            </section>

            {canManageRoster && (
              <section className="manager-counsel-panel" aria-label="관리자 교사용 학습 진단서와 학부모 상담서">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">{adminLoggedIn ? "관리자 상담 문서" : "교사용 상담 문서"}</span>
                    <h2>학생별 학습 진단서와 학부모 상담서</h2>
                  </div>
                  <span className="study-level">{managerReportRows.length}명</span>
                </div>
                {managerReportRows.length ? (
                  <div className="manager-report-list">
                    {managerReportRows.map(({ row, periods, reports }) => (
                      <details className="student-counsel-report manager-student-report" key={row.student.id}>
                        <summary>
                          <span>{row.student.name} 학습 진단서·학부모 상담서</span>
                          <small>{reports[0]?.dateLabel ?? "오늘 자동 생성 대기"}</small>
                        </summary>
                        <div className="student-period-chart" aria-label={`${row.student.name} 일간 주간 월간 학습 진도표`}>
                          {periods.map((period) => (
                            <article key={period.id}>
                              <div>
                                <span>{period.label} 진도</span>
                                <strong>{period.attempted}문제</strong>
                                <small>정답률 {period.accuracy}%</small>
                              </div>
                              <div className="study-progress-line" aria-label={`${period.label} 진도율 ${period.progress}%`}>
                                <span style={{ width: `${period.progress}%` }} />
                              </div>
                            </article>
                          ))}
                        </div>
                        <div className="student-report-stack">
                          {reports.map((report) => (
                            <article key={report.id}>
                              <div className="student-report-meta">
                                <strong>{report.dateLabel}</strong>
                                <span>{report.attempted}문제 · 정답률 {report.accuracy}% · 보완 {report.focusTitle}</span>
                              </div>
                              <div className="student-report-actions">
                                <button className="secondary-btn compact" type="button" onClick={() => saveStudentReportPdf(row.student.name, report)}>
                                  PDF 저장
                                </button>
                                <button className="secondary-btn compact" type="button" onClick={() => printStudentReport(row.student.name, report)}>
                                  프린터 출력
                                </button>
                                <button className="secondary-btn compact" type="button" onClick={() => saveStudentReportText(row.student.name, report)}>
                                  파일 저장
                                </button>
                                <button className="secondary-btn compact" type="button" onClick={() => void shareStudentReportToKakao(row.student.name, report)}>
                                  카카오톡 전송
                                </button>
                                <button className="secondary-btn compact" type="button" onClick={() => emailStudentReport(row.student.name, report)}>
                                  이메일 전송
                                </button>
                              </div>
                              <div className="student-report-docs">
                                <label>
                                  <span>학습 진단서</span>
                                  <textarea readOnly value={report.diagnosisText} aria-label={`${row.student.name} ${report.dateLabel} 학습 진단서`} />
                                </label>
                                <label>
                                  <span>학부모 상담서</span>
                                  <textarea readOnly value={report.counselingText} aria-label={`${row.student.name} ${report.dateLabel} 학부모 상담서`} />
                                </label>
                              </div>
                            </article>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="empty-filter-note">관리자 또는 교사용 로그인 후 클래스와 학생 학습 기록이 생기면 상담 문서가 자동으로 표시됩니다.</p>
                )}
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
