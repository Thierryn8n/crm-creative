import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// API para gerenciar negociações e atualizar análises com informações do usuário
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { analysis_id, negotiation_data } = body

    // Validar dados
    if (!analysis_id || !negotiation_data) {
      return NextResponse.json({ 
        error: 'Dados incompletos',
        required: ['analysis_id', 'negotiation_data']
      }, { status: 400 })
    }

    // Verificar se a análise existe
    const { data: analysis } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('id', analysis_id)
      .single()

    if (!analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    // Criar registro de negociação
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiations')
      .insert([{
        analysis_id,
        user_id: user.id,
        negotiation_summary: negotiation_data.negotiation_summary,
        outcome: negotiation_data.outcome,
        agreed_value: negotiation_data.agreed_value,
        timeline: negotiation_data.timeline,
        key_points: negotiation_data.key_points.filter((point: string) => point.trim() !== ''),
        contact_person: negotiation_data.contact_person,
        follow_up_actions: negotiation_data.follow_up_actions,
        lessons_learned: negotiation_data.lessons_learned,
        next_steps: negotiation_data.next_steps,
        user_notes: negotiation_data.user_notes,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (negotiationError) {
      console.error('Erro ao salvar negociação:', negotiationError)
      return NextResponse.json({ 
        error: 'Erro ao salvar negociação',
        details: negotiationError.message 
      }, { status: 500 })
    }

    // Atualizar análise com informações da negociação
    const { error: updateError } = await supabase
      .from('company_analysis')
      .update({
        negotiation_summary: {
          negotiation_id: negotiation.id,
          outcome: negotiation_data.outcome,
          summary: negotiation_data.negotiation_summary,
          agreed_value: negotiation_data.agreed_value,
          timeline: negotiation_data.timeline,
          contact_person: negotiation_data.contact_person,
          lessons_learned: negotiation_data.lessons_learned,
          next_steps: negotiation_data.next_steps
        },
        analysis_status: negotiation_data.outcome === 'success' ? 'completed' : 
                         negotiation_data.outcome === 'failure' ? 'failed' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis_id)

    if (updateError) {
      console.error('Erro ao atualizar análise:', updateError)
      // Não falhar completamente, pois a negociação foi salva
    }

    // Chamar IA para processar aprendizado da negociação
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_negotiation',
          analysis_id: analysis_id,
          negotiation_history: {
            summary: negotiation_data.negotiation_summary,
            outcome: negotiation_data.outcome,
            lessons: negotiation_data.lessons_learned,
            key_points: negotiation_data.key_points,
            timeline: negotiation_data.timeline
          }
        })
      })

      if (!aiResponse.ok) {
        console.warn('IA não conseguiu processar aprendizado da negociação')
      }
    } catch (aiError) {
      console.warn('Erro ao chamar IA para processar negociação:', aiError)
      // Não falhar a requisição principal por causa da IA
    }

    return NextResponse.json({
      success: true,
      negotiation: negotiation,
      message: 'Negociação registrada com sucesso e IA atualizada com aprendizados'
    })

  } catch (error) {
    console.error('Erro na API de negociação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Buscar negociações de uma análise específica
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('analysis_id')

    if (!analysisId) {
      return NextResponse.json({ error: 'analysis_id é obrigatório' }, { status: 400 })
    }

    // Buscar negociações da análise
    const { data: negotiations, error } = await supabase
      .from('negotiations')
      .select('*')
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar negociações:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar negociações',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      negotiations: negotiations || [],
      message: 'Negociações recuperadas com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de negociações:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
