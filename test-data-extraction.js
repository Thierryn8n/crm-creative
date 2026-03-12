// Teste de extração de dados de diferentes tipos de websites
async function testDataExtraction() {
  const testCases = [
    {
      name: 'Americanas (E-commerce)',
      url: 'https://www.americanas.com.br',
      company: 'Lojas Americanas',
      location: 'São Paulo, SP'
    },
    {
      name: 'Intelbras (Tecnologia com proteção)',
      url: 'https://www.intelbras.com.br',
      company: 'Intelbras',
      location: 'Santa Catarina, SC'
    },
    {
      name: 'Petrobras (Grande corporação)',
      url: 'https://petrobras.com.br',
      company: 'Petrobras',
      location: 'Rio de Janeiro, RJ'
    }
  ]

  console.log('🧪 Testando extração de dados de diferentes estruturas...\n')

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testando: ${testCase.name}`)
      console.log(`🌐 URL: ${testCase.url}`)
      
      const response = await fetch('http://localhost:3001/api/scrape-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testCase.url,
          company_name: testCase.company,
          location: testCase.location
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log(`❌ Erro: ${response.status} - ${errorData.error || 'Erro desconhecido'}`)
        if (errorData.suggestion) {
          console.log(`💡 Sugestão: ${errorData.suggestion}`)
        }
      } else {
        const data = await response.json()
        console.log('✅ Scraping bem-sucedido!')
        console.log(`📄 Descrição: ${data.description || 'Não encontrada'}`)
        console.log(`📧 Email: ${data.email || 'Não encontrado'}`)
        console.log(`📞 Telefone: ${data.phone || 'Não encontrado'}`)
        console.log(`📍 Endereço: ${data.address || 'Não encontrado'}`)
        console.log(`🔗 URL encontrada: ${data.found_url || 'Não encontrada'}`)
        
        if (data.social_media) {
          console.log(`📱 Social Media:`)
          Object.entries(data.social_media).forEach(([platform, url]) => {
            console.log(`   - ${platform}: ${url || 'Não encontrado'}`)
          })
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro inesperado: ${error.message}`)
    }
    
    console.log('---\n')
  }
  
  console.log('🎉 Teste de extração concluído!')
}

// Executar o teste
testDataExtraction()