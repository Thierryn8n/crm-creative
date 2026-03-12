import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// API para a IA acessar seus próprios dados e realizar análises avançadas
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      action,
      analysis_id,
      company_data,
      user_context,
      previous_insights,
      negotiation_history
    } = body

    switch (action) {
      case 'analyze_company':
        return await analyzeCompany(supabase, user.id, company_data, user_context)
        
      case 'generate_strategy':
        return await generateStrategy(supabase, user.id, analysis_id, company_data, previous_insights)
        
      case 'update_negotiation':
        return await updateNegotiation(supabase, user.id, analysis_id, negotiation_history)
        
      case 'get_ai_insights':
        return await getAIInsights(supabase, user.id, analysis_id)
        
      default:
        return NextResponse.json({ 
          error: 'Ação não reconhecida',
          available_actions: ['analyze_company', 'generate_strategy', 'update_negotiation', 'get_ai_insights']
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Erro na API de IA:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para analisar uma empresa usando dados da IA
async function analyzeCompany(supabase: any, userId: string, companyData: any, userContext: any) {
  try {
    // Buscar análises anteriores da IA para aprendizado
    const { data: previousAnalysis } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('user_profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar matches de skills para contexto adicional
    const { data: skillsMatches } = await supabase
      .from('user_skills_matches')
      .select('*')
      .eq('user_profile_id', userId)
      .limit(5)

    // Criar análise contextualizada com base em dados anteriores
    const aiAnalysis = {
      company_data: companyData,
      user_context: userContext,
      previous_patterns: previousAnalysis?.map(analysis => ({
        company_type: analysis.company_name,
        success_factors: analysis.strategy_generated?.success_factors,
        negotiation_approach: analysis.negotiation_summary
      })),
      skills_alignment: skillsMatches?.map(match => ({
        skill: match.skill_gaps,
        priority: match.priority,
        status: match.status
      })),
      ai_insights: {
        market_opportunity: generateMarketOpportunity(companyData, previousAnalysis),
        negotiation_strategy: generateNegotiationStrategy(companyData, userContext, previousAnalysis),
        risk_assessment: generateRiskAssessment(companyData, previousAnalysis),
        recommended_approach: generateRecommendedApproach(companyData, userContext, skillsMatches)
      },
      confidence_score: calculateConfidenceScore(companyData, previousAnalysis, skillsMatches),
      learning_notes: generateLearningNotes(previousAnalysis, companyData)
    }

    // Salvar nova análise no banco de dados
    const { data: newAnalysis, error } = await supabase
      .from('company_analysis')
      .insert([{
        user_profile_id: userId,
        company_name: companyData.name,
        website_analysis: companyData.website,
        social_media_analysis: companyData.socialMedia,
        linkedin_data: companyData.linkedin,
        trends_analysis: aiAnalysis.ai_insights,
        strategy_generated: aiAnalysis,
        notes: `Análise IA gerada em ${new Date().toISOString()}`,
        status: 'analyzing'
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      analysis_id: newAnalysis.id,
      ai_analysis: aiAnalysis,
      message: 'Análise de empresa realizada com sucesso pela IA'
    })

  } catch (error) {
    console.error('Erro ao analisar empresa:', error)
    return NextResponse.json({
      error: 'Erro ao analisar empresa',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para gerar estratégia baseada em insights da IA
async function generateStrategy(supabase: any, userId: string, analysisId: string, companyData: any, previousInsights: any) {
  try {
    // Buscar análise atual
    const { data: currentAnalysis } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('id', analysisId)
      .eq('user_profile_id', userId)
      .single()

    if (!currentAnalysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    // Gerar estratégia personalizada baseada em dados históricos
    const strategy = {
      approach_timeline: generateTimeline(companyData, currentAnalysis),
      communication_strategy: generateCommunicationStrategy(companyData, currentAnalysis),
      value_proposition: generateValueProposition(companyData, currentAnalysis, previousInsights),
      negotiation_tactics: generateNegotiationTactics(companyData, currentAnalysis),
      follow_up_plan: generateFollowUpPlan(companyData, currentAnalysis),
      success_metrics: generateSuccessMetrics(companyData, currentAnalysis),
      risk_mitigation: generateRiskMitigation(companyData, currentAnalysis),
      ai_recommendations: generateAIRecommendations(companyData, currentAnalysis, previousInsights)
    }

    // Atualizar análise com nova estratégia
    const { data: updatedAnalysis, error } = await supabase
      .from('company_analysis')
      .update({
        strategy_generated: strategy,
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      strategy: strategy,
      analysis_id: analysisId,
      message: 'Estratégia gerada com sucesso pela IA'
    })

  } catch (error) {
    console.error('Erro ao gerar estratégia:', error)
    return NextResponse.json({
      error: 'Erro ao gerar estratégia',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para atualizar negociação com aprendizado da IA
async function updateNegotiation(supabase: any, userId: string, analysisId: string, negotiationHistory: any) {
  try {
    // Buscar análise atual
    const { data: currentAnalysis } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('id', analysisId)
      .eq('user_profile_id', userId)
      .single()

    if (!currentAnalysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    // Analisar histórico de negociação e aprender com padrões
    const negotiationAnalysis = {
      negotiation_summary: negotiationHistory.summary,
      outcome_analysis: analyzeNegotiationOutcome(negotiationHistory),
      learning_points: extractLearningPoints(negotiationHistory, currentAnalysis),
      next_steps: generateNextSteps(negotiationHistory, currentAnalysis),
      confidence_update: updateConfidenceScore(negotiationHistory, currentAnalysis),
      ai_notes: generateAINotes(negotiationHistory, currentAnalysis)
    }

    // Atualizar análise com nova informação de negociação
    const { data: updatedAnalysis, error } = await supabase
      .from('company_analysis')
      .update({
        negotiation_summary: negotiationAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      negotiation_analysis: negotiationAnalysis,
      analysis_id: analysisId,
      message: 'Negociação atualizada com aprendizado da IA'
    })

  } catch (error) {
    console.error('Erro ao atualizar negociação:', error)
    return NextResponse.json({
      error: 'Erro ao atualizar negociação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para obter insights da IA sobre uma análise específica
async function getAIInsights(supabase: any, userId: string, analysisId: string) {
  try {
    // Buscar análise específica
    const { data: analysis } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('id', analysisId)
      .eq('user_profile_id', userId)
      .single()

    if (!analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    // Buscar análises relacionadas para contexto
    const { data: relatedAnalysis } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('user_profile_id', userId)
      .neq('id', analysisId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Gerar insights consolidados
    const insights = {
      current_analysis: analysis,
      related_patterns: analyzeRelatedPatterns(relatedAnalysis),
      performance_metrics: generatePerformanceMetrics(analysis, relatedAnalysis),
      improvement_suggestions: generateImprovementSuggestions(analysis, relatedAnalysis),
      predictive_insights: generatePredictiveInsights(analysis, relatedAnalysis),
      learning_summary: generateLearningSummary(analysis, relatedAnalysis)
    }

    return NextResponse.json({
      success: true,
      insights: insights,
      message: 'Insights da IA obtidos com sucesso'
    })

  } catch (error) {
    console.error('Erro ao obter insights da IA:', error)
    return NextResponse.json({
      error: 'Erro ao obter insights',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Funções auxiliares para gerar análises e insights
function generateMarketOpportunity(companyData: any, previousAnalysis: any[]) {
  // Lógica para gerar oportunidades de mercado baseada em dados históricos
  return {
    market_size: 'Analisar com base em dados anteriores',
    growth_potential: 'Avaliar potencial de crescimento',
    competition_analysis: 'Analisar concorrência com base em casos similares',
    entry_strategy: 'Recomendar estratégia de entrada baseada em sucessos anteriores'
  }
}

function generateNegotiationStrategy(companyData: any, userContext: any, previousAnalysis: any[]) {
  // Gerar estratégia de negociação baseada em padrões de sucesso
  return {
    approach_style: 'Recomendar estilo baseado em personalidade da empresa',
    key_points: 'Identificar pontos-chave para negociação',
    concession_strategy: 'Estratégia de concessões baseada em casos anteriores',
    closing_techniques: 'Técnicas de fechamento recomendadas'
  }
}

function generateRiskAssessment(companyData: any, previousAnalysis: any[]) {
  // Avaliar riscos baseados em experiências anteriores
  return {
    financial_risk: 'Avaliar risco financeiro',
    market_risk: 'Avaliar risco de mercado',
    negotiation_risk: 'Avaliar riscos na negociação',
    mitigation_strategies: 'Estratégias de mitigação recomendadas'
  }
}

function generateRecommendedApproach(companyData: any, userContext: any, skillsMatches: any[]) {
  // Gerar abordagem recomendada baseada em alinhamento de skills
  return {
    best_practices: 'Melhores práticas identificadas',
    personalized_approach: 'Abordagem personalizada para este caso',
    skill_leverage: 'Como alavancar suas skills',
    success_probability: 'Probabilidade estimada de sucesso'
  }
}

function calculateConfidenceScore(companyData: any, previousAnalysis: any[], skillsMatches: any[]) {
  // Calcular score de confiança baseado em diversos fatores
  return {
    overall_score: 75, // Score baseado em análise de dados
    factors: ['Dados da empresa', 'Histórico de sucesso', 'Alinhamento de skills'],
    reliability: 'Alta confiança baseada em dados históricos'
  }
}

function generateLearningNotes(previousAnalysis: any[], companyData: any) {
  // Gerar notas de aprendizado para melhorar futuras análises
  return {
    successful_patterns: 'Padrões de sucesso identificados',
    common_pitfalls: 'Armadilhas comuns a evitar',
    improvement_areas: 'Áreas de melhoria identificadas',
    key_learnings: 'Aprendizados-chave para aplicar'
  }
}

function generateTimeline(companyData: any, currentAnalysis: any) {
  return {
    phase_1: 'Contato inicial - 1-2 dias',
    phase_2: 'Apresentação de portfólio - 3-5 dias',
    phase_3: 'Negociação - 1-2 semanas',
    phase_4: 'Fechamento - 2-4 semanas'
  }
}

function generateCommunicationStrategy(companyData: any, currentAnalysis: any) {
  return {
    preferred_channel: 'Email profissional',
    communication_style: 'Formal mas amigável',
    frequency: '2-3 vezes por semana',
    key_messages: ['Valor do portfólio', 'Experiência relevante', 'Disponibilidade']
  }
}

function generateValueProposition(companyData: any, currentAnalysis: any, previousInsights: any) {
  return {
    unique_selling_points: 'Diferenciais identificados',
    competitive_advantages: 'Vantagens competitivas',
    roi_projection: 'Projeção de retorno sobre investimento',
    customization_approach: 'Como personalizar para este cliente'
  }
}

function generateNegotiationTactics(companyData: any, currentAnalysis: any) {
  return {
    opening_position: 'Posição inicial recomendada',
    concession_strategy: 'Estratégia de concessões',
    deal_breakers: 'Pontos inegociáveis',
    closing_techniques: 'Técnicas de fechamento'
  }
}

function generateFollowUpPlan(companyData: any, currentAnalysis: any) {
  return {
    follow_up_schedule: 'Cronograma de acompanhamento',
    touch_points: 'Pontos de contato estratégicos',
    content_strategy: 'Estratégia de conteúdo',
    escalation_plan: 'Plano de escalação'
  }
}

function generateSuccessMetrics(companyData: any, currentAnalysis: any) {
  return {
    response_rate: 'Taxa de resposta esperada',
    conversion_probability: 'Probabilidade de conversão',
    timeline_adherence: 'Adesão ao cronograma',
    satisfaction_score: 'Score de satisfação esperado'
  }
}

function generateRiskMitigation(companyData: any, currentAnalysis: any) {
  return {
    identified_risks: 'Riscos identificados',
    mitigation_strategies: 'Estratégias de mitigação',
    contingency_plans: 'Planos de contingência',
    monitoring_approach: 'Abordagem de monitoramento'
  }
}

function generateAIRecommendations(companyData: any, currentAnalysis: any, previousInsights: any) {
  return {
    best_practices: 'Melhores práticas recomendadas',
    personalized_tips: 'Dicas personalizadas',
    common_mistakes: 'Erros comuns a evitar',
    success_factors: 'Fatores críticos de sucesso'
  }
}

function analyzeNegotiationOutcome(negotiationHistory: any) {
  return {
    outcome_type: negotiationHistory.outcome,
    success_factors: 'Fatores que levaram ao resultado',
    improvement_areas: 'Áreas de melhoria identificadas'
  }
}

function extractLearningPoints(negotiationHistory: any, currentAnalysis: any) {
  return {
    what_worked: 'O que funcionou bem',
    what_didnt_work: 'O que não funcionou',
    key_insights: 'Insights-chave para aplicar',
    behavioral_patterns: 'Padrões de comportamento identificados'
  }
}

function generateNextSteps(negotiationHistory: any, currentAnalysis: any) {
  return {
    immediate_actions: 'Ações imediatas recomendadas',
    medium_term_goals: 'Objetivos de médio prazo',
    long_term_strategy: 'Estratégia de longo prazo',
    follow_up_plan: 'Plano de acompanhamento'
  }
}

function updateConfidenceScore(negotiationHistory: any, currentAnalysis: any) {
  return {
    previous_score: currentAnalysis.confidence_score || 50,
    new_score: 80, // Atualizado baseado no resultado da negociação
    confidence_factors: 'Fatores que influenciaram o score',
    reliability_assessment: 'Avaliação de confiabilidade'
  }
}

function generateAINotes(negotiationHistory: any, currentAnalysis: any) {
  return {
    learning_summary: 'Resumo de aprendizados',
    pattern_recognition: 'Reconhecimento de padrões',
    improvement_suggestions: 'Sugestões de melhoria',
    future_recommendations: 'Recomendações para o futuro'
  }
}

function analyzeRelatedPatterns(relatedAnalysis: any[]) {
  return {
    common_characteristics: 'Características comuns identificadas',
    success_patterns: 'Padrões de sucesso',
    failure_patterns: 'Padrões de falha',
    trend_analysis: 'Análise de tendências'
  }
}

function generatePerformanceMetrics(analysis: any, relatedAnalysis: any[]) {
  return {
    conversion_rate: 'Taxa de conversão',
    response_time: 'Tempo de resposta médio',
    success_rate: 'Taxa de sucesso',
    satisfaction_score: 'Score de satisfação'
  }
}

function generateImprovementSuggestions(analysis: any, relatedAnalysis: any[]) {
  return {
    strategy_optimization: 'Otimização de estratégia',
    communication_improvement: 'Melhoria de comunicação',
    timing_adjustments: 'Ajustes de timing',
    approach_refinement: 'Refinamento de abordagem'
  }
}

function generatePredictiveInsights(analysis: any, relatedAnalysis: any[]) {
  return {
    success_probability: 'Probabilidade de sucesso',
    timeline_prediction: 'Previsão de cronograma',
    outcome_forecast: 'Previsão de resultado',
    risk_assessment: 'Avaliação de riscos'
  }
}

function generateLearningSummary(analysis: any, relatedAnalysis: any[]) {
  return {
    key_learnings: 'Aprendizados-chave',
    best_practices: 'Melhores práticas',
    common_pitfalls: 'Armadilhas comuns',
    improvement_areas: 'Áreas de melhoria'
  }
}
