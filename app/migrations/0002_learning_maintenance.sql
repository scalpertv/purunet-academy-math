-- Cloudflare D1 학습 데이터 유효성 검사와 보고서, 백업 기록 저장소를 보강한다.
CREATE TABLE IF NOT EXISTS learning_data_validations (
  id TEXT PRIMARY KEY,
  trigger_name TEXT NOT NULL,
  status TEXT NOT NULL,
  issue_count INTEGER NOT NULL,
  checked_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_periodic_reports (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  teacher_id TEXT,
  teacher_name TEXT,
  class_id TEXT,
  class_name TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_db_backups (
  id TEXT PRIMARY KEY,
  backup_kind TEXT NOT NULL,
  period_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  table_counts TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_progress_map_settings (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  learner_id TEXT NOT NULL,
  teacher_id TEXT,
  class_id TEXT,
  target_daily INTEGER,
  focus_title TEXT,
  teacher_memo TEXT,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_validations_checked ON learning_data_validations (checked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_student_period ON learning_periodic_reports (report_type, period_key, student_id);
CREATE INDEX IF NOT EXISTS idx_reports_teacher_period ON learning_periodic_reports (teacher_id, period_key DESC);
CREATE INDEX IF NOT EXISTS idx_reports_student_period ON learning_periodic_reports (student_id, period_key DESC);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON learning_periodic_reports (generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_created ON learning_db_backups (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_map_teacher ON student_progress_map_settings (teacher_id, updated_at DESC);
