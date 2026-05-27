// Cloudflare D1 학습 서버 API와 브라우저 캐시 사이의 스냅샷 통신을 담당한다.
import type {
  AdminAccountRecord,
  ClassRecord,
  LearnerAttemptRecord,
  LearningSecurityAlert,
  StudentLearningAssignmentRecord,
  StudentAccountRecord,
  StudentProgressOverrideRecord,
  StudentRecord,
  TeacherAccountRecord,
  TeacherRecord,
} from "./learnerDb";

export interface CloudLearningSettingsRecord {
  id: "active";
  teacherId?: string;
  classId?: string;
  studentId?: string;
  updatedAt: string;
}

export interface CloudLearningSnapshot {
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
  settings: CloudLearningSettingsRecord;
  syncedAt?: string;
}

const CLOUD_SNAPSHOT_ENDPOINT = "/api/learning/snapshot";

export function canUseCloudLearningDb() {
  return (
    typeof window !== "undefined" &&
    typeof fetch !== "undefined" &&
    window.location.protocol === "https:" &&
    import.meta.env.VITE_DISABLE_CLOUD_LEARNING_DB !== "1"
  );
}

export async function loadCloudLearningSnapshot(): Promise<CloudLearningSnapshot | null> {
  if (!canUseCloudLearningDb()) return null;
  const response = await fetch(CLOUD_SNAPSHOT_ENDPOINT, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Cloudflare 학습 DB를 읽지 못했습니다.");
  }
  return (await response.json()) as CloudLearningSnapshot;
}

export async function saveCloudLearningSnapshot(snapshot: CloudLearningSnapshot): Promise<void> {
  if (!canUseCloudLearningDb()) return;
  const response = await fetch(CLOUD_SNAPSHOT_ENDPOINT, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(snapshot),
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Cloudflare 학습 DB에 저장하지 못했습니다.");
  }
}
