import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { client_id, to_email, subject, body: emailBody, template_id } = body

    // Log the sent email
    const { data: sentEmail, error: sentError } = await supabase
      .from('sent_emails')
      .insert([{
        client_id,
        to_email,
        subject,
        body: emailBody,
        template_id,
        status: 'sent'
      }])
      .select()
      .single()

    if (sentError) {
      console.error('Error logging sent email:', sentError)
      return NextResponse.json({ error: sentError.message }, { status: 500 })
    }

    // Log interaction
    await supabase
      .from('interactions')
      .insert([{
        client_id,
        type: 'email',
        subject,
        content: emailBody,
        direction: 'outbound'
      }])

    // Update last contact date on client
    const { data: currentClient } = await supabase
      .from('clients')
      .select('full_company_data')
      .eq('id', client_id)
      .single();

    if (currentClient) {
      const updatedFullData = {
        ...(currentClient.full_company_data || {}),
        last_contact_date: new Date().toISOString()
      };
      
      await supabase
        .from('clients')
        .update({ full_company_data: updatedFullData })
        .eq('id', client_id);
    }

    // Here you would integrate with an actual email service like SendGrid, Resend, etc.
    // For now, we just log the email as sent
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email logged successfully. Configure email service for actual sending.',
      email: sentEmail
    })
  } catch (error) {
    console.error('Error in POST /api/send-email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
