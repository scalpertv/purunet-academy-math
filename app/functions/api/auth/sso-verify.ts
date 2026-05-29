// SSO 토큰을 검증하고 1회 사용 처리 후 사용자 정보를 반환하는 엔드포인트

interface D1Row { [key: string]: unknown }
interface D1Statement {
  bind(...values: (string | number | null)[]): D1Statement;
  first<T = D1Row>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database { prepare(query: string): D1Statement }
interface Env { LEARNING_DB?: D1Database }

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const jsonOk = (data: unknown) => new Response(JSON.stringify(data), { headers: JSON_HEADERS });
const jsonErr = (msg: string, status = 400) => new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: JSON_HEADERS });

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const body = await context.request.json() as { token?: string };
    if (!body.token) return jsonErr('토큰이 필요합니다.', 422);

    const db = context.env.LEARNING_DB;
    if (!db) return jsonErr('DB 설정 오류', 500);

    const row = await db.prepare(
      'SELECT token, username, role, display_name, password_hash, source, user_id, learner_id, expires_at, used_at FROM sso_tokens WHERE token = ? LIMIT 1'
    ).bind(String(body.token)).first<{
      token: string; username: string; role: string; display_name: string;
      password_hash: string; source: string; user_id: string; learner_id: string | null;
      expires_at: string; used_at: string | null;
    }>();

    if (!row) return jsonErr('유효하지 않은 토큰입니다.', 401);
    if (row.used_at) return jsonErr('이미 사용된 토큰입니다.', 401);
    if (new Date(row.expires_at) < new Date()) return jsonErr('만료된 토큰입니다.', 401);

    await db.prepare('UPDATE sso_tokens SET used_at = ? WHERE token = ?').bind(new Date().toISOString(), row.token).run();

    return jsonOk({
      ok: true,
      username: row.username,
      role: row.role,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      source: row.source,
      userId: row.user_id,
      learnerId: row.learner_id ?? undefined,
    });
  } catch (e) {
    return jsonErr('토큰 검증 오류: ' + (e instanceof Error ? e.message : String(e)), 500);
  }
}
