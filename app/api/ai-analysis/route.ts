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

    // Buscar análises da IA vinculadas ao perfil do usuário
    let query = supabase
      .from('company_analysis')
      .select(`*`)
      .eq('profile_id', profileId)
      .order('kanban_order', { ascending: true })
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
      kanban_order: analysis.kanban_order || 0,
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
    console.log('API received body:', JSON.stringify(body, null, 2))
    
    const { 
      company_name, 
      status,
      ai_data, 
      related_client_id
    } = body

     // Validate company_name
     if (!company_name || typeof company_name !== 'string' || company_name.trim() === '') {
       console.log('Invalid company_name:', company_name)
       return NextResponse.json({ 
         error: 'Nome da empresa é obrigatório',
         details: 'O campo company_name não pode estar vazio'
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

    let safeRelatedClientId: string | null = null
    if (related_client_id) {
      const { data: realClient } = await supabase
        .from('real_clients')
        .select('id')
        .eq('id', related_client_id)
        .maybeSingle()

      if (realClient?.id) {
        safeRelatedClientId = realClient.id
      } else {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('id', related_client_id)
          .maybeSingle()

        if (client?.id) {
          safeRelatedClientId = client.id
        }
      }
    }

    const baseInsertData: any = {
      company_name,
      profile_id: profileId,
      related_client_id: safeRelatedClientId,
      analysis_status: status || 'pending'
    }

    const attemptInsert = async (payload: any) => {
      return await supabase
        .from('company_analysis')
        .insert([payload])
        .select()
        .single()
    }

    let insertData: any = { ...baseInsertData }
    let newAnalysis: any = null
    let error: any = null

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await attemptInsert(insertData)
      newAnalysis = result.data
      error = result.error

      if (!error) {
        break
      }

      if (error.code === '23505') {
        const suffix = new Date().toISOString().replace('T', ' ').slice(0, 19)
        insertData.company_name = `${company_name} (${suffix})`
        continue
      }

      if (error.code === '42501') {
        return NextResponse.json({ 
          error: 'Sem permissão para criar análise',
          details: error.message
        }, { status: 403 })
      }

      const columnMatch = error.message?.match(/column \"(.+?)\" of relation \"company_analysis\" does not exist/)
      if (columnMatch) {
        const missingColumn = columnMatch[1]
        if (missingColumn in insertData) {
          delete insertData[missingColumn]
        }
        if (missingColumn === 'analysis_status' && !('status' in insertData)) {
          insertData.status = status || 'pending'
        }
        continue
      }

      break
    }

    if (error) {
      console.error('Erro ao criar análise:', error)
      return NextResponse.json({ 
        error: 'Erro ao criar análise',
        details: error.message
      }, { status: 500 })
    }

    const transformed = {
      id: newAnalysis.id,
      company_name: newAnalysis.company_name || 'Empresa Sem Nome',
      analysis_type: newAnalysis.strategy_generated ? 'post_approval' : 'pre_approval',
      status: newAnalysis.analysis_status || newAnalysis.status || 'pending',
      ai_data: {
        website_analysis: newAnalysis.website_analysis,
        social_media: newAnalysis.social_media_presence,
        linkedin_data: newAnalysis.linkedin_analysis,
        trends_analysis: newAnalysis.trends_analysis || newAnalysis.market_analysis,
        ads_analysis: newAnalysis.ads_analysis,
        strategy_generated: newAnalysis.strategy_generated || newAnalysis.ai_strategy
      },
      user_notes: newAnalysis.notes,
      negotiation_details: newAnalysis.negotiation_summary,
      kanban_order: newAnalysis.kanban_order || 0,
      created_at: newAnalysis.created_at,
      updated_at: newAnalysis.updated_at || newAnalysis.last_updated
    }

    return NextResponse.json(transformed)
    
  } catch (error) {
    console.error('Erro na API de criação de análise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
