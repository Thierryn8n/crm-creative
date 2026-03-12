import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// API para gerenciar versões salvas de análises IA
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
      analysis_id,
      version_type,
      data_snapshot,
      user_notes,
      approval_notes
    } = body

    // Validar dados
    if (!analysis_id || !version_type || !data_snapshot) {
      return NextResponse.json({ 
        error: 'Dados incompletos',
        required: ['analysis_id', 'version_type', 'data_snapshot']
      }, { status: 400 })
    }

    // Buscar o profile_id real do usuário logado
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const profileId = profile.id

    // Verificar se a análise pertence ao usuário
    const { data: analysis } = await supabase
      .from('company_analysis')
      .select('id')
      .eq('id', analysis_id)
      .eq('profile_id', profileId)
      .single()

    if (!analysis) {
      return NextResponse.json({ error: 'Análise não encontrada ou não autorizada' }, { status: 404 })
    }

    // Criar versão salva
    const { data: version, error } = await supabase
      .from('ai_analysis_versions')
      .insert([{
        analysis_id,
        version_type,
        data_snapshot,
        user_notes,
        approval_notes,
        profile_id: profileId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar versão:', error)
      return NextResponse.json({ 
        error: 'Erro ao salvar versão',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      version: version,
      message: 'Versão salva com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de versões:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Buscar versões de uma análise específica
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

    // Buscar o profile_id real do usuário logado
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const profileId = profile.id

    // Buscar versões da análise
    const { data: versions, error } = await supabase
      .from('ai_analysis_versions')
      .select('*')
      .eq('analysis_id', analysisId)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar versões:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar versões',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      versions: versions || [],
      message: 'Versões recuperadas com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de versões:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
