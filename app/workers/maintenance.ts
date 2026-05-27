// Cloudflare Cron Trigger에서 학습 데이터 검증과 보고서, 백업 기록을 주기적으로 실행한다.
import { runLearningMaintenance, type LearningMaintenanceEnv } from "../functions/_learningMaintenance";

type ScheduledControllerLike = {
  cron: string;
  scheduledTime: number;
};

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void;
};

export default {
  async scheduled(controller: ScheduledControllerLike, env: LearningMaintenanceEnv, ctx: ExecutionContextLike) {
    const trigger = controller.cron === "0 18 * * *" ? "daily-cron" : `cron-${controller.cron}`;
    ctx.waitUntil(runLearningMaintenance(env, trigger));
  },
} satisfies {
  scheduled(controller: ScheduledControllerLike, env: LearningMaintenanceEnv, ctx: ExecutionContextLike): Promise<void>;
};
