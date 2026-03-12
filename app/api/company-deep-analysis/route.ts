import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

async function callGemini(model: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY ausente')
  
  const invoke = async (m: string) => {
    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [
        {
          googleSearch: {}
        }
      ],
      generationConfig: { 
        temperature: 0.1,
        topK: 40, 
        topP: 0.95, 
        maxOutputTokens: 4096
      }
    }

    return fetch(`${GEMINI_API_URL}/${m}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
  
  let resp = await invoke(model)
  if (resp.status === 404 && !model.endsWith('-latest')) {
    resp = await invoke(`${model}-latest`)
  }
  if (!resp.ok) {
    const msg = await resp.text().catch(() => '')
    throw new Error(`Falha na Gemini API: ${msg}`)
  }
  const data = await resp.json()
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  // Limpeza de markdown super robusta (essencial sem responseMimeType)
  // 1. Tenta pegar o que está dentro do bloco markdown ```json ... ```
  if (text.includes('```json')) {
    text = text.split('```json')[1].split('```')[0].trim()
  } else if (text.includes('```')) {
    text = text.split('```')[1].split('```')[0].trim()
  }
  
  // 2. Sempre tenta encontrar o JSON válido mais externo, mesmo que tenha passado pelo split acima ou não
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1)
  }
  
  return text
}

async function collectWebData(
  companyName: string,
  websiteUrl?: string,
  linkedinUrl?: string,
  instagramUrl?: string,
  facebookUrl?: string,
  twitterUrl?: string
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/web-scraper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName,
        websiteUrl,
        linkedinUrl,
        instagramUrl,
        facebookUrl,
        twitterUrl
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`Falha ao coletar dados da web: ${response.status}`)
    const data = await response.json()
    console.log(`[Analysis] Dados da web coletados para ${companyName}:`, {
      hasWebsite: !!data.website,
      hasLinkedin: !!data.linkedin,
      hasSocialMedia: !!data.socialMedia
    })
    return data
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.warn('[Analysis] Timeout na coleta de dados da web (25s)')
      return {
        companyName,
        website: null,
        linkedin: null,
        socialMedia: {},
        adCampaigns: null,
        marketTrends: null,
        error: 'Timeout na coleta de dados'
      }
    }
    console.error('[Analysis] Erro ao coletar dados da web:', error.message)
    return {
      companyName,
      website: null,
      linkedin: null,
      socialMedia: {},
      adCampaigns: null,
      marketTrends: null,
      error: error.message
    }
  }
}

async function getUserProfile(supabase: any, userId: string) {
  console.log(`[Analysis] Buscando perfil e currículo para user_id: ${userId}`)
  
  // 1. Buscar dados básicos do perfil
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  // 2. Buscar o currículo mais recente na tabela user_resumes
  const { data: resume, error: resumeError } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (resumeError) {
    console.error(`[Analysis] Erro ao buscar currículo para ${userId}:`, resumeError.message)
  }

  // 3. Buscar itens do portfólio
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (profileError && !profile) {
    console.warn(`[Analysis] Perfil não encontrado para ${userId}. Retornando vazio.`)
    return {
      user_name: 'Usuário',
      skills: [],
      specialties: [],
      experience_years: 0,
      bio: '',
      resume_text: '',
      portfolio: []
    }
  }

  let finalResumeText = ''
  let source = ''

  // 1. PRIORIDADE ABSOLUTA: Coluna resume_text da tabela user_profiles
  // O usuário confirmou que a coluna existe e deve ser usada.
  if (profile?.resume_text && profile.resume_text.trim().length > 5) {
      console.log('[Analysis] ✅ USANDO TEXTO DO BANCO (resume_text):', profile.resume_text.substring(0, 50))
      finalResumeText = profile.resume_text
      source = 'user_profiles.resume_text (DIRETO DO BANCO)'
  } 
  
  // 2. Se a coluna estiver vazia, tenta pegar da tabela user_resumes (BACKUP)
  if (!finalResumeText && resume?.content && resume.content.length > 5 && !resume.content.includes('Conteúdo do arquivo PDF')) {
    finalResumeText = resume.content
    source = 'user_resumes (DB)'
    // Se achou aqui mas não no perfil, já atualiza o perfil para ficar rápido na próxima
    if (userId) {
      await supabase.from('user_profiles').update({ 
        resume_text: finalResumeText,
        updated_at: new Date().toISOString()
      }).eq('id', userId)
    }
  }

  // 3. Se ainda não tem texto válido, tenta extrair do PDF via IA (LENTO - SÓ NA PRIMEIRA VEZ)
  // Só consideramos placeholder se for realmente vazio ou a mensagem padrão de erro
  const isPlaceholder = !finalResumeText || finalResumeText.includes('Conteúdo do arquivo PDF')
  const resumeUrl = resume?.file_url || profile?.resume_url 
  
  if (isPlaceholder && resumeUrl) {
    console.log(`[Analysis] ⚠️ Currículo não encontrado no banco ou inválido. Iniciando extração profunda via IA: ${resumeUrl}`)
    source = 'EXTRAÇÃO IA (PDF)'
    try {
      let fileBuffer: ArrayBuffer | null = null;
      let usedAdmin = false;

      // A. Tentar download direto (funciona se bucket for público)
      const fileRes = await fetch(resumeUrl)
      if (fileRes.ok) {
        fileBuffer = await fileRes.arrayBuffer()
      } else {
        console.warn(`[Analysis] Download público falhou (${fileRes.status}). Tentando via Admin Client...`)
        
        // B. Tentar via Admin Client (funciona mesmo com RLS/Bucket Privado)
        // Extrair o caminho relativo da URL
        // Ex: .../user-files/userId/arquivo.pdf
        // Assumindo que a URL contém "user-files/"
        const pathParts = resumeUrl.split('user-files/')
        if (pathParts.length > 1) {
            const relativePath = pathParts[1] // Pega tudo depois de user-files/
            // Decodificar URI caso tenha espaços (%20)
            const decodedPath = decodeURIComponent(relativePath)
            
            const admin = createAdminClient()
            const { data, error } = await admin.storage
                .from('user-files')
                .download(decodedPath)
            
            if (data && !error) {
                fileBuffer = await data.arrayBuffer()
                usedAdmin = true
                console.log('[Analysis] Sucesso ao baixar via Admin Client!')
            } else {
                console.error('[Analysis] Falha ao baixar via Admin:', error)
            }
        }
      }

      if (fileBuffer) {
        const base64Data = Buffer.from(fileBuffer).toString('base64')
        
        // Usar Gemini 1.5 Flash para extrair texto do PDF (Multimodal)
        const extractionPrompt = `
          Você é um especialista em extração de dados (OCR avançado).
          Analise este documento de currículo (PDF) e extraia TODO o conteúdo textual.
          
          REGRAS:
          1. Retorne APENAS o texto do currículo, formatado em Markdown para facilitar a leitura.
          2. Não adicione comentários como "Aqui está o texto".
          3. Preserve datas, nomes de empresas, cargos e descrições de projetos.
          4. Se houver links (LinkedIn, Portfólio), certifique-se de extraí-los corretamente.
        `
        
        const apiKey = process.env.GEMINI_API_KEY
        if (apiKey) {
          const payload = {
            contents: [{
              parts: [
                { text: extractionPrompt },
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192
            }
          }
          
          const aiRes = await fetch(`${GEMINI_API_URL}/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          
          if (aiRes.ok) {
            const aiData = await aiRes.json()
            const extractedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text
            
            if (extractedText && extractedText.length > 100) {
              console.log(`[Analysis] ✅ Texto extraído com sucesso via IA (${extractedText.length} chars)`)
              finalResumeText = extractedText
              
              // Atualizar o banco de dados para não precisar extrair novamente
              // Usamos adminClient aqui também para garantir permissão de escrita se necessário
              const admin = createAdminClient()
              
              // Atualiza user_resumes
              if (resume?.id) {
                await admin.from('user_resumes').update({ 
                  content: extractedText,
                  updated_at: new Date().toISOString()
                }).eq('id', resume.id)
              }
              
              // Atualiza user_profiles (sincronização)
              await admin.from('user_profiles').update({ 
                resume_text: extractedText,
                updated_at: new Date().toISOString()
              }).eq('id', userId)
            }
          } else {
            console.error('[Analysis] Erro na API Gemini para extração:', await aiRes.text())
          }
        }
      } else {
        console.error('[Analysis] Não foi possível obter o buffer do arquivo PDF.')
      }
    } catch (err) {
      console.error('[Analysis] Erro fatal na extração de texto do PDF:', err)
    }
  }

  console.log(`[Analysis] Currículo final (${source}): ${finalResumeText ? 'Sim (' + finalResumeText.length + ' chars)' : 'Não'}`)

  return {
    ...profile,
    resume_text: finalResumeText,
    resume_url: resume?.file_url || profile?.resume_url,
    portfolio: portfolio || []
  }
}

async function analyzeCompanyWebsite(companyName: string, websiteUrl?: string, webData?: any, isDeepSearch = false) {
  const prompt = `
${isDeepSearch ? '🔥 BUSCA PROFUNDA MANUAL SOLICITADA: O usuário não encontrou os dados na primeira tentativa. Você DEVE realizar uma busca extensiva agora no Google, Maps e site oficial para encontrar detalhes REAIS.' : 'IMPORTANTE: Use a ferramenta de busca do Google para pesquisar informações REAIS e recentes sobre esta empresa na internet agora mesmo.'}
Pesquise o site oficial, o Perfil da Empresa no Google (Google Meu Negócio) e o Google Maps. 

REGRAS CRÍTICAS:
1. PROIBIDO: Não invente dados fictícios. Se uma informação não for encontrada, retorne null. NUNCA use "N/A", "Não informado" ou valores genéricos.
2. DADOS BRUTOS: Os dados abaixo são extraídos do site. Use-os como fonte primária, mas valide-os com o Google Search.
3. GOOGLE BUSINESS: Se encontrar o perfil no Google Maps, extraia obrigatoriamente: rating, reviews_count, address e opening_hours.

Analise profundamente a empresa ${companyName} ${websiteUrl ? `(${websiteUrl})` : ''}.
DADOS BRUTOS EXTRAÍDOS DO SITE:
${JSON.stringify(webData || {}, null, 2)}

Retorne um objeto JSON com dados REAIS encontrados:
{
  "summary": "visão geral estratégica REAL (2-3 parágrafos). Mencione fatos específicos encontrados sobre a empresa, sua história ou conquistas recentes.",
  "culture": {
    "mission": "missão oficial detectada ou null",
    "values": ["lista de valores reais encontrados ou []"],
    "style": "estilo de trabalho detectado (ex: formal, startup, inovador) ou null"
  },
  "tech_stack": ["tecnologias REAIS detectadas no site (ex: React, Next.js, SAP, AWS) ou []"],
  "benefits": ["benefícios REAIS oferecidos (ex: Home Office, Plano de Saúde, PLR) ou []"],
  "institutional": {
      "about": "descrição institucional baseada nos textos REAIS do site",
      "services": ["lista de serviços ou produtos REAIS"],
      "images": ["URLs REAIS das imagens encontradas"],
      "header_summary": "resumo do cabeçalho REAL",
      "footer_summary": "resumo do rodapé REAL"
    },
  "contacts": {
    "emails": ["lista de e-mails REAIS encontrados"],
    "phones": [
      { 
        "number": "número original", 
        "formatted": "55...", 
        "label": "Comercial/WhatsApp/etc",
        "whatsapp_link": "https://wa.me/55..." 
      }
    ]
  },
  "local_presence": {
    "google_maps_url": "link REAL para o Google Maps se encontrado ou null",
    "rating": number ou null,
    "reviews_count": number ou null,
    "address": "endereço físico COMPLETO e REAL ou null",
    "opening_hours": "horários de funcionamento REAIS ou null",
    "main_reviews_summary": "resumo honesto das avaliações dos clientes no Google ou null"
  },
  "facts": {
    "employees_count": "estimativa de funcionários REAL ou null",
    "hiring_status": boolean,
    "headquarters": "cidade/país da sede REAL ou null"
  }
}

Responda APENAS com o JSON. Priorize a precisão sobre a quantidade. Se não tiver certeza, use null.
`
  
  const result = await callGemini('gemini-2.0-flash', prompt)
  console.log(`[Analysis] Gemini analyzeCompanyWebsite result received (length: ${result.length})`)
  return result
}

async function analyzeSocialMedia(companyName: string, webData?: any, isDeepSearch = false) {
  const prompt = `
${isDeepSearch ? '🔥 BUSCA PROFUNDA MANUAL SOLICITADA: Pesquise exaustivamente por LinkedIn, Instagram, Facebook e Twitter desta empresa. Verifique perfis reais, número de seguidores e atividade recente.' : 'IMPORTANTE: Use a ferramenta de busca do Google para encontrar as redes sociais REAIS desta empresa agora.'}

REGRAS CRÍTICAS:
1. PROIBIDO: Não invente números de seguidores, posts ou níveis de engajamento. 
2. VALIDAÇÃO: Verifique se os links encontrados em webData são realmente oficiais.
3. MISSING DATA: Se não encontrar uma rede social, retorne null para os dados dessa plataforma.

Analise o ecossistema digital REAL da empresa ${companyName}.
DADOS COLETADOS (Links encontrados no site):
${JSON.stringify(webData?.socialMedia || {}, null, 2)}

Retorne um objeto JSON com dados REAIS:
{
  "presence": ["lista de redes sociais ativas e verificadas"],
  "engagement": "análise qualitativa do engajamento REAL (ex: alto, baixo, focado em vídeo) ou null",
  "content_strategy": "descrição da estratégia de conteúdo observada ou null",
  "strengths": ["pontos fortes digitais REAIS encontrados"],
  "weaknesses": ["pontos fracos ou oportunidades de melhoria REAIS"],
  "platforms_data": {
    "linkedin": { "followers": number ou null, "recent_posts": number ou null, "hiring": boolean, "url": "URL verificada ou null" },
    "instagram": { "followers": number ou null, "posts": number ou null, "engagement_rate": number ou null, "url": "URL verificada ou null" },
    "facebook": { "followers": number ou null, "posts": number ou null, "url": "URL verificada ou null" },
    "twitter": { "followers": number ou null, "posts": number ou null, "url": "URL verificada or null" },
    "youtube": { "subscribers": number ou null, "videos": number ou null, "url": "URL verificada or null" }
  }
}

Responda APENAS with the JSON. Se o dado não for encontrado com certeza absoluta, use null.
`
  
  const result = await callGemini('gemini-2.0-flash', prompt)
  console.log(`[Analysis] Gemini analyzeSocialMedia result received (length: ${result.length})`)
  return result
}

async function analyzeMarketAndAds(companyName: string, industry: string, webData: any, isDeepSearch = false) {
  const prompt = `
${isDeepSearch ? '🔥 ANÁLISE DE MERCADO PROFUNDA: O usuário quer dados REAIS de concorrência e anúncios. Pesquise no Google Ads Transparency Center, Facebook Ad Library e notícias do setor para encontrar dados concretos.' : 'IMPORTANTE: Use a ferramenta de busca do Google para pesquisar o mercado e anúncios REAIS desta empresa agora.'}

REGRAS CRÍTICAS:
1. PROIBIDO: Não invente orçamentos, números de crescimento ou nomes de concorrentes.
2. CONCORRENTES: Identifique pelo menos 3 concorrentes REAIS que operam no mesmo mercado.
3. ANÚNCIOS: Verifique se a empresa possui anúncios ativos nas plataformas Meta ou Google.

Analise o mercado REAL para ${companyName} (${industry}).
DADOS DE ANÚNCIOS COLETADOS:
${JSON.stringify(webData?.adCampaigns || {}, null, 2)}

Retorne um objeto JSON com dados REAIS:
{
  "market": { 
    "trends": ["3-5 tendências de mercado REAIS e atuais"], 
    "competitors": ["lista de 3-5 concorrentes diretos REAIS"], 
    "position": "análise da posição de mercado (ex: líder, nicho, em expansão) ou null", 
    "growth_outlook": "perspectiva de crescimento baseada em fatos reais ou null",
    "data": {
      "industry_growth": "porcentagem de crescimento do setor REAL ou null",
      "market_size": "estimativa REAL do tamanho do mercado ou null"
    }
  },
  "ads": {
    "meta": { "active": boolean, "platforms": ["Instagram", "Facebook", "Messenger"], "creatives_style": "estilo dos criativos detectado ou null", "estimated_budget": "estimativa qualitativa ou null" },
    "google": { "active": boolean, "keywords": ["palavras-chave REAIS encontradas"], "estimated_budget": "estimativa qualitativa ou null" },
    "linkedin": { "active": boolean, "ad_types": ["Sponsored Content", "InMail", etc] }
  }
}

Responda APENAS with the JSON. Se não encontrar dados concretos, use null.
`
  
  const result = await callGemini('gemini-2.0-flash', prompt)
  console.log(`[Analysis] Gemini analyzeMarketAndAds result received (length: ${result.length})`)
  return result
}

async function generatePersonalizedStrategy(companyName: string, industry: string, userProfile: any, analysisData: any, webData: any, isDeepSearch = false) {
  const prompt = `
${isDeepSearch ? '🔥 RECONSTRUÇÃO DE ESTRATÉGIA: O usuário solicitou uma estratégia mais profunda. Analise detalhadamente como o perfil do candidato se conecta com os dados REAIS da empresa e crie um plano tático agressivo.' : 'Crie uma estratégia personalizada multidimensional e ALTAMENTE ACIONÁVEL para o usuário conseguir fechar um contrato B2B ou vaga with the ${companyName}.'}

REGRAS CRÍTICAS DE PERSONALIZAÇÃO (OBRIGATÓRIO):
1. IDENTIDADE ÚNICA: O Pitch de E-mail e ROTEIRO WHATSAPP NÃO PODEM ser genéricos. Devem soar como se tivessem sido escritos por ${userProfile.user_name || 'o usuário'} especificamente para esta empresa.
2. INTEGRAÇÃO DO CURRÍCULO (OBRIGATÓRIO): Use fatos, anos de experiência e conquistas REAIS listadas no 'resume_text' abaixo. TANTO O EMAIL QUANTO O WHATSAPP devem mencionar experiências específicas do currículo como prova de competência.
3. PROVA SOCIAL DO PORTFÓLIO: Cite nominalmente pelo menos 1 projeto do portfólio do usuário que resolva um problema similar ao que esta empresa enfrenta. IMPORTANTE: No final do email e do whatsapp, use SEMPRE o link do portfólio pessoal (${userProfile.portfolio_url || 'https://thierrycreative.vercel.app'}) e JAMAIS use links de terceiros como Behance, Dribbble ou GitHub, a menos que o usuário não tenha site próprio.
4. CONEXÃO COM A DOR: Não apenas liste skills. Explique COMO a experiência do usuário (vinda do currículo) resolve as dores específicas da ${companyName} identificadas na análise (EM EMAIL E WHATSAPP).
5. TONE & SENIORIDADE: Ajuste o tom para refletir a senioridade real do usuário (Ex: Se tem 10 anos, fale como sênior/estrategista; se tem 2, fale como executor ágil) - APLICAR AOS DOIS ROTEIROS.
6. ROTEIRO WHATSAPP ESPECÍFICO: O script WhatsApp DEVE ser mais curto e direto que o email, mas igualmente personalizado com dados do currículo. Use tom conversacional e mencione rapidamente uma conquista específica do currículo.

DADOS DA EMPRESA:
- Nome: ${companyName}
- Setor: ${industry || 'Tecnologia'}
- Cultura: ${JSON.stringify(analysisData.website?.culture || {}, null, 2)}
- Tecnologias: ${JSON.stringify(analysisData.website?.tech_stack || [], null, 2)}
- Mercado: ${analysisData.market_ads?.market?.position || 'Não detectado'}

PERFIL DO USUÁRIO (O SEU PITCH DEVE SER BASEADO EXCLUSIVAMENTE NESTES DADOS):
- Nome: ${userProfile.user_name}
- Bio: ${userProfile.bio || 'Não informada'}
- Experiência: ${userProfile.experience_years} anos
- Skills: ${JSON.stringify(userProfile.skills || [])}
- Especialidades: ${JSON.stringify(userProfile.specialties || [])}
- CURRÍCULO COMPLETO (BASE PARA O PITCH): ${userProfile.resume_text ? userProfile.resume_text.substring(0, 10000) : 'ERRO CRÍTICO: NENHUM CURRÍCULO ENCONTRADO NO BANCO DE DADOS. Não invente dados. Informe explicitamente ao usuário que ele precisa fazer o upload do PDF na aba Perfil para gerar pitches personalizados.'}
- PORTFÓLIO PRINCIPAL (USE ESTE LINK): ${userProfile.portfolio_url || 'https://thierrycreative.vercel.app'}
- PROJETOS DO PORTFÓLIO: ${JSON.stringify(userProfile.portfolio?.map((p: any) => ({ title: p.title, desc: p.description, type: p.type })) || [])}

Retorne um JSON com esta estrutura:
{
  "pain_points": ["3 dores REAIS identificadas na empresa"],
  "value_proposition": "como o usuário resolve essas dores especificamente usando sua experiência e currículo",
  "networking": { "opportunities": ["grupos ou eventos onde encontrar decisores"], "effective_channels": ["LinkedIn", "Email Direto", etc] },
  "interview_prep": { "likely_questions": ["3 perguntas prováveis baseadas na cultura da empresa"], "strategy_tips": ["dicas de comportamento/respostas"] },
  "skills_to_highlight": ["skills do currículo do usuário que mais brilham para esta empresa"],
  "outreach": {
    "whatsapp_script": "Script de abordagem via WhatsApp BASEADO EXCLUSIVAMENTE NO CURRÍCULO DO USUÁRIO. DEVE: 1) Mencionar experiência específica do currículo que resolve dor da empresa, 2) Citar projeto do portfólio como prova social, 3) Ser direto e pessoal como se ${userProfile.user_name} estivesse falando, 4) Conectar skills do currículo com necessidades da empresa, 5) Ter tom adequado à senioridade (júnior/mid/sênior baseado em ${userProfile.experience_years} anos).",
    "email_pitch": "Pitch B2B completo e profissional. DEVE SER BASEADO NO CURRÍCULO E PORTFÓLIO DO USUÁRIO. Use as experiências e conquistas dele como prova social central. O texto deve ser persuasivo e focado em ROI ou solução de problemas técnicos."
  },
  "action_plan": {
    "day_30": { "tasks": ["tarefas imediatas"], "kpi": "meta para 30 dias" },
    "day_60": { "tasks": ["tarefas de consolidação"], "kpi": "meta para 60 dias" },
    "day_90": { "tasks": ["tarefas de fechamento"], "kpi": "meta para 90 dias" }
  }
}

Responda APENAS with the valid JSON in Português do Brasil.
`
  
  const result = await callGemini('gemini-2.0-flash', prompt)
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, websiteUrl, linkedinUrl, instagramUrl, facebookUrl, twitterUrl, industry, section } = body
    console.log(`[Analysis] Iniciando análise para: ${companyName}${section ? ` (Seção: ${section})` : ''}`)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Analysis] Usuário não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 0. BUSCAR PERFIL DO USUÁRIO PRIMEIRO (Para garantir que temos o currículo mais recente)
    const userProfile = await getUserProfile(supabase, user.id)

    // Se for uma análise parcial (de uma seção específica), ignoramos o cache e forçamos a busca profunda
    if (section) {
      console.log(`[Analysis] 🎯 Análise parcial solicitada para a seção: ${section}`)
      
      const webData = await collectWebData(companyName, websiteUrl, linkedinUrl, instagramUrl, facebookUrl, twitterUrl)

      let result: any = {}
      
      if (section === 'website') {
        const res = await analyzeCompanyWebsite(companyName, websiteUrl, webData, true)
        result.website = JSON.parse(res)
      } else if (section === 'summary') {
        const res = await analyzeCompanyWebsite(companyName, websiteUrl, webData, true)
        const fullWebsite = JSON.parse(res)
        result.website = { summary: fullWebsite.summary }
      } else if (section === 'institutional') {
        const res = await analyzeCompanyWebsite(companyName, websiteUrl, webData, true)
        const fullWebsite = JSON.parse(res)
        result.website = { 
          institutional: fullWebsite.institutional,
          contacts: fullWebsite.contacts 
        }
      } else if (section === 'webData') {
        result.webData = webData
      } else if (section === 'social') {
        const res = await analyzeSocialMedia(companyName, webData, true)
        result.social = JSON.parse(res)
      } else if (section === 'market_ads') {
        const res = await analyzeMarketAndAds(companyName, industry || 'Tecnologia', webData, true)
        result.market_ads = JSON.parse(res)
      } else if (section === 'personalizedStrategy') {
        // Para a estratégia, precisamos de uma análise base mínima
        const [w, s, m] = await Promise.all([
          analyzeCompanyWebsite(companyName, websiteUrl, webData),
          analyzeSocialMedia(companyName, webData),
          analyzeMarketAndAds(companyName, industry || 'Tecnologia', webData)
        ])
        const analysisData = {
          website: JSON.parse(w),
          social: JSON.parse(s),
          market_ads: JSON.parse(m)
        }
        const res = await generatePersonalizedStrategy(companyName, industry || 'Tecnologia', userProfile, analysisData, webData, true)
        result.personalizedStrategy = JSON.parse(res)
      }

      // Adiciona o perfil atualizado na resposta parcial
      result.userProfile = userProfile
      return NextResponse.json(result)
    }

    // 0.5. VERIFICAR SE A EMPRESA JÁ FOI APROVADA E POSSUI ANÁLISE SALVA (Watermark Check)
    console.log(`[Analysis] Verificando se ${companyName} já é uma empresa aprovada com análise...`)
    const { data: approvedCompany, error: approvedError } = await supabase
      .from('approved_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_name', companyName)
      .maybeSingle()

    if (approvedCompany) {
       // Verificar se tem dados de análise
       const savedAnalysis = approvedCompany.ai_analysis || {};
       const savedStrategy = approvedCompany.strategy_generated || {};
       
       // Verificação simplificada de "Marca D'água" - se tem dados de estratégia ou análise de site
       const hasWatermark = (savedAnalysis.website || savedStrategy.executive_summary || savedStrategy.suggested_approach);

       if (hasWatermark) {
          console.log(`[Analysis] 💧 MARCA D'ÁGUA ENCONTRADA: Empresa já aprovada e analisada. Retornando dados salvos...`);
          
          const responsePayload = {
            companyName: approvedCompany.company_name,
            website: savedAnalysis.website || {},
            social: savedAnalysis.social || {},
            market_ads: savedAnalysis.market_ads || {},
            personalizedStrategy: savedStrategy || {},
            webData: approvedCompany.full_company_data || {},
            analyzedAt: approvedCompany.updated_at || approvedCompany.created_at,
            userProfile: userProfile,
            metadata: {
              watermark: 'processed_by_crm_creative_ai',
              cached: true,
              source: 'approved_companies'
            },
            debug: {
              source: 'approved_companies_watermark',
              watermark: true,
              is_frozen: true
            }
          }
          return NextResponse.json(responsePayload);
       }
    }

    // 1. TENTAR RECUPERAR ANÁLISE JÁ EXISTENTE NO SUPABASE (apenas para análise completa)
    console.log(`[Analysis] Buscando análise existente para ${companyName} (user_id: ${user.id})...`)
    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('company_analysis')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_name', companyName)
      .maybeSingle()

    if (fetchError) {
      console.error(`[Analysis] Erro ao buscar no banco:`, fetchError.message)
    }

    // Só retorna do banco se realmente tiver uma estratégia de IA salva lá dentro
    if (existingAnalysis && existingAnalysis.ai_strategy && Object.keys(existingAnalysis.ai_strategy).length > 0) {
      
      // VERIFICAÇÃO DE OBSOLESCÊNCIA: Se o currículo mudou depois da análise, INVALIDA O CACHE
      const analysisDate = new Date(existingAnalysis.last_updated || existingAnalysis.created_at)
      const profileDate = new Date(userProfile.updated_at || '2000-01-01')
      
      // Se o perfil foi atualizado DEPOIS da análise, precisamos refazer a estratégia
      if (profileDate > analysisDate) {
        console.log(`[Analysis] ⚠️ Perfil atualizado (${profileDate.toISOString()}) após a última análise (${analysisDate.toISOString()}). Invalidando cache...`)
        // Não retornamos aqui, deixamos cair para a re-geração
      } else {
        console.log(`[Analysis] ✅ Análise encontrada no banco para ${companyName}. Retornando cache...`)
        
        const responsePayload = {
          companyName: existingAnalysis.company_name,
          website: existingAnalysis.website_analysis,
          social: existingAnalysis.social_media_presence,
          market_ads: {
            market: existingAnalysis.market_analysis,
            ads: existingAnalysis.ads_analysis
          },
          personalizedStrategy: existingAnalysis.ai_strategy,
          webData: existingAnalysis.full_company_data,
          analyzedAt: existingAnalysis.last_updated || new Date().toISOString(),
          userProfile: userProfile, // <--- ADICIONADO: Perfil sempre fresco na resposta
          debug: {
            hasWebsiteData: !!existingAnalysis.website_analysis,
            hasSocialMediaData: !!existingAnalysis.social_media_presence,
            hasMarketTrends: !!existingAnalysis.market_analysis,
            source: 'database'
          }
        }
        
        console.log(`[Analysis] Payload de resposta reconstruído para ${companyName}`)
        return NextResponse.json(responsePayload)
      }
    }

    console.log(`[Analysis] 🔍 Nenhuma análise válida (ou cache inválido). Iniciando nova para: ${companyName}`)
    
    console.log(`[Analysis] Coletando dados da web...`)
    const webData = await collectWebData(companyName, websiteUrl, linkedinUrl, instagramUrl, facebookUrl, twitterUrl)
    
    
    // Etapa 1: Análise Multidimensional (Paralelo)
    console.log(`[Analysis] 🚀 Etapa 1: Iniciando Análises em Paralelo...`)
    const [websiteRes, socialRes, marketAdsRes] = await Promise.all([
      analyzeCompanyWebsite(companyName, websiteUrl, webData),
      analyzeSocialMedia(companyName, webData),
      analyzeMarketAndAds(companyName, industry || 'Tecnologia', webData)
    ])

    console.log(`[Analysis] 🔍 Verificando integridade das respostas da Etapa 1...`)
    if (!websiteRes) console.warn('[Analysis] ⚠️ websiteRes veio vazio')
    if (!socialRes) console.warn('[Analysis] ⚠️ socialRes veio vazio')
    if (!marketAdsRes) console.warn('[Analysis] ⚠️ marketAdsRes veio vazio')

    console.log(`[Analysis] ⚙️ Parseando resultados da Etapa 1...`)
    
    const safeParse = (jsonString: string, label: string) => {
      if (!jsonString) return null
      try {
        return JSON.parse(jsonString)
      } catch (e) {
        console.error(`[Analysis] ❌ Erro ao parsear ${label}:`, e)
        console.log(`[Analysis] Conteúdo inválido de ${label}:`, jsonString.substring(0, 500))
        return null
      }
    }

    const websiteAnalysis = safeParse(websiteRes, 'websiteRes')
    const socialMediaAnalysis = safeParse(socialRes, 'socialRes')
    const marketAndAdsAnalysis = safeParse(marketAdsRes, 'marketAdsRes')
      
    console.log(`[Analysis] ✅ Parse concluído:`, {
      website: !!websiteAnalysis,
      social: !!socialMediaAnalysis,
      market: !!marketAndAdsAnalysis
    })

    try {
      // ENRIQUECER webData com dados reais encontrados pela IA (Backfill)
      console.log(`[Analysis] 🔄 Enriquecendo webData com descobertas da IA...`)
      if (websiteAnalysis?.facts) {
        if (!webData.linkedin) webData.linkedin = {}
        webData.linkedin.employees = websiteAnalysis.facts.employees_count || webData.linkedin.employees
        webData.linkedin.hiring = websiteAnalysis.facts.hiring_status !== undefined ? websiteAnalysis.facts.hiring_status : webData.linkedin.hiring
      }
      
      if (socialMediaAnalysis?.platforms_data) {
        const pd = socialMediaAnalysis.platforms_data
        if (pd.linkedin) {
          if (!webData.linkedin) webData.linkedin = {}
          webData.linkedin.followers = pd.linkedin.followers || webData.linkedin.followers
          webData.linkedin.recentPosts = pd.linkedin.recent_posts || webData.linkedin.recentPosts
          webData.linkedin.hiring = pd.linkedin.hiring !== undefined ? pd.linkedin.hiring : webData.linkedin.hiring
        }
        
        if (!webData.socialMedia) webData.socialMedia = {}
        const platforms = ['instagram', 'facebook', 'twitter']
        platforms.forEach(p => {
          if (pd[p]) {
            webData.socialMedia[p] = {
              ...(webData.socialMedia[p] || {}),
              followers: pd[p].followers || 0,
              posts: pd[p].posts || 0,
              engagement: pd[p].engagement || 0,
              verified: pd[p].verified || false
            }
          }
        })
      }
      
      if (marketAndAdsAnalysis?.market?.data) {
        if (!webData.marketTrends) webData.marketTrends = {}
        const md = marketAndAdsAnalysis.market.data
        webData.marketTrends.industryGrowth = md.industry_growth || webData.marketTrends.industryGrowth
        webData.marketTrends.marketSize = md.market_size || webData.marketTrends.marketSize
        webData.marketTrends.marketPosition = marketAndAdsAnalysis.market.position || webData.marketTrends.marketPosition
        webData.marketTrends.competitors = marketAndAdsAnalysis.market.competitors?.length || webData.marketTrends.competitors
        webData.marketTrends.keyTrends = marketAndAdsAnalysis.market.trends || webData.marketTrends.keyTrends
      }
      
      if (marketAndAdsAnalysis?.ads) {
        webData.adCampaigns = {
          facebookAds: marketAndAdsAnalysis.ads.meta || {},
          googleAds: marketAndAdsAnalysis.ads.google || {}
        }
      }
    } catch (enrichError) {
      console.error('[Analysis] ⚠️ Erro ao enriquecer dados (não fatal):', enrichError)
    }

    const intermediateAnalysis = {
      website: websiteAnalysis,
      social: socialMediaAnalysis,
      market_ads: marketAndAdsAnalysis
    }

    // Etapa 2: Estratégia Personalizada (Baseada na Etapa 1)
    console.log(`[Analysis] 🧠 Etapa 2: Gerando estratégia personalizada...`)
    const strategyRes = await generatePersonalizedStrategy(companyName, industry || 'Tecnologia', userProfile, intermediateAnalysis, webData)
    
    const personalizedStrategy = safeParse(strategyRes, 'strategyRes')
    if (personalizedStrategy) {
      console.log(`[Analysis] ✅ Estratégia personalizada gerada e parseada`)
    } else {
      console.warn(`[Analysis] ⚠️ Falha ao gerar estratégia personalizada.`)
    }
    
    // Preparar objeto final (usando objetos parseados para o front-end)
    // Garantir que todos os campos sejam serializáveis para evitar erro 500 no Next.js
    const analysisResult = JSON.parse(JSON.stringify({
      companyName,
      webData: webData || {},
      website: websiteAnalysis || {},
      social: socialMediaAnalysis || {},
      market_ads: marketAndAdsAnalysis || {},
      personalizedStrategy: personalizedStrategy || {},
      userProfile: userProfile || {},
      analyzedAt: new Date().toISOString(),
      metadata: {
        watermark: 'processed_by_crm_creative_ai',
        version: '1.0',
        generated_at: new Date().toISOString()
      },
      debug: {
        hasWebsiteData: !!websiteAnalysis,
        hasSocialMediaData: !!socialMediaAnalysis,
        hasMarketTrends: !!marketAndAdsAnalysis,
        source: 'ai_generation'
      }
    }))
    
    // Salvar análise (Usando upsert para atualizar se já existir para este usuário)
    console.log(`[Analysis] 💾 Salvando resultados no banco de dados (upsert)...`)
    const { error: insertError } = await supabase.from('company_analysis').upsert({
      user_id: user.id,
      company_name: companyName,
      full_company_data: webData, // Salva o objeto completo retornado pelo scraper
      website_analysis: websiteAnalysis,
      social_media_presence: socialMediaAnalysis,
      ads_analysis: marketAndAdsAnalysis?.ads || {},
      market_analysis: marketAndAdsAnalysis?.market || {},
      trends_analysis: marketAndAdsAnalysis?.market?.trends || [],
      ai_strategy: personalizedStrategy,
      analysis_status: 'completed',
      last_updated: new Date().toISOString()
    }, { 
      onConflict: 'user_id,company_name' 
    })
    
    if (insertError) {
      console.error('[Analysis] ❌ Erro ao salvar no Supabase:', insertError)
      // Não lançamos erro aqui para o usuário não perder a análise que já foi gerada na memória
    }
    
    console.log(`[Analysis] 🎉 Análise concluída com sucesso para: ${companyName}`)
    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error('[Analysis] Erro fatal na análise profunda:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro interno no servidor',
      details: error.stack
    }, { status: 500 })
  }
}