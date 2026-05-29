-- 타 사이트(학원·유치원)에서 연산반으로 SSO 로그인할 때 사용하는 단기 토큰 저장 테이블
CREATE TABLE IF NOT EXISTS sso_tokens (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  source TEXT NOT NULL,
  user_id TEXT NOT NULL,
  learner_id TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sso_tokens_expires ON sso_tokens (expires_at);
