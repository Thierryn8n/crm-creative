-- SQL para remover colunas desnecessárias da tabela clients
-- Já que agora consolidamos tudo no campo JSONB 'full_company_data'

ALTER TABLE "public"."clients" 
DROP COLUMN IF EXISTS "contact_name",
DROP COLUMN IF EXISTS "email",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "whatsapp_link",
DROP COLUMN IF EXISTS "website",
DROP COLUMN IF EXISTS "linkedin_url",
DROP COLUMN IF EXISTS "instagram_url",
DROP COLUMN IF EXISTS "city",
DROP COLUMN IF EXISTS "state",
DROP COLUMN IF EXISTS "notes",
DROP COLUMN IF EXISTS "source",
DROP COLUMN IF EXISTS "last_contact_date";

-- Manter apenas: id, company_name, status, priority, created_at, updated_at, full_company_data
