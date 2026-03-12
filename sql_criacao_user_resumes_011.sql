-- SQL ATUALIZAÇÃO 011 - Criação da Tabela de Currículos (user_resumes)
-- Data: 2026-03-10
-- Descrição: Cria a tabela user_resumes para armazenar o conteúdo extraído de arquivos e links de currículos

-- 1. Criar a tabela user_resumes
CREATE TABLE IF NOT EXISTS public.user_resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'resume', 'linkedin', 'text'
    content TEXT NOT NULL, -- Conteúdo extraído/texto do currículo
    file_url TEXT, -- Caminho do arquivo no storage se houver
    linkedin_url TEXT, -- URL do LinkedIn se houver
    extracted_skills JSONB DEFAULT '[]',
    extracted_experience JSONB DEFAULT '[]',
    extracted_education JSONB DEFAULT '[]',
    extracted_languages JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2), -- 0.00 a 1.00
    analysis JSONB DEFAULT '{}', -- Análise completa da IA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que cada usuário tenha apenas um registro por tipo
    -- Isso permite o uso do 'upsert' no código
    CONSTRAINT unique_user_resume_type UNIQUE (user_id, type)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_resumes_user_id ON public.user_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_resumes_type ON public.user_resumes(type);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
-- Permitir que usuários vejam apenas seus próprios currículos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_resumes' AND policyname = 'Users can view their own resumes'
    ) THEN
        CREATE POLICY "Users can view their own resumes" 
        ON public.user_resumes FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_resumes' AND policyname = 'Users can insert their own resumes'
    ) THEN
        CREATE POLICY "Users can insert their own resumes" 
        ON public.user_resumes FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_resumes' AND policyname = 'Users can update their own resumes'
    ) THEN
        CREATE POLICY "Users can update their own resumes" 
        ON public.user_resumes FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_resumes' AND policyname = 'Users can delete their own resumes'
    ) THEN
        CREATE POLICY "Users can delete their own resumes" 
        ON public.user_resumes FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Trigger para atualizar o campo updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_resumes_updated_at') THEN
        CREATE TRIGGER update_user_resumes_updated_at
            BEFORE UPDATE ON public.user_resumes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 6. Adicionar comentário para documentação
COMMENT ON TABLE public.user_resumes IS 'Armazena o conteúdo extraído e analisado de currículos e perfis do LinkedIn dos usuários';
