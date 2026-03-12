import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    // Centralize Profiles
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
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
        `
      })
    } catch (e) {
      console.error('Error centralizing profiles:', e)
    }

    // Create clients table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            company_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'lead',
            priority VARCHAR(20) DEFAULT 'medium',
            website_url TEXT,
            linkedin_url TEXT,
            instagram_url TEXT,
            facebook_url TEXT,
            twitter_url TEXT,
            full_company_data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure columns exist if table already exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'profile_id') THEN
              ALTER TABLE public.clients ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'website_url') THEN
              ALTER TABLE public.clients ADD COLUMN website_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'linkedin_url') THEN
              ALTER TABLE public.clients ADD COLUMN linkedin_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'instagram_url') THEN
              ALTER TABLE public.clients ADD COLUMN instagram_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'facebook_url') THEN
              ALTER TABLE public.clients ADD COLUMN facebook_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'twitter_url') THEN
              ALTER TABLE public.clients ADD COLUMN twitter_url TEXT;
            END IF;
          END $$;

          -- Enable RLS
          ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {
      // Table might already exist, continue
    }

    // Create interactions table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            subject VARCHAR(255),
            content TEXT,
            direction VARCHAR(20) DEFAULT 'outbound',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure profile_id exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'profile_id') THEN
              ALTER TABLE public.interactions ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create email_templates table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.email_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure profile_id exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'profile_id') THEN
              ALTER TABLE public.email_templates ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create sent_emails table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.sent_emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            template_id UUID REFERENCES public.email_templates(id),
            to_email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'sent',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure profile_id exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sent_emails' AND column_name = 'profile_id') THEN
              ALTER TABLE public.sent_emails ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create portfolio_cache table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.portfolio_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            external_id VARCHAR(255),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            thumbnail_url TEXT,
            media_urls JSONB DEFAULT '[]'::jsonb,
            source_table VARCHAR(100),
            synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure profile_id exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_cache' AND column_name = 'profile_id') THEN
              ALTER TABLE public.portfolio_cache ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.portfolio_cache ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create ai_searches table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.ai_searches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            query TEXT NOT NULL,
            results JSONB,
            clients_added INTEGER DEFAULT 0,
            result_count INTEGER DEFAULT 5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure profile_id exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_searches' AND column_name = 'profile_id') THEN
              ALTER TABLE public.ai_searches ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.ai_searches ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create potential_clients table (leads before approval)
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.potential_clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            company_name VARCHAR(255) NOT NULL,
            contact_name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            whatsapp_link TEXT,
            website VARCHAR(255),
            linkedin_url VARCHAR(255),
            instagram_url VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(50),
            description TEXT,
            status VARCHAR(50) DEFAULT 'potential',
            labels JSONB DEFAULT '[]'::jsonb,
            ai_search_id UUID REFERENCES public.ai_searches(id),
            rejection_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(profile_id, company_name, email)
          );

          -- Ensure profile_id exists and unique constraint is updated
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'potential_clients' AND column_name = 'profile_id') THEN
              ALTER TABLE public.potential_clients ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.potential_clients ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create client_labels table (for custom labels)
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.client_labels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            color VARCHAR(7) DEFAULT '#6B7280',
            is_system BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure profile_id exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_labels' AND column_name = 'profile_id') THEN
              ALTER TABLE public.client_labels ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          ALTER TABLE public.client_labels ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch {}

    // Create portfolio_items table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.portfolio_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50),
            category VARCHAR(100),
            thumbnail_url TEXT,
            media_urls JSONB DEFAULT '[]'::jsonb,
            external_id VARCHAR(255),
            source_table VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Enable RLS
          ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating portfolio_items:', e)
    }

    // Create user_resumes table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_resumes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            type VARCHAR(50) DEFAULT 'resume',
            content TEXT,
            file_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(profile_id, type)
          );

          -- Enable RLS
          ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating user_resumes:', e)
    }

    // Create approved_companies table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.approved_companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            company_id UUID REFERENCES public.clients(id),
            company_name VARCHAR(255) NOT NULL,
            website_url TEXT,
            linkedin_url TEXT,
            instagram_url TEXT,
            facebook_url TEXT,
            twitter_url TEXT,
            full_company_data JSONB DEFAULT '{}'::jsonb,
            ai_analysis JSONB DEFAULT '{}'::jsonb,
            strategy_generated JSONB DEFAULT '{}'::jsonb,
            match_score INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'novo',
            negotiation_status VARCHAR(50) DEFAULT 'iniciado',
            priority VARCHAR(20) DEFAULT 'medium',
            negotiation_value DECIMAL(12,2),
            next_action_date TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            last_contact_date TIMESTAMP WITH TIME ZONE,
            first_contact_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(profile_id, company_id)
          );
          
          -- Ensure columns exist if table already exists
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approved_companies' AND column_name = 'website_url') THEN
              ALTER TABLE public.approved_companies ADD COLUMN website_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approved_companies' AND column_name = 'linkedin_url') THEN
              ALTER TABLE public.approved_companies ADD COLUMN linkedin_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approved_companies' AND column_name = 'instagram_url') THEN
              ALTER TABLE public.approved_companies ADD COLUMN instagram_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approved_companies' AND column_name = 'facebook_url') THEN
              ALTER TABLE public.approved_companies ADD COLUMN facebook_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approved_companies' AND column_name = 'twitter_url') THEN
              ALTER TABLE public.approved_companies ADD COLUMN twitter_url TEXT;
            END IF;
          END $$;
          
          ALTER TABLE public.approved_companies ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating approved_companies:', e)
    }

    // Create negotiation_history table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.negotiation_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            approved_company_id UUID REFERENCES public.approved_companies(id) ON DELETE CASCADE,
            profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            action_type VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            outcome VARCHAR(50),
            next_steps TEXT,
            contact_method VARCHAR(50),
            contact_person VARCHAR(100),
            value DECIMAL(12,2),
            expected_close_date TIMESTAMP WITH TIME ZONE,
            ai_analysis JSONB DEFAULT '{}'::jsonb,
            ai_recommendations JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          ALTER TABLE public.negotiation_history ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating negotiation_history:', e)
    }

    // Create ai_insights table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.ai_insights (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            approved_company_id UUID REFERENCES public.approved_companies(id) ON DELETE CASCADE,
            profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            insight_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            confidence_score INTEGER DEFAULT 0,
            context_data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating ai_insights:', e)
    }

    // Create ai_search_memory table (referenced in approved-companies/route.ts)
    try {
        await adminSupabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.ai_search_memory (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
              company_name VARCHAR(255) NOT NULL,
              status VARCHAR(50) DEFAULT 'discovered',
              feedback_notes TEXT,
              last_discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE public.ai_search_memory ENABLE ROW LEVEL SECURITY;
          `
        })
      } catch (e) {
        console.error('Error creating ai_search_memory:', e)
      }

    // Create company_analysis table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.company_analysis (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            company_name VARCHAR(255) NOT NULL,
            website_url TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            analysis_status VARCHAR(50) DEFAULT 'pending',
            kanban_order INTEGER DEFAULT 0,
            website_analysis JSONB DEFAULT '{}'::jsonb,
            social_media_presence JSONB DEFAULT '{}'::jsonb,
            ads_analysis JSONB DEFAULT '{}'::jsonb,
            market_analysis JSONB DEFAULT '{}'::jsonb,
            ai_strategy JSONB DEFAULT '{}'::jsonb,
            match_score INTEGER DEFAULT 0,
            related_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(profile_id, company_name)
          );

          -- Ensure columns exist
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_analysis' AND column_name = 'profile_id') THEN
              ALTER TABLE public.company_analysis ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_analysis' AND column_name = 'kanban_order') THEN
              ALTER TABLE public.company_analysis ADD COLUMN kanban_order INTEGER DEFAULT 0;
            END IF;
          END $$;

          ALTER TABLE public.company_analysis ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating company_analysis:', e)
    }

    // Create kanban_boards table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.kanban_boards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            board_type VARCHAR(50) DEFAULT 'sales',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(profile_id, name)
          );

          ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating kanban_boards:', e)
    }

    // Create kanban_columns table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.kanban_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            position INTEGER NOT NULL,
            color VARCHAR(50) DEFAULT '#e5e7eb',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(board_id, title)
          );

          ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating kanban_columns:', e)
    }

    // Create kanban_cards table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.kanban_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            column_id UUID REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
            approved_company_id UUID REFERENCES public.approved_companies(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority VARCHAR(50) DEFAULT 'medium',
            due_date DATE,
            position INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating kanban_cards:', e)
    }

    // Create negotiations table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.negotiations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            approved_company_id UUID REFERENCES public.approved_companies(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'iniciado',
            value DECIMAL(12,2),
            expected_close_date DATE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating negotiations:', e)
    }

    // Create user_skills_matches table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_skills_matches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            company_analysis_id UUID REFERENCES public.company_analysis(id) ON DELETE CASCADE,
            match_score INTEGER,
            skills_found TEXT[],
            skills_missing TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE public.user_skills_matches ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating user_skills_matches:', e)
    }

    // Create ai_analysis_versions table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.ai_analysis_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            company_analysis_id UUID REFERENCES public.company_analysis(id) ON DELETE CASCADE,
            version_number INTEGER NOT NULL,
            analysis_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE public.ai_analysis_versions ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error creating ai_analysis_versions:', e)
    }

    // Ensure portfolio_items has profile_id and correct policies
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          -- Add profile_id to portfolio_items if it doesn't exist
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'profile_id') THEN
              ALTER TABLE public.portfolio_items ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            END IF;
          END $$;

          -- Enable RLS
          ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.error('Error updating portfolio_items:', e)
    }

    // Create 'resumes' and 'user-files' storage buckets using Admin Client
    try {
      console.log('[Setup] Verificando buckets...')
      const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets()
      if (listError) throw listError

      const requiredBuckets = [
        { id: 'resumes', size: 10485760, types: ['application/pdf'] },
        { id: 'user-files', size: 20971520, types: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] }
      ]

      for (const bucket of requiredBuckets) {
        const existing = buckets?.find(b => b.id === bucket.id)
        if (!existing) {
          console.log(`[Setup] Criando bucket público: ${bucket.id}`)
          const { error: createError } = await adminSupabase.storage.createBucket(bucket.id, { 
            public: true,
            fileSizeLimit: bucket.size,
            allowedMimeTypes: bucket.types
          })
          if (createError) console.error(`[Setup] Erro ao criar bucket ${bucket.id}:`, createError)
        } else {
          console.log(`[Setup] Bucket ${bucket.id} já existe. Garantindo que seja público...`)
          const { error: updateError } = await adminSupabase.storage.updateBucket(bucket.id, { 
            public: true,
            fileSizeLimit: bucket.size,
            allowedMimeTypes: bucket.types
          })
          if (updateError) console.error(`[Setup] Erro ao atualizar bucket ${bucket.id}:`, updateError)
        }
      }

      // Allow public read access via SQL (standard for public buckets)
      // Use direct SQL for storage policies to ensure they are correct
      const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          -- Enable RLS on storage.objects if not already
          ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

          -- Resumes Policies
          DROP POLICY IF EXISTS "Public read for resumes" ON storage.objects;
          CREATE POLICY "Public read for resumes" ON storage.objects FOR SELECT TO public USING (bucket_id = 'resumes');
          
          DROP POLICY IF EXISTS "Public insert for resumes" ON storage.objects;
          CREATE POLICY "Public insert for resumes" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'resumes');

          -- User Files Policies
          DROP POLICY IF EXISTS "Public read for user-files" ON storage.objects;
          CREATE POLICY "Public read for user-files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'user-files');
          
          DROP POLICY IF EXISTS "Public insert for user-files" ON storage.objects;
          CREATE POLICY "Public insert for user-files" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'user-files');

          -- Full access for authenticated users to their own files
          DROP POLICY IF EXISTS "Auth manage own files" ON storage.objects;
          CREATE POLICY "Auth manage own files" ON storage.objects FOR ALL TO authenticated USING (bucket_id IN ('resumes', 'user-files'));
        `
      })
      if (rpcError) {
        console.error('[Setup] Erro RPC SQL Storage:', rpcError)
        // Se o RPC falhar, pode ser que a função não exista.
        return NextResponse.json({ 
          success: false, 
          error: 'Função rpc("exec_sql") não encontrada. Crie-a no Editor SQL do Supabase ou execute o SQL manualmente.',
          sql: rpcError.message 
        }, { status: 400 })
      }
    } catch (e) {
      console.error('Error creating buckets:', e)
      return NextResponse.json({ success: false, error: 'Falha ao configurar buckets: ' + (e as Error).message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tables created successfully' })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ success: false, error: 'Failed to setup tables' }, { status: 500 })
  }
}
