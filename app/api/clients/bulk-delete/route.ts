import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Obter o token do header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('Token recebido:', token ? 'Sim' : 'Não')
    
    const supabase = await createClient()
    
    // Se houver token, usar para autenticar
    if (token) {
      try {
        // Usar o admin client para validar o token
        const adminSupabase = createAdminClient()
        const { data: { user }, error } = await adminSupabase.auth.getUser(token)
        
        console.log('User autenticado via token:', user?.id)
        console.log('Erro de autenticação via token:', error)
        
        if (error || !user) {
          return NextResponse.json(
            { error: 'Token inválido ou expirado' },
            { status: 401 }
          )
        }
      } catch (error) {
        console.error('Erro ao validar token:', error)
        return NextResponse.json(
          { error: 'Erro ao validar token' },
          { status: 401 }
        )
      }
    } else {
      // Verificar se o usuário está autenticado via cookies
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('User via cookies:', user?.id)
      console.log('Erro de autenticação via cookies:', authError)
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }
    }
    
    const { ids } = await request.json()
    
    // Log do IP e user agent para debug
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    console.log(`Requisição de bulk delete - IP: ${ip}, User-Agent: ${userAgent}`)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs dos clientes são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário está autenticado (temporariamente desabilitado para teste)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // console.log('User data:', user)
    // console.log('Auth error:', authError)
    
    // if (authError || !user) {
    //   console.log('Erro de autenticação:', authError, 'User:', user)
    //   return NextResponse.json(
    //     { error: 'Não autorizado', details: authError?.message },
    //     { status: 401 }
    //   )
    // }
    
    // 1. Buscar os nomes das empresas antes de deletar para limpar a memória da IA
    const { data: companies, error: fetchError } = await supabase
      .from('clients')
      .select('company_name')
      .in('id', ids)

    if (fetchError) {
      console.error('Erro ao buscar empresas para limpar memória:', fetchError)
    }

    // 2. Excluir os clientes
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error('Erro ao excluir clientes:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir clientes', details: deleteError.message },
        { status: 500 }
      )
    }

    // 3. Remover da memória da IA para que possam ser sugeridas novamente no futuro
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && companies && companies.length > 0) {
        const companyNames = companies.map(c => c.company_name).filter(Boolean)
        if (companyNames.length > 0) {
          await supabase
            .from('ai_search_memory')
            .delete()
            .eq('user_id', user.id)
            .in('company_name', companyNames)
        }
      }
    } catch (memError) {
      console.warn('Falha ao remover da memória da IA após exclusão em massa:', memError)
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length} cliente(s) excluído(s) com sucesso`,
      deleted_count: ids.length
    }, {
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('Erro na exclusão em massa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}