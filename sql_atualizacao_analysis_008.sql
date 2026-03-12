-- SQL ATUALIZAÇÃO 008 - Consolidação de Dados de Análise em JSONB (Padrão 007)
-- Data: 2026-03-10
-- Descrição: Consolida dados de empresa e análise nas tabelas company_analysis e approved_companies

-- 1. Adicionar full_company_data na tabela company_analysis
ALTER TABLE public.company_analysis 
ADD COLUMN IF NOT EXISTS full_company_data JSONB DEFAULT '{}';

-- 2. Migrar dados existentes para o JSON em company_analysis
UPDATE public.company_analysis 
SET full_company_data = jsonb_build_object(
    'website_url', website_url,
    'linkedin_url', linkedin_url,
    'instagram_url', instagram_url,
    'facebook_url', facebook_url,
    'twitter_url', twitter_url,
    'company_size', company_size,
    'industry', industry,
    'location_city', location_city,
    'location_state', location_state,
    'location_country', location_country
)
WHERE full_company_data = '{}' OR full_company_data IS NULL;

-- 3. Adicionar full_company_data na tabela approved_companies
ALTER TABLE public.approved_companies 
ADD COLUMN IF NOT EXISTS full_company_data JSONB DEFAULT '{}';

-- 4. Migrar dados existentes para o JSON em approved_companies
UPDATE public.approved_companies 
SET full_company_data = jsonb_build_object(
    'company_website', company_website,
    'company_description', company_description,
    'company_industry', company_industry,
    'company_size', company_size
)
WHERE full_company_data = '{}' OR full_company_data IS NULL;

-- 5. Opcional: Remover colunas redundantes em company_analysis (Padrão 007)
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS website_url;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS linkedin_url;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS instagram_url;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS facebook_url;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS twitter_url;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS company_size;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS industry;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS location_city;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS location_state;
-- ALTER TABLE public.company_analysis DROP COLUMN IF EXISTS location_country;

-- 6. Opcional: Remover colunas redundantes em approved_companies
-- ALTER TABLE public.approved_companies DROP COLUMN IF EXISTS company_website;
-- ALTER TABLE public.approved_companies DROP COLUMN IF EXISTS company_description;
-- ALTER TABLE public.approved_companies DROP COLUMN IF EXISTS company_industry;
-- ALTER TABLE public.approved_companies DROP COLUMN IF EXISTS company_size;
