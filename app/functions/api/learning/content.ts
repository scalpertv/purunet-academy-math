// Cloudflare D1에 과목별 학습 콘텐츠 카탈로그를 분리 저장하고 읽는 Pages Function.
type D1Value = string | number | null;

interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

interface Env {
  LEARNING_DB?: D1Database;
}

type JsonRecord = Record<string, unknown>;

interface LearningContentCloudSnapshot {
  catalogRecords: JsonRecord[];
  unitRecords: JsonRecord[];
  topicRecords: JsonRecord[];
  syncedAt?: string;
}

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

function requireDb(env: Env) {
  if (!env.LEARNING_DB) throw new Error("Cloudflare D1 LEARNING_DB binding이 설정되지 않았습니다.");
  return env.LEARNING_DB;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parsePayloadRow(row: { payload: string }) {
  return JSON.parse(row.payload) as JsonRecord;
}

async function readPayloadRows(db: D1Database, table: string, orderColumn: string) {
  const rows = await db.prepare(`SELECT payload FROM ${table} ORDER BY ${orderColumn}`).all<{ payload: string }>();
  return (rows.results ?? []).map(parsePayloadRow);
}

async function readContentSnapshot(db: D1Database): Promise<LearningContentCloudSnapshot> {
  const [catalogRecords, unitRecords, topicRecords] = await Promise.all([
    readPayloadRows(db, "learning_content_databases", "id"),
    readPayloadRows(db, "learning_content_units", "order_index"),
    readPayloadRows(db, "learning_content_topics", "order_index"),
  ]);
  return {
    catalogRecords,
    unitRecords,
    topicRecords,
    syncedAt: new Date().toISOString(),
  };
}

function batchCatalogs(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO learning_content_databases (
           id, subject, school_level, category, publisher, title, description,
           created_at, updated_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           subject = excluded.subject,
           school_level = excluded.school_level,
           category = excluded.category,
           publisher = excluded.publisher,
           title = excluded.title,
           description = excluded.description,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.subject, "math"),
        asString(record.schoolLevel, "elementary"),
        asString(record.category, "operation"),
        typeof record.publisher === "string" ? record.publisher : null,
        asString(record.title, "학습 콘텐츠 DB"),
        typeof record.description === "string" ? record.description : null,
        asString(record.createdAt, new Date().toISOString()),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

function batchUnits(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO learning_content_units (
           id, database_id, unit_key, subject, school_level, grade_label,
           course_label, title, order_index, updated_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           database_id = excluded.database_id,
           unit_key = excluded.unit_key,
           subject = excluded.subject,
           school_level = excluded.school_level,
           grade_label = excluded.grade_label,
           course_label = excluded.course_label,
           title = excluded.title,
           order_index = excluded.order_index,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.databaseId, "elementary-math"),
        asString(record.unitKey, asString(record.id)),
        asString(record.subject, "math"),
        asString(record.schoolLevel, "elementary"),
        typeof record.gradeLabel === "string" ? record.gradeLabel : null,
        typeof record.course === "string" ? record.course : null,
        asString(record.title, "단원"),
        asNumber(record.order),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

function batchTopics(db: D1Database, records: JsonRecord[]) {
  return records.map((record) =>
    db
      .prepare(
        `INSERT INTO learning_content_topics (
           id, database_id, unit_id, topic_key, learning_level, learning_area,
           title, order_index, updated_at, payload
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           database_id = excluded.database_id,
           unit_id = excluded.unit_id,
           topic_key = excluded.topic_key,
           learning_level = excluded.learning_level,
           learning_area = excluded.learning_area,
           title = excluded.title,
           order_index = excluded.order_index,
           updated_at = excluded.updated_at,
           payload = excluded.payload`,
      )
      .bind(
        asString(record.id),
        asString(record.databaseId, "elementary-math"),
        asString(record.unitId),
        asString(record.topicId, asString(record.id)),
        typeof record.learningLevel === "string" ? record.learningLevel : null,
        typeof record.learningArea === "string" ? record.learningArea : null,
        asString(record.title, "유형"),
        asNumber(record.order),
        asString(record.updatedAt, new Date().toISOString()),
        JSON.stringify(record),
      ),
  );
}

async function writeContentSnapshot(db: D1Database, snapshot: LearningContentCloudSnapshot) {
  const statements = [
    ...batchCatalogs(db, snapshot.catalogRecords ?? []),
    ...batchUnits(db, snapshot.unitRecords ?? []),
    ...batchTopics(db, snapshot.topicRecords ?? []),
  ];
  if (statements.length) await db.batch(statements);
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    return jsonResponse(await readContentSnapshot(requireDb(env)));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "학습 콘텐츠 DB를 읽지 못했습니다." }, 500);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  if (!sameOriginAllowed(request)) return jsonResponse({ error: "같은 Cloudflare Pages origin에서만 저장할 수 있습니다." }, 403);
  try {
    const snapshot = (await request.json()) as LearningContentCloudSnapshot;
    await writeContentSnapshot(requireDb(env), snapshot);
    return jsonResponse({ ok: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "학습 콘텐츠 DB에 저장하지 못했습니다." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}
