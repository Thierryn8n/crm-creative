-- SQL ATUALIZAÇÃO 010 - Correção de Schema e Vínculo de Usuário
-- Data: 2026-03-10
-- Descrição: Adiciona user_id às tabelas de análise e garante que o schema suporte as operações da IA

-- 1. Adicionar user_id na tabela company_analysis se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_analysis' AND column_name = 'user_id') THEN
        ALTER TABLE public.company_analysis ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Adicionar user_id na tabela approved_companies se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approved_companies' AND column_name = 'user_id') THEN
        ALTER TABLE public.approved_companies ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Garantir que as colunas de análise sejam JSONB (já devem ser, mas por precaução)
ALTER TABLE public.company_analysis ALTER COLUMN website_analysis SET DEFAULT '{}';
ALTER TABLE public.company_analysis ALTER COLUMN social_media_presence SET DEFAULT '{}';
ALTER TABLE public.company_analysis ALTER COLUMN ads_analysis SET DEFAULT '{}';
ALTER TABLE public.company_analysis ALTER COLUMN market_analysis SET DEFAULT '{}';
ALTER TABLE public.company_analysis ALTER COLUMN ai_strategy SET DEFAULT '{}';

-- 4. Criar índices para busca por usuário
CREATE INDEX IF NOT EXISTS idx_company_analysis_user_id ON public.company_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_approved_companies_user_id ON public.approved_companies(user_id);

-- 6. Corrigir constraint única para permitir múltiplos usuários analisarem a mesma empresa
DO $$ 
BEGIN
    -- Remover a constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'company_analysis' AND constraint_name = 'unique_company_analysis_name'
    ) THEN
        ALTER TABLE public.company_analysis DROP CONSTRAINT unique_company_analysis_name;
    END IF;

    -- Adicionar a nova constraint composta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'company_analysis' AND constraint_name = 'unique_user_company_analysis'
    ) THEN
        ALTER TABLE public.company_analysis ADD CONSTRAINT unique_user_company_analysis UNIQUE (user_id, company_name);
    END IF;

    -- 7. Garantir unicidade em approved_companies para evitar duplicatas na aprovação
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'approved_companies' AND constraint_name = 'unique_user_company_approval'
    ) THEN
        ALTER TABLE public.approved_companies ADD CONSTRAINT unique_user_company_approval UNIQUE (user_id, company_id);
    END IF;
END $$;
