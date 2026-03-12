import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items deve ser um array' }, { status: 400 })
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

    // Atualizar cada item
    // Nota: Supabase não tem uma função de bulk update por ID com valores diferentes nativa via .update() 
    // que funcione para múltiplos registros com IDs diferentes de uma só vez de forma simples.
    // Usaremos Promise.all para atualizações individuais ou um RPC se necessário.
    // Para uma lista pequena de cards no Kanban, Promise.all é aceitável.
    
    const updates = items.map(item => {
      const updateData: any = {}
      if (item.status !== undefined) updateData.analysis_status = item.status
      if (item.kanban_order !== undefined) updateData.kanban_order = item.kanban_order
      updateData.updated_at = new Date().toISOString()

      return supabase
        .from('company_analysis')
        .update(updateData)
        .eq('id', item.id)
        .eq('profile_id', profileId)
    })

    const results = await Promise.all(updates)
    
    const errors = results.filter(r => r.error).map(r => r.error)
    
    if (errors.length > 0) {
      console.error('Erros no bulk update:', errors)
      return NextResponse.json({ 
        error: 'Algumas atualizações falharam',
        details: errors 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro na API de bulk update:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
