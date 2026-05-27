-- 관리자 root 운영과 과목별 학습 콘텐츠 분리 저장소를 추가한다.
CREATE TABLE IF NOT EXISTS learning_assignments (
  id TEXT PRIMARY KEY,
  assignment_type TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_content_databases (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  school_level TEXT NOT NULL,
  category TEXT NOT NULL,
  publisher TEXT,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_content_units (
  id TEXT PRIMARY KEY,
  database_id TEXT NOT NULL,
  unit_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  school_level TEXT NOT NULL,
  grade_label TEXT,
  course_label TEXT,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_content_topics (
  id TEXT PRIMARY KEY,
  database_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  topic_key TEXT NOT NULL,
  learning_level TEXT,
  learning_area TEXT,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_content_items (
  id TEXT PRIMARY KEY,
  database_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  difficulty TEXT,
  publisher TEXT,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher_status ON learning_assignments (teacher_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_class_status ON learning_assignments (class_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_student_status ON learning_assignments (student_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_learner_updated ON learning_assignments (learner_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_db_subject_level ON learning_content_databases (subject, school_level, category);
CREATE INDEX IF NOT EXISTS idx_content_units_database_order ON learning_content_units (database_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_units_level_subject ON learning_content_units (school_level, subject, grade_label);
CREATE INDEX IF NOT EXISTS idx_content_topics_database_order ON learning_content_topics (database_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_topics_unit_order ON learning_content_topics (unit_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_topics_level_area ON learning_content_topics (learning_level, learning_area);
CREATE INDEX IF NOT EXISTS idx_content_items_topic ON learning_content_items (topic_id, updated_at DESC);
