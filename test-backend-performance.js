// Teste para verificar apenas a busca de URL no backend
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';

async function testFindCompanyUrl() {
    console.time('Busca URL Intelbras');
    
    try {
        const prompt = `Encontre o site oficial da empresa "Intelbras" localizada em "São José, SC".
        
Instruções:
1. Use busca Google para encontrar o site oficial
2. O site deve conter o nome da empresa
3. Prefira domínios .com.br ou .com
4. Verifique se é o site real da empresa (não redes sociais ou diretórios)
5. Retorne apenas a URL completa começando com http/https

Responda no formato: URL: [url completa]`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ googleSearch: {} }],
                generationConfig: { temperature: 0.1 }
            })
        });

        const data = await response.json();
        console.timeEnd('Busca URL Intelbras');
        
        console.log('Status da resposta:', response.status);
        console.log('Dados recebidos:', JSON.stringify(data, null, 2));
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Texto extraído:', text);
        
        if (text) {
            const urlMatch = text.match(/URL:\s*(https?:\/\/[^\s"'>,]+)/i);
            if (urlMatch) {
                const url = urlMatch[1].replace(/[.,;)]+$/, "");
                console.log('✅ URL encontrada:', url);
                return url;
            }
        }
        
        console.log('❌ URL não encontrada');
        return null;
        
    } catch (error) {
        console.timeEnd('Busca URL Intelbras');
        console.error('Erro:', error);
        return null;
    }
}

testFindCompanyUrl();