import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    const { id } = params

    // Buscar empresa aprovada
    const { data: company, error: companyError } = await supabase
      .from('approved_companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Buscar histórico de negociações
    const { data: negotiations, error: negotiationsError } = await supabase
      .from('negotiation_history')
      .select('*')
      .eq('company_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (negotiationsError) {
      console.error('Erro ao buscar negociações:', negotiationsError)
    }

    return NextResponse.json({ 
      company,
      negotiations: negotiations || []
    })
    
  } catch (error) {
    console.error('Erro na API de empresa individual:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
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

    const { id } = params
    const body = await request.json()
    
    // Campos permitidos para atualização
    const allowedFields = ['status', 'negotiation_status', 'priority', 'negotiation_value', 'next_action_date', 'assigned_to']
    const updateData: any = {}
    
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualização' }, { status: 400 })
    }

    // Atualizar updated_at
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('approved_companies')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar empresa:', error)
      return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 })
    }

    return NextResponse.json({ company: data })
    
  } catch (error) {
    console.error('Erro na API de atualização:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}