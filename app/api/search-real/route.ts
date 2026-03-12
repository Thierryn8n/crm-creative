import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent'

// Função para coletar dados detalhados de uma empresa
async function collectCompanyData(company: any) {
  try {
    let websiteData = null
    let linkedinData = null
    let socialMediaData = {
      linkedin: company.linkedin,
      instagram: company.instagram,
      facebook: company.facebook,
      twitter: company.twitter
    }

    // Coletar dados do website
    if (company.website) {
      try {
        const response = await fetch(company.website, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (compatible; CompanyBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          
          // Extrair informações básicas
          const title = html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || ''
          const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/)?.[1] || ''
          const keywords = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/)?.[1] || ''
          
          // Verificar seções importantes
          const hasCareers = /carreira|vaga|trabalhe|jobs|careers/i.test(html)
          const hasAbout = /quem somos|sobre nós|nossa história|about us/i.test(html)
          const hasContact = /contato|fale conosco|contact/i.test(html)
          const hasPortfolio = /portfólio|cases|clientes|portfolio/i.test(html)
          const hasServices = /serviços|soluções|services|solutions/i.test(html)
          
          websiteData = {
            title: title.trim(),
            description: description.trim(),
            keywords: keywords.trim(),
            hasCareers,
            hasAbout,
            hasContact,
            hasPortfolio,
            hasServices,
            url: company.website,
            scraped_at: new Date().toISOString()
          }
        }
      } catch (error) {
        console.error(`Erro ao acessar website ${company.website}:`, error)
      }
    }

    // Coletar dados do LinkedIn se disponível
    if (company.linkedin) {
      try {
        // Aqui você pode adicionar scraping do LinkedIn ou usar API
        linkedinData = {
          url: company.linkedin,
          company_name: company.company_name,
          followers: null, // Pode ser preenchido com scraping adicional
          industry: company.industry,
          company_size: company.company_size,
          collected_at: new Date().toISOString()
        }
      } catch (error) {
        console.error(`Erro ao processar LinkedIn ${company.linkedin}:`, error)
      }
    }

    return {
      ...company,
      website_data: websiteData,
      linkedin_data: linkedinData,
      social_media: socialMediaData,
      collected_at: new Date().toISOString(),
      data_quality: {
        has_website: !!websiteData,
        has_linkedin: !!linkedinData,
        has_contact_info: !!(company.email || company.phone),
        has_description: !!company.description,
        score: 0 // Será calculado posteriormente
      }
    }
  } catch (error) {
    console.error(`Erro ao coletar dados da empresa ${company.company_name}:`, error)
    return company
  }
}

// Função para calcular score de qualidade dos dados
function calculateDataQuality(company: any) {
  let score = 0
  
  if (company.email && company.email.includes('@')) score += 20
  if (company.phone) score += 15
  if (company.website) score += 20
  if (company.linkedin) score += 15
  if (company.description && company.description.length > 50) score += 15
  if (company.website_data?.hasCareers) score += 10
  if (company.website_data?.hasAbout) score += 5
  
  return Math.min(score, 100)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, location, type = 'advertising_agency', resultCount = 5 } = body

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not configured. Please add GEMINI_API_KEY to environment variables.',
        results: []
      }, { status: 400 })
    }

    // Prompt melhorado para garantir dados reais e completos
    const prompt = `Você é um especialista em encontrar empresas reais e ativas de ${type} no Brasil.
    
Busca: "${query}"
${location ? `Localização: ${location}` : ''}

Por favor, forneça uma lista de EXATAMENTE ${resultCount} empresas REAIS, ATIVAS e EXISTENTES que atendam a esses critérios. 

PARA CADA EMPRESA, você DEVE fornecer:
✅ Nome da empresa (nome real e atual)
✅ Website oficial (URL completa e funcional)
✅ LinkedIn oficial (URL completa da página da empresa)
✅ Instagram oficial (URL completa, se existir)
✅ Facebook oficial (URL completa, se existir)
✅ Cidade (cidade real onde está localizada)
✅ Estado (UF do Brasil)
✅ Descrição detalhada (mínimo 100 caracteres sobre o que a empresa faz)
✅ Ramo de atuação/indústria (setor específico)
✅ Porte aproximado (micro, pequena, média, grande)
✅ Email de contato comercial (email real e válido)
✅ Telefone comercial (telefone real com DDD)

REGRAS IMPORTANTES:
1. Forneça apenas empresas que REALMENTE existam e estejam ativas
2. Verifique se os websites estão funcionando
3. Use dados públicos e verificáveis
4. Nunca invente ou fabrique informações
5. Se não tiver certeza, não inclua a empresa

Responda APENAS em formato JSON válido:
{
  "companies": [
    {
      "company_name": "Nome Real da Empresa",
      "website": "https://www.empresa.com.br",
      "linkedin": "https://www.linkedin.com/company/empresa",
      "instagram": "https://www.instagram.com/empresa",
      "facebook": "https://www.facebook.com/empresa",
      "city": "São Paulo",
      "state": "SP",
      "description": "Descrição detalhada do que a empresa faz, seus principais serviços e diferenciais no mercado",
      "industry": "Publicidade e Marketing",
      "company_size": "média",
      "email": "contato@empresa.com.br",
      "phone": "(11) 9999-9999"
    }
  ]
}`

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
        generationConfig: {
          temperature: 0.3, // Menor temperatura para mais consistência
          topK: 20,
          topP: 0.9,
          maxOutputTokens: 4096, // Mais tokens para descrições detalhadas
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to search with Gemini API',
        details: errorData,
        results: []
      }, { status: 500 })
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from response
    let companies = []
    try {
      // Extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        companies = parsed.companies || []
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      companies = []
    }

    // Log the search and create potential clients
    const supabase = await createClient()
    
    // Coletar dados detalhados das empresas em paralelo
    const companiesWithData = await Promise.all(
      companies.map(collectCompanyData)
    )

    // Calcular qualidade dos dados
    const companiesWithQuality = companiesWithData.map(company => ({
      ...company,
      data_quality: {
        ...company.data_quality,
        score: calculateDataQuality(company)
      }
    }))

    // Insert AI search record com dados completos
    const { data: searchData, error: searchError } = await supabase
      .from('ai_searches')
      .insert([{
        query: `${query} ${location || ''} ${type}`,
        results: { companies: companiesWithQuality },
        clients_added: 0,
        result_count: resultCount,
        search_type: 'real_companies_enhanced',
        full_data: { companies: companiesWithQuality, search_metadata: {
          query,
          location,
          type,
          timestamp: new Date().toISOString(),
          total_companies: companies.length
        }}
      }])
      .select()
      .single()

    if (searchError) {
      console.error('Error logging AI search:', searchError)
    }

    // Check for duplicates and create potential clients com dados completos
    const potentialClients = []
    for (const company of companiesWithQuality) {
      // Check if this company already exists as a client or potential client
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_name', company.company_name)
        .maybeSingle()

      const { data: existingPotential } = await supabase
        .from('potential_clients')
        .select('id')
        .eq('company_name', company.company_name)
        .maybeSingle()

      if (!existingClient && !existingPotential) {
        // Create potential client com TODOS os dados
        const fullCompanyData = {
          ...company,
          search_metadata: {
            query,
            location,
            type,
            search_id: searchData?.id
          }
        }

        const { data: potentialClient, error: pcError } = await supabase
          .from('potential_clients')
          .insert([{
            company_name: company.company_name,
            contact_name: company.contact_name || null,
            email: company.email || null,
            phone: company.phone || null,
            website: company.website || null,
            linkedin_url: company.linkedin || null,
            instagram_url: company.instagram || null,
            facebook_url: company.facebook || null,
            city: company.city || null,
            state: company.state || null,
            description: company.description || null,
            industry: company.industry || null,
            company_size: company.company_size || null,
            founded_year: company.founded_year || null,
            employee_count: company.employee_count || null,
            status: 'potential',
            ai_search_id: searchData?.id || null,
            full_company_data: fullCompanyData, // Todos os dados em JSON
            website_data: company.website_data || null,
            social_media: company.social_media || null,
            linkedin_data: company.linkedin_data || null
          }])
          .select()
          .single()

        if (!pcError && potentialClient) {
          potentialClients.push(potentialClient)
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: potentialClients,
      total_found: companies.length,
      duplicates_avoided: companies.length - potentialClients.length,
      data_quality: {
        average_score: companiesWithQuality.reduce((sum, c) => sum + (c.data_quality?.score || 0), 0) / companiesWithQuality.length,
        companies_with_high_quality: companiesWithQuality.filter(c => (c.data_quality?.score || 0) >= 70).length
      },
      search_metadata: {
        query,
        location,
        type,
        companies_searched: companies.length,
        companies_saved: potentialClients.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in enhanced search:', error)
    return NextResponse.json({ 
      error: 'Failed to perform enhanced search',
      details: error instanceof Error ? error.message : 'Unknown error',
      results: []
    }, { status: 500 })
  }
}