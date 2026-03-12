import { NextRequest, NextResponse } from 'next/server'

const GEMINI_FLASH_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface FoundCompanyData {
    url: string | null;
    phone: string | null;
    address: string | null;
    google_rating: number | null;
    reviews_count: number | null;
    description: string | null;
    working_hours: string | null;
    social_media: {
        linkedin: string | null;
        instagram: string | null;
        facebook: string | null;
    };
}

async function findCompanyData(query: string, location: string, apiKey: string, cnpj?: string): Promise<FoundCompanyData | null> {
    try {
        console.log(`[findCompanyData] Realizando busca abrangente: ${query}`);
        
        const systemInstruction = "You are an expert data analyst. You MUST return ONLY a valid JSON object. No conversational text. If data is missing from snippets, check the grounding metadata for 'rating' and 'reviewCount'. For numeric values like google_rating, return a number (e.g. 4.8) or null. For reviews_count, return a number (e.g. 150) or null. If you see '1.4K', return 1400. Address must include CEP in 00000-000 format. CRITICAL: For URLs, return the DIRECT website link (e.g. https://envox.com.br). DO NOT return google.com redirect links, Vertex AI search links, or grounding-api-redirect links.";
        
        const prompt = `Search and extract current data for: "${query}" ${cnpj ? `(CNPJ: ${cnpj})` : ''}.
        Focus on finding the official website and the Google Maps/Business profile.
        
        REQUIRED JSON FORMAT:
        {
          "url": "official website or null",
          "phone": "phone number or null",
          "address": "full address with CEP/postal code or null",
          "google_rating": number_or_null,
          "reviews_count": number_or_null,
          "description": "short business description or null",
          "working_hours": "business hours or null",
          "social_media": {
            "linkedin": "url or null",
            "instagram": "url or null",
            "facebook": "url or null"
          }
        }`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                tools: [{ google_search: {} }],
                generationConfig: {
                    temperature: 0,
                    topK: 1,
                    topP: 1,
                }
            })
        })

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error(`[findCompanyData] Gemini API error: ${geminiResponse.status}`, errorText);
            return null;
        }

        const data = await geminiResponse.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (text) {
            let cleanedText = text;
            
            // Tenta extrair o bloco de código JSON primeiro
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                cleanedText = jsonMatch[1];
            } else {
                // Se não houver blocos de código, tenta encontrar entre as primeiras e últimas chaves
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    cleanedText = text.substring(firstBrace, lastBrace + 1);
                }
            }
            
            cleanedText = cleanedText.trim();

            // Reparo básico de JSON (vírgulas faltantes antes de chaves de fechamento ou novas propriedades)
            // Isso ajuda se o Gemini esquecer uma vírgula entre campos
            cleanedText = cleanedText.replace(/"\s*\n\s*"/g, '",\n"');

            try {
                const parsed = JSON.parse(cleanedText)
                
                // Função auxiliar para converter strings como "4.6" ou "1.4K" em números
                const parseNumber = (val: any): number | null => {
                    if (val === null || val === undefined) return null;
                    if (typeof val === 'number') return val;
                    const s = val.toString().toLowerCase().replace(',', '.').replace(/[^0-9.]/g, '');
                    let num = parseFloat(s);
                    if (val.toString().toLowerCase().includes('k')) num *= 1000;
                    return isNaN(num) ? null : num;
                };

                // Normalizar URL
                if (parsed.url && parsed.url !== '...' && !parsed.url.startsWith('http')) {
                    parsed.url = 'https://' + parsed.url
                }
                
                // Sanitização final: transformar strings de placeholder em null
                const sanitize = (val: any) => {
                    if (val === null || val === undefined) return null;
                    const s = val.toString().toLowerCase();
                    if (s === '...' || s === '' || s === 'null' || s.includes('não encontrado') || s.includes('não informado')) return null;
                    // Detectar links de redirecionamento do Google/Vertex AI
                    if (s.includes('vertexaisearch.cloud.google.com') || s.includes('grounding-api-redirect')) return null;
                    return val;
                };
                
                const finalParsed: FoundCompanyData = {
                    url: sanitize(parsed.url),
                    phone: sanitize(parsed.phone),
                    address: sanitize(parsed.address),
                    google_rating: parseNumber(parsed.google_rating),
                    reviews_count: parseNumber(parsed.reviews_count),
                    description: sanitize(parsed.description),
                    working_hours: sanitize(parsed.working_hours),
                    social_media: {
                        linkedin: sanitize(parsed.social_media?.linkedin),
                        instagram: sanitize(parsed.social_media?.instagram),
                        facebook: sanitize(parsed.social_media?.facebook)
                    }
                };

                return finalParsed
            } catch (e) {
                console.error(`[findCompanyData] Error parsing JSON after cleaning:`, e);
                console.error(`[findCompanyData] Cleaned text attempted:`, cleanedText);
                return null;
            }
        }
        return null
    } catch (e) {
        console.error('[findCompanyData] Exception:', e)
        return null
    }
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string | null> {
    try {
        console.log(`[scrapeWithFirecrawl] Iniciando scrape profundo de: ${url}`);
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                url: url,
                formats: ['markdown'],
                onlyMainContent: true,
                waitFor: 1000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[scrapeWithFirecrawl] Firecrawl error: ${response.status}`, error);
            return null;
        }

        const data = await response.json();
        return data.data?.markdown || null;
    } catch (e) {
        console.error('[scrapeWithFirecrawl] Exception:', e);
        return null;
    }
}

export async function POST(request: NextRequest) {
  try {
    const { 
        url, 
        company_name, 
        location,
        cnpj,
        description: input_description,
        email: input_email,
        phone: input_phone,
        address: input_address
    } = await request.json()

    if (!company_name && !url) {
      return NextResponse.json({ error: 'Company name or URL is required' }, { status: 400 })
    }

    console.log(`[POST /api/scrape-company] Recebido:`, { url, company_name, location, cnpj });
    
    const apiKey = process.env.GEMINI_API_KEY
    const firecrawlKey = process.env.FIRECRAWL_API_KEY

    if (!apiKey) {
      console.error('[POST /api/scrape-company] GEMINI_API_KEY not found');
      return NextResponse.json({ error: 'GEMINI_API_KEY not found' }, { status: 500 });
    }

    let targetUrl = url;
    let searchData: FoundCompanyData | null = null;

    if (company_name) {
        console.log(`[POST /api/scrape-company] Buscando dados consolidados para: ${company_name} em ${location || input_address}`)
        
        const searchLocation = location || input_address || '';
        
        // Query única e poderosa: Focada em todos os dados de uma só vez
        let mainQuery = `Find the Google Business Profile and official website for "${company_name}" in ${searchLocation}.`;
        
        if (url && url !== 'null') {
            mainQuery += ` The company website is likely ${url}. Use this to find the correct Google Maps profile and extra info.`;
        }

        if (input_phone) {
            mainQuery += ` Known contact: ${input_phone}.`;
        }

        mainQuery += `
        
        EXTRACT:
        - official website URL
        - google_rating (numeric, e.g. 4.9)
        - reviews_count (numeric number of reviews, e.g. 55)
        - full address WITH CEP (format 00000-000)
        - phone and social media (LinkedIn, Instagram, Facebook).
        - business category/industry
        - short business description`;

        searchData = await findCompanyData(mainQuery, searchLocation, apiKey, cnpj);
        
        if (searchData?.url && (!targetUrl || targetUrl === 'null')) {
            targetUrl = searchData.url;
        }
    }

    // Se ainda não temos URL após as instâncias, não retornamos erro, apenas prosseguimos com o que temos
    if (!targetUrl) {
        console.log(`[POST /api/scrape-company] Nenhum site encontrado após Instância 2. Continuando apenas com dados do Google.`);
    }

    let htmlData: any = null
    let firecrawlMarkdown: string | null = null

    if (targetUrl) {
        if (!targetUrl.startsWith('http')) {
          targetUrl = `https://${targetUrl}`
        }

        console.log(`[POST /api/scrape-company] Tentando scrape de: ${targetUrl}`);
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        let html = ''
        // firecrawlMarkdown já declarado acima

        // Tenta primeiro com Firecrawl se a chave estiver presente (mais robusto)
        if (firecrawlKey) {
            firecrawlMarkdown = await scrapeWithFirecrawl(targetUrl, firecrawlKey);
            if (firecrawlMarkdown) {
                console.log(`[POST /api/scrape-company] Conteúdo obtido via Firecrawl (${firecrawlMarkdown.length} chars)`);
            }
        }

        // Se o Firecrawl falhar ou não houver chave, tenta o fetch padrão
        if (!firecrawlMarkdown) {
            try {
                const response = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    },
                    signal: controller.signal,
                    redirect: 'follow'
                })

                if (response.ok) {
                    html = await response.text()
                    console.log(`[POST /api/scrape-company] HTML obtido via fetch padrão (${html.length} chars)`);
                } else {
                    console.warn(`[POST /api/scrape-company] Erro ao carregar site via fetch: ${response.status} ${response.statusText}`);
                }
            } catch (fetchError: any) {
                console.error(`[POST /api/scrape-company] Fetch error for ${targetUrl}:`, fetchError.message || fetchError)
            } finally {
                clearTimeout(timeoutId)
            }
        }

        // Se temos conteúdo (seja via Firecrawl ou Fetch), processamos com Gemini
        if (firecrawlMarkdown || (html && html.length > 500)) {
            const contentToAnalyze = firecrawlMarkdown || html.substring(0, 15000);
            const isMarkdown = !!firecrawlMarkdown;

            // Prompt ajustado para o tipo de conteúdo
            const scrapePrompt = `Você é um especialista em extração de dados estruturados de sites corporativos.
Extraia informações DETALHADAS desta empresa do ${isMarkdown ? 'conteúdo Markdown' : 'HTML'} do site: ${targetUrl}.

CAMPOS OBRIGATÓRIOS (se disponíveis):
1. Descrição completa do negócio (o que fazem, especialidades).
2. E-mails de contato (comercial, suporte, etc).
3. Telefones e WhatsApp.
4. Endereço completo com CEP.
5. Horário de funcionamento.
6. Links de Redes Sociais (LinkedIn, Instagram, Facebook).
7. Título e Descrição SEO (Meta tags).
8. Principais serviços ou produtos mencionados.

CONTEÚDO DO SITE: 
${contentToAnalyze}

Retorne APENAS um JSON válido seguindo esta estrutura:
{
  "description": "...",
  "email": "...",
  "phone": "...",
  "address": "...",
  "working_hours": "...",
  "services": ["serviço 1", "serviço 2"],
  "social_media": { 
    "linkedin": "...", 
    "instagram": "...", 
    "facebook": "..." 
  },
  "meta_tags": {
    "title": "...",
    "description": "..."
  }
}`;

            const geminiResponse = await fetch(GEMINI_FLASH_URL + `?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: scrapePrompt }] }]
                })
            })

            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json()
                const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const cleanedJson = jsonMatch ? jsonMatch[0].replace(/```json/gi, '').replace(/```/g, '').trim() : '{}';
                try {
                    const parsed = JSON.parse(cleanedJson)
                    htmlData = Array.isArray(parsed) ? parsed[0] : parsed
                    console.log(`[POST /api/scrape-company] Dados extraídos do HTML:`, htmlData)
                } catch (e) {
                    console.error('[POST /api/scrape-company] Erro ao parsear JSON do HTML:', e)
                }
            }
        }
    }

    // Mesclar dados: Priorizar scraping do site, mas usar Google Search como fallback/complemento
    const isValid = (val: any) => {
        if (!val) return false;
        const s = val.toString().toLowerCase();
        const invalidPhrases = [
            'não encontrado',
            'indisponível',
            'não informado',
            'não consta',
            'unknown',
            'not found',
            'null',
            'none',
            'trecho fornecido',
            'não extraído',
            'no data',
            'vazio',
            'indisponivel',
            'desconhecido'
        ];
        return !invalidPhrases.some(phrase => s.includes(phrase)) && s.trim() !== '...' && s.trim() !== '';
    };

    const finalData = {
        google_rating: searchData?.google_rating ?? null,
        reviews_count: searchData?.reviews_count ?? null,
        found_url: targetUrl || (searchData?.url ?? null),
        description: isValid(htmlData?.description) ? htmlData.description : (searchData?.description ?? (input_description || null)),
        email: isValid(htmlData?.email) ? htmlData.email : (input_email || null),
        phone: isValid(htmlData?.phone) ? htmlData.phone : (searchData?.phone ?? (input_phone || null)),
        address: isValid(htmlData?.address) ? htmlData.address : (searchData?.address ?? (input_address || null)),
        working_hours: isValid(htmlData?.working_hours) ? htmlData.working_hours : (searchData?.working_hours ?? null),
        social_media: {
            linkedin: isValid(htmlData?.social_media?.linkedin) ? htmlData.social_media.linkedin : (searchData?.social_media?.linkedin ?? null),
            instagram: isValid(htmlData?.social_media?.instagram) ? htmlData.social_media.instagram : (searchData?.social_media?.instagram ?? null),
            facebook: isValid(htmlData?.social_media?.facebook) ? htmlData.social_media.facebook : (searchData?.social_media?.facebook ?? null)
        },
        meta_tags: (htmlData && htmlData.meta_tags) ? {
            title: htmlData.meta_tags.title || null,
            description: htmlData.meta_tags.description || null
        } : null,
        extracted_at: new Date().toISOString(),
        source: firecrawlMarkdown ? 'firecrawl+google' : (htmlData ? (searchData ? 'website+google' : 'website_only') : (searchData ? 'google_only' : 'none'))
    }

    console.log(`[POST /api/scrape-company] Final Data for ${company_name}:`, JSON.stringify(finalData, null, 2));
    console.log(`[POST /api/scrape-company] Sucesso! Source: ${finalData.source}`);
    return NextResponse.json(finalData)

  } catch (error: any) {
    console.error('[POST /api/scrape-company] Internal Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
