-- SQL ATUALIZAÇÃO 009 - Memória de Busca da IA
-- Data: 2026-03-10
-- Descrição: Cria tabela de memória para evitar duplicatas e melhorar a relevância das buscas da IA

-- 1. Criar tabela de memória de busca
CREATE TABLE IF NOT EXISTS public.ai_search_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_name TEXT NOT NULL,
    website_url TEXT,
    status TEXT DEFAULT 'discovered', -- discovered, interested, ignored, rejected
    search_query TEXT,
    feedback_notes TEXT,
    last_discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    occurrence_count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'
);

-- 2. Índice para busca rápida por nome e usuário
CREATE INDEX IF NOT EXISTS idx_ai_search_memory_user_company ON public.ai_search_memory(user_id, company_name);
CREATE INDEX IF NOT EXISTS idx_ai_search_memory_website ON public.ai_search_memory(website_url);

-- 3. Adicionar coluna de memória na tabela de buscas para rastrear o que foi filtrado
ALTER TABLE public.ai_searches 
ADD COLUMN IF NOT EXISTS filtered_out_count INTEGER DEFAULT 0;

-- 4. Função para registrar descoberta na memória
CREATE OR REPLACE FUNCTION public.register_company_discovery(
    p_user_id UUID,
    p_company_name TEXT,
    p_website_url TEXT,
    p_query TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ai_search_memory (user_id, company_name, website_url, search_query, metadata)
    VALUES (p_user_id, p_company_name, p_website_url, p_query, p_metadata)
    ON CONFLICT (user_id, company_name) DO UPDATE 
    SET occurrence_count = ai_search_memory.occurrence_count + 1,
        last_discovered_at = CURRENT_TIMESTAMP,
        metadata = ai_search_memory.metadata || p_metadata;
END;
$$ LANGUAGE plpgsql;
