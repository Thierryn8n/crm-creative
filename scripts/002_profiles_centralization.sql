-- SQL Migration: Profiles Centralization
-- This script ensures a 'profiles' table exists and links all other tables to it.

-- 1. Rename user_profiles to profiles if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        ALTER TABLE public.user_profiles RENAME TO profiles;
    END IF;
END $$;

-- 2. Ensure profiles table has the correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url TEXT,
    indeed_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    behance_url TEXT,
    resume_text TEXT,
    skills TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 0,
    specialties TEXT[] DEFAULT '{}',
    preferred_work_types TEXT[] DEFAULT '{}',
    hourly_rate NUMERIC(10,2),
    daily_rate NUMERIC(10,2),
    availability VARCHAR(50) DEFAULT 'available',
    bio TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.1. Ensure user_id column and FK exist even if profiles table already existed
DO $$
BEGIN
    -- Add user_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID UNIQUE;
    END IF;

    -- Ensure FK from profiles.user_id -> auth.users(id) exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON kcu.constraint_name = tc.constraint_name 
         AND kcu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = 'profiles' 
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Ensure uniqueness on user_id
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);
END $$;

-- 3. Add profile_id column to all other tables
DO $$
DECLARE
    t TEXT;
    tables_to_link TEXT[] := ARRAY[
        'user_resumes', 
        'clients', 
        'interactions', 
        'email_templates', 
        'sent_emails', 
        'portfolio_cache', 
        'ai_searches', 
        'potential_clients', 
        'client_labels', 
        'portfolio_items', 
        'approved_companies', 
        'negotiation_history', 
        'ai_insights', 
        'ai_search_memory', 
        'kanban_boards', 
        'kanban_columns', 
        'kanban_cards',
        'company_analysis',
        'user_skills_matches',
        'ai_analysis_versions',
        'negotiations'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_link LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- Add profile_id if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'profile_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE', t);
            END IF;
        END IF;
    END LOOP;

    -- Add kanban_order to company_analysis if it doesn't exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_analysis') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_analysis' AND column_name = 'kanban_order') THEN
            ALTER TABLE public.company_analysis ADD COLUMN kanban_order INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- 4. Enable RLS and create policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can manage their own profile') THEN
        CREATE POLICY "Users can manage their own profile" ON public.profiles
            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Enable RLS and create policies for all linked tables
DO $$
DECLARE
    t TEXT;
    policy_exists BOOLEAN;
    tables_to_link TEXT[] := ARRAY[
        'user_resumes', 
        'clients', 
        'interactions', 
        'email_templates', 
        'sent_emails', 
        'portfolio_cache', 
        'ai_searches', 
        'potential_clients', 
        'client_labels', 
        'portfolio_items', 
        'approved_companies', 
        'negotiation_history', 
        'ai_insights', 
        'ai_search_memory', 
        'kanban_boards', 
        'kanban_columns', 
        'kanban_cards',
        'company_analysis',
        'user_skills_matches',
        'ai_analysis_versions',
        'negotiations'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_link LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- Drop existing permissive policy if it exists
            EXECUTE format('DROP POLICY IF EXISTS "Enable all access for all users" ON public.%I', t);
            
            -- Check if our custom policy already exists
            SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'Users can manage their own data') INTO policy_exists;
            
            IF NOT policy_exists THEN
                EXECUTE format('
                    CREATE POLICY "Users can manage their own data" ON public.%I
                    FOR ALL USING (
                        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
                    ) WITH CHECK (
                        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
                    )', t);
            END IF;
        END IF;
    END LOOP;
END $$;
