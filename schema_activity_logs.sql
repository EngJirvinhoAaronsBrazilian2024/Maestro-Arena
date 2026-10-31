-- ============================================================
-- MAESTRO ARENA: REAL-TIME ACTIVITY LOGS TABLE (INSFORGE POSTGRES)
-- ============================================================
-- Run this script in your InsForge SQL Editor (https://gci83gu5.us-east.insforge.app)
-- to create the activity_logs table for tracking real user actions.
-- ============================================================

-- 1. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT NOT NULL DEFAULT 'visitor@maestroarena.com',
    user_name TEXT NOT NULL DEFAULT 'App Visitor',
    action TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'engagement',
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip TEXT DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT 'Maestro Web/Mobile',
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 2. Create indexes for fast querying and filtering in Admin Panel
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
    ON public.activity_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_category 
    ON public.activity_logs (category);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email 
    ON public.activity_logs (user_email);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
    ON public.activity_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action 
    ON public.activity_logs (action);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow reading logs (Admin panel & backend service)
DROP POLICY IF EXISTS "Allow select activity logs" ON public.activity_logs;
CREATE POLICY "Allow select activity logs"
    ON public.activity_logs
    FOR SELECT
    USING (true);

-- Allow inserting activity logs from active users and backend
DROP POLICY IF EXISTS "Allow insert activity logs" ON public.activity_logs;
CREATE POLICY "Allow insert activity logs"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (true);

-- 5. Enable Realtime broadcasting (optional for live WebSocket feeds)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'insforge_realtime'
    ) THEN
        ALTER PUBLICATION insforge_realtime ADD TABLE public.activity_logs;
    END IF;
END $$;

