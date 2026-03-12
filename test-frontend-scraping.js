// Teste do frontend - buscar e fazer scraping de Lojas Americanas
async function testFrontendScraping() {
  try {
    console.log('🧪 Testando busca e scraping no frontend...')
    
    // Passo 1: Buscar empresas
    console.log('📍 Passo 1: Buscando Lojas Americanas...')
    const searchResponse = await fetch('http://localhost:3001/api/gemini-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'lojas americanas',
        location: 'São Paulo, SP',
        resultCount: 1
      })
    })
    
    if (!searchResponse.ok) {
      throw new Error(`Erro na busca: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    console.log('✅ Busca bem-sucedida!', searchData)
    
    if (!searchData.results || searchData.results.length === 0) {
      console.log('⚠️ Nenhum resultado encontrado')
      return
    }
    
    const result = searchData.results[0]
    console.log(`📋 Resultado encontrado: ${result.company_name}`)
    
    // Passo 2: Fazer scraping do site
    console.log('🕷️ Passo 2: Fazendo scraping do site...')
    const scrapeResponse = await fetch('http://localhost:3001/api/scrape-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.website,
        company_name: result.company_name,
        location: `${result.city || ''} ${result.state || ''}`.trim()
      })
    })
    
    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json().catch(() => ({}))
      throw new Error(`Erro no scraping: ${scrapeResponse.status} - ${errorData.error || 'Erro desconhecido'}`)
    }
    
    const scrapeData = await scrapeResponse.json()
    console.log('✅ Scraping bem-sucedido!')
    console.log('📊 Dados extraídos:', JSON.stringify(scrapeData, null, 2))
    
    console.log('\n🎉 Teste concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar o teste
testFrontendScraping()