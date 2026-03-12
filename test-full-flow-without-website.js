// Teste do fluxo completo - empresa sem website inicial
async function testFullFlowWithoutWebsite() {
  try {
    console.log('🧪 Testando fluxo completo com empresa sem website inicial...')
    
    // Passo 1: Buscar empresa sem website
    console.log('📍 Passo 1: Buscando empresa sem website...')
    const searchResponse = await fetch('http://localhost:3001/api/gemini-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'padaria pequena',
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
    
    // Procurar empresa sem website
    const resultWithoutWebsite = searchData.results.find(r => !r.website)
    
    if (!resultWithoutWebsite) {
      console.log('⚠️ Nenhuma empresa sem website encontrada, usando a primeira')
      var result = searchData.results[0]
    } else {
      console.log(`📋 Empresa sem website encontrada: ${resultWithoutWebsite.company_name}`)
      var result = resultWithoutWebsite
    }
    
    console.log(`📝 Dados da empresa:`, {
      company_name: result.company_name,
      city: result.city,
      state: result.state,
      website: result.website || 'NULL'
    })
    
    // Passo 2: Simular clique em "Buscar Dados Completos"
    console.log('🕷️ Passo 2: Simulando clique em "Buscar Dados Completos"...')
    console.log('📤 Enviando para /api/scrape-company com website=NULL...')
    
    const scrapeResponse = await fetch('http://localhost:3001/api/scrape-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.website, // NULL ou undefined
        company_name: result.company_name,
        location: `${result.city || ''} ${result.state || ''}`.trim()
      })
    })
    
    console.log(`📥 Resposta do servidor: ${scrapeResponse.status}`)
    
    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json().catch(() => ({}))
      console.log(`❌ Erro: ${scrapeResponse.status} - ${errorData.error || 'Erro desconhecido'}`)
      if (errorData.suggestion) {
        console.log(`💡 Sugestão: ${errorData.suggestion}`)
      }
      if (errorData.details) {
        console.log(`🔍 Detalhes: ${errorData.details}`)
      }
    } else {
      const data = await scrapeResponse.json()
      console.log('✅ Scraping bem-sucedido!')
      console.log('📊 Dados extraídos:', JSON.stringify(data, null, 2))
    }
    
    console.log('\n🎉 Teste de fluxo completo concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar o teste
testFullFlowWithoutWebsite()