-- Notifications Table
CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls Table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll Votes Table
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Seasons Table
CREATE TABLE IF NOT EXISTS quiz_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_seasons ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS Policies (Master Email Bypass)
-- ==========================================

-- Notifications
DROP POLICY IF EXISTS "Anyone can read notifications" ON app_notifications;
CREATE POLICY "Anyone can read notifications" ON app_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage notifications" ON app_notifications;
CREATE POLICY "Admins can manage notifications" ON app_notifications FOR ALL 
USING (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com');

-- Polls
DROP POLICY IF EXISTS "Anyone can read polls" ON polls;
CREATE POLICY "Anyone can read polls" ON polls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage polls" ON polls;
CREATE POLICY "Admins can manage polls" ON polls FOR ALL 
USING (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com');

-- Poll Votes
DROP POLICY IF EXISTS "Users can vote" ON poll_votes;
CREATE POLICY "Users can vote" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can see votes" ON poll_votes;
CREATE POLICY "Users can see votes" ON poll_votes FOR SELECT USING (true);

-- Feedback
DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view feedback" ON feedback;
CREATE POLICY "Admins can view feedback" ON feedback FOR SELECT 
USING (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com');

DROP POLICY IF EXISTS "Admins can manage feedback" ON feedback;
CREATE POLICY "Admins can manage feedback" ON feedback FOR UPDATE 
USING (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com');

-- Quiz Seasons
DROP POLICY IF EXISTS "Anyone can read quiz seasons" ON quiz_seasons;
CREATE POLICY "Anyone can read quiz seasons" ON quiz_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage quiz seasons" ON quiz_seasons;
CREATE POLICY "Admins can manage quiz seasons" ON quiz_seasons FOR ALL 
USING (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'kisakyearon72@gmail.com');
