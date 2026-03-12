import { NextRequest, NextResponse } from 'next/server'

// Função para coletar dados de websites
async function scrapeWebsite(url: string) {
  if (!url) return null
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout interno
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal,
      redirect: 'follow'
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.warn(`[Scraper] Falha ao acessar ${url}: ${response.status} ${response.statusText}`)
      return { url, success: false, error: `HTTP ${response.status}` }
    }
    
    const html = await response.text()
    
    // Extrai informações básicas
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || ''
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''
    
    // Extração de Header e Footer (mais robusta)
    const header = html.match(/<header[^>]*>([\s\S]*?)<\/header>|id=["']header["'][^>]*>([\s\S]*?)<\/div>|class=["'][^"']*header[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[0]?.replace(/<[^>]*>?/gm, ' ').trim().substring(0, 1500) || ''
    const footer = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>|id=["']footer["'][^>]*>([\s\S]*?)<\/div>|class=["'][^"']*footer[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[0]?.replace(/<[^>]*>?/gm, ' ').trim().substring(0, 1500) || ''

    // Extração de E-mails (mais abrangente)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = Array.from(new Set(html.match(emailRegex) || []))

    // Extração de Telefones (Brasil e Internacional)
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}|(?:\+?55\s?)?\(?\d{2}\)?\s?9\d{4}[-\s]?\d{4}/g
    const phonesRaw = Array.from(new Set(html.match(phoneRegex) || []))
    
    // Filtrar e limpar telefones para garantir validade
    const phones = phonesRaw
      .map(p => p.trim())
      .filter(p => {
        const digits = p.replace(/\D/g, '')
        return digits.length >= 8 && digits.length <= 15
      })

    // Extração de Imagens Institucionais (Logo, Hero, etc)
    const images: { src: string, alt: string }[] = []
    const baseUrl = new URL(url).origin
    
    // Tenta capturar imagens com alt ou src que sugiram conteúdo institucional
    const institutionalKeywords = ['logo', 'sobre', 'about', 'equipe', 'team', 'sede', 'office', 'fachada', 'banner', 'hero', 'empresa', 'company']
    
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)
    for (const match of imgMatches) {
      if (images.length >= 20) break
      
      const imgTag = match[0]
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i)
      
      if (srcMatch) {
        let src = srcMatch[1]
        const alt = altMatch ? altMatch[1] : ''
        
        // Converter para URL absoluta
        if (src.startsWith('//')) src = `https:${src}`
        else if (src.startsWith('/')) src = `${baseUrl}${src}`
        else if (!src.startsWith('http')) continue

        const isInstitutional = institutionalKeywords.some(kw => 
          src.toLowerCase().includes(kw) || alt.toLowerCase().includes(kw)
        )

        if (isInstitutional || images.length < 8) {
          images.push({ src, alt })
        }
      }
    }

    // Extração de Textos Institucionais e Produtos/Serviços
    const bodyText = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                        .replace(/<[^>]*>?/gm, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()

    // Tenta identificar seções de sobre e serviços por palavras-chave com contexto maior
    const aboutSection = bodyText.match(/(?:sobre|quem somos|nossa história|about us|conheça|missão|valores|história da empresa|quem é a)[\s\S]{0,4000}/i)?.[0]?.substring(0, 3000) || ''
    const servicesSection = bodyText.match(/(?:serviços|produtos|nossas soluções|services|products|atuação|o que fazemos|portfólio|portfolio|soluções)[\s\S]{0,4000}/i)?.[0]?.substring(0, 3000) || ''

    return {
      title,
      metaDescription,
      header,
      footer,
      emails,
      phones,
      images: Array.from(new Set(images.map(img => JSON.stringify(img)))).map(s => JSON.parse(s)),
      aboutText: aboutSection,
      servicesText: servicesSection,
      url,
      success: true
    }
  } catch (error: any) {
    console.error('Erro ao coletar dados do website:', error.message)
    return {
      title: '',
      description: '',
      keywords: '',
      hasCareers: false,
      hasAbout: false,
      hasContact: false,
      url,
      success: false,
      error: error.message
    }
  }
}

// Função para analisar LinkedIn
async function analyzeLinkedIn(linkedinUrl: string) {
  try {
    const companyName = linkedinUrl.split('/').pop() || ''
    
    // Retornamos apenas a URL e o nome detectado. 
    // A análise real de seguidores/funcionários será feita pela Gemini Search Grounding no route.ts
    return {
      companyName,
      url: linkedinUrl,
      source: 'LinkedIn URL provided'
    }
  } catch (error: any) {
    console.error('Erro ao processar URL do LinkedIn:', error.message)
    return null
  }
}

// Função para analisar redes sociais
async function analyzeSocialMedia(platform: string, url: string) {
  try {
    // Retornamos apenas a URL. 
    // A análise real de engajamento/posts será feita pela Gemini Search Grounding no route.ts
    return {
      platform,
      url: url,
      source: `${platform} URL provided`
    }
  } catch (error: any) {
    console.error(`Erro ao processar URL do ${platform}:`, error.message)
    return null
  }
}

// Função para coletar dados de anúncios (Meta/Google Ads)
async function analyzeAdCampaigns(companyName: string, websiteUrl: string) {
  try {
    // Retornamos apenas os metadados para que a Gemini Search Grounding no route.ts
    // faça a pesquisa real de anúncios ativos e orçamentos estimados.
    return {
      companyName,
      websiteUrl,
      source: 'Metadata for AI analysis',
      status: 'pending_ai_grounding'
    }
  } catch (error: any) {
    console.error('Erro ao preparar metadados de anúncios:', error.message)
    return null
  }
}

// Função para analisar tendências de mercado
async function analyzeMarketTrends(industry: string, companyName: string) {
  try {
    // Retornamos apenas os metadados para que a Gemini Search Grounding no route.ts
    // faça a pesquisa real de tendências e crescimento.
    return {
      industry,
      companyName,
      source: 'Metadata for AI analysis',
      status: 'pending_ai_grounding'
    }
  } catch (error: any) {
    console.error('Erro ao preparar metadados de mercado:', error.message)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      companyName, 
      websiteUrl, 
      linkedinUrl, 
      instagramUrl, 
      facebookUrl, 
      twitterUrl, 
      youtubeUrl,
      industry 
    } = body

    console.log('Iniciando coleta de dados para:', companyName)

    // Coletar todos os dados em paralelo
    const [
      websiteData,
      linkedinData,
      instagramData,
      facebookData,
      twitterData,
      youtubeData,
      adCampaigns,
      marketTrends
    ] = await Promise.all([
      websiteUrl ? scrapeWebsite(websiteUrl) : null,
      linkedinUrl ? analyzeLinkedIn(linkedinUrl) : null,
      instagramUrl ? analyzeSocialMedia('instagram', instagramUrl) : null,
      facebookUrl ? analyzeSocialMedia('facebook', facebookUrl) : null,
      twitterUrl ? analyzeSocialMedia('twitter', twitterUrl) : null,
      youtubeUrl ? analyzeSocialMedia('youtube', youtubeUrl) : null,
      analyzeAdCampaigns(companyName, websiteUrl || ''),
      analyzeMarketTrends(industry || 'Tecnologia', companyName)
    ])

    const result = {
      companyName,
      website: websiteData,
      linkedin: linkedinData,
      socialMedia: {
        instagram: instagramData,
        facebook: facebookData,
        twitter: twitterData,
        youtube: youtubeData
      },
      adCampaigns,
      marketTrends,
      collectedAt: new Date().toISOString()
    }

    console.log('Dados coletados com sucesso para:', companyName)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na coleta de dados:', error)
    return NextResponse.json(
      { error: 'Erro ao coletar dados da empresa' },
      { status: 500 }
    )
  }
}