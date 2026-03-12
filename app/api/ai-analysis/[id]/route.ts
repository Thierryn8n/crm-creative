import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { status, user_notes, negotiation_details, ai_data } = body

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (status !== undefined) updateData.analysis_status = status
    if (user_notes !== undefined) updateData.notes = user_notes
    if (negotiation_details !== undefined) updateData.negotiation_summary = negotiation_details
    
    // Atualizar dados da IA se fornecidos
    if (ai_data) {
      if (ai_data.website_analysis) updateData.website_analysis = ai_data.website_analysis
      if (ai_data.social_media) updateData.social_media_analysis = ai_data.social_media
      if (ai_data.linkedin_data) updateData.linkedin_data = ai_data.linkedin_data
      if (ai_data.trends_analysis) updateData.trends_analysis = ai_data.trends_analysis
      if (ai_data.ads_analysis) updateData.ads_analysis = ai_data.ads_analysis
      if (ai_data.strategy_generated) updateData.strategy_generated = ai_data.strategy_generated
    }

    // Atualizar timestamp
    updateData.updated_at = new Date().toISOString()

    // Atualizar análise
    const { data: updatedAnalysis, error } = await supabase
      .from('company_analysis')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_profile_id', user.id) // Garantir que só o dono pode atualizar
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar análise:', error)
      return NextResponse.json({ 
        error: 'Erro ao atualizar análise',
        details: error.message 
      }, { status: 500 })
    }

    if (!updatedAnalysis) {
      return NextResponse.json({ 
        error: 'Análise não encontrada ou sem permissão'
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedAnalysis 
    })
    
  } catch (error) {
    console.error('Erro na API de atualização de análise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 1. Buscar o nome da empresa antes de deletar
    const { data: analysis, error: fetchError } = await supabase
      .from('company_analysis')
      .select('company_name')
      .eq('id', params.id)
      .eq('user_profile_id', user.id)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar análise antes de deletar:', fetchError)
    }

    // 2. Deletar análise
    const { error: deleteError } = await supabase
      .from('company_analysis')
      .delete()
      .eq('id', params.id)
      .eq('user_profile_id', user.id) // Garantir que só o dono pode deletar

    if (deleteError) {
      console.error('Erro ao deletar análise:', deleteError)
      return NextResponse.json({ 
        error: 'Erro ao deletar análise',
        details: deleteError.message 
      }, { status: 500 })
    }

    // 3. Remover da memória da IA se o nome da empresa for encontrado
    try {
      if (analysis?.company_name) {
        await supabase
          .from('ai_search_memory')
          .delete()
          .eq('user_id', user.id)
          .eq('company_name', analysis.company_name)
      }
    } catch (memError) {
      console.warn('Falha ao remover da memória da IA após exclusão de análise:', memError)
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro na API de exclusão de análise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
