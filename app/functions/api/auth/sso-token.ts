// 타 사이트에서 연산반으로 자동 로그인(SSO)하기 위한 단기 토큰을 발급하는 엔드포인트

interface D1Row { [key: string]: unknown }
interface D1Statement {
  bind(...values: (string | number | null)[]): D1Statement;
  first<T = D1Row>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database { prepare(query: string): D1Statement }
interface Env {
  LEARNING_DB?: D1Database;
  ACADEMY_DB?: D1Database;
  KINDERGARTEN_DB?: D1Database;
}

const ALLOWED_ORIGINS = [
  'https://dreamer-ai-academy.pages.dev',
  'https://little-dreamer-ai.pages.dev',
  'https://purunet-academy.pages.dev',
  'https://little-purunet.pages.dev',
];
const TOKEN_TTL_MS = 5 * 60 * 1000;

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function normalizeUsername(v: string) { return v.trim().replace(/\s+/g, '').toLowerCase(); }

async function sha256Hash(role: string, username: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${role}:${username}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return 'sha256-' + Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

type VerifyResult = { role: 'teacher' | 'student'; displayName: string; userId: string; learnerId?: string; passwordHash: string };

async function checkLearningDb(db: D1Database, username: string, tHash: string, sHash: string): Promise<VerifyResult | null> {
  const tRow = await db.prepare(
    'SELECT display_name, teacher_id, can_login, payload FROM teacher_accounts WHERE username = ? LIMIT 1'
  ).bind(username).first<{ display_name: string; teacher_id: string; can_login: number; payload: string }>();
  if (tRow && tRow.can_login) {
    let ph = '';
    try { ph = (JSON.parse(tRow.payload) as { passwordHash?: string }).passwordHash ?? ''; } catch { ph = ''; }
    if (ph === tHash) return { role: 'teacher', displayName: tRow.display_name, userId: tRow.teacher_id, passwordHash: tHash };
  }
  const sRow = await db.prepare(
    'SELECT display_name, student_id, learner_id, can_login, payload FROM student_accounts WHERE username = ? LIMIT 1'
  ).bind(username).first<{ display_name: string; student_id: string; learner_id: string; can_login: number; payload: string }>();
  if (sRow && sRow.can_login) {
    let ph = '';
    try { ph = (JSON.parse(sRow.payload) as { passwordHash?: string }).passwordHash ?? ''; } catch { ph = ''; }
    if (ph === sHash) return { role: 'student', displayName: sRow.display_name, userId: sRow.student_id, learnerId: sRow.learner_id, passwordHash: sHash };
  }
  return null;
}

async function checkExternalDb(db: D1Database, username: string, password: string, tHash: string, sHash: string): Promise<VerifyResult | null> {
  const tRow = await db.prepare(
    'SELECT id, name, payload FROM teachers WHERE username = ? LIMIT 1'
  ).bind(username).first<{ id: string; name: string; payload: string }>();
  if (tRow) {
    let pw = '';
    try { pw = (JSON.parse(tRow.payload) as { password?: string }).password ?? ''; } catch { pw = ''; }
    if (pw === password) return { role: 'teacher', displayName: tRow.name, userId: tRow.id, passwordHash: tHash };
  }
  const sRow = await db.prepare(
    'SELECT id, name, payload FROM students WHERE username = ? LIMIT 1'
  ).bind(username).first<{ id: string; name: string; payload: string }>();
  if (sRow) {
    let pw = '';
    try { pw = (JSON.parse(sRow.payload) as { password?: string }).password ?? ''; } catch { pw = ''; }
    if (pw === password) return { role: 'student', displayName: sRow.name, userId: sRow.id, passwordHash: sHash };
  }
  return null;
}

export function onRequestOptions(context: { request: Request }): Response {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const origin = context.request.headers.get('Origin');
  const headers = { ...corsHeaders(origin), 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

  try {
    const body = await context.request.json() as { username?: string; password?: string; source?: string };
    if (!body.username || !body.password) {
      return new Response(JSON.stringify({ ok: false, error: '아이디와 비밀번호를 입력해 주세요.' }), { status: 422, headers });
    }

    const username = normalizeUsername(body.username);
    const password = String(body.password);
    const [tHash, sHash] = await Promise.all([sha256Hash('teacher', username, password), sha256Hash('student', username, password)]);

    let verified: VerifyResult | null = null;
    let source = body.source ?? 'unknown';

    if (context.env.LEARNING_DB) {
      verified = await checkLearningDb(context.env.LEARNING_DB, username, tHash, sHash);
      if (verified) source = 'learning';
    }
    if (!verified && context.env.ACADEMY_DB) {
      verified = await checkExternalDb(context.env.ACADEMY_DB, username, password, tHash, sHash);
      if (verified) source = 'academy';
    }
    if (!verified && context.env.KINDERGARTEN_DB) {
      verified = await checkExternalDb(context.env.KINDERGARTEN_DB, username, password, tHash, sHash);
      if (verified) source = 'kindergarten';
    }

    if (!verified) {
      return new Response(JSON.stringify({ ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }), { status: 401, headers });
    }

    if (!context.env.LEARNING_DB) {
      return new Response(JSON.stringify({ ok: false, error: 'DB 설정 오류' }), { status: 500, headers });
    }

    const token = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    await context.env.LEARNING_DB.prepare(
      'INSERT INTO sso_tokens (token, username, role, display_name, password_hash, source, user_id, learner_id, expires_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).bind(token, username, verified.role, verified.displayName, verified.passwordHash, source, verified.userId, verified.learnerId ?? null, expiresAt, now).run();

    return new Response(JSON.stringify({ ok: true, token }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: '토큰 발급 오류: ' + (e instanceof Error ? e.message : String(e)) }), { status: 500, headers });
  }
}
