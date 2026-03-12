async function testMadero() {
    console.log('🚀 Tentando scraping para Madero em Curitiba na porta 3000...');
    try {
        const response = await fetch('http://localhost:3000/api/scrape-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_name: 'Madero',
                location: 'Curitiba, PR'
            })
        });

        if (!response.ok) {
            console.error(`❌ Erro ${response.status}:`, await response.text());
            return;
        }

        const data = await response.json();
        console.log('✅ Resultado do Scraping:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
}

testMadero();
