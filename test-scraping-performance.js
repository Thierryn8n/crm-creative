// Teste de performance do scraping completo
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';

async function testScrapingPerformance() {
    const targetUrl = 'https://www.intelbras.com/pt-br/';
    
    console.log(`⏱️ Testando scraping de: ${targetUrl}`);
    
    try {
        // Testar fetch do site
        console.time('⏱️ Fetch do site');
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CompanyBot/1.0)'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.timeEnd('⏱️ Fetch do site');
        console.log(`📄 HTML recebido: ${html.length} caracteres`);
        
        // Limpar HTML
        console.time('⏱️ Limpeza HTML');
        const cleanHtml = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
            .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "")
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 50000);
        console.timeEnd('⏱️ Limpeza HTML');
        console.log(`🧹 HTML limpo: ${cleanHtml.length} caracteres`);
        
        // Testar chamada ao Gemini
        const prompt = `
            Extraia informações básicas da empresa deste HTML. Retorne JSON:
            {
                "found_url": "${targetUrl}",
                "description": "Breve descrição",
                "email": "email se encontrar",
                "phone": "telefone se encontrar", 
                "address": "endereço se encontrar",
                "social_media": {
                    "linkedin": "url",
                    "instagram": "url",
                    "facebook": "url"
                },
                "extracted_at": "${new Date().toISOString()}"
            }

            HTML:
            ${cleanHtml.substring(0, 10000)}
        `;
        
        console.time('⏱️ Chamada Gemini');
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            })
        });
        console.timeEnd('⏱️ Chamada Gemini');
        
        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const data = await geminiResponse.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        console.log('✅ Sucesso! Resposta do Gemini recebida');
        console.log('📊 Tamanho da resposta:', textContent?.length || 0, 'caracteres');
        
        // Parse JSON
        let json;
        try {
            json = JSON.parse(textContent);
        } catch (e) {
            const match = textContent.match(/```json\n([\s\S]*?)\n```/);
            if (match) {
                json = JSON.parse(match[1]);
            } else {
                json = JSON.parse(textContent.replace(/```json|```/g, ''));
            }
        }
        
        console.log('🎯 Resultado final:', JSON.stringify(json, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testScrapingPerformance();