-- SQL ATUALIZAÇÃO 001 - Sistema de Gerenciamento de Leads
-- Data: 2026-03-07
-- Descrição: Cria tabelas para sistema de aprovação de leads e etiquetas

-- 1. Adicionar campo result_count na tabela ai_searches
ALTER TABLE ai_searches 
ADD COLUMN IF NOT EXISTS result_count INTEGER DEFAULT 5;

-- 2. Criar tabela potential_clients para leads em análise
CREATE TABLE IF NOT EXISTS potential_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp_link TEXT,
    website TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'potential' CHECK (status IN ('potential', 'analyzing', 'approved', 'rejected', 'contacted')),
    labels TEXT[] DEFAULT '{}',
    ai_search_id UUID REFERENCES ai_searches(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela client_labels para etiquetas personalizadas
CREATE TABLE IF NOT EXISTS client_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_potential_clients_status ON potential_clients(status);
CREATE INDEX IF NOT EXISTS idx_potential_clients_company_name ON potential_clients(company_name);
CREATE INDEX IF NOT EXISTS idx_potential_clients_created_at ON potential_clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_potential_clients_ai_search_id ON potential_clients(ai_search_id);

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at na tabela potential_clients
DROP TRIGGER IF EXISTS update_potential_clients_updated_at ON potential_clients;
CREATE TRIGGER update_potential_clients_updated_at
    BEFORE UPDATE ON potential_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir etiquetas padrão do sistema
INSERT INTO client_labels (name, color, is_system) VALUES
    ('Lead Quente', '#EF4444', true),
    ('Lead Morno', '#F59E0B', true),
    ('Lead Frio', '#6B7280', true),
    ('Em Negociação', '#10B981', true),
    ('Cliente VIP', '#8B5CF6', true),
    ('Follow-up', '#3B82F6', true)
ON CONFLICT (name) DO NOTHING;

-- 8. Adicionar constraint única para evitar duplicatas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'potential_clients' 
        AND constraint_name = 'unique_company_name'
    ) THEN
        ALTER TABLE potential_clients 
        ADD CONSTRAINT unique_company_name UNIQUE (company_name);
    END IF;
END $$;

-- 9. Criar view para análise de leads
CREATE OR REPLACE VIEW lead_analysis AS
SELECT 
    status,
    COUNT(*) as total,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM potential_clients) as percentage
FROM potential_clients 
GROUP BY status
ORDER BY total DESC;

-- 10. Adicionar comentários para documentação
COMMENT ON TABLE potential_clients IS 'Tabela para armazenar leads em análise antes de se tornarem clientes';
COMMENT ON TABLE client_labels IS 'Tabela de etiquetas personalizadas para categorizar clientes';
COMMENT ON COLUMN potential_clients.status IS 'Status do lead: potential, analyzing, approved, rejected, contacted';
COMMENT ON COLUMN potential_clients.labels IS 'Array de etiquetas associadas ao lead';
COMMENT ON COLUMN potential_clients.rejection_reason IS 'Motivo da rejeição quando status = rejected';