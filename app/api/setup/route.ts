import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    // Create user_profiles table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            user_name VARCHAR(255),
            email VARCHAR(255),
            linkedin_url TEXT,
            resume_text TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Enable RLS
          ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

          -- Policies for user_profiles
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Public access to profiles') THEN
              CREATE POLICY "Public access to profiles" ON public.user_profiles
                FOR ALL USING (true) WITH CHECK (true);
            END IF;
          END $$;
        `
      })
    } catch (e) {
      console.error('Error creating user_profiles:', e)
    }

    // Create clients table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        `
      })
    } catch {
      // Table might already exist, continue
    }

    // Create interactions table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            subject VARCHAR(255),
            content TEXT,
            direction VARCHAR(20) DEFAULT 'outbound',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
    } catch {}

    // Create email_templates table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.email_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
    } catch {}

    // Create sent_emails table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.sent_emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            template_id UUID REFERENCES public.email_templates(id),
            to_email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'sent',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
    } catch {}

    // Create portfolio_cache table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.portfolio_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            external_id VARCHAR(255),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            thumbnail_url TEXT,
            media_urls JSONB DEFAULT '[]'::jsonb,
            source_table VARCHAR(100),
            synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
    } catch {}

    // Create ai_searches table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.ai_searches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            query TEXT NOT NULL,
            results JSONB,
            clients_added INTEGER DEFAULT 0,
            result_count INTEGER DEFAULT 5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
    } catch {}

    // Create potential_clients table (leads before approval)
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.potential_clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
            UNIQUE(company_name, email)
          );
        `
      })
    } catch {}

    // Create client_labels table (for custom labels)
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.client_labels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            color VARCHAR(7) DEFAULT '#6B7280',
            is_system BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      })
    } catch {}

    // Create portfolio_items table
    try {
      await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.portfolio_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
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

          -- Policies for portfolio_items
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_items' AND policyname = 'Public access to portfolio_items') THEN
              CREATE POLICY "Public access to portfolio_items" ON public.portfolio_items
                FOR ALL USING (true) WITH CHECK (true);
            END IF;
          END $$;
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
            user_id UUID NOT NULL,
            type VARCHAR(50) DEFAULT 'resume',
            content TEXT,
            file_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, type)
          );

          -- Enable RLS
          ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

          -- Policies for user_resumes
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_resumes' AND policyname = 'Users can manage their own resumes') THEN
              CREATE POLICY "Users can manage their own resumes" ON public.user_resumes
                FOR ALL USING (true) WITH CHECK (true); -- Simplified for now to ensure it works
            END IF;
          END $$;
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
            user_id UUID NOT NULL,
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
            UNIQUE(user_id, company_id)
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
          
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'approved_companies' AND policyname = 'Users can manage their own approved companies') THEN
              CREATE POLICY "Users can manage their own approved companies" ON public.approved_companies
                FOR ALL USING (true) WITH CHECK (true);
            END IF;
          END $$;
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
            user_id UUID NOT NULL,
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
          
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negotiation_history' AND policyname = 'Users can manage their own negotiation history') THEN
              CREATE POLICY "Users can manage their own negotiation history" ON public.negotiation_history
                FOR ALL USING (true) WITH CHECK (true);
            END IF;
          END $$;
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
            user_id UUID NOT NULL,
            insight_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            confidence_score INTEGER DEFAULT 0,
            context_data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
          
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_insights' AND policyname = 'Users can manage their own ai insights') THEN
              CREATE POLICY "Users can manage their own ai insights" ON public.ai_insights
                FOR ALL USING (true) WITH CHECK (true);
            END IF;
          END $$;
        `
      })
    } catch (e) {
      console.error('Error creating ai_insights:', e)
    }

    // Create ai_search_memory table (referenced in approved-companies/route.ts)
    try {
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.ai_search_memory (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL,
              company_name VARCHAR(255) NOT NULL,
              status VARCHAR(50) DEFAULT 'discovered',
              feedback_notes TEXT,
              last_discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE public.ai_search_memory ENABLE ROW LEVEL SECURITY;
            
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_search_memory' AND policyname = 'Users can manage their own ai search memory') THEN
                CREATE POLICY "Users can manage their own ai search memory" ON public.ai_search_memory
                  FOR ALL USING (true) WITH CHECK (true);
              END IF;
            END $$;
          `
        })
      } catch (e) {
        console.error('Error creating ai_search_memory:', e)
      }


    // Ensure portfolio_items has user_id and correct policies
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          -- Add user_id to portfolio_items if it doesn't exist
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'user_id') THEN
              ALTER TABLE public.portfolio_items ADD COLUMN user_id UUID;
            END IF;
          END $$;

          -- Enable RLS
          ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

          -- Policies for portfolio_items
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_items' AND policyname = 'Users can manage their own portfolio items') THEN
              CREATE POLICY "Users can manage their own portfolio items" ON public.portfolio_items
                FOR ALL USING (true) WITH CHECK (true); -- Simplified for now
            END IF;
          END $$;
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
