import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const relatedClientId = searchParams.get('related_client_id')
    const companyName = searchParams.get('company_name')
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar análises da IA
    let query = supabase
      .from('company_analysis')
      .select(`*`)
      .order('created_at', { ascending: false })

    if (relatedClientId) {
      query = query.eq('related_client_id', relatedClientId)
    } else if (companyName) {
      query = query.ilike('company_name', companyName)
    }

    const { data: aiAnalysis, error } = await query

    if (error) {
      console.error('Erro ao buscar análises:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar análises',
        details: error.message 
      }, { status: 500 })
    }

    // Transformar dados para o formato esperado
    const transformedData = aiAnalysis?.map((analysis: any) => ({
      id: analysis.id,
      company_name: analysis.company_name || 'Empresa Sem Nome',
      analysis_type: analysis.strategy_generated ? 'post_approval' : 'pre_approval',
      status: analysis.analysis_status || analysis.status || 'pending',
      ai_data: {
        website_analysis: analysis.website_analysis,
        social_media: analysis.social_media_presence,
        linkedin_data: analysis.linkedin_analysis,
        trends_analysis: analysis.trends_analysis,
        ads_analysis: analysis.ads_analysis,
        strategy_generated: analysis.strategy_generated
      },
      user_notes: analysis.notes,
      negotiation_details: analysis.negotiation_summary,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at || analysis.last_updated
    })) || []

    return NextResponse.json(transformedData)
    
  } catch (error) {
    console.error('Erro na API de análises IA:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

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
      company_name, 
      analysis_type, 
      ai_data, 
      user_notes, 
      negotiation_details 
    } = body

    // Criar nova análise
    const { data: newAnalysis, error } = await supabase
      .from('company_analysis')
      .insert([{
        company_name,
        user_profile_id: user.id,
        website_analysis: ai_data?.website_analysis,
        social_media_analysis: ai_data?.social_media,
        linkedin_data: ai_data?.linkedin_data,
        trends_analysis: ai_data?.trends_analysis,
        ads_analysis: ai_data?.ads_analysis,
        strategy_generated: ai_data?.strategy_generated,
        notes: user_notes,
        negotiation_summary: negotiation_details,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar análise:', error)
      return NextResponse.json({ 
        error: 'Erro ao criar análise',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: newAnalysis 
    })
    
  } catch (error) {
    console.error('Erro na API de criação de análise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
