import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      approved_company_id, 
      action_type, 
      description, 
      outcome, 
      next_steps, 
      contact_method, 
      contact_person, 
      value, 
      expected_close_date 
    } = body

    if (!approved_company_id || !action_type || !description) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Buscar informações da empresa aprovada
    const { data: companyData, error: companyError } = await supabase
      .from('approved_companies')
      .select('company_name, negotiation_status')
      .eq('id', approved_company_id)
      .eq('user_id', user.id)
      .single()

    if (companyError || !companyData) {
      return NextResponse.json({ error: 'Empresa aprovada não encontrada' }, { status: 404 })
    }

    // Gerar análise da IA sobre a interação
    const aiAnalysis = await generateNegotiationAnalysis(description, outcome, next_steps, companyData)

    // Criar registro de histórico
    const historyData = {
      approved_company_id,
      user_id: user.id,
      action_type,
      description,
      outcome: outcome || null,
      next_steps: next_steps || null,
      contact_method: contact_method || null,
      contact_person: contact_person || null,
      value: value || null,
      expected_close_date: expected_close_date || null,
      ai_analysis: aiAnalysis.analysis,
      ai_recommendations: aiAnalysis.recommendations
    }

    const { data, error } = await supabase
      .from('negotiation_history')
      .insert([historyData])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar histórico:', error)
      return NextResponse.json({ error: 'Erro ao registrar histórico' }, { status: 500 })
    }

    // Atualizar status da negociação se necessário
    let newNegotiationStatus = companyData.negotiation_status
    
    if (action_type === 'contact' && companyData.negotiation_status === 'iniciado') {
      newNegotiationStatus = 'contato_realizado'
    } else if (action_type === 'proposal' && companyData.negotiation_status === 'contato_realizado') {
      newNegotiationStatus = 'proposta_enviada'
    } else if (action_type === 'negotiation' && ['proposta_enviada', 'contato_realizado'].includes(companyData.negotiation_status)) {
      newNegotiationStatus = 'negociacao'
    } else if (action_type === 'contract' && companyData.negotiation_status === 'negociacao') {
      newNegotiationStatus = 'fechado_vitoria'
    }

    if (newNegotiationStatus !== companyData.negotiation_status) {
      await supabase
        .from('approved_companies')
        .update({ 
          negotiation_status: newNegotiationStatus,
          last_contact_date: new Date().toISOString()
        })
        .eq('id', approved_company_id)
        .eq('user_id', user.id)
    }

    // Criar insight da IA sobre a negociação
    const insightData = {
      approved_company_id,
      user_id: user.id,
      insight_type: 'recommendation',
      title: `Negociação: ${action_type}`,
      content: aiAnalysis.analysis,
      confidence_score: aiAnalysis.confidence,
      context_data: {
        action_type,
        outcome,
        next_steps,
        negotiation_status: newNegotiationStatus
      }
    }

    await supabase.from('ai_insights').insert([insightData])

    return NextResponse.json({ 
      success: true, 
      history: data,
      ai_analysis: aiAnalysis,
      new_negotiation_status: newNegotiationStatus,
      message: 'Histórico registrado com sucesso'
    })
    
  } catch (error) {
    console.error('Erro na API de histórico:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function generateNegotiationAnalysis(description: string, outcome?: string, next_steps?: string, companyData?: any) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = `
      Você é um especialista em vendas e negociações B2B.
      
      Analise a seguinte interação de negociação:
      - Descrição: ${description}
      - Resultado: ${outcome || 'Não especificado'}
      - Próximos passos: ${next_steps || 'Não especificado'}
      - Empresa: ${companyData?.company_name || 'Não disponível'}
      - Status atual: ${companyData?.negotiation_status || 'Não disponível'}
      
      Forneça:
      1. Uma análise detalhada da situação (máximo 200 palavras)
      2. 3 recomendações específicas para os próximos passos
      3. Um score de confiança (0-100) sobre as chances de sucesso
      
      Retorne em formato JSON:
      {
        "analysis": "Análise detalhada aqui",
        "recommendations": ["recomendação1", "recomendação2", "recomendação3"],
        "confidence": 85
      }
    `
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback
    return {
      analysis: `Interação registrada: ${description}. ${outcome ? `Resultado: ${outcome}` : ''}`,
      recommendations: [
        'Acompanhar próximos passos definidos',
        'Manter comunicação regular com o cliente',
        'Preparar material adicional se necessário'
      ],
      confidence: 70
    }
    
  } catch (error) {
    console.error('Erro ao gerar análise da IA:', error)
    
    return {
      analysis: `Interação registrada com sucesso. Descrição: ${description}`,
      recommendations: [
        'Monitorar progresso da negociação',
        'Manter registro de todas as interações',
        'Preparar follow-up adequado'
      ],
      confidence: 60
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const approved_company_id = searchParams.get('approved_company_id')

    if (!approved_company_id) {
      return NextResponse.json({ error: 'ID da empresa é obrigatório' }, { status: 400 })
    }

    // Buscar histórico de negociações
    const { data, error } = await supabase
      .from('negotiation_history')
      .select('*')
      .eq('approved_company_id', approved_company_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
    }

    return NextResponse.json({ history: data })
    
  } catch (error) {
    console.error('Erro na API de histórico:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
