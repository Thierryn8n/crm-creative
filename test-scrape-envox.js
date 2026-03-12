
async function testScrapeEnvox() {
  const ports = [3000, 3001];
  let success = false;

  for (const port of ports) {
    try {
      console.log(`🚀 Tentando scraping para Envox na porta ${port}...`)
      
      const response = await fetch(`http://localhost:${port}/api/scrape-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: 'Envox Agência de Marketing Digital',
          location: 'Curitiba, PR'
        })
      })

      if (response.status === 404) {
        console.warn(`⚠️ Porta ${port} retornou 404. Tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ Resultado do Scraping (Porta ${port}):`, JSON.stringify(data, null, 2))
      success = true;
      break;
    } catch (error) {
      console.error(`❌ Erro na porta ${port}:`, error.message)
    }
  }

  if (!success) {
    console.error('❌ Falha em todas as portas testadas.')
  }
}

testScrapeEnvox()
