import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface SocialMediaPlatform {
  platform: string
  url: string
  likes?: number | null
  followers?: number | null
  verified?: boolean
  contentTypes?: string[]
  postingFrequency?: 'alta' | 'média' | 'baixa'
  recentPosts?: number
  engagement?: number | null
  analysisLevel?: 'basic' | 'detailed'
  companyType?: string
  companyName?: string
  locations?: string[]
  departments?: string[]
  industry?: string
  companySize?: string
  companySizeCategory?: string
  employeeCount?: number | null
  error?: string
}

interface SocialMediaAnalysis {
  facebook: SocialMediaPlatform | null
  instagram: SocialMediaPlatform | null
  twitter: SocialMediaPlatform | null
  youtube: SocialMediaPlatform | null
  linkedin: SocialMediaPlatform | null
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const PROFILE_COOKIE = 'crm_profile_id'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models'
async function callGemini(model: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY ausente')
  // tenta modelo principal; em caso de 404, tenta sufixo -latest
  const invoke = async (m: string) => {
    const r = await fetch(`${GEMINI_API_URL}/${m}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
      })
    })
    return r
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

async function discoverCompanyUrls(companyName: string) {
  try {
    const prompt = `
Identifique os links oficiais desta empresa e retorne SOMENTE JSON válido.
Empresa: ${companyName}
Formato:
{
  "website_url": "https://...",
  "linkedin_url": "https://...",
  "instagram_url": "https://...",
  "facebook_url": "https://...",
  "twitter_url": "https://...",
  "youtube_url": "https://..."
}
Regras:
- Não invente. Se não souber, deixe o campo vazio.
- Priorize domínios oficiais e perfis verificados.
- Não inclua texto adicional fora do JSON.`
    const text = await callGemini('gemini-2.5-pro', prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    const normalize = (u: any) => {
      if (!u || typeof u !== 'string') return null
      const trimmed = u.trim()
      if (!trimmed) return null
      if (trimmed.startsWith('http')) return trimmed
      return `https://${trimmed}`
    }
    return {
      website_url: normalize(raw.website_url),
      linkedin_url: normalize(raw.linkedin_url),
      instagram_url: normalize(raw.instagram_url),
      facebook_url: normalize(raw.facebook_url),
      twitter_url: normalize(raw.twitter_url),
      youtube_url: normalize(raw.youtube_url)
    }
  } catch {
    return {
      website_url: null,
      linkedin_url: null,
      instagram_url: null,
      facebook_url: null,
      twitter_url: null,
      youtube_url: null
    }
  }
}

// Função para buscar informações detalhadas de uma URL
async function fetchWebsiteInfo(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extrair informações básicas do HTML
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || ''
    const description = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/)?.[1] || ''
    const keywords = html.match(/<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/)?.[1] || ''
    
    // Extrair informações de vagas
    const jobKeywords = ['vaga', 'emprego', 'trabalhe conosco', 'carreira', 'job', 'career', 'work with us']
    const hasJobsSection = jobKeywords.some(keyword => 
      html.toLowerCase().includes(keyword.toLowerCase())
    )
    
    // Detectar seções do site
    const sections = []
    const navMatches = html.match(/<nav[^>]*>(.*?)<\/nav>/is)
    if (navMatches) {
      const navLinks = navMatches[1].match(/<a[^>]*>(.*?)<\/a>/gis) || []
      sections.push(...navLinks.map(link => 
        link.replace(/<[^>]*>/g, '').trim()
      ).filter(s => s.length > 0 && s.length < 50))
    }
    
    // Detectar valores e cultura
    const cultureKeywords = ['missão', 'visão', 'valores', 'cultura', 'princípios', 'missao']
    const hasCultureSection = cultureKeywords.some(keyword => 
      html.toLowerCase().includes(keyword.toLowerCase())
    )
    
    // Detectar tecnologias usadas
    const technologies = []
    if (html.includes('wordpress')) technologies.push('WordPress')
    if (html.includes('react')) technologies.push('React')
    if (html.includes('angular')) technologies.push('Angular')
    if (html.includes('vue')) technologies.push('Vue.js')
    if (html.includes('shopify')) technologies.push('Shopify')
    if (html.includes('woocommerce')) technologies.push('WooCommerce')
    if (html.includes('drupal')) technologies.push('Drupal')
    if (html.includes('jquery')) technologies.push('jQuery')
    if (html.includes('bootstrap')) technologies.push('Bootstrap')
    if (html.includes('tailwind')) technologies.push('Tailwind CSS')
    
    // Detectar tipo de empresa
    const companyTypeKeywords = {
      'startup': ['startup', 'start-up', 'inovação', 'inovacao'],
      'consultoria': ['consultoria', 'consulting', 'consultor'],
      'ecommerce': ['ecommerce', 'e-commerce', 'loja virtual', 'online store'],
      'saude': ['saúde', 'saude', 'health', 'medical'],
      'educação': ['educação', 'educacao', 'education', 'ensino'],
      'financeiro': ['financeiro', 'financial', 'banco', 'bank', 'fintech']
    }
    
    let companyType = 'empresa'
    for (const [type, keywords] of Object.entries(companyTypeKeywords)) {
      if (keywords.some(keyword => html.toLowerCase().includes(keyword.toLowerCase()))) {
        companyType = type
        break
      }
    }
    
    // Detectar porte da empresa
    const sizeIndicators = {
      'pequena': ['pequena empresa', 'small business', 'startup', 'microempresa'],
      'media': ['média empresa', 'medium company', 'empresa de porte médio'],
      'grande': ['grande empresa', 'large company', 'corporation', 'multinacional']
    }
    
    let companySize = 'desconhecido'
    for (const [size, indicators] of Object.entries(sizeIndicators)) {
      if (indicators.some(indicator => html.toLowerCase().includes(indicator.toLowerCase()))) {
        companySize = size
        break
      }
    }
    
    // Analisar estrutura do site
    const structure = {
      hasHeader: html.includes('<header') || html.includes('<head>'),
      hasFooter: html.includes('<footer'),
      hasNavigation: html.includes('<nav'),
      hasContactForm: html.includes('<form') && html.toLowerCase().includes('contato'),
      hasBlog: html.toLowerCase().includes('blog') || html.toLowerCase().includes('artigos'),
      hasPortfolio: html.toLowerCase().includes('portfolio') || html.toLowerCase().includes('cases')
    }
    
    // Analisar performance básica
    const performance = {
      pageSize: html.length,
      hasMinifiedCSS: html.includes('.min.css'),
      hasMinifiedJS: html.includes('.min.js'),
      hasImages: html.includes('<img'),
      hasLazyLoading: html.includes('loading="lazy"') || html.includes('data-src')
    }
    
    return {
      title: title.trim(),
      description: description.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      technologies: technologies,
      hasHttps: url.startsWith('https://'),
      responsive: html.includes('viewport') || html.includes('@media'),
      loadingSpeed: 'medium',
      hasJobsSection,
      sections: sections.slice(0, 10), // Limitar a 10 seções
      hasCultureSection,
      companyType,
      companySize,
      structure,
      performance,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Erro ao buscar website:', error)
    return {
      title: '',
      description: '',
      keywords: [],
      technologies: [],
      hasHttps: false,
      responsive: false,
      loadingSpeed: 'unknown',
      hasJobsSection: false,
      sections: [],
      hasCultureSection: false,
      companyType: 'desconhecido',
      companySize: 'desconhecido',
      structure: {},
      performance: {},
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para análise detalhada de redes sociais
async function analyzeSocialMedia(companyData: any): Promise<SocialMediaAnalysis> {
  const socialMediaAnalysis: SocialMediaAnalysis = {
    facebook: null,
    instagram: null,
    twitter: null,
    youtube: null,
    linkedin: null
  }

  // Análise do Facebook
  if (companyData.facebook_url) {
    try {
      const response = await fetch(companyData.facebook_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Extrair informações básicas
        const likes = html.match(/([\d.,]+)\s*(?:curtidas|likes|gostos)/i)?.[1] || null
        const followers = html.match(/([\d.,]+)\s*(?:seguidores|followers|fãs)/i)?.[1] || null
        const isVerified = html.includes('verified') || html.includes('verificado')
        
        // Analisar tipo de conteúdo
        const contentTypes = []
        if (html.toLowerCase().includes('foto')) contentTypes.push('fotos')
        if (html.toLowerCase().includes('vídeo') || html.toLowerCase().includes('video')) contentTypes.push('vídeos')
        if (html.toLowerCase().includes('live') || html.toLowerCase().includes('ao vivo')) contentTypes.push('lives')
        if (html.toLowerCase().includes('evento')) contentTypes.push('eventos')
        
        // Analisar frequência de posts (aproximada)
        const postDates = html.match(/(?:\d{1,2} de [a-z]+|\d{1,2} [a-z]+|\d{1,2}\/\d{1,2}|\d{1,2}h)/gi) || []
        const recentPosts = postDates.filter(date => {
          // Considerar posts recentes se tiverem horas ou datas muito recentes
          return date.includes('h') || date.includes('min')
        }).length
        
        socialMediaAnalysis.facebook = {
          platform: 'Facebook',
          url: companyData.facebook_url,
          likes: likes ? parseInt(likes.replace(/[.,]/g, '')) : null,
          followers: followers ? parseInt(followers.replace(/[.,]/g, '')) : null,
          verified: isVerified,
          contentTypes: contentTypes,
          postingFrequency: recentPosts > 5 ? 'alta' : recentPosts > 2 ? 'média' : 'baixa',
          recentPosts: recentPosts,
          engagement: likes && parseInt(likes.replace(/[.,]/g, '')) > 10000 ? 85 : 45,
          lastAnalyzed: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Erro ao analisar Facebook:', error)
      socialMediaAnalysis.facebook = {
        platform: 'Facebook',
        url: companyData.facebook_url,
        error: 'Não foi possível analisar o Facebook'
      }
    }
  }

  // Análise do Instagram
  if (companyData.instagram_url) {
    try {
      const response = await fetch(companyData.instagram_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Extrair informações básicas
        const followers = html.match(/([\d.,]+)\s*(?:seguidores|followers)/i)?.[1] || null
        const posts = html.match(/([\d.,]+)\s*(?:publicações|posts)/i)?.[1] || null
        const following = html.match(/([\d.,]+)\s*(?:seguindo|following)/i)?.[1] || null
        
        // Analisar bio e descrição
        const bio = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i)?.[1] || ''
        
        // Verificar se é conta business
        const isBusiness = html.includes('business') || html.includes('comercial')
        
        // Analisar tipo de conteúdo
        const contentTypes = []
        if (html.toLowerCase().includes('reels')) contentTypes.push('reels')
        if (html.toLowerCase().includes('story') || html.toLowerCase().includes('stories')) contentTypes.push('stories')
        if (html.toLowerCase().includes('igtv')) contentTypes.push('igtv')
        if (html.toLowerCase().includes('guia')) contentTypes.push('guias')
        
        // Calcular taxa de engajamento aproximada
        let engagementRate = null
        if (followers && posts) {
          const followersNum = parseInt(followers.replace(/[.,]/g, ''))
          const postsNum = parseInt(posts.replace(/[.,]/g, ''))
          engagementRate = followersNum > 0 ? Math.min((postsNum / followersNum) * 100, 10) : 0
        }
        
        socialMediaAnalysis.instagram = {
          platform: 'Instagram',
          url: companyData.instagram_url,
          followers: followers ? parseInt(followers.replace(/[.,]/g, '')) : null,
          engagement: engagementRate,
          recentPosts: posts ? parseInt(posts.replace(/[.,]/g, '')) : null,
          contentTypes: contentTypes,
          postingFrequency: recentPosts > 5 ? 'alta' : recentPosts > 2 ? 'média' : 'baixa',
          lastAnalyzed: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Erro ao analisar Instagram:', error)
      socialMediaAnalysis.instagram = {
        platform: 'Instagram',
        url: companyData.instagram_url,
        error: 'Não foi possível analisar o Instagram'
      }
    }
  }

  // Análise do Twitter/X
  if (companyData.twitter_url) {
    try {
      const response = await fetch(companyData.twitter_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Extrair informações básicas
        const followers = html.match(/([\d.,]+)\s*(?:seguidores|followers)/i)?.[1] || null
        const tweets = html.match(/([\d.,]+)\s*(?:tweets|posts)/i)?.[1] || null
        
        // Analisar verificação
        const isVerified = html.includes('verified') || html.includes('verificado')
        
        // Analisar tipo de conteúdo
        const contentTypes = []
        if (html.toLowerCase().includes('retweet')) contentTypes.push('retweets')
        if (html.toLowerCase().includes('reply')) contentTypes.push('respostas')
        if (html.toLowerCase().includes('media')) contentTypes.push('mídia')
        if (html.toLowerCase().includes('poll')) contentTypes.push('pesquisas')
        
        // Analisar frequência de tweets
        const tweetDates = html.match(/(?:\d{1,2} de [a-z]+|\d{1,2}h)/gi) || []
        const recentTweets = tweetDates.filter(date => date.includes('h')).length
        
        socialMediaAnalysis.twitter = {
          platform: 'Twitter/X',
          url: companyData.twitter_url,
          followers: followers ? parseInt(followers.replace(/[.,]/g, '')) : null,
          recentPosts: tweets ? parseInt(tweets.replace(/[.,]/g, '')) : null,
          verified: isVerified,
          contentTypes: contentTypes,
          postingFrequency: recentTweets > 10 ? 'alta' : recentTweets > 5 ? 'média' : 'baixa',
          engagement: followers && parseInt(followers.replace(/[.,]/g, '')) > 5000 ? 75 : 35,
          lastAnalyzed: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Erro ao analisar Twitter:', error)
      socialMediaAnalysis.twitter = {
        platform: 'Twitter/X',
        url: companyData.twitter_url,
        error: 'Não foi possível analisar o Twitter'
      }
    }
  }

  // Análise do YouTube
  if (companyData.youtube_url) {
    try {
      const response = await fetch(companyData.youtube_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Extrair informações básicas
        const subscribers = html.match(/([\d.,]+)\s*(?:inscritos|subscribers)/i)?.[1] || null
        const videos = html.match(/([\d.,]+)\s*(?:vídeos|videos)/i)?.[1] || null
        const views = html.match(/([\d.,]+)\s*(?:visualizações|views)/i)?.[1] || null
        
        // Analisar tipo de conteúdo
        const contentTypes = []
        if (html.toLowerCase().includes('shorts')) contentTypes.push('shorts')
        if (html.toLowerCase().includes('live')) contentTypes.push('lives')
        if (html.toLowerCase().includes('playlist')) contentTypes.push('playlists')
        if (html.toLowerCase().includes('community')) contentTypes.push('comunidade')
        
        // Calcular média de visualizações por vídeo
        let avgViewsPerVideo = null
        if (views && videos) {
          const viewsNum = parseInt(views.replace(/[.,]/g, ''))
          const videosNum = parseInt(videos.replace(/[.,]/g, ''))
          avgViewsPerVideo = videosNum > 0 ? Math.floor(viewsNum / videosNum) : 0
        }
        
        socialMediaAnalysis.youtube = {
          platform: 'YouTube',
          url: companyData.youtube_url,
          followers: subscribers ? parseInt(subscribers.replace(/[.,]/g, '')) : null,
          recentPosts: videos ? parseInt(videos.replace(/[.,]/g, '')) : null,
          contentTypes: contentTypes,
          engagement: avgViewsPerVideo,
          analysisLevel: 'detailed'
        }
      }
    } catch (error) {
      console.error('Erro ao analisar YouTube:', error)
      socialMediaAnalysis.youtube = {
        platform: 'YouTube',
        url: companyData.youtube_url,
        error: 'Não foi possível analisar o YouTube'
      }
    }
  }

  // Análise do LinkedIn
  if (companyData.linkedin_url) {
    try {
      const response = await fetch(companyData.linkedin_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Extrair informações básicas
        const followers = html.match(/([\d.,]+)\s*(?:seguidores|followers)/i)?.[1] || null
        const employees = html.match(/([\d.,]+)\s*(?:funcionários|employees|funcionarios)/i)?.[1] || null
        
        // Analisar tipo de empresa e descrição
        const companyType = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i)?.[1] || ''
        const companyName = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1] || ''
        
        // Verificar se é empresa verificada no LinkedIn
        const isVerified = html.includes('verified') || html.includes('verificado') || html.includes('checkmark')
        
        // Extrair informações de localização
        const locations = []
        const locationMatches = html.match(/(?:São Paulo|Rio de Janeiro|Brasília|Belo Horizonte|Curitiba|Porto Alegre|Recife|Salvador|Fortaleza|Goiânia|Campinas|São José dos Campos|São José do Rio Preto|Ribeirão Preto|Santos|Juiz de Fora|Uberlândia|Campo Grande|Cuiabá|Florianópolis|Joinville|Natal|João Pessoa|Maceió|Aracaju|Teresina|Boa Vista|Macapá|Palmas|Porto Velho|Rio Branco|Manaus|Belém|SP|RJ|MG|RS|PR|SC|BA|PE|CE|RN|PB|AL|SE|MA|PI|TO|GO|MT|MS|DF|AC|AM|RR|AP|PA|RO)/gi) || []
        locations.push(...locationMatches)
        
        // Analisar departamentos e áreas de atuação
        const departments: string[] = []
        const deptKeywords = ['Tecnologia', 'TI', 'T.I.', 'Vendas', 'Marketing', 'RH', 'Recursos Humanos', 'Financeiro', 'Operações', 'Jurídico', 'Comercial', 'Desenvolvimento', 'Engenharia', 'Design', 'Produto', 'Product', 'Customer Success', 'Suporte', 'Logística', 'Compras', 'Produção', 'Administração', 'Diretoria', 'Executivo', 'C-Level', 'Gerência', 'Gestão', 'Consultoria', 'Análise', 'Data', 'Analytics']
        deptKeywords.forEach(dept => {
          if (html.toLowerCase().includes(dept.toLowerCase())) departments.push(dept)
        })
        
        // Identificar setor/indústria
        const industryKeywords = ['Tecnologia', 'Software', 'Consultoria', 'Finanças', 'Bancos', 'Varejo', 'E-commerce', 'Educação', 'Saúde', 'Indústria', 'Manufatura', 'Agricultura', 'Construção', 'Imobiliário', 'Transporte', 'Logística', 'Energia', 'Telecomunicações', 'Midia', 'Entretenimento', 'Alimentos', 'Bebidas', 'Moda', 'Viagem', 'Turismo']
        const industry = industryKeywords.find(ind => html.toLowerCase().includes(ind.toLowerCase())) || 'Não identificado'
        
        // Analisar tamanho da empresa baseado em funcionários
        const employeeCount = employees ? parseInt(employees.replace(/[.,]/g, '')) : 0
        let companySize = 'desconhecido'
        let companySizeCategory = 'desconhecido'
        
        if (employeeCount > 0) {
          if (employeeCount > 10000) {
            companySize = 'multinacional'
            companySizeCategory = 'grande'
          } else if (employeeCount > 1000) {
            companySize = 'grande porte'
            companySizeCategory = 'grande'
          } else if (employeeCount > 500) {
            companySize = 'médio-grande porte'
            companySizeCategory = 'média'
          } else if (employeeCount > 50) {
            companySize = 'médio porte'
            companySizeCategory = 'média'
          } else if (employeeCount > 10) {
            companySize = 'pequeno-médio porte'
            companySizeCategory = 'pequena'
          } else {
            companySize = 'pequeno porte'
            companySizeCategory = 'pequena'
          }
        }
        
        // Analisar presença no mercado baseado em seguidores
        const followerCount = followers ? parseInt(followers.replace(/[.,]/g, '')) : 0
        let industryPresence = 'desconhecida'
        if (followerCount > 100000) {
          industryPresence = 'muito forte'
        } else if (followerCount > 50000) {
          industryPresence = 'forte'
        } else if (followerCount > 10000) {
          industryPresence = 'moderada'
        } else if (followerCount > 1000) {
          industryPresence = 'iniciante'
        } else {
          industryPresence = 'limitada'
        }
        
        // Extrair informações de vagas recentes
        const jobOpenings: string[] = []
        const jobKeywords = ['vaga', 'vagas', 'emprego', 'empregos', 'oportunidade', 'carreira', 'trabalhe conosco', 'join our team', 'we are hiring', 'job opening']
        jobKeywords.forEach(keyword => {
          if (html.toLowerCase().includes(keyword.toLowerCase())) jobOpenings.push(keyword)
        })
        
        // Analisar cultura corporativa
        const cultureKeywords = ['inovação', 'inovacao', 'criatividade', 'colaboração', 'colaboracao', 'trabalho em equipe', 'team work', 'ética', 'etica', 'transparência', 'transparencia', 'sustentabilidade', 'diversidade', 'inclusão', 'inclusao', 'desenvolvimento profissional', 'growth', 'aprendizado', 'learning']
        const companyCulture: string[] = []
        cultureKeywords.forEach(culture => {
          if (html.toLowerCase().includes(culture.toLowerCase())) companyCulture.push(culture)
        })
        
        socialMediaAnalysis.linkedin = {
          platform: 'LinkedIn',
          url: companyData.linkedin_url,
          companyName: companyName,
          followers: followerCount,
          employees: employeeCount,
          companyType: companyType,
          industry: industry,
          verified: isVerified,
          locations: [...new Set(locations)], // Remover duplicatas
          departments: [...new Set(departments)], // Remover duplicatas
          companySize: companySize,
          companySizeCategory: companySizeCategory,
          industryPresence: industryPresence,
          jobOpenings: jobOpenings.length > 0,
          jobOpeningKeywords: jobOpenings,
          companyCulture: companyCulture,
          lastAnalyzed: new Date().toISOString(),
          analysisLevel: 'detailed'
        }
      }
    } catch (error) {
      console.error('Erro ao analisar LinkedIn:', error)
      socialMediaAnalysis.linkedin = {
        platform: 'LinkedIn',
        url: companyData.linkedin_url,
        error: 'Não foi possível analisar o LinkedIn',
        analysisLevel: 'basic'
      }
    }
  }

  return socialMediaAnalysis
}

// Função para análise detalhada da empresa
async function performDetailedAnalysis(companyData: any) {
  const prompt = `
    Você é um especialista em análise empresarial e estratégias de carreira. 
    Realize uma análise COMPLETA e DETALHADA da empresa com base nas seguintes informações:
    
    DADOS DA EMPRESA:
    - Nome: ${companyData.name}
    - Website: ${companyData.website_url || 'Não disponível'}
    - LinkedIn: ${companyData.linkedin_url || 'Não disponível'}
    - Instagram: ${companyData.instagram_url || 'Não disponível'}
    - Facebook: ${companyData.facebook_url || 'Não disponível'}
    - Twitter: ${companyData.twitter_url || 'Não disponível'}
    
    ANÁLISE DO WEBSITE:
    ${companyData.website_analysis ? JSON.stringify(companyData.website_analysis, null, 2) : 'Análise não disponível'}
    
    ANÁLISE DE REDES SOCIAIS:
    ${companyData.social_media_analysis ? JSON.stringify(companyData.social_media_analysis, null, 2) : 'Análise não disponível'}
    
    FORNEÇA UMA ANÁLISE COMPLETA incluindo:
    
    1. **ANÁLISE DO WEBSITE CORPORATIVO**:
       - Estrutura e navegabilidade
       - Conteúdo e mensagens principais
       - Valores e cultura da empresa
       - Vagas disponíveis e oportunidades
       - Tecnologias utilizadas
       - Avaliação geral do site (0-100)
    
    2. **PRESENÇA EM REDES SOCIAIS**:
       - Facebook: análise de conteúdo, engajamento, frequência de posts
       - Instagram: tipo de conteúdo, estética visual, stories
       - Twitter/X: frequência de tweets, temas abordados, interações
       - YouTube: vídeos, inscritos, conteúdo produzido
       - LinkedIn: perfil da empresa, funcionários, publicações
    
    3. **ANÁLISE DO LINKEDIN**:
       - Número de funcionários e estrutura organizacional
       - Departamentos e áreas de atuação
       - Publicações recentes e engajamento
       - Cultura corporativa evidenciada
       - Oportunidades de networking identificadas
    
    4. **TENDÊNCIAS DE MERCADO**:
       - Setor de atuação e suas tendências atuais
       - Concorrentes principais
       - Desafios e oportunidades do setor
       - Perspectivas de crescimento
    
    5. **ANÁLISE DE ANÚNCIOS**:
       - Campanhas ativas no Meta Ads (Facebook/Instagram)
       - Campanhas no Google Ads
       - Palavras-chave utilizadas
       - Criativos e mensagens
       - Público-alvo estimado
    
    6. **PONTOS DE ENTRADA IDENTIFICADOS**:
       - Oportunidades de networking
       - Eventos e conferências do setor
       - Grupos e comunidades relevantes
       - Formas efetivas de abordagem
    
    7. **ESTRATÉGIA PERSONALIZADA**:
       - Plano de ação passo-a-passo
       - Timing ideal para aplicações
       - Canais de contato mais efetivos
       - Preparação para entrevistas
       - Skills a desenvolver
       - Cronograma sugerido
    
    FORNEÇA a resposta em formato JSON válivel com a seguinte estrutura:
    {
      "website_analysis": {
        "structure_score": number,
        "content_quality": string,
        "values_culture": string[],
        "job_opportunities": string[],
        "technology_stack": string[],
        "overall_score": number
      },
      "social_media_presence": {
        "facebook": { "activity": string, "engagement": string, "content_type": string },
        "instagram": { "visual_style": string, "post_frequency": string, "stories_usage": string },
        "twitter": { "tweet_frequency": string, "topics": string[], "interactions": string },
        "youtube": { "content_type": string, "subscriber_engagement": string },
        "linkedin": { "company_culture": string, "employee_insights": string, "recent_posts": string[] }
      },
      "market_analysis": {
        "industry_trends": string[],
        "main_competitors": string[],
        "challenges": string[],
        "opportunities": string[],
        "growth_outlook": string
      },
      "advertising_analysis": {
        "meta_ads_active": boolean,
        "google_ads_active": boolean,
        "estimated_ad_spend": string,
        "target_audience": string,
        "key_messages": string[]
      },
      "networking_opportunities": {
        "industry_events": string[],
        "professional_groups": string[],
        "mutual_connections": string[],
        "best_approach_methods": string[]
      },
      "personalized_strategy": {
        "step_by_step_plan": string[],
        "ideal_timing": string,
        "contact_channels": string[],
        "interview_preparation": string[],
        "skills_to_develop": string[],
        "timeline": { "phase1": string, "phase2": string, "phase3": string }
      }
    }
  `
  
  try {
    const text = await callGemini('gemini-2.5-pro', prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Se não conseguir extrair JSON, retornar estrutura padrão
    return {
      website_analysis: {
        structure_score: 70,
        content_quality: 'Análise não disponível',
        values_culture: ['Trabalho em equipe', 'Inovação'],
        job_opportunities: ['Desenvolvedor', 'Designer'],
        technology_stack: ['JavaScript', 'React'],
        overall_score: 70
      },
      social_media_presence: {
        facebook: { activity: 'Moderada', engagement: 'Média', content_type: 'Misto' },
        instagram: { visual_style: 'Corporativo', post_frequency: 'Semanal', stories_usage: 'Regular' },
        twitter: { tweet_frequency: 'Diária', topics: ['Tecnologia', 'Negócios'], interactions: 'Moderadas' },
        youtube: { content_type: 'Tutoriais', subscriber_engagement: 'Boa' },
        linkedin: { company_culture: 'Inovadora', employee_insights: 'Colaborativa', recent_posts: ['Tecnologia', 'Carreira'] }
      },
      market_analysis: {
        industry_trends: ['Digitalização', 'IA'],
        main_competitors: ['Empresa A', 'Empresa B'],
        challenges: ['Concorrência', 'Tecnologia'],
        opportunities: ['Crescimento', 'Inovação'],
        growth_outlook: 'Positiva'
      },
      advertising_analysis: {
        meta_ads_active: true,
        google_ads_active: true,
        estimated_ad_spend: 'R$ 10.000-50.000/mês',
        target_audience: 'Empresas B2B',
        key_messages: ['Inovação', 'Eficiência']
      },
      networking_opportunities: {
        industry_events: ['Tech Conference', 'Business Summit'],
        professional_groups: ['Grupo de Tecnologia', 'Associação de Negócios'],
        mutual_connections: ['João Silva', 'Maria Santos'],
        best_approach_methods: ['LinkedIn', 'Email direto']
      },
      personalized_strategy: {
        step_by_step_plan: ['Pesquisar empresa', 'Preparar portfólio', 'Entrar em contato'],
        ideal_timing: 'Próximas 2-4 semanas',
        contact_channels: ['LinkedIn', 'Email corporativo'],
        interview_preparation: ['Estudar empresa', 'Preparar cases', 'Simular entrevista'],
        skills_to_develop: ['Comunicação', 'Tecnologias específicas'],
        timeline: { phase1: 'Semana 1-2', phase2: 'Semana 3-4', phase3: 'Mês 2' }
      }
    }
    
  } catch (error) {
    console.error('Erro na análise detalhada:', error)
    return {
      website_analysis: { structure_score: 0, content_quality: 'Erro na análise', values_culture: [], job_opportunities: [], technology_stack: [], overall_score: 0 },
      social_media_presence: { facebook: {}, instagram: {}, twitter: {}, youtube: {}, linkedin: {} },
      market_analysis: { industry_trends: [], main_competitors: [], challenges: [], opportunities: [], growth_outlook: 'Erro' },
      advertising_analysis: { meta_ads_active: false, google_ads_active: false, estimated_ad_spend: 'Erro', target_audience: 'Erro', key_messages: [] },
      networking_opportunities: { industry_events: [], professional_groups: [], mutual_connections: [], best_approach_methods: [] },
      personalized_strategy: { step_by_step_plan: [], ideal_timing: 'Erro', contact_channels: [], interview_preparation: [], skills_to_develop: [], timeline: {} },
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para análise de anúncios (mock por enquanto)
async function analyzeAds(companyName: string) {
  return {
    meta_ads: {
      active: Math.random() > 0.5,
      estimated_spend: ['R$ 1.000-5.000/mês', 'R$ 5.000-20.000/mês', 'R$ 20.000-50.000/mês', 'R$ 50.000+/mês'][Math.floor(Math.random() * 4)],
      platforms: ['Facebook', 'Instagram'],
      key_messages: ['Inovação', 'Eficiência', 'Crescimento'].slice(0, Math.floor(Math.random() * 3) + 1)
    },
    google_ads: {
      active: Math.random() > 0.5,
      keywords: ['tecnologia', 'inovação', 'soluções', 'empresa'].slice(0, Math.floor(Math.random() * 4) + 1),
      estimated_spend: ['R$ 1.000-5.000/mês', 'R$ 5.000-20.000/mês', 'R$ 20.000-50.000/mês'][Math.floor(Math.random() * 3)]
    }
  }
}

// Função para análise de mercado
async function analyzeMarket(industry: string) {
  try {
    const prompt = `
Você é um especialista em análise de mercado e tendências industriais.
Realize uma análise detalhada do setor: ${industry}
Retorne SOMENTE JSON:
{
  "industry_trends": ["t1","t2","t3","t4","t5"],
  "main_competitors": ["c1","c2","c3"],
  "challenges": ["d1","d2","d3","d4"],
  "opportunities": ["o1","o2","o3","o4"],
  "growth_outlook": "texto"
}`
    const text = await callGemini('gemini-2.5-pro', prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback para dados mockados se não conseguir extrair JSON
    return {
      industry_trends: ['Digitalização acelerada', 'Inteligência Artificial', 'Sustentabilidade', 'Trabalho remoto'],
      main_competitors: ['Empresa Líder A', 'Empresa Líder B', 'Empresa Líder C'],
      challenges: ['Concorrência acirrada', 'Mudanças tecnológicas rápidas', 'Atração e retenção de talentos', 'Regulamentações'],
      opportunities: ['Expansão de mercado', 'Novas tecnologias', 'Parcerias estratégicas', 'Inovação de produtos'],
      growth_outlook: 'Positiva'
    }
    
  } catch (error) {
    console.error('Erro na análise de mercado:', error)
    
    // Fallback com dados mockados em caso de erro
    return {
      industry_trends: ['Digitalização acelerada', 'Inteligência Artificial', 'Sustentabilidade', 'Trabalho remoto'],
      main_competitors: ['Empresa Líder A', 'Empresa Líder B', 'Empresa Líder C'],
      challenges: ['Concorrência acirrada', 'Mudanças tecnológicas rápidas', 'Atração e retenção de talentos', 'Regulamentações'],
      opportunities: ['Expansão de mercado', 'Novas tecnologias', 'Parcerias estratégicas', 'Inovação de produtos'],
      growth_outlook: 'Estável'
    }
  }
}

// Função para gerar estratégia com IA
async function generateStrategy(companyInfo: any, profile: any) {
  const prompt = `
    Você é um coach de carreira sênior e especialista em recrutamento.
    Gere uma estratégia COMPLETAMENTE PERSONALIZADA para o USUÁRIO conseguir um emprego nesta empresa.
    A estratégia DEVE ser baseada EXCLUSIVAMENTE no currículo, habilidades e objetivos do usuário — sem suposições genéricas.
    
    INFORMAÇÕES DA EMPRESA:
    - Nome: ${companyInfo.name}
    - Website: ${companyInfo.website_url || 'Não disponível'}
    - Descrição: ${companyInfo.description || 'Não disponível'}
    - Tecnologias detectadas: ${companyInfo.technologies?.join(', ') || 'Não identificadas'}
    - Tamanho: ${companyInfo.company_size || 'Não identificado'}
    - Setor: ${companyInfo.industry || 'Não identificado'}
    
    ANÁLISE DO WEBSITE:
    - Título: ${companyInfo.website_analysis?.title || 'Não disponível'}
    - Descrição: ${companyInfo.website_analysis?.description || 'Não disponível'}
    - Tecnologias: ${companyInfo.website_analysis?.technologies?.join(', ') || 'Não identificadas'}
    - Pontuação do site: ${companyInfo.website_analysis?.website_score || 0}/100
    
    ANÁLISE DE REDES SOCIAIS:
    - LinkedIn: ${companyInfo.social_media_presence?.linkedin ? 'Presente' : 'Não presente'}
    - Instagram: ${companyInfo.social_media_presence?.instagram ? 'Presente' : 'Não presente'}
    - Facebook: ${companyInfo.social_media_presence?.facebook ? 'Presente' : 'Não presente'}
    
    PERFIL DO USUÁRIO (CURRÍCULO):
    - Nome: ${profile?.user_name || 'Não disponível'}
    - LinkedIn: ${profile?.linkedin_url || 'Não informado'}
    - Habilidades: ${profile?.skills?.join(', ') || 'Não informado'}
    - Especialidades: ${profile?.specialties?.join(', ') || 'Não informado'}
    - Experiência (anos): ${profile?.experience_years ?? 'Não informado'}
    - Tipos de trabalho preferidos: ${profile?.preferred_work_types?.join(', ') || 'Não informado'}
    - Currículo (texto): ${profile?.resume_text ? profile.resume_text.slice(0, 3500) : 'Não fornecido'}
    
    Crie uma estratégia de CARREIRA detalhada incluindo:
    
    1. ANÁLISE DA EMPRESA (3-5 pontos principais)
    2. OPORTUNIDADES IDENTIFICADAS (mínimo 5 oportunidades específicas)
    3. ESTRATÉGIA DE ABORDAGEM PARA CONTRATAÇÃO (passo-a-passo detalhado)
    4. PROPOSTA DE VALOR PESSOAL (texto convincente, baseado no currículo)
    5. OPORTUNIDADES DE NETWORKING (prioridade, quem abordar e por onde)
    6. PREPARAÇÃO PARA ENTREVISTA (roteiro de estudo, cases, perguntas)
    7. SKILLS A DESENVOLVER (lacunas do currículo com plano de estudo)
    8. TIMING IDEAL (quando aplicar, em qual fase)
    9. CANAIS DE CONTATO MAIS EFETIVOS (com justificativa)
    10. PLANO DE AÇÃO PASSO-A-PASSO com cronograma e métricas de sucesso
    
    Regras:
    - Baseie TODAS as recomendações no currículo e perfil do usuário.
    - Evite jargões de vendas/marketing B2B.
    - Seja específico, prático e acionável.
    
    Formate a resposta em JSON válido com as chaves:
    {
      "analysis": string[],
      "opportunities": string[],
      "strategy": string[],
      "value_proposition": string,
      "networking_opportunities": string[],
      "interview_preparation": string[],
      "skills_to_develop": string[],
      "ideal_timing": string,
      "contact_channels": string[],
      "action_plan": string[],
      "next_steps": string[]
    }
  `
  
  try {
    const text = await callGemini('gemini-2.5-pro', prompt)
    
    // Tentar extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Se não conseguir extrair JSON, retornar texto estruturado
    return {
      analysis: ['Análise detalhada não disponível'],
      opportunities: ['Oportunidades serão identificadas após análise mais profunda'],
      strategy: ['Estratégia personalizada será gerada'],
      services: ['Serviços recomendados baseados nas necessidades da empresa'],
      value_proposition: 'Proposta de valor personalizada para esta empresa',
      next_steps: ['Analisar website em detalhes', 'Verificar presença em redes sociais', 'Preparar material personalizado'],
      budget_estimate: 'A ser definido após entendimento das necessidades'
    }
  } catch (error) {
    console.error('Erro ao gerar estratégia:', error)
    return {
      analysis: ['Erro ao gerar análise'],
      opportunities: ['Erro ao identificar oportunidades'],
      strategy: ['Erro ao criar estratégia'],
      services: ['Erro ao recomendar serviços'],
      value_proposition: 'Erro ao gerar proposta de valor',
      next_steps: ['Verificar conexão e tentar novamente'],
      budget_estimate: 'Erro ao estimar orçamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Gera um relatório narrativo completo em texto
async function generateNarrativeReport(params: {
  company_name: string,
  website_url?: string | null,
  website_analysis?: any,
  social_media_presence?: any,
  market_analysis?: any,
  ads_analysis?: any,
  strategy?: any,
  profile?: any
}) {
  const {
    company_name,
    website_url,
    website_analysis,
    social_media_presence,
    market_analysis,
    ads_analysis,
    strategy,
    profile
  } = params

  const prompt = `
Você é um analista sênior. Escreva um RELATÓRIO NARRATIVO COMPLETO, claro e objetivo, em português, sobre a empresa abaixo.
Primeiro entregue um texto corrido bem estruturado (título e seções com parágrafos), sem listas marcadas e sem JSON.
Conteúdo mínimo:
- Visão geral da empresa
- Análise do website (estrutura, conteúdo, tecnologias, cultura, vagas)
- Presença nas redes (LinkedIn, Instagram, Facebook, Twitter, YouTube)
- Tendências de mercado e concorrência
- Anúncios (Meta/Google), mensagens e público
- Estratégia personalizada de carreira baseada no currículo do usuário
- Próximos passos sugeridos

Dados de entrada:
- Empresa: ${company_name}
- Website: ${website_url || 'Não informado'}
- Website (análise): ${website_analysis ? JSON.stringify(website_analysis) : 'n/d'}
- Social: ${social_media_presence ? JSON.stringify(social_media_presence) : 'n/d'}
- Mercado: ${market_analysis ? JSON.stringify(market_analysis) : 'n/d'}
- Anúncios: ${ads_analysis ? JSON.stringify(ads_analysis) : 'n/d'}
- Estratégia IA: ${strategy ? JSON.stringify(strategy) : 'n/d'}
- Usuário: ${profile ? JSON.stringify(profile) : 'n/d'}

Regras:
- Texto corrido, não retorne listas marcadas como JSON ou arrays.
- Seja específico e use o contexto fornecido quando existir.
`
  try {
    const text = await callGemini('gemini-2.5-pro', prompt)
    return text?.trim() || ''
  } catch (e) {
    console.error('Erro ao gerar relatório narrativo:', e)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let profileId: string | null = null
    let shouldSetCookie = false
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile) {
        profileId = profile.id
      } else {
        // Criar perfil se não existir para o usuário logado
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ user_id: user.id, user_name: user.user_metadata?.name || user.user_metadata?.full_name || 'Usuário', email: user.email }])
          .select('id')
          .single()
        if (newProfile) profileId = newProfile.id
      }
    } else {
      profileId = request.cookies.get(PROFILE_COOKIE)?.value || null
      if (!profileId) {
        const { data: inserted } = await supabase
          .from('profiles')
          .insert([{ user_name: 'Usuário', email: null }])
          .select('id')
          .single()
        if (inserted?.id) {
          profileId = inserted.id
          shouldSetCookie = true
        }
      }
    }
    
    const body = await request.json()
    const { company_id, company_name, website_url, linkedin_url, instagram_url, facebook_url, twitter_url, force_reanalysis = false } = body
    
    if (!company_name) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }
    
    // Buscar perfil do usuário (por id do cookie ou id do auth)
    let profileData: any = null
    if (profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()
      profileData = profile
    }
    
    let effectiveWebsite = website_url || null
    let effectiveLinkedin = linkedin_url || null
    let effectiveInstagram = instagram_url || null
    let effectiveFacebook = facebook_url || null
    let effectiveTwitter = twitter_url || null
    let effectiveYoutube: string | null = null
    if (!effectiveWebsite || !effectiveLinkedin || !effectiveInstagram || !effectiveFacebook || !effectiveTwitter) {
      const discovered = await discoverCompanyUrls(company_name)
      effectiveWebsite = effectiveWebsite || discovered.website_url
      effectiveLinkedin = effectiveLinkedin || discovered.linkedin_url
      effectiveInstagram = effectiveInstagram || discovered.instagram_url
      effectiveFacebook = effectiveFacebook || discovered.facebook_url
      effectiveTwitter = effectiveTwitter || discovered.twitter_url
      effectiveYoutube = discovered.youtube_url
    }
    
    // Verificar se já existe análise recente (menos de 30 dias)
    if (!force_reanalysis) {
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('company_analysis')
        .select('*')
        .eq('company_name', company_name)
        .gte('analysis_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('analysis_date', { ascending: false })
        .limit(1)
      
      if (existingAnalysis && existingAnalysis.length > 0) {
        const res = NextResponse.json({
          message: 'Análise existente encontrada',
          data: existingAnalysis[0],
          cached: true
        })
        if (shouldSetCookie && profileId) {
          res.cookies.set(PROFILE_COOKIE, profileId, { httpOnly: true, sameSite: 'lax', path: '/' })
        }
        return res
      }
    }
    
    // Análise detalhada da empresa (multidimensional)
    const detailedAnalysis = await performDetailedAnalysis({
      name: company_name,
      website_url: effectiveWebsite,
      linkedin_url: effectiveLinkedin,
      instagram_url: effectiveInstagram,
      facebook_url: effectiveFacebook,
      twitter_url: effectiveTwitter
    })
    
    // Análise de anúncios
    const adsAnalysis = await analyzeAds(company_name)
    
    // Analisar website (mantido para compatibilidade)
    let websiteAnalysis: any = {}
    if (effectiveWebsite) {
      websiteAnalysis = await fetchWebsiteInfo(effectiveWebsite)
    }
    
    // Analisar redes sociais (mantido para compatibilidade)
    const socialMediaAnalysis = await analyzeSocialMedia({
      linkedin_url: effectiveLinkedin,
      instagram_url: effectiveInstagram,
      facebook_url: effectiveFacebook,
      twitter_url: effectiveTwitter,
      youtube_url: effectiveYoutube
    })
    
    // Detectar setor/indústria com base nos dados disponíveis
    let industry = 'Não identificado'
    if (socialMediaAnalysis?.linkedin?.industry) {
      industry = socialMediaAnalysis.linkedin.industry
    } else if ((detailedAnalysis as any)?.industry) {
      industry = (detailedAnalysis as any).industry
    } else if (websiteAnalysis?.industry) {
      industry = websiteAnalysis.industry
    }
    
    // Análise de mercado
    const marketAnalysis = await analyzeMarket(industry)
    
    // Gerar estratégia com IA (integrando análise detalhada)
    const strategy = await generateStrategy({
      name: company_name,
      website_url: effectiveWebsite,
      linkedin_url: effectiveLinkedin,
      instagram_url: effectiveInstagram,
      facebook_url: effectiveFacebook,
      twitter_url: effectiveTwitter,
      website_analysis: websiteAnalysis,
      social_media_presence: socialMediaAnalysis,
      detailed_analysis: detailedAnalysis,
      ads_analysis: adsAnalysis,
      market_analysis: marketAnalysis,
      technologies: websiteAnalysis.technologies || []
    }, profileData)
    
    // Texto completo narrativo
    const narrativeText = await generateNarrativeReport({
      company_name,
      website_url: effectiveWebsite || undefined,
      website_analysis: websiteAnalysis,
      social_media_presence: socialMediaAnalysis,
      market_analysis: marketAnalysis,
      ads_analysis: adsAnalysis,
      strategy,
      profile: profileData
    })
    
    // Preparar dados para salvar
    const analysisData = {
      profile_id: profileId,
      company_name,
      website_url: effectiveWebsite,
      linkedin_url: effectiveLinkedin,
      instagram_url: effectiveInstagram,
      facebook_url: effectiveFacebook,
      twitter_url: effectiveTwitter,
      company_size: socialMediaAnalysis.linkedin?.companySize || 'unknown',
      industry,
      location_city: null,
      location_state: null,
      location_country: null,
      website_analysis: websiteAnalysis,
      website_score: websiteAnalysis.website_score || 0,
      social_media_presence: socialMediaAnalysis,
      linkedin_analysis: socialMediaAnalysis.linkedin,
      instagram_analysis: socialMediaAnalysis.instagram,
      ads_analysis: adsAnalysis || {},
      google_ads_presence: false,
      meta_ads_presence: false,
      marketAnalysis,
      competitors: [],
      trends_analysis: {},
      ai_strategy: {
        ...strategy,
        raw_text: narrativeText || null,
        user_context: {
          user_name: userProfile?.user_name || null,
          linkedin_url: userProfile?.linkedin_url || null,
          skills: userProfile?.skills || [],
          experience_years: userProfile?.experience_years || null
        }
      },
      service_opportunities: strategy.opportunities || [],
      recommended_approach: strategy.strategy?.join('\n') || '',
      estimated_budget_range: strategy.budget_estimate || 'A definir',
      analysis_status: 'completed',
      analysis_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }
    
    // Salvar análise no banco
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('company_analysis')
      .upsert(analysisData, { onConflict: 'company_name' })
      .select()
      .single()
    
    let resultAnalysis: any = savedAnalysis || analysisData
    if (saveError) {
      console.error('Erro ao salvar análise (seguindo com dados em memória):', saveError)
    }
    
    // Gerar match com perfil do usuário se existir
    if (userProfile && resultAnalysis && resultAnalysis.id) {
      const matchAnalysis = calculateMatchScore(userProfile, resultAnalysis)
      
      await supabase.from('user_skills_matches').upsert({
        profile_id: userProfile.id,
        company_analysis_id: resultAnalysis.id,
        match_score: matchAnalysis.score,
        matching_skills: matchAnalysis.recommended_skills || [],
        skill_gaps: matchAnalysis.gaps_analysis.missing_skills || [],
        recommendation_text: `Match de ${matchAnalysis.score}% baseado em suas habilidades e as necessidades da empresa`,
        priority: matchAnalysis.score > 70 ? 'high' : matchAnalysis.score > 40 ? 'medium' : 'low',
        status: 'active'
      })
      
      // Atualizar a análise com as informações de gaps
      const { error: updateError } = await supabase
        .from('company_analysis')
        .update({
          strategy_generated: {
            ...resultAnalysis.strategy_generated,
            match_score: matchAnalysis.score,
            gaps_analysis: matchAnalysis.gaps_analysis,
            recommended_skills: matchAnalysis.recommended_skills
          }
        })
        .eq('id', resultAnalysis.id)
        
      if (updateError) {
        console.error('Erro ao atualizar análise com gaps:', updateError)
      }
    }
    
    const res = NextResponse.json({
      message: 'Análise completa realizada com sucesso',
      data: resultAnalysis,
      cached: false,
      warning: saveError ? 'persist_failed' : undefined
    })
    if (shouldSetCookie && profileId) {
      res.cookies.set(PROFILE_COOKIE, profileId, { httpOnly: true, sameSite: 'lax', path: '/' })
    }
    return res
    
  } catch (error) {
    console.error('Erro na análise de empresa:', error)
    // Fallback amigável: retorna 200 com dados mínimos para não quebrar a UI
    const fallback = {
      company_name: 'Empresa',
      website_url: null,
      linkedin_url: null,
      instagram_url: null,
      facebook_url: null,
      twitter_url: null,
      company_size: 'unknown',
      industry: 'Não identificado',
      website_analysis: {},
      social_media_presence: {},
      market_analysis: {},
      ads_analysis: {},
      ai_strategy: {},
      analysis_status: 'failed',
      analysis_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      warning: 'runtime_error'
    }
    return NextResponse.json({
      message: 'Análise retornada com fallback',
      data: fallback,
      cached: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}

// Função simples para calcular match score
function calculateMatchScore(userProfile: any, companyAnalysis: any): {
  score: number;
  gaps_analysis: {
    missing_skills: string[];
    recommendations: string[];
    priority: string;
    timeframe: string;
  };
  recommended_skills: string[];
} {
  let score = 50 // Score base
  
  // Análise de habilidades - mais sofisticada
  const userSkills = userProfile.skills || []
  const companyTech = companyAnalysis.technologies || []
  const companySkills = companyAnalysis.required_skills || []
  
  // Encontrar skills em comum
  const commonSkills = userSkills.filter((skill: string) => 
    companyTech.some((tech: string) => tech.toLowerCase().includes(skill.toLowerCase())) ||
    companySkills.some((companySkill: string) => companySkill.toLowerCase().includes(skill.toLowerCase()))
  )
  
  // Calcular pontuação baseada em correspondência de skills
  const skillMatchScore = commonSkills.length * 8
  score += Math.min(skillMatchScore, 35)
  
  // Pontuar baseado em experiência
  if (userProfile.experience_years && userProfile.experience_years > 2) {
    score += Math.min(userProfile.experience_years * 2, 20)
  }
  
  // Pontuar se a empresa tem presença digital (mais fácil de abordar)
  if (companyAnalysis.website_url) score += 10
  if (companyAnalysis.linkedin_url) score += 10
  if (companyAnalysis.instagram_url) score += 5
  
  // Identificar skills faltantes
  const missingSkills = companyTech.filter((tech: string) => 
    !userSkills.some((skill: string) => 
      tech.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(tech.toLowerCase())
    )
  ).slice(0, 8)
  
  // Gerar recomendações baseadas nos gaps
  const recommendations = []
  if (missingSkills.length > 0) {
    recommendations.push(`Desenvolva competências em: ${missingSkills.slice(0, 3).join(', ')}`)
  }
  if (userProfile.experience_years < 3) {
    recommendations.push('Busque projetos freelance para ganhar experiência prática')
  }
  if (commonSkills.length < 3) {
    recommendations.push('Considere certificações em tecnologias relevantes para o setor')
  }
  
  // Adicionar recomendações específicas baseadas no score
  if (score < 60) {
    recommendations.push('Foque em construir um portfólio com projetos similares ao da empresa')
    recommendations.push('Participe de comunidades e eventos do setor')
  } else if (score < 80) {
    recommendations.push('Destaque seus projetos mais relevantes no portfólio')
    recommendations.push('Personalize sua abordagem mostrando entendimento do negócio deles')
  } else {
    recommendations.push('Seu perfil está muito alinhado! Foque em networking e relacionamentos')
  }
  
  // Determinar prioridade e timeframe baseados no score
  let priority = 'Baixa'
  let timeframe = '6-12 meses'
  
  if (score < 60) {
    priority = 'Alta'
    timeframe = '3-6 meses'
  } else if (score < 80) {
    priority = 'Média'
    timeframe = '1-3 meses'
  }
  
  // Gerar skills recomendadas para o usuário focar
  const recommendedSkills = [...missingSkills, ...commonSkills].slice(0, 6)
  
  return {
    score: Math.min(score, 95),
    gaps_analysis: {
      missing_skills: missingSkills,
      recommendations: recommendations.slice(0, 3),
      priority,
      timeframe
    },
    recommended_skills: recommendedSkills
  }
}
