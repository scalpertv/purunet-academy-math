// 꿈쟁이 학습 데이터를 IVY_DB D1에서 불러오는 호환 엔드포인트

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

function safeJson(v) {
  if (v == null) return null;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const student_id = url.searchParams.get('student_id');
    if (!student_id) {
      return new Response(JSON.stringify({ ok: false, error: 'student_id required' }), { status: 422, headers: { 'content-type': 'application/json', ...cors() } });
    }
    const db = context.env.IVY_DB;
    if (!db) throw new Error('IVY_DB binding missing');
    await db.prepare(CREATE_SQL).run();
    const rows = await db.prepare(
      'SELECT data_key, payload, updated_at FROM ivy_user_data WHERE student_id = ?1 ORDER BY updated_at DESC'
    ).bind(String(student_id)).all();
    const entries = (rows.results || []).map(r => ({
      key: r.data_key,
      payload: safeJson(r.payload),
      updated_at: r.updated_at
    }));
    return new Response(JSON.stringify({ ok: true, entries }), { headers: { 'content-type': 'application/json', ...cors() } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { 'content-type': 'application/json', ...cors() } });
  }
}
