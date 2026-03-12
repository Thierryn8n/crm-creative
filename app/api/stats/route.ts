import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get client counts by status
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('status')

    if (clientsError) {
      console.error('Error fetching client stats:', clientsError)
      return NextResponse.json({ error: clientsError.message }, { status: 500 })
    }

    // Get sent emails count
    const { count: emailsCount, error: emailsError } = await supabase
      .from('sent_emails')
      .select('*', { count: 'exact', head: true })

    // Get AI searches count
    const { count: searchesCount, error: searchesError } = await supabase
      .from('ai_searches')
      .select('*', { count: 'exact', head: true })

    const stats = {
      totalClients: clients?.length || 0,
      leads: clients?.filter(c => c.status === 'lead').length || 0,
      contacted: clients?.filter(c => c.status === 'contacted').length || 0,
      negotiating: clients?.filter(c => c.status === 'negotiating').length || 0,
      clients: clients?.filter(c => c.status === 'client').length || 0,
      lost: clients?.filter(c => c.status === 'lost').length || 0,
      emailsSent: emailsError ? 0 : (emailsCount || 0),
      aiSearches: searchesError ? 0 : (searchesCount || 0)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/stats:', error)
    return NextResponse.json({
      totalClients: 0,
      leads: 0,
      contacted: 0,
      negotiating: 0,
      clients: 0,
      lost: 0,
      emailsSent: 0,
      aiSearches: 0
    })
  }
}
