-- ==============================================================================
-- DriveOps-AI: Supabase Database Schema & Foundation Migration
-- Target Project: Car Manufacturing Intelligence
-- ==============================================================================
-- IMPORTANT GUIDELINES FOLLOWED:
-- 1. Non-destructive: Does NOT drop or recreate existing tables.
-- 2. Preserves existing `public.alerts` table and its columns.
-- 3. Enables Row Level Security (RLS) safely with appropriate policies.
-- 4. Manufacturing telemetry is facility-shared data for authenticated operators.
-- 5. User profiles are linked to auth.users.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'Operations Lead',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- Users can view their own profile and other operators in their facility
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can view profiles'
    ) THEN
        CREATE POLICY "Authenticated users can view profiles"
            ON public.profiles FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
            ON public.profiles FOR UPDATE
            TO authenticated
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
            ON public.profiles FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Automatic profile creation trigger when a user signs up through Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'Operations Lead'),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------------------------
-- 2. EXISTING ALERTS TABLE (public.alerts) - PRESERVED
-- ------------------------------------------------------------------------------
-- Notice: If public.alerts already exists, CREATE TABLE IF NOT EXISTS will safely no-op.
CREATE TABLE IF NOT EXISTS public.alerts (
    alert_id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    production_line TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    status TEXT DEFAULT 'open'
);

-- Enable RLS on alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Alerts Policies:
-- Manufacturing alerts are facility-shared: all authenticated plant operators can view alerts
-- and update alert status (e.g. acknowledge an alert).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Authenticated operators can view alerts'
    ) THEN
        CREATE POLICY "Authenticated operators can view alerts"
            ON public.alerts FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Authenticated operators can update alert status'
    ) THEN
        CREATE POLICY "Authenticated operators can update alert status"
            ON public.alerts FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Authenticated operators can insert alerts'
    ) THEN
        CREATE POLICY "Authenticated operators can insert alerts"
            ON public.alerts FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

-- Optional initial seed for public.alerts (only inserted if table is empty)
INSERT INTO public.alerts (alert_id, machine_id, production_line, timestamp, alert_type, severity, message, recommended_action, status)
SELECT 'ALT-482', 'M-312', 'Final Assembly', '8 min ago', 'Station stopped unexpectedly', 'Critical', 'Motor temperature reached 94°C before the station stopped. Similar readings appeared twice in the last hour.', 'Inspect motor cooling and hold the station for maintenance clearance.', 'open'
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE alert_id = 'ALT-482');

INSERT INTO public.alerts (alert_id, machine_id, production_line, timestamp, alert_type, severity, message, recommended_action, status)
SELECT 'ALT-479', 'M-204', 'Body Line A', '24 min ago', 'Cycle time above target', 'High', 'Average cycle time is 42.6 seconds, 6.5% above the line target over the last 90 minutes.', 'Check hydraulic pressure and review the last tooling change.', 'open'
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE alert_id = 'ALT-479');

INSERT INTO public.alerts (alert_id, machine_id, production_line, timestamp, alert_type, severity, message, recommended_action, status)
SELECT 'ALT-477', 'M-074', 'Body Line B', '41 min ago', 'Vibration trend rising', 'Medium', 'Vibration is 18% above its seven-day baseline, but the drive is still running within limits.', 'Schedule a bearing inspection during the next planned pause.', 'open'
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE alert_id = 'ALT-477');

INSERT INTO public.alerts (alert_id, machine_id, production_line, timestamp, alert_type, severity, message, recommended_action, status)
SELECT 'ALT-468', 'M-052', 'Final Assembly', '2h ago', 'Maintenance window active', 'Low', 'The machine is operating at reduced pace while a planned service task is in progress.', 'Confirm the service checklist before returning to standard pace.', 'acknowledged'
WHERE NOT EXISTS (SELECT 1 FROM public.alerts WHERE alert_id = 'ALT-468');


-- ------------------------------------------------------------------------------
-- 3. MACHINES TABLE (Proposed for next phase data migration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.machines (
    machine_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    production_line TEXT NOT NULL,
    machine_status TEXT NOT NULL DEFAULT 'Running', -- 'Running' | 'Attention' | 'Down' | 'Maintenance'
    overall_status TEXT NOT NULL DEFAULT 'Healthy', -- 'Healthy' | 'Watch' | 'At risk'
    utilization NUMERIC(5, 2) DEFAULT 0.0,
    quality_rate NUMERIC(5, 2) DEFAULT 100.0,
    cycle_time NUMERIC(6, 2) DEFAULT 0.0,
    target_cycle_time NUMERIC(6, 2) DEFAULT 0.0,
    runtime TEXT,
    last_service TEXT,
    next_service TEXT,
    detected_issues TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on machines
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'machines' AND policyname = 'Authenticated operators can view machines'
    ) THEN
        CREATE POLICY "Authenticated operators can view machines"
            ON public.machines FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;
