CREATE TABLE quiz_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested INTEGER,
  generated INTEGER,
  validated INTEGER,
  rejected INTEGER,
  category TEXT,
  difficulty TEXT,
  competition TEXT,
  season TEXT,
  source TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at BIGINT,
  error TEXT
);
