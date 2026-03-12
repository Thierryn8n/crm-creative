const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function findCompanyUrl(company, location, apiKey) {
    try {
        // Primeira tentativa: Busca direta com prompt detalhado
        const prompt1 = `Encontre o site oficial da empresa "${company}" localizada em "${location}".
        
Instruções:
1. Use busca Google para encontrar o site oficial
2. O site deve conter o nome da empresa
3. Prefira domínios .com.br ou .com
4. Verifique se é o site real da empresa (não redes sociais ou diretórios)
5. Retorne apenas a URL completa começando com http/https

Responda no formato: URL: [url completa]`

        const response1 = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt1 }] }],
                tools: [{ googleSearch: {} }],
                generationConfig: { temperature: 0.1 }
            })
        })

        const data1 = await response1.json()
        const text1 = data1.candidates?.[0]?.content?.parts?.[0]?.text
        
        console.log('Texto recebido do Gemini tentativa 1:', text1)
        
        if (text1) {
            // Tenta extrair URL do formato "URL: [url]"
            const urlMatch1 = text1.match(/URL:\s*(https?:\/\/[^\s"'>,]+)/i)
            if (urlMatch1) {
                let url = urlMatch1[1].replace(/[.,;)]+$/, "")
                console.log(`URL encontrada (formato URL:): ${url}`)
                return url
            }
            
            // Tenta extrair URL do formato "www.dominio.com" ou "dominio.com"
            const wwwMatch = text1.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com\.br|com|br|net|org))/i)
            if (wwwMatch) {
                let url = wwwMatch[0]
                if (!url.startsWith('http')) {
                    url = 'https://' + url
                }
                console.log(`URL encontrada (formato www): ${url}`)
                return url
            }
            
            // Tenta extrair qualquer URL no texto
            const anyUrlMatch = text1.match(/https?:\/\/[^\s"'>,]+/)
            if (anyUrlMatch) {
                let url = anyUrlMatch[0].replace(/[.,;)]+$/, "")
                console.log(`URL encontrada (formato http): ${url}`)
                return url
            }
        } else {
            console.log('Tentativa 1: Nenhum texto retornado pelo Gemini')
        }

        return null
    } catch (e) {
        console.error('Error finding URL:', e)
        return null
    }
}

// Teste direto
async function test() {
    const apiKey = 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc'
    const url = await findCompanyUrl('Intelbras', 'São José, SC', apiKey)
    console.log('URL final:', url)
}

test()