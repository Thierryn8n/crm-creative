-- SQL de Atualização 005 - Sistema de Empresas Aprovadas e Kanban
-- Criar tabela de empresas aprovadas com gestão de negociações

-- Criar tabela de empresas aprovadas
CREATE TABLE IF NOT EXISTS approved_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company_analysis(id) ON DELETE CASCADE,
    
    -- Informações da empresa (copiadas na aprovação)
    company_name TEXT NOT NULL,
    company_website TEXT,
    company_description TEXT,
    company_industry TEXT,
    company_size TEXT,
    
    -- Análise completa da IA (salva na aprovação)
    ai_analysis JSONB NOT NULL,
    strategy_generated JSONB,
    website_analysis JSONB,
    social_media_analysis JSONB,
    market_analysis JSONB,
    match_score INTEGER,
    skill_gaps JSONB,
    
    -- Status do processo
    status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_negociacao', 'aprovado_cliente', 'contrato_assinado', 'projeto_em_andamento', 'concluido', 'perdido')),
    
    -- Informações de negociação
    negotiation_status TEXT DEFAULT 'iniciado' CHECK (negotiation_status IN ('iniciado', 'contato_realizado', 'proposta_enviada', 'negociacao', 'fechado_vitoria', 'fechado_derrota')),
    first_contact_date DATE,
    last_contact_date DATE,
    next_action_date DATE,
    negotiation_value DECIMAL(10,2),
    
    -- Gestão do processo
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Campos de controle
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    UNIQUE(user_id, company_id)
);

-- Índices para a tabela approved_companies
CREATE INDEX IF NOT EXISTS idx_approved_companies_user_id ON approved_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_approved_companies_status ON approved_companies(status);
CREATE INDEX IF NOT EXISTS idx_approved_companies_negotiation_status ON approved_companies(negotiation_status);
CREATE INDEX IF NOT EXISTS idx_approved_companies_priority ON approved_companies(priority);
CREATE INDEX IF NOT EXISTS idx_approved_companies_next_action ON approved_companies(next_action_date);

-- Criar tabela de Kanban para gestão visual
CREATE TABLE IF NOT EXISTS kanban_boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    board_type TEXT DEFAULT 'sales' CHECK (board_type IN ('sales', 'project', 'negotiation')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Criar tabela de colunas do Kanban
CREATE TABLE IF NOT EXISTS kanban_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#e5e7eb',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(board_id, title)
);

-- Criar tabela de cards do Kanban
CREATE TABLE IF NOT EXISTS kanban_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE,
    approved_company_id UUID REFERENCES approved_companies(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Datas e prazos
    due_date DATE,
    start_date DATE,
    completed_date DATE,
    
    -- Informações adicionais
    tags TEXT[],
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Controle de posição
    position INTEGER NOT NULL DEFAULT 0,
    
    -- Campos de controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de histórico de negociações
CREATE TABLE IF NOT EXISTS negotiation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    approved_company_id UUID REFERENCES approved_companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de ação
    action_type TEXT NOT NULL CHECK (action_type IN ('contact', 'meeting', 'proposal', 'negotiation', 'contract', 'payment', 'delivery', 'feedback')),
    
    -- Detalhes da ação
    description TEXT NOT NULL,
    outcome TEXT,
    next_steps TEXT,
    
    -- Informações de contato
    contact_method TEXT CHECK (contact_method IN ('email', 'phone', 'meeting', 'whatsapp', 'linkedin', 'video_call')),
    contact_person TEXT,
    
    -- Valores e datas
    value DECIMAL(10,2),
    expected_close_date DATE,
    
    -- Análise da IA sobre a interação
    ai_analysis TEXT,
    ai_recommendations TEXT[],
    
    -- Campos de controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de anotações e insights da IA
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    approved_company_id UUID REFERENCES approved_companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de insight
    insight_type TEXT NOT NULL CHECK (insight_type IN ('strategy', 'opportunity', 'risk', 'recommendation', 'analysis')),
    
    -- Conteúdo do insight
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Contexto e fonte
    context_data JSONB,
    source_analysis TEXT,
    
    -- Status do insight
    is_active BOOLEAN DEFAULT true,
    was_useful BOOLEAN,
    user_feedback TEXT,
    
    -- Campos de controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar função para atualizar a data de update automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_approved_companies_updated_at 
    BEFORE UPDATE ON approved_companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_boards_updated_at 
    BEFORE UPDATE ON kanban_boards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at 
    BEFORE UPDATE ON kanban_columns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_cards_updated_at 
    BEFORE UPDATE ON kanban_cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at 
    BEFORE UPDATE ON ai_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_approved_company_id ON kanban_cards(approved_company_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_due_date ON kanban_cards(due_date);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_priority ON kanban_cards(priority);
CREATE INDEX IF NOT EXISTS idx_negotiation_history_company_id ON negotiation_history(approved_company_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_history_created_at ON negotiation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_company_id ON ai_insights(approved_company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
