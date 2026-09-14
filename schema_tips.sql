CREATE TABLE IF NOT EXISTS public.tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL, -- 'single', 'maestro', 'odd'
    odds DECIMAL(10, 2),
    analysis TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'won', 'lost', 'void', 'postponed'
    publish_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tip_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tip_id UUID REFERENCES public.tips(id) ON DELETE CASCADE,
    match_id VARCHAR(100), -- from API
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    competition VARCHAR(255),
    home_logo TEXT,
    away_logo TEXT,
    kickoff TIMESTAMPTZ,
    prediction VARCHAR(255) NOT NULL,
    market VARCHAR(255)
);

-- RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on tips" ON public.tips FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on tip_matches" ON public.tip_matches FOR SELECT USING (true);

CREATE POLICY "Enable insert/update/delete for admins on tips" ON public.tips FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Enable insert/update/delete for admins on tip_matches" ON public.tip_matches FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
