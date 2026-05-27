// Cloudflare Pages Functions에서 영어 학습 기록을 D1 DB와 동기화한다.
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const DEFAULT_LEARNER_ID = "local-demo";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function timestamp(value) {
  return cleanText(value, new Date().toISOString());
}

function requireDb(env) {
  if (!env.ENGLISH_LEARNING_DB) {
    throw new Error("ENGLISH_LEARNING_DB binding is not configured.");
  }
  return env.ENGLISH_LEARNING_DB;
}

async function countTable(db, tableName) {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).first();
  return Number(row?.count || 0);
}

async function getCounts(db) {
  return {
    events: await countTable(db, "learning_events"),
    portfolios: await countTable(db, "portfolios"),
    reflections: await countTable(db, "reflections"),
    words: await countTable(db, "word_mastery"),
    grammar: await countTable(db, "grammar_mastery"),
    snapshots: await countTable(db, "progress_snapshots")
  };
}

function mapMasteryRows(rows, idKey) {
  return rows.reduce((result, row) => {
    result[row[idKey]] = {
      attempts: row.attempts,
      correct: row.correct,
      production: row.production,
      nextReviewHint: row.next_review_hint || "",
      lastReviewedAt: row.last_reviewed_at || "",
      lastTransformAt: row.last_transform_at || "",
      lastProductionAt: row.last_production_at || "",
      updatedAt: row.updated_at
    };
    return result;
  }, {});
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: JSON_HEADERS
  });
}

export async function onRequestGet({ env, request }) {
  try {
    const db = requireDb(env);
    const url = new URL(request.url);
    const learnerId = cleanText(url.searchParams.get("learnerId"), DEFAULT_LEARNER_ID);

    const [events, portfolios, reflections, wordRows, grammarRows, snapshot, counts] = await Promise.all([
      db
        .prepare(
          "SELECT id, track_id AS trackId, track_title AS trackTitle, stage_id AS stageId, evidence_type AS evidenceType, note, score, created_at AS at FROM learning_events WHERE learner_id = ? ORDER BY created_at DESC LIMIT 40"
        )
        .bind(learnerId)
        .all(),
      db
        .prepare(
          "SELECT id, track_id AS trackId, track_title AS trackTitle, kind, text, created_at AS at FROM portfolios WHERE learner_id = ? ORDER BY created_at DESC LIMIT 30"
        )
        .bind(learnerId)
        .all(),
      db
        .prepare(
          "SELECT id, track_id AS trackId, track_title AS trackTitle, text, created_at AS at FROM reflections WHERE learner_id = ? ORDER BY created_at DESC LIMIT 30"
        )
        .bind(learnerId)
        .all(),
      db
        .prepare("SELECT * FROM word_mastery WHERE learner_id = ? ORDER BY updated_at DESC LIMIT 200")
        .bind(learnerId)
        .all(),
      db
        .prepare("SELECT * FROM grammar_mastery WHERE learner_id = ? ORDER BY updated_at DESC LIMIT 200")
        .bind(learnerId)
        .all(),
      db.prepare("SELECT payload_json AS payloadJson, updated_at AS updatedAt FROM progress_snapshots WHERE learner_id = ?").bind(learnerId).first(),
      getCounts(db)
    ]);

    return json({
      ok: true,
      source: "cloudflare-d1",
      learnerId,
      counts,
      progress: {
        evidence: events.results || [],
        portfolio: portfolios.results || [],
        reflections: reflections.results || [],
        wordMastery: mapMasteryRows(wordRows.results || [], "word_id"),
        grammarMastery: mapMasteryRows(grammarRows.results || [], "grammar_id")
      },
      snapshot
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env);
    const body = asObject(await request.json());
    const progress = asObject(body.progress);
    const learnerId = cleanText(body.learnerId, DEFAULT_LEARNER_ID);
    const now = new Date().toISOString();
    const statements = [];

    statements.push(
      db
        .prepare(
          "INSERT INTO progress_snapshots (learner_id, payload_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(learner_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at"
        )
        .bind(learnerId, JSON.stringify(progress), now)
    );

    for (const item of asArray(progress.evidence)) {
      statements.push(
        db
          .prepare(
            "INSERT OR REPLACE INTO learning_events (id, learner_id, track_id, track_title, stage_id, evidence_type, note, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            cleanText(item.id, crypto.randomUUID()),
            learnerId,
            cleanText(item.trackId, "unknown-track"),
            cleanText(item.trackTitle, "영어 학습"),
            cleanText(item.stageId, "practice"),
            cleanText(item.evidenceType, "activity"),
            cleanText(item.note, ""),
            cleanNumber(item.score, 0),
            timestamp(item.at)
          )
      );
    }

    for (const item of asArray(progress.portfolio)) {
      statements.push(
        db
          .prepare(
            "INSERT OR REPLACE INTO portfolios (id, learner_id, track_id, track_title, kind, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            cleanText(item.id, crypto.randomUUID()),
            learnerId,
            cleanText(item.trackId, "unknown-track"),
            cleanText(item.trackTitle, "영어 학습"),
            cleanText(item.kind, "portfolio"),
            cleanText(item.text, ""),
            timestamp(item.at)
          )
      );
    }

    for (const item of asArray(progress.reflections)) {
      statements.push(
        db
          .prepare("INSERT OR REPLACE INTO reflections (id, learner_id, track_id, track_title, text, created_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(
            cleanText(item.id, crypto.randomUUID()),
            learnerId,
            cleanText(item.trackId, "unknown-track"),
            cleanText(item.trackTitle, "영어 학습"),
            cleanText(item.text, ""),
            timestamp(item.at)
          )
      );
    }

    for (const [wordId, item] of Object.entries(asObject(progress.wordMastery))) {
      const mastery = asObject(item);
      statements.push(
        db
          .prepare(
            "INSERT INTO word_mastery (learner_id, word_id, attempts, correct, production, next_review_hint, last_reviewed_at, last_production_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(learner_id, word_id) DO UPDATE SET attempts = excluded.attempts, correct = excluded.correct, production = excluded.production, next_review_hint = excluded.next_review_hint, last_reviewed_at = excluded.last_reviewed_at, last_production_at = excluded.last_production_at, updated_at = excluded.updated_at"
          )
          .bind(
            learnerId,
            wordId,
            cleanNumber(mastery.attempts, 0),
            cleanNumber(mastery.correct, 0),
            cleanNumber(mastery.production, 0),
            cleanText(mastery.nextReviewHint, ""),
            cleanText(mastery.lastReviewedAt, ""),
            cleanText(mastery.lastProductionAt, ""),
            timestamp(mastery.updatedAt || mastery.lastReviewedAt || mastery.lastProductionAt || now)
          )
      );
    }

    for (const [grammarId, item] of Object.entries(asObject(progress.grammarMastery))) {
      const mastery = asObject(item);
      statements.push(
        db
          .prepare(
            "INSERT INTO grammar_mastery (learner_id, grammar_id, attempts, correct, production, next_review_hint, last_reviewed_at, last_transform_at, last_production_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(learner_id, grammar_id) DO UPDATE SET attempts = excluded.attempts, correct = excluded.correct, production = excluded.production, next_review_hint = excluded.next_review_hint, last_reviewed_at = excluded.last_reviewed_at, last_transform_at = excluded.last_transform_at, last_production_at = excluded.last_production_at, updated_at = excluded.updated_at"
          )
          .bind(
            learnerId,
            grammarId,
            cleanNumber(mastery.attempts, 0),
            cleanNumber(mastery.correct, 0),
            cleanNumber(mastery.production, 0),
            cleanText(mastery.nextReviewHint, ""),
            cleanText(mastery.lastReviewedAt, ""),
            cleanText(mastery.lastTransformAt, ""),
            cleanText(mastery.lastProductionAt, ""),
            timestamp(mastery.updatedAt || mastery.lastReviewedAt || mastery.lastTransformAt || mastery.lastProductionAt || now)
          )
      );
    }

    if (statements.length) {
      await db.batch(statements);
    }

    return json({
      ok: true,
      syncedAt: now,
      learnerId,
      insertedStatements: statements.length,
      counts: await getCounts(db)
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
}
