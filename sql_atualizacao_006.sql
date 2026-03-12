-- SQL ATUALIZAÇÃO 006 - Consolidação de Dados de Empresa em JSON
-- Data: 2026-03-10
-- Descrição: Adiciona coluna JSONB para dados consolidados e migra dados existentes

-- 1. Adicionar coluna full_company_data na tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS full_company_data JSONB DEFAULT '{}';

-- 2. Migrar dados existentes para o JSON em clients
UPDATE public.clients 
SET full_company_data = jsonb_build_object(
    'contact_name', contact_name,
    'email', email,
    'phone', phone,
    'whatsapp_link', whatsapp_link,
    'website', website,
    'linkedin_url', linkedin_url,
    'instagram_url', instagram_url,
    'city', city,
    'state', state,
    'notes', notes,
    'source', source
)
WHERE full_company_data = '{}' OR full_company_data IS NULL;

-- 3. Adicionar coluna full_company_data na tabela potential_clients
ALTER TABLE public.potential_clients 
ADD COLUMN IF NOT EXISTS full_company_data JSONB DEFAULT '{}';

-- 4. Migrar dados existentes para o JSON em potential_clients
UPDATE public.potential_clients 
SET full_company_data = jsonb_build_object(
    'contact_name', contact_name,
    'email', email,
    'phone', phone,
    'whatsapp_link', whatsapp_link,
    'website', website,
    'linkedin_url', linkedin_url,
    'instagram_url', instagram_url,
    'city', city,
    'state', state,
    'description', description,
    'rejection_reason', rejection_reason
)
WHERE full_company_data = '{}' OR full_company_data IS NULL;

-- NOTA: O usuário solicitou a exclusão das colunas individuais.
-- Para manter a funcionalidade do sistema (índices e buscas básicas), 
-- manteremos company_name, status, priority, created_at, updated_at.

-- 5. Remover colunas redundantes em clients (OPCIONAL: Comentado para segurança inicial)
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS contact_name;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS email;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS phone;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS whatsapp_link;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS website;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS linkedin_url;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS instagram_url;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS city;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS state;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS notes;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS source;

-- 6. Remover colunas redundantes em potential_clients
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS contact_name;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS email;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS phone;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS whatsapp_link;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS website;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS linkedin_url;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS instagram_url;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS city;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS state;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS description;
-- ALTER TABLE public.potential_clients DROP COLUMN IF EXISTS rejection_reason;
