// 외부 DB(LEARNING_DB·ACADEMY_DB·KINDERGARTEN_DB)에서 자격증명을 검증하는 크로스-로그인 엔드포인트

interface D1Row { [key: string]: unknown }
interface D1Statement {
  bind(...values: (string | number | null)[]): D1Statement;
  first<T = D1Row>(): Promise<T | null>;
}
interface D1Database { prepare(query: string): D1Statement }
interface Env {
  LEARNING_DB?: D1Database;
  ACADEMY_DB?: D1Database;
  KINDERGARTEN_DB?: D1Database;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const jsonOk = (data: unknown) => new Response(JSON.stringify(data), { headers: JSON_HEADERS });
const jsonErr = (msg: string, status = 400) => new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: JSON_HEADERS });

function normalizeUsername(v: string) {
  return v.trim().replace(/\s+/g, '').toLowerCase();
}

async function sha256Hash(role: string, username: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${role}:${username}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return 'sha256-' + Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

type VerifyResult = {
  ok: true;
  source: 'learning' | 'academy' | 'kindergarten';
  role: 'teacher' | 'student';
  username: string;
  displayName: string;
  userId: string;
  learnerId?: string;
  passwordHash: string;
};

async function checkLearningDb(db: D1Database, username: string, tHash: string, sHash: string): Promise<VerifyResult | null> {
  const tRow = await db.prepare(
    'SELECT username, display_name, teacher_id, can_login, payload FROM teacher_accounts WHERE username = ? LIMIT 1'
  ).bind(username).first<{ username: string; display_name: string; teacher_id: string; can_login: number; payload: string }>();
  if (tRow && tRow.can_login) {
    let ph = '';
    try { ph = (JSON.parse(tRow.payload) as { passwordHash?: string }).passwordHash ?? ''; } catch { ph = ''; }
    if (ph === tHash) return { ok: true, source: 'learning', role: 'teacher', username: tRow.username, displayName: tRow.display_name, userId: tRow.teacher_id, passwordHash: tHash };
  }

  const sRow = await db.prepare(
    'SELECT username, display_name, student_id, learner_id, can_login, payload FROM student_accounts WHERE username = ? LIMIT 1'
  ).bind(username).first<{ username: string; display_name: string; student_id: string; learner_id: string; can_login: number; payload: string }>();
  if (sRow && sRow.can_login) {
    let ph = '';
    try { ph = (JSON.parse(sRow.payload) as { passwordHash?: string }).passwordHash ?? ''; } catch { ph = ''; }
    if (ph === sHash) return { ok: true, source: 'learning', role: 'student', username: sRow.username, displayName: sRow.display_name, userId: sRow.student_id, learnerId: sRow.learner_id, passwordHash: sHash };
  }
  return null;
}

async function checkExternalDb(db: D1Database, username: string, password: string, source: 'academy' | 'kindergarten', tHash: string, sHash: string): Promise<VerifyResult | null> {
  const tRow = await db.prepare(
    'SELECT id, name, username, payload FROM teachers WHERE username = ? LIMIT 1'
  ).bind(username).first<{ id: string; name: string; username: string; payload: string }>();
  if (tRow) {
    let pw = '';
    try { pw = (JSON.parse(tRow.payload) as { password?: string }).password ?? ''; } catch { pw = ''; }
    if (pw === password) return { ok: true, source, role: 'teacher', username: tRow.username, displayName: tRow.name, userId: tRow.id, passwordHash: tHash };
  }

  const sRow = await db.prepare(
    'SELECT id, name, username, payload FROM students WHERE username = ? LIMIT 1'
  ).bind(username).first<{ id: string; name: string; username: string; payload: string }>();
  if (sRow) {
    let pw = '';
    try { pw = (JSON.parse(sRow.payload) as { password?: string }).password ?? ''; } catch { pw = ''; }
    if (pw === password) return { ok: true, source, role: 'student', username: sRow.username, displayName: sRow.name, userId: sRow.id, passwordHash: sHash };
  }
  return null;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const body = await context.request.json() as { username?: string; password?: string };
    if (!body.username || !body.password) return jsonErr('아이디와 비밀번호를 입력해 주세요.', 422);

    const username = normalizeUsername(body.username);
    const password = String(body.password);
    const [tHash, sHash] = await Promise.all([sha256Hash('teacher', username, password), sha256Hash('student', username, password)]);

    if (context.env.LEARNING_DB) {
      const r = await checkLearningDb(context.env.LEARNING_DB, username, tHash, sHash);
      if (r) return jsonOk(r);
    }
    if (context.env.ACADEMY_DB) {
      const r = await checkExternalDb(context.env.ACADEMY_DB, username, password, 'academy', tHash, sHash);
      if (r) return jsonOk(r);
    }
    if (context.env.KINDERGARTEN_DB) {
      const r = await checkExternalDb(context.env.KINDERGARTEN_DB, username, password, 'kindergarten', tHash, sHash);
      if (r) return jsonOk(r);
    }

    return jsonErr('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
  } catch (e) {
    return jsonErr('로그인 처리 중 오류: ' + (e instanceof Error ? e.message : String(e)), 500);
  }
}
