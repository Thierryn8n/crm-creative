import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

const PROFILE_COOKIE = 'crm_profile_id'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let profileId: string | null = null
    if (user) {
      profileId = user.id
    } else {
      profileId = request.cookies.get(PROFILE_COOKIE)?.value || null
      if (!profileId) {
        const { data: inserted } = await supabase
          .from('user_profiles')
          .insert([{ user_name: 'Usuário', email: null }])
          .select('id')
          .single()
        if (!inserted) {
          return NextResponse.json({ error: 'Falha ao criar perfil' }, { status: 500 })
        }
        profileId = inserted.id
        const setCookie = NextResponse.next()
        setCookie.cookies.set(PROFILE_COOKIE, profileId || '', { httpOnly: true, sameSite: 'lax', path: '/' })
      }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()

    const { data: portfolio } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', profileId)
      .eq('category', 'resume')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({ profile, portfolio: portfolio || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let profileId: string | null = null
    if (user) {
      profileId = user.id
    } else {
      profileId = request.cookies.get(PROFILE_COOKIE)?.value || null
      if (!profileId) {
        const { data: inserted } = await supabase
          .from('user_profiles')
          .insert([{ user_name: 'Usuário', email: null }])
          .select('id')
          .single()
        if (!inserted) {
          return NextResponse.json({ error: 'Falha ao criar perfil' }, { status: 500 })
        }
        profileId = inserted.id
      }
    }

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const linkedin_url = form.get('linkedin_url')?.toString() || null
      const resume_text = form.get('resume_text')?.toString() || null
      const file = form.get('pdf') as File | null

      await supabase
        .from('user_profiles')
        .upsert({
          id: profileId,
          user_name: user?.user_metadata?.full_name || user?.email || 'Usuário',
          email: user?.email || null,
          linkedin_url,
          resume_text,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      let pdfUrl: string | null = null
      if (file && file.size > 0) {
        console.log(`[Upload] Iniciando upload de arquivo: ${file.name} (${file.size} bytes)`)
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const path = `${profileId}/${Date.now()}-${file.name}`
        
        // Tentar upload para o bucket 'user-files' que criamos
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(path, bytes, { contentType: file.type, upsert: true })
        
        if (!uploadError) {
          console.log('[Upload] Upload para user-files concluído com sucesso:', uploadData?.path)
          const { data: publicUrl } = supabase.storage.from('user-files').getPublicUrl(path)
          pdfUrl = publicUrl?.publicUrl || null
        } else {
          console.error('[Upload] Erro no bucket user-files:', uploadError.message, uploadError)
          // Fallback para o bucket antigo 'resumes' se o novo falhar por algum motivo
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('resumes')
            .upload(path, bytes, { contentType: file.type, upsert: true })
          
          if (!fallbackError) {
            console.log('[Upload] Upload para resumes (fallback) concluído com sucesso:', fallbackData?.path)
            const { data: publicUrl } = supabase.storage.from('resumes').getPublicUrl(path)
            pdfUrl = publicUrl?.publicUrl || null
          } else {
            console.error('[Upload] Erro no bucket resumes (fallback):', fallbackError.message)
          }
        }

        if (pdfUrl) {
          console.log(`[Upload] PDF URL gerada: ${pdfUrl}. Iniciando inserção no banco...`)
          
          // Salvar na tabela portfolio_items para visualização na lista de arquivos
          const { error: portfolioError } = await supabase
            .from('portfolio_items')
            .insert([{
              user_id: profileId,
              title: file.name || 'Currículo PDF',
              description: 'Currículo do usuário',
              type: 'pdf',
              category: 'resume',
              thumbnail_url: null,
              media_urls: [pdfUrl],
              external_id: null,
              source_table: 'user_profiles'
            }])
          
          if (portfolioError) {
            console.error('[Upload] Erro ao inserir em portfolio_items:', portfolioError.message)
          } else {
            console.log('[Upload] Registro inserido em portfolio_items com sucesso.')
          }
          
          // Também salvar na tabela user_resumes para a IA usar
          const { error: resumeError } = await supabase
            .from('user_resumes')
            .upsert({
              user_id: profileId,
              type: 'resume',
              content: `Conteúdo do arquivo PDF: ${file.name}. (Aguardando processamento profundo)`,
              file_url: pdfUrl,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,type' })

          if (resumeError) {
            console.error('[Upload] Erro ao inserir em user_resumes:', resumeError.message)
          } else {
            console.log('[Upload] Registro inserido em user_resumes com sucesso.')
          }
        }
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()

      const { data: portfolio } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', profileId)
        .eq('category', 'resume')
        .order('created_at', { ascending: false })
        .limit(5)

      const res = NextResponse.json({ 
        success: !file || (file && pdfUrl), 
        profile, 
        portfolio: portfolio || [], 
        pdfUrl,
        error: (file && !pdfUrl) ? 'Falha ao fazer upload do arquivo. Verifique se o Storage está configurado.' : null
      })
      if (!user && profileId) {
        res.cookies.set(PROFILE_COOKIE, profileId, { httpOnly: true, sameSite: 'lax', path: '/' })
      }
      return res
    } else {
      const body = await request.json()
      const { linkedin_url, resume_text } = body

      await supabase
        .from('user_profiles')
        .upsert({
          id: profileId,
          user_name: user?.user_metadata?.full_name || user?.email || 'Usuário',
          email: user?.email || null,
          linkedin_url: linkedin_url ?? null,
          resume_text: resume_text ?? null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      const res = NextResponse.json({ success: true })
      if (!user && profileId) {
        res.cookies.set(PROFILE_COOKIE, profileId, { httpOnly: true, sameSite: 'lax', path: '/' })
      }
      return res
    }
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
