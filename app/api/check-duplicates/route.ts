import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { companyNames } = body

    if (!Array.isArray(companyNames) || companyNames.length === 0) {
      return NextResponse.json({ exists: [] })
    }

    // 1. Check existing clients
    const { data: existingClients } = await supabase
      .from('clients')
      .select('company_name')
      .in('company_name', companyNames)

    // 2. Check potential clients
    const { data: existingPotentials } = await supabase
      .from('potential_clients')
      .select('company_name')
      .in('company_name', companyNames)

    const existingNames = new Set([
      ...(existingClients?.map(c => c.company_name) || []),
      ...(existingPotentials?.map(c => c.company_name) || [])
    ])

    return NextResponse.json({ 
      exists: Array.from(existingNames) 
    })
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 })
  }
}
