// Cloudflare D1 학습 데이터 유지보수 API 호출을 담당한다.
export type LearningMaintenanceIssue = {
  severity: "warn" | "error";
  table: string;
  id: string;
  message: string;
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
  issues: LearningMaintenanceIssue[];
};

export type LearningMaintenanceStatus = {
  validations: Array<Record<string, unknown>>;
  backups: Array<Record<string, unknown>>;
  reports: Array<Record<string, unknown>>;
  checkedAt: string;
};

const MAINTENANCE_ENDPOINT = "/api/learning/maintenance";

export function canUseCloudMaintenance() {
  return (
    typeof window !== "undefined" &&
    typeof fetch !== "undefined" &&
    window.location.protocol === "https:" &&
    import.meta.env.VITE_DISABLE_CLOUD_LEARNING_DB !== "1"
  );
}

export async function runCloudLearningMaintenance(trigger = "app-manual"): Promise<LearningMaintenanceResult | null> {
  if (!canUseCloudMaintenance()) return null;
  const response = await fetch(MAINTENANCE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ trigger }),
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Cloudflare 학습 데이터 유지보수를 실행하지 못했습니다.");
  }
  return (await response.json()) as LearningMaintenanceResult;
}

export async function loadCloudLearningMaintenanceStatus(): Promise<LearningMaintenanceStatus | null> {
  if (!canUseCloudMaintenance()) return null;
  const response = await fetch(MAINTENANCE_ENDPOINT, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Cloudflare 학습 데이터 유지보수 상태를 읽지 못했습니다.");
  }
  return (await response.json()) as LearningMaintenanceStatus;
}
