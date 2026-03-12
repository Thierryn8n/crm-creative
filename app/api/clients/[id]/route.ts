import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // 1. Primeiro, buscar o cliente atual para pegar o full_company_data existente
    const { data: currentClient, error: getError } = await supabase
      .from('clients')
      .select('full_company_data')
      .eq('id', id)
      .single();

    if (getError) {
      console.error('Error fetching current client for update:', getError);
      return NextResponse.json({ error: getError.message }, { status: 500 });
    }

    // 2. Separar campos fixos de campos que devem ir para o JSON
    const { company_name, status, priority, full_company_data, ...rest } = body;

    // 3. Mesclar novos dados no full_company_data
    const updatedFullData = {
      ...(currentClient.full_company_data || {}),
      ...(full_company_data || {}),
      ...rest,
      updated_at: new Date().toISOString()
    };

    // 4. Preparar objeto de atualização final
    const updateData: any = {
      full_company_data: updatedFullData
    };
    if (company_name) updateData.company_name = company_name;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Buscar o nome da empresa antes de deletar para limpar a memória da IA
    const { data: client, error: getError } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', id)
      .single()

    if (getError) {
      console.error('Error fetching client before deletion:', getError)
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    // 2. Deletar o cliente
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting client:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 3. Remover da memória da IA para que possa ser sugerida novamente no futuro
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && client?.company_name) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile) {
          await supabase
            .from('ai_search_memory')
            .delete()
            .eq('profile_id', profile.id)
            .eq('company_name', client.company_name)
        }
      }
    } catch (memError) {
      console.warn('Falha ao remover da memória da IA após exclusão:', memError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
