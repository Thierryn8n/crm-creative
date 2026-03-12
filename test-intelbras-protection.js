// Teste com Intelbras (sabemos que tem proteção)
async function testIntelbrasProtection() {
  try {
    console.log('🧪 Testando tratamento de erro com Intelbras...')
    
    // Passo 1: Buscar Intelbras
    console.log('📍 Passo 1: Buscando Intelbras...')
    const searchResponse = await fetch('http://localhost:3001/api/gemini-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'intelbras',
        location: 'Santa Catarina, SC',
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
    
    // Passo 2: Tentar fazer scraping (deve falhar com 403)
    console.log('🕷️ Passo 2: Tentando scraping do site...')
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
      console.log(`❌ Erro: ${scrapeResponse.status} - ${errorData.error || 'Erro desconhecido'}`)
      console.log(`💡 Sugestão: ${errorData.suggestion || 'Sem sugestão'}`)
      if (errorData.details) {
        console.log(`🔍 Detalhes: ${errorData.details}`)
      }
      console.log('✅ Tratamento de erro funcionando corretamente!')
    } else {
      console.log('⚠️ Scraping inesperadamente bem-sucedido')
      const data = await scrapeResponse.json()
      console.log('Dados:', data)
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar o teste
testIntelbrasProtection()