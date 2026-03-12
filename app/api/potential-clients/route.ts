import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/potential-clients - List all potential clients
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. Buscar potenciais clientes
    const { data: clients, error } = await supabase
      .from('potential_clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching potential clients:', error)
      return NextResponse.json({ error: 'Failed to fetch potential clients' }, { status: 500 })
    }

    // 2. Verificar quais possuem análise da IA
    const { data: analyses } = await supabase
      .from('company_analysis')
      .select('company_name')

    const analyzedCompanyNames = new Set(
      analyses?.map(a => a.company_name?.toLowerCase()).filter(Boolean)
    )

    // 3. Mesclar informação
    const clientsWithAnalysis = (clients || []).map(client => ({
      ...client,
      has_analysis: analyzedCompanyNames.has(client.company_name?.toLowerCase())
    }))

    return NextResponse.json({ clients: clientsWithAnalysis })
  } catch (error) {
    console.error('Error in potential clients GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}