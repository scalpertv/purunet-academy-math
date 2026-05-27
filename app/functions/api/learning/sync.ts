// Cloudflare D1 학습 데이터 실시간 동기화를 위한 API 엔드포인트
// POST /api/learning/sync
import type { Env } from "./snapshot";
import { sameOriginAllowed, requireDb, batchAttempts, batchProgressOverrides, batchAssignments } from "./snapshot";

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  // 같은 Cloudflare Pages origin에서만 요청 허용
  if (!sameOriginAllowed(request)) {
    return new Response(JSON.stringify({ error: "같은 Cloudflare Pages origin에서만 요청할 수 있습니다." }), { status: 403 });
  }

  try {
    // 요청 본문을 JSON으로 파싱
    const payload = await request.json();
    
    // 데이터베이스 연결
    const db = requireDb(env);
    
    // 실시간 동기화 로직 구현
    const statements = [];
    
    // 학습 시도(attempts) 데이터 동기화
    if (payload.attempts && Array.isArray(payload.attempts)) {
      statements.push(...batchAttempts(db, payload.attempts));
    }
    
    // 진도 재정의(progressOverrides) 데이터 동기화
    if (payload.progressOverrides && Array.isArray(payload.progressOverrides)) {
      statements.push(...batchProgressOverrides(db, payload.progressOverrides));
    }
    
    // 학습 과제(assignments) 데이터 동기화
    if (payload.assignments && Array.isArray(payload.assignments)) {
      statements.push(...batchAssignments(db, payload.assignments));
    }
    
    // 데이터베이스에 배치 처리로 저장
    if (statements.length > 0) {
      await db.batch(statements);
    }
    
    // 동기화 성공 응답 반환
    return new Response(JSON.stringify({
      ok: true,
      syncedAt: new Date().toISOString(),
      processedRecords: statements.length,
      receivedPayload: payload
    }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    // 오류 발생 시 오류 메시지 반환
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "동기화에 실패했습니다."
    }), { status: 500 });
  }
}