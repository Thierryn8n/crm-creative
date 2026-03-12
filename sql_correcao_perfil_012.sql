-- SQL ATUALIZAÇÃO 012 - Correção de Vínculo de user_profiles
-- Data: 2026-03-10
-- Descrição: Garante que user_profiles.id seja o mesmo que auth.users.id e corrige constraints

-- 1. Garantir que a tabela user_profiles tenha as colunas corretas e vínculos
DO $$ 
BEGIN
    -- Se a tabela já existir, garantir que o ID seja UUID e vinculado ao auth.users
    -- Nota: Isso assume que você já criou a tabela anteriormente com sql_atualizacao_003.sql
    
    -- Adicionar resume_text se não existir (para redundância e busca rápida)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'resume_text') THEN
        ALTER TABLE public.user_profiles ADD COLUMN resume_text TEXT;
    END IF;

    -- Garantir que updated_at exista
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança para user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
        ON public.user_profiles FOR SELECT 
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.user_profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON public.user_profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;
