// 꿈쟁이 학습 데이터를 IVY_DB D1에 저장하는 호환 엔드포인트

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS ivy_user_data (
    student_id TEXT NOT NULL,
    data_key   TEXT NOT NULL,
    payload    TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (student_id, data_key)
  )
`;

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { student_id, data_key, payload } = body;
    if (!student_id || !data_key) {
      return new Response(JSON.stringify({ ok: false, error: 'student_id and data_key required' }), { status: 422, headers: { 'content-type': 'application/json', ...cors() } });
    }
    const db = context.env.IVY_DB;
    if (!db) throw new Error('IVY_DB binding missing');
    await db.prepare(CREATE_SQL).run();
    await db.prepare(`
      INSERT INTO ivy_user_data (student_id, data_key, payload, updated_at)
      VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(student_id, data_key) DO UPDATE SET
        payload    = excluded.payload,
        updated_at = excluded.updated_at
    `).bind(
      String(student_id),
      String(data_key),
      JSON.stringify(payload),
      new Date().toISOString()
    ).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', ...cors() } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { 'content-type': 'application/json', ...cors() } });
  }
}
