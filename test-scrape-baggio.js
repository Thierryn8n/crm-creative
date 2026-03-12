
async function testScrapeBaggio() {
  const port = 3000;
  try {
    console.log(`🚀 Tentando scraping para Pizzaria Baggio na porta ${port}...`)
    
    const response = await fetch(`http://localhost:${port}/api/scrape-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: 'Pizzaria Baggio Juvevê',
        location: 'Curitiba, PR'
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    const data = await response.json()
    console.log(`✅ Resultado do Scraping (Baggio):`, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`❌ Erro:`, error.message)
  }
}

testScrapeBaggio()
