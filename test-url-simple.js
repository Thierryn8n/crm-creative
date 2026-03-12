// Teste simples para verificar apenas a busca de URL
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';

async function findCompanyUrlSimple(company, location) {
    try {
        console.log(`Buscando URL para: ${company} em ${location}`);
        
        const prompt = `Encontre o site oficial da empresa "${company}" localizada em "${location}". Responda apenas com a URL completa.`;
        
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
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        console.log('Resposta do Gemini:', text);
        
        // Procura por URL no texto
        const urlMatch = text?.match(/https?:\/\/[^\s"'>,]+/);
        if (urlMatch) {
            const url = urlMatch[0].replace(/[.,;)]$/, '');
            console.log('URL encontrada:', url);
            return url;
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao buscar URL:', error);
        return null;
    }
}

// Testar
findCompanyUrlSimple('Intelbras', 'São José, SC');