-- SQL ATUALIZAÇÃO 003 - Sistema de Análise de Empresas e Perfil do Usuário
-- Data: 2026-03-07
-- Descrição: Cria tabelas para análise detalhada de empresas e perfil do usuário

-- 1. Criar tabela profiles para armazenar perfil do usuário
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    linkedin_url TEXT,
    indeed_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    behance_url TEXT,
    resume_text TEXT, -- Texto completo do currículo
    skills TEXT[] DEFAULT '{}', -- Array de habilidades
    experience_years INTEGER DEFAULT 0,
    specialties TEXT[] DEFAULT '{}', -- Especialidades do usuário
    preferred_work_types TEXT[] DEFAULT '{}', -- Tipos de trabalho preferidos
    hourly_rate DECIMAL(10,2), -- Preço por hora
    daily_rate DECIMAL(10,2), -- Preço por dia
    availability VARCHAR(50) DEFAULT 'available', -- available, busy, unavailable
    bio TEXT, -- Biografia profissional
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela portfolio_items para mídias do portfólio
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- image, video, pdf, link, text
    file_url TEXT,
    thumbnail_url TEXT,
    external_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100), -- design, development, marketing, etc
    client_name VARCHAR(255),
    project_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    metrics JSONB DEFAULT '{}', -- estatísticas do projeto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela company_analysis para análise detalhada de empresas
CREATE TABLE IF NOT EXISTS company_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    website_url TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    twitter_url TEXT,
    company_size VARCHAR(50), -- startup, small, medium, large, enterprise
    industry VARCHAR(100),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_country VARCHAR(50),
    
    -- Análise do website
    website_analysis JSONB DEFAULT '{}', -- estrutura, tecnologias, design
    website_score INTEGER DEFAULT 0, -- pontuação de 0-100
    
    -- Análise de redes sociais
    social_media_presence JSONB DEFAULT '{}', -- presença em cada rede
    linkedin_analysis JSONB DEFAULT '{}', -- análise do LinkedIn
    instagram_analysis JSONB DEFAULT '{}', -- análise do Instagram
    
    -- Análise de anúncios
    ads_analysis JSONB DEFAULT '{}', -- análise de campanhas de anúncios
    google_ads_presence BOOLEAN DEFAULT FALSE,
    meta_ads_presence BOOLEAN DEFAULT FALSE,
    
    -- Análise de mercado e tendências
    market_analysis JSONB DEFAULT '{}', -- análise do mercado
    competitors JSONB DEFAULT '{}', -- principais concorrentes
    trends_analysis JSONB DEFAULT '{}', -- tendências do setor
    
    -- Estratégia gerada pela IA
    ai_strategy JSONB DEFAULT '{}', -- estratégia completa gerada
    service_opportunities TEXT[] DEFAULT '{}', -- oportunidades de serviço
    recommended_approach TEXT, -- abordagem recomendada
    estimated_budget_range VARCHAR(100), -- faixa de orçamento estimada
    
    -- Relacionamento com contatos/clientes existentes
    related_contact_id UUID REFERENCES contacts(id),
    related_client_id UUID REFERENCES real_clients(id),
    
    -- Status da análise
    analysis_status VARCHAR(50) DEFAULT 'pending', -- pending, analyzing, completed, failed
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela user_skills_matches para match entre perfil e oportunidades
CREATE TABLE IF NOT EXISTS user_skills_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    company_analysis_id UUID REFERENCES company_analysis(id),
    match_score INTEGER DEFAULT 0, -- pontuação de 0-100
    matching_skills TEXT[] DEFAULT '{}', -- habilidades que combinam
    skill_gaps TEXT[] DEFAULT '{}', -- lacunas de habilidades
    recommendation_text TEXT, -- texto de recomendação
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    status VARCHAR(50) DEFAULT 'active', -- active, contacted, won, lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela strategy_templates para templates de estratégias
CREATE TABLE IF NOT EXISTS strategy_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100), -- setor específico ou null para genérico
    company_size VARCHAR(50), -- tamanho da empresa ou null para genérico
    template_type VARCHAR(50) NOT NULL, -- approach, proposal, pitch, follow_up
    template_content JSONB NOT NULL, -- conteúdo do template
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00, -- taxa de sucesso
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_category ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_is_featured ON portfolio_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_company_analysis_company_name ON company_analysis(company_name);
CREATE INDEX IF NOT EXISTS idx_company_analysis_industry ON company_analysis(industry);
CREATE INDEX IF NOT EXISTS idx_company_analysis_analysis_status ON company_analysis(analysis_status);
CREATE INDEX IF NOT EXISTS idx_company_analysis_related_contact ON company_analysis(related_contact_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_matches_user ON user_skills_matches(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_matches_company ON user_skills_matches(company_analysis_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_matches_score ON user_skills_matches(match_score DESC);

-- 7. Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Inserir templates de estratégia padrão
INSERT INTO strategy_templates (name, description, industry, company_size, template_type, template_content, tags) VALUES
    ('Abordagem para Empresas de Tecnologia', 'Template para abordar empresas de tecnologia', 'technology', 'medium', 'approach', 
     '{"steps": ["Pesquisar tecnologias usadas", "Analisar concorrência", "Identificar gaps", "Propor solução tecnológica"], "key_points": ["Foco em inovação", "ROI mensurável", "Cases de sucesso"]}', 
     '{"tecnologia", "inovação", "digital"}'),
    
    ('Proposta para Marketing Digital', 'Template para propostas de marketing digital', 'marketing', null, 'proposal',
     '{"structure": ["Análise atual", "Objetivos", "Estratégia", "Cronograma", "Investimento", "Resultados esperados"], "highlight": "Aumento de 3x no engajamento"}',
     '{"marketing", "digital", "redes sociais"}'),
    
    ('Pitch para Pequenas Empresas', 'Template de pitch direto para pequenas empresas', null, 'small', 'pitch',
     '{"opening": "Entendi que vocês estão buscando crescer...", "problem": "Muitas pequenas empresas perdem clientes por...", "solution": "Nossa solução ajuda a...", "cta": "Vamos marcar uma call?"}',
     '{"pequenas empresas", "pitch", "direto"}'),
    
    ('Follow-up Pós-Reunião', 'Template de follow-up após reunião', null, null, 'follow_up',
     '{"timing": "24-48 horas", "content": "Obrigado pela reunião de ontem... Conforme conversamos...", "next_steps": ["Enviar proposta detalhada", "Agendar próxima call", "Compartilhar cases"]}',
     '{"follow-up", "pós-reunião", "próximos passos"}');

-- 10. Adicionar comentários para documentação
COMMENT ON TABLE profiles IS 'Perfil completo do usuário com habilidades, experiência e preferências';
COMMENT ON TABLE portfolio_items IS 'Itens do portfólio do usuário (imagens, vídeos, documentos)';
COMMENT ON TABLE company_analysis IS 'Análise detalhada de empresas com estratégias geradas por IA';
COMMENT ON TABLE user_skills_matches IS 'Matches entre perfil do usuário e oportunidades em empresas';
COMMENT ON TABLE strategy_templates IS 'Templates de estratégias para diferentes tipos de abordagem';

-- 11. Adicionar constraints únicas para evitar duplicatas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'company_analysis' 
        AND constraint_name = 'unique_company_analysis_name'
    ) THEN
        ALTER TABLE company_analysis 
        ADD CONSTRAINT unique_company_analysis_name UNIQUE (company_name);
    END IF;
END $$;