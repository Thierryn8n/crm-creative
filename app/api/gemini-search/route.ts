import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const GEMINI_FALLBACK_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { query, location, resultCount = 5 } = body

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not configured. Please add GEMINI_API_KEY to environment variables.',
        results: []
      }, { status: 400 })
    }

    // 0. Buscar histórico da memória para orientar a IA
    let recentMemory: any[] | null = null
    try {
      if (user) {
        const { data } = await supabase
          .from('ai_search_memory')
          .select('company_name, status, feedback_notes')
          .eq('user_id', user.id)
          .order('last_discovered_at', { ascending: false })
          .limit(20)
        recentMemory = data
      }
    } catch (e) {
      console.warn('Error fetching search memory (ignoring):', e)
    }

    const memoryContext = recentMemory && recentMemory.length > 0 
      ? `\n\nMEMÓRIA DE BUSCAS ANTERIORES (EVITE ESTAS EMPRESAS OU USE COMO REFERÊNCIA):
${recentMemory.map((m: any) => `- ${m.company_name} (Status: ${m.status}${m.feedback_notes ? `, Feedback: ${m.feedback_notes}` : ''})`).join('\n')}`
      : ''

    const promptParts = [
      'Você é um especialista em encontrar dados precisos de empresas no Brasil via Google Knowledge Panel (Painel de Informações à direita).',
      'IMPORTANTE: Extraia TODAS as informações visíveis nos resultados de busca do Google, Google Maps e no Painel de Informações.',
      'RATINGS: Procure por notas em estrelas (ex: 4.8) e quantidade de avaliações (ex: 161). Esses dados costumam aparecer logo abaixo do título no card lateral.',
      'CEP: O endereço completo DEVE incluir o CEP.',
      'Olhe atentamente para o telefone, endereço completo COM CEP, avaliações em estrelas e links de redes sociais que aparecem diretamente na página de resultados.',
      '',
      `Busca: "${query}"`,
      location ? `Localização: ${location}` : '',
      memoryContext,
      '',
      `Por favor, forneça uma lista de ${resultCount} empresas REAIS e EXISTENTES que atendam exatamente a este termo de busca: "${query}".`,
      'NÃO repita empresas listadas na memória de buscas anteriores se o status for "interested", "ignored" ou "rejected".',
      '',
      'Para cada empresa, você DEVE extrair com precisão:',
      '- Nome da empresa (Exato como no Google Maps)',
      '- Website oficial (URL completa)',
      '- LinkedIn oficial (link real, não exemplo)',
      '- Instagram oficial (link real, não exemplo)',
      '- Facebook oficial (link real, não exemplo)',
      '- Cidade e Estado',
      '- Endereço completo INCLUINDO o CEP (Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100)',
      '- URL do perfil da empresa no Google Maps',
      '- Avaliação média no Google Maps (ex: 4.8) -> campo "google_rating"',
      '- Quantidade de avaliações no Google Maps (ex: 152) -> campo "google_maps_reviews_count"',
      '- Descrição real da empresa baseada no Google',
      '- Ramo de atuação/indústria',
      '- Porte aproximado (micro, pequena, média, grande)',
      '- Email de contato comercial (se visível)',
      '- Telefone comercial (Extraia EXATAMENTE como aparece, ex: (41) 3300-0404)',
      '',
      'INSTRUÇÕES ADICIONAIS:',
      '1. Se o usuário buscou por um NOME ESPECÍFICO, foque nessa empresa.',
      '2. O telefone, o CEP e o Rating são CRÍTICOS. Se aparecem no card à direita, você DEVE extraí-los.',
      '3. Não invente dados. Se não encontrar, retorne null.',
      '',
      'Responda APENAS em formato JSON puro, sem markdown:',
      '{',
      '  "companies": [',
      '    {',
      '      "company_name": "Nome Real da Empresa",',
      '      "website": "https://www.empresa.com.br",',
      '      "linkedin": "https://www.linkedin.com/company/empresa",',
      '      "instagram": "https://www.instagram.com/empresa",',
      '      "facebook": "https://www.facebook.com/empresa",',
      '      "city": "São Paulo",',
      '      "state": "SP",',
      '      "address": "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",',
      '      "google_maps_url": "https://maps.google.com/?cid=1234567890",',
      '      "google_rating": 4.8,',
      '      "google_maps_reviews_count": 152,',
      '      "description": "Descrição real extraída do Google",',
      '      "industry": "Marketing Digital",',
      '      "company_size": "média",',
      '      "email": "contato@empresa.com.br",',
      '      "phone": "(11) 9999-9999"',
      '    }',
      '  ]',
      '}'
    ]
    const prompt = promptParts.filter(Boolean).join('\n')

    const generateContent = async (url: string) => {
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          tools: [
            {
              googleSearch: {}
            }
          ],
          generationConfig: {
            temperature: 0.1, // Reduzido para evitar alucinações
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData)
      }

      return response.json()
    }

    let data: any
    let textContent = ''
    try {
      data = await generateContent(GEMINI_API_URL)
      textContent = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || ''
    } catch (error) {
      console.error('Gemini primary model error:', error)
    }

    if (!textContent) {
      try {
        data = await generateContent(GEMINI_FALLBACK_API_URL)
        textContent = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || ''
      } catch (error) {
        console.error('Gemini fallback model error:', error)
      }
    }

    if (!textContent) {
      return NextResponse.json({
        error: 'A IA não retornou conteúdo para esta busca. Tente outro termo mais específico.',
        results: []
      }, { status: 502 })
    }

    let companies: any[] = []
    try {
      const buildGoogleMapsSearchUrl = (company: any) => {
        const terms = [company.company_name, company.city, company.state, location, 'Google Maps']
          .filter(Boolean)
          .join(' ')
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(terms)}`
      }

      const normalizeJsonLike = (input: string) => {
        let normalized = ''
        let inString = false
        let escaped = false

        for (const char of input) {
          if (escaped) {
            normalized += char
            escaped = false
            continue
          }

          if (char === '\\') {
            normalized += char
            escaped = true
            continue
          }

          if (char === '"') {
            inString = !inString
            normalized += char
            continue
          }

          if (inString && (char === '\n' || char === '\r')) {
            normalized += '\\n'
            continue
          }

          normalized += char
        }

        return normalized
      }

      const cleanedText = textContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      try {
        const parsed = JSON.parse(normalizeJsonLike(cleanedText))
        companies = parsed.companies || []
      } catch {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(normalizeJsonLike(jsonMatch[0]))
            companies = parsed.companies || []
          } catch {
            companies = []
          }
        } else {
          const companiesIndex = cleanedText.indexOf('"companies"')
          if (companiesIndex >= 0) {
            const arrayStart = cleanedText.indexOf('[', companiesIndex)
            if (arrayStart >= 0) {
              const extractedCompanies: any[] = []
              let depth = 0
              let objectStart = -1

              for (let i = arrayStart; i < cleanedText.length; i += 1) {
                const char = cleanedText[i]
                if (char === '{') {
                  if (depth === 0) objectStart = i
                  depth += 1
                } else if (char === '}') {
                  depth -= 1
                  if (depth === 0 && objectStart >= 0) {
                    const rawObject = cleanedText.slice(objectStart, i + 1)
                    try {
                      const parsedObject = JSON.parse(normalizeJsonLike(rawObject))
                      extractedCompanies.push(parsedObject)
                    } catch {
                      const fixedObject = rawObject
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']')
                      try {
                        const parsedObject = JSON.parse(normalizeJsonLike(fixedObject))
                        extractedCompanies.push(parsedObject)
                      } catch {}
                    }
                    objectStart = -1
                  }
                }
              }

              companies = extractedCompanies
            }
          }
        }
      }

      if (companies.length === 0) {
        const companyMatches = [...cleanedText.matchAll(/"company_name"\s*:\s*"([^"]+)"/g)]
        if (companyMatches.length > 0) {
          const extractField = (block: string, field: string) => {
            const regex = new RegExp(`"${field}"\\s*:\\s*(null|"((?:\\\\.|[^"\\\\])*)"|(-?\\d+(?:\\.\\d+)?))`)
            const match = block.match(regex)
            if (!match) return null
            if (match[1] === 'null') return null
            if (typeof match[3] === 'string') return Number(match[3])
            return match[2] ?? null
          }

          const heuristicCompanies = companyMatches.map((match, index) => {
            const start = match.index ?? 0
            const end = companyMatches[index + 1]?.index ?? cleanedText.length
            const block = cleanedText.slice(start, end)

            return {
              company_name: match[1],
              website: extractField(block, 'website'),
              linkedin: extractField(block, 'linkedin'),
              instagram: extractField(block, 'instagram'),
              facebook: extractField(block, 'facebook'),
              city: extractField(block, 'city'),
              state: extractField(block, 'state'),
              address: extractField(block, 'address'),
              google_maps_url: extractField(block, 'google_maps_url'),
              google_rating: extractField(block, 'google_rating'),
              google_maps_reviews_count: extractField(block, 'google_maps_reviews_count'),
              description: extractField(block, 'description'),
              industry: extractField(block, 'industry'),
              company_size: extractField(block, 'company_size'),
              email: extractField(block, 'email'),
              phone: extractField(block, 'phone')
            }
          }).filter((company) => company.company_name)

          companies = heuristicCompanies
        }
      }

      companies = companies
        .filter((company) => company?.company_name)
        .map((company) => ({
          ...company,
          google_maps_url: company.google_maps_url || buildGoogleMapsSearchUrl(company)
        }))
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      companies = []
    }

    // Coletar dados detalhados das empresas
    const companiesWithData = await Promise.all(
      companies.map(async (company: any) => {
        try {
          // Coletar dados do website se disponível (desativado temporariamente para performance)
          let websiteData = null
          // if (company.website) {
          //   try {
          //     const response = await fetch(company.website, {
          //       headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompanyBot/1.0)' }
          //     })
          //     const html = await response.text()
          //     
          //     const title = html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || ''
          //     const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/)?.[1] || ''
          //     
          //     websiteData = {
          //       title: title.trim(),
          //       description: description.trim(),
          //       hasCareers: html.toLowerCase().includes('carreira') || html.toLowerCase().includes('vaga'),
          //       hasAbout: html.toLowerCase().includes('quem somos') || html.toLowerCase().includes('about'),
          //       url: company.website
          //     }
          //   } catch (error) {
          //     console.error(`Erro ao acessar website ${company.website}:`, error)
          //   }
          // }

          const fullData = {
            ...company,
            social_media: {
              linkedin: company.linkedin,
              instagram: company.instagram,
              facebook: company.facebook
            },
            maps_data: {
              google_maps_url: company.google_maps_url || null,
              address: company.address || null,
              rating: company.google_rating || company.google_maps_rating || null,
              reviews_count: company.google_maps_reviews_count || null
            },
            collected_at: new Date().toISOString()
          }

          return {
            ...company,
            full_company_data: fullData
          }
        } catch (error) {
          console.error(`Erro ao processar empresa ${company.company_name}:`, error)
          return company
        }
      })
    )

    const visibleResults: any[] = [...companiesWithData]
    let duplicatesAvoided = 0
    let saveFailures = 0
    let dbWarning: string | null = null

    try {
      const supabase = await createClient()
      const { data: searchData, error: searchError } = await supabase
        .from('ai_searches')
        .insert([{
          query: `${query} ${location || ''}`,
          results: { companies: visibleResults },
          clients_added: 0,
          result_count: resultCount,
          full_data: { companies: visibleResults }
        }])
        .select()
        .single()

      if (searchError) {
        console.error('Error logging AI search:', searchError)
      }

      // Check for duplicates and existing memory
      const companyNames = visibleResults.map(c => c.company_name)
      
      // 1. Check existing clients and potentials
      const { data: existingClients } = await supabase
        .from('clients')
        .select('company_name')
        .in('company_name', companyNames)

      const { data: existingPotentials } = await supabase
        .from('potential_clients')
        .select('company_name')
        .in('company_name', companyNames)

      // 2. Check AI search memory (ignored or rejected companies)
      const { data: searchMemory } = await supabase
        .from('ai_search_memory')
        .select('company_name, status')
        .eq('user_id', user?.id)
        .in('company_name', companyNames)

      const existingCompanyNames = new Set([
        ...(existingClients?.map(c => c.company_name) || []),
        ...(existingPotentials?.map(c => c.company_name) || [])
      ])

      const ignoredCompanyNames = new Set(
        searchMemory?.filter(m => m.status === 'ignored' || m.status === 'rejected')
          .map(m => m.company_name) || []
      )

      // Filter out duplicates and ignored companies
      const newCompanies = visibleResults.filter(company => 
        !existingCompanyNames.has(company.company_name) && 
        !ignoredCompanyNames.has(company.company_name)
      )

      duplicatesAvoided = visibleResults.length - newCompanies.length

      // REMOVIDO: Salvamento automático na memória e potenciais durante a busca
      // A pedido do usuário: "só deve colocar na memória no momento que o cadastro"
      
    } catch (dbError) {
      dbWarning = 'Houve um erro ao verificar duplicatas no banco de dados.'
      console.error('Error checking duplicates in Gemini search:', dbError)
    }

    return NextResponse.json({
      success: true,
      results: newCompanies,
      total_found: visibleResults.length,
      duplicates_avoided: duplicatesAvoided,
      save_failures: saveFailures,
      db_warning: dbWarning,
      rawResponse: textContent
    })
  } catch (error) {
    console.error('Error in Gemini search:', error)
    return NextResponse.json({ 
      error: 'Failed to perform search',
      results: []
    }, { status: 500 })
  }
}

export const maxDuration = 60 // 60 seconds timeout for Vercel
