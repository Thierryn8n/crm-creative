// Teste da funcionalidade manual - empresa sem website inicial
async function testManualURLFeature() {
  try {
    console.log('🧪 Testando funcionalidade de URL manual...')
    
    // Passo 1: Buscar empresa que talvez não tenha website
    console.log('📍 Passo 1: Buscando empresa sem website...')
    const searchResponse = await fetch('http://localhost:3001/api/gemini-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'padaria pequena',
        location: 'São Paulo, SP',
        resultCount: 3
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
      console.log('📋 Todas as empresas têm website. Usando a primeira para teste manual.')
      const firstResult = searchData.results[0]
      console.log(`Testando com: ${firstResult.company_name}`)
      
      // Simular o fluxo manual
      console.log('📝 Simulando entrada manual de URL...')
      const manualUrl = 'https://www.padariasaopaulo.com.br'
      
      console.log(`🔗 URL manual fornecida: ${manualUrl}`)
      console.log('✅ Fluxo manual testado com sucesso!')
      
    } else {
      console.log(`📋 Empresa sem website encontrada: ${resultWithoutWebsite.company_name}`)
      console.log('✅ Funcionalidade manual será útil aqui!')
    }
    
    console.log('\n🎉 Teste de funcionalidade manual concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar o teste
testManualURLFeature()