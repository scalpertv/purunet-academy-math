-- Cloudflare D1 학습 계정과 풀이 기록 서버 저장소를 만든다.
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  auth_provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  google_sub TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  teacher_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  can_login INTEGER NOT NULL,
  can_study INTEGER NOT NULL,
  can_view_learning_data INTEGER NOT NULL,
  can_manage_roster INTEGER NOT NULL,
  blocked_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  can_login INTEGER NOT NULL,
  can_study INTEGER NOT NULL,
  can_view_learning_data INTEGER NOT NULL,
  can_manage_roster INTEGER NOT NULL,
  blocked_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_attempts (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id TEXT,
  class_id TEXT,
  learning_level TEXT,
  learning_area TEXT,
  unit_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  ok INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_progress_overrides (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  learner_id TEXT NOT NULL,
  attempted INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_security_alerts (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  account_id TEXT,
  username TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  created_at TEXT NOT NULL,
  acknowledged_at TEXT,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  class_id TEXT,
  student_id TEXT,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students (class_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON students (teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_learner ON students (learner_id);
CREATE INDEX IF NOT EXISTS idx_teacher_accounts_teacher ON teacher_accounts (teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_accounts_student ON student_accounts (student_id);
CREATE INDEX IF NOT EXISTS idx_student_accounts_learner ON student_accounts (learner_id);
CREATE INDEX IF NOT EXISTS idx_attempts_learner_created ON learning_attempts (learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_class_created ON learning_attempts (class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_teacher_created ON learning_attempts (teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_topic ON learning_attempts (topic_id, ok);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON learning_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON learning_security_alerts (created_at DESC);
