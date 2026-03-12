import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // 1. Buscar clientes
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('company_name', `%${search}%`)
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 2. Verificar quais clientes possuem análise da IA
    // Buscamos todas as análises do usuário para cruzar os dados
    const { data: analyses } = await supabase
      .from('company_analysis')
      .select('related_client_id, company_name')

    // Criar um Set de IDs de clientes que possuem análise para busca rápida
    const analyzedClientIds = new Set(
      analyses?.map(a => a.related_client_id).filter(Boolean)
    )
    
    // Criar um Set de nomes de empresas que possuem análise (caso o ID não esteja vinculado)
    const analyzedCompanyNames = new Set(
      analyses?.map(a => a.company_name?.toLowerCase()).filter(Boolean)
    )

    // 3. Mesclar a informação de análise nos clientes
    const clientsWithAnalysisInfo = (clients || []).map(client => ({
      ...client,
      has_analysis: analyzedClientIds.has(client.id) || 
                    analyzedCompanyNames.has(client.company_name?.toLowerCase())
    }))

    return NextResponse.json(clientsWithAnalysisInfo)
  } catch (error) {
    console.error('Error in GET /api/clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Consolidate data into full_company_data
    const { company_name, status, priority, full_company_data, ...rest } = body;
    
    // IMPORTANTE: Garantir que TODOS os campos de rest e o próprio full_company_data 
    // sejam fundidos no objeto final para a coluna JSONB
    const mergedFullData = {
      ...(full_company_data || {}),
      ...rest,
      collected_at: new Date().toISOString()
    };

    const clientData = {
      company_name,
      status: status || 'lead',
      priority: priority || 'medium',
      full_company_data: mergedFullData
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Adicionar à memória da IA para evitar sugestões repetidas em buscas futuras
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile) {
          await supabase
            .from('ai_search_memory')
            .upsert({
              profile_id: profile.id,
              company_name: clientData.company_name,
              website_url: mergedFullData.website || null,
              status: 'interested',
              metadata: {
                source: 'registration',
                industry: mergedFullData.industry || null,
                city: mergedFullData.city || null
              }
            }, { onConflict: 'profile_id,company_name' })
        }
      }
    } catch (memError) {
      console.warn('Falha ao registrar na memória da IA:', memError)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/clients:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
