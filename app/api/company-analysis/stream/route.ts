import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models'

async function callGeminiText(model: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY ausente')
  const invoke = async (m: string) => {
    return fetch(`${GEMINI_API_URL}/${m}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
      })
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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return text
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_name,
      website_url,
      website_analysis,
      social_media_presence,
      market_analysis,
      ads_analysis,
      strategy,
      profile
    } = body || {}

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const write = (t: string) => controller.enqueue(encoder.encode(t))
        try {
          write(`# ${company_name || 'Empresa'}\n\n`)

          const sections: Array<{ title: string; prompt: string }> = [
            {
              title: 'Visão Geral',
              prompt: `Escreva uma VISÃO GERAL clara e objetiva sobre a empresa "${company_name}" usando o contexto quando possível. 
Empresa: ${company_name}
Website: ${website_url || 'n/d'}
Contexto: ${(website_analysis || social_media_presence) ? JSON.stringify({ website_analysis, social_media_presence }).slice(0, 4000) : 'n/d'}
Texto corrido, 2-3 parágrafos.`
            },
            {
              title: 'Análise do Website',
              prompt: `Analise o WEBSITE (estrutura, conteúdo, tecnologias, cultura, vagas) com 2-3 parágrafos.
Empresa: ${company_name}
Website: ${website_url || 'n/d'}
Análise disponível: ${website_analysis ? JSON.stringify(website_analysis).slice(0, 4000) : 'n/d'}`
            },
            {
              title: 'Presença nas Redes',
              prompt: `Analise a PRESENÇA NAS REDES (LinkedIn, Instagram, Facebook, Twitter, YouTube) com 2-3 parágrafos.
Dados: ${social_media_presence ? JSON.stringify(social_media_presence).slice(0, 4000) : 'n/d'}`
            },
            {
              title: 'Tendências de Mercado e Concorrência',
              prompt: `Descreva TENDÊNCIAS DE MERCADO e CONCORRÊNCIA relevantes em 2-3 parágrafos.
Base: ${market_analysis ? JSON.stringify(market_analysis).slice(0, 4000) : 'n/d'}`
            },
            {
              title: 'Anúncios e Mensagens',
              prompt: `Analise ANÚNCIOS (Meta/Google), mensagens e público, 1-2 parágrafos.
Base: ${ads_analysis ? JSON.stringify(ads_analysis).slice(0, 4000) : 'n/d'}`
            },
            {
              title: 'Estratégia de Carreira Personalizada',
              prompt: `Escreva uma ESTRATÉGIA DE CARREIRA personalizada baseada no currículo do usuário, 2-3 parágrafos.
Usuário: ${profile ? JSON.stringify(profile).slice(0, 4000) : 'n/d'}
Estratégia IA (se houver): ${strategy ? JSON.stringify(strategy).slice(0, 4000) : 'n/d'}`
            },
            {
              title: 'Próximos Passos',
              prompt: `Explique PRÓXIMOS PASSOS sugeridos, em 1-2 parágrafos, texto corrido (sem listas).`
            }
          ]

          for (const sec of sections) {
            write(`\n\n${sec.title}\n\n`)
            const text = await callGeminiText('gemini-2.5-pro', sec.prompt)
            write(text.trim())
          }

          controller.close()
        } catch (e: any) {
          write(`\n\n[Erro] ${e?.message || 'Falha ao gerar conteúdo'}`)
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error) {
    console.error('Erro no stream narrativo:', error)
    return new Response('Erro ao gerar stream', { status: 500 })
  }
}
