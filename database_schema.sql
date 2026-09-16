-- Users Table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  role text DEFAULT 'user',
  created_at bigint DEFAULT extract(epoch from now()) * 1000
);

-- Quiz Questions Table
CREATE TABLE public.quiz_questions (
  id text PRIMARY KEY,
  question text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  options jsonb NOT NULL,
  correctAnswer text NOT NULL,
  explanation text,
  hint text,
  image text,
  source text,
  status text DEFAULT 'PUBLISHED',
  created_at bigint DEFAULT extract(epoch from now()) * 1000
);

-- Quiz Results Table
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  score int DEFAULT 0,
  total int DEFAULT 0,
  category text,
  difficulty text,
  completed_at bigint DEFAULT extract(epoch from now()) * 1000
);

-- Quiz Stats Table
CREATE TABLE public.quiz_stats (
  user_id text PRIMARY KEY,
  quizzes_taken int DEFAULT 0,
  total_score int DEFAULT 0,
  correct_answers int DEFAULT 0,
  last_played_at bigint DEFAULT extract(epoch from now()) * 1000
);

-- Tips Table
CREATE TABLE public.tips (
  id text PRIMARY KEY,
  category text NOT NULL,
  matches jsonb NOT NULL,
  odds numeric,
  analysis text,
  status text NOT NULL,
  booking_code text,
  publish_date bigint NOT NULL,
  created_at bigint DEFAULT extract(epoch from now()) * 1000
);

-- H2H Matches Table
CREATE TABLE public.h2h_matches (
  id text PRIMARY KEY,
  player1Id text,
  player1Name text,
  player2Id text,
  player2Name text,
  category text,
  difficulty text,
  status text NOT NULL,
  questions jsonb NOT NULL,
  player1Score int DEFAULT 0,
  player1Time int DEFAULT 0,
  player2Score int DEFAULT 0,
  player2Time int DEFAULT 0,
  winnerId text,
  created_at bigint DEFAULT extract(epoch from now()) * 1000
);

-- Realtime Setup
alter publication insforge_realtime add table public.h2h_matches;
alter publication insforge_realtime add table public.tips;
alter publication insforge_realtime add table public.quiz_questions;
