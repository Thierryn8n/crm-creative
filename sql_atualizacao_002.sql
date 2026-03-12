-- SQL ATUALIZAÇÃO 002 - Adicionar colunas JSON para dados completos
-- Data: 2026-03-08
-- Descrição: Adiciona colunas JSON para armazenar dados completos das empresas

-- 1. Adicionar coluna full_company_data na tabela potential_clients
ALTER TABLE potential_clients 
ADD COLUMN IF NOT EXISTS full_company_data JSONB DEFAULT NULL;

-- 2. Adicionar coluna raw_search_data na tabela ai_searches para armazenar dados brutos
ALTER TABLE ai_searches 
ADD COLUMN IF NOT EXISTS full_data JSONB DEFAULT NULL;

-- 3. Adicionar colunas específicas para dados de redes sociais e website
ALTER TABLE potential_clients 
ADD COLUMN IF NOT EXISTS website_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS linkedin_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS founded_year VARCHAR(10),
ADD COLUMN IF NOT EXISTS employee_count VARCHAR(50);

-- 4. Criar índices para performance nas colunas JSON
CREATE INDEX IF NOT EXISTS idx_potential_clients_full_data ON potential_clients USING GIN (full_company_data);
CREATE INDEX IF NOT EXISTS idx_potential_clients_social_media ON potential_clients USING GIN (social_media);
CREATE INDEX IF NOT EXISTS idx_potential_clients_website_data ON potential_clients USING GIN (website_data);
CREATE INDEX IF NOT EXISTS idx_potential_clients_linkedin_data ON potential_clients USING GIN (linkedin_data);
CREATE INDEX IF NOT EXISTS idx_ai_searches_full_data ON ai_searches USING GIN (full_data);

-- 5. Adicionar índices nas novas colunas
CREATE INDEX IF NOT EXISTS idx_potential_clients_industry ON potential_clients(industry);
CREATE INDEX IF NOT EXISTS idx_potential_clients_company_size ON potential_clients(company_size);

-- 6. Adicionar trigger para atualizar updated_at nas novas colunas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger na tabela potential_clients
DROP TRIGGER IF EXISTS update_potential_clients_updated_at ON potential_clients;
CREATE TRIGGER update_potential_clients_updated_at
    BEFORE UPDATE ON potential_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();