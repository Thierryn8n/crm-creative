import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/potential-clients/[id]/reject - Reject a potential client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    
    const { data, error } = await supabase
      .from('potential_clients')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error rejecting potential client:', error)
      return NextResponse.json({ error: 'Failed to reject potential client' }, { status: 500 })
    }

    return NextResponse.json({ success: true, client: data })
  } catch (error) {
    console.error('Error in reject potential client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}