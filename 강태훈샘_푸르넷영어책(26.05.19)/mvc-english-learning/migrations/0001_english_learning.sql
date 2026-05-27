-- 영어 MVC 학습 프로그램의 Cloudflare D1 서버 DB 스키마
CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL DEFAULT 'local-demo',
  track_id TEXT NOT NULL,
  track_title TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  note TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL DEFAULT 'local-demo',
  track_id TEXT NOT NULL,
  track_title TEXT NOT NULL,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL DEFAULT 'local-demo',
  track_id TEXT NOT NULL,
  track_title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS word_mastery (
  learner_id TEXT NOT NULL DEFAULT 'local-demo',
  word_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  production INTEGER NOT NULL DEFAULT 0,
  next_review_hint TEXT,
  last_reviewed_at TEXT,
  last_production_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (learner_id, word_id)
);

CREATE TABLE IF NOT EXISTS grammar_mastery (
  learner_id TEXT NOT NULL DEFAULT 'local-demo',
  grammar_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  production INTEGER NOT NULL DEFAULT 0,
  next_review_hint TEXT,
  last_reviewed_at TEXT,
  last_transform_at TEXT,
  last_production_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (learner_id, grammar_id)
);

CREATE TABLE IF NOT EXISTS progress_snapshots (
  learner_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_events_created_at ON learning_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_events_learner ON learning_events(learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_learner ON portfolios(learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_learner ON reflections(learner_id, created_at DESC);
