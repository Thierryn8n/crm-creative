-- SQL ATUALIZAÇÃO 012 - Correção de Vínculo de profiles
-- Data: 2026-03-12
-- Descrição: Garante que a tabela profiles tenha as colunas corretas e vínculos

-- 1. Garantir que a tabela profiles tenha as colunas corretas e vínculos
DO $$ 
BEGIN
    -- Se a tabela já existir, garantir que o ID seja UUID e vinculado ao auth.users
    
    -- Adicionar resume_text se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'resume_text') THEN
        ALTER TABLE public.profiles ADD COLUMN resume_text TEXT;
    END IF;

    -- Garantir que user_id exista e seja único
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Garantir que updated_at exista
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança para profiles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

    CREATE POLICY "Users can manage their own profile" 
    ON public.profiles FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;
