import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // SQL 004 corrigido
    const sql = `
      -- SQL de Atualização 004 - Integração de Portfólio e Análise de Compatibilidade
      -- Data: 2026-03-07
      -- Descrição: Adiciona suporte completo para upload de portfólio e análise de compatibilidade com empresas

      -- Adicionar campos para análise de compatibilidade na tabela company_analysis
      ALTER TABLE company_analysis 
      ADD COLUMN IF NOT EXISTS strategy_generated JSONB;
      ALTER TABLE company_analysis 
      ADD COLUMN IF NOT EXISTS negotiation_summary JSONB;
      ALTER TABLE company_analysis 
      ADD COLUMN IF NOT EXISTS notes TEXT;

      -- Adicionar campos para match score e análise de gaps
      ALTER TABLE user_skills_matches
      ADD COLUMN IF NOT EXISTS skill_gaps TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS recommendation_text TEXT,
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

      -- Garantir que a tabela portfolio_items tenha todos os campos necessários
      ALTER TABLE portfolio_items
      ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS description TEXT;

      -- Criar índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_portfolio_items_category ON portfolio_items(category);
      CREATE INDEX IF NOT EXISTS idx_user_skills_matches_user_id ON user_skills_matches(user_profile_id);
      CREATE INDEX IF NOT EXISTS idx_user_skills_matches_company_id ON user_skills_matches(company_analysis_id);
      CREATE INDEX IF NOT EXISTS idx_user_skills_matches_priority ON user_skills_matches(priority);

      -- Adicionar constraint para garantir valores válidos
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'chk_priority' AND conrelid = 'user_skills_matches'::regclass
        ) THEN
          ALTER TABLE user_skills_matches
          ADD CONSTRAINT chk_priority 
          CHECK (priority IN ('high', 'medium', 'low'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'chk_status' AND conrelid = 'user_skills_matches'::regclass
        ) THEN
          ALTER TABLE user_skills_matches
          ADD CONSTRAINT chk_status 
          CHECK (status IN ('active', 'inactive', 'pending'));
        END IF;
      END $$;

      -- Adicionar campo para armazenar análise completa de gaps
      ALTER TABLE user_skills_matches
      ADD COLUMN IF NOT EXISTS gaps_analysis JSONB;

      -- Criar tabela de versões de análises da IA
      CREATE TABLE IF NOT EXISTS ai_analysis_versions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        analysis_id UUID REFERENCES company_analysis(id) ON DELETE CASCADE,
        version_type TEXT CHECK (version_type IN ('pre_approval', 'post_approval')),
        data_snapshot JSONB NOT NULL,
        user_notes TEXT,
        approval_notes TEXT,
        user_id UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ai_analysis_versions_analysis_id ON ai_analysis_versions(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_ai_analysis_versions_created_at ON ai_analysis_versions(created_at DESC);

      -- Criar tabela de negociações vinculadas à análise
      CREATE TABLE IF NOT EXISTS negotiations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        analysis_id UUID REFERENCES company_analysis(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id),
        negotiation_summary TEXT NOT NULL,
        outcome TEXT CHECK (outcome IN ('success','partial_success','failure','pending')) DEFAULT 'pending',
        agreed_value TEXT,
        timeline TEXT,
        key_points TEXT[] DEFAULT '{}',
        contact_person TEXT,
        follow_up_actions TEXT,
        lessons_learned TEXT,
        next_steps TEXT,
        user_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_negotiations_analysis_id ON negotiations(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON negotiations(created_at DESC);
    `

    // Executar o SQL diretamente
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('Erro ao executar SQL 004:', error)
      return NextResponse.json({ 
        error: 'Erro ao executar SQL', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'SQL 004 executado com sucesso'
    })
    
  } catch (error) {
    console.error('Erro na API de correção SQL 004:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
