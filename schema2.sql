CREATE TABLE h2h_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  player1 JSONB NOT NULL,
  player2 JSONB,
  winner_uid UUID
);

ALTER TABLE h2h_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read h2h_matches" ON h2h_matches FOR SELECT USING (true);
CREATE POLICY "Anyone can insert h2h_matches" ON h2h_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update h2h_matches" ON h2h_matches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete h2h_matches" ON h2h_matches FOR DELETE USING (true);

