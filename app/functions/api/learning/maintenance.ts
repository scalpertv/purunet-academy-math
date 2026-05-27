// Cloudflare D1 학습 데이터 유지보수 실행과 상태 조회 API를 제공한다.
import {
  readLearningMaintenanceStatus,
  runLearningMaintenance,
  type LearningMaintenanceEnv,
} from "../../_learningMaintenance";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

function sameOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export async function onRequestGet({ env }: { env: LearningMaintenanceEnv }) {
  try {
    return jsonResponse(await readLearningMaintenanceStatus(env));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "학습 데이터 유지보수 상태를 읽지 못했습니다." }, 500);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: LearningMaintenanceEnv }) {
  if (!sameOriginAllowed(request)) return jsonResponse({ error: "같은 Cloudflare Pages origin에서만 유지보수를 실행할 수 있습니다." }, 403);
  try {
    const body = (await request.json().catch(() => ({}))) as { trigger?: string };
    return jsonResponse(await runLearningMaintenance(env, body.trigger ?? "manual"));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "학습 데이터 유지보수를 실행하지 못했습니다." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}
