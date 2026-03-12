
async function testEnvoxSearch() {
  try {
    console.log('🚀 Testando busca para Envox...')
    
    const response = await fetch('http://127.0.0.1:3000/api/gemini-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Envox Agência de Marketing Digital',
        location: 'Curitiba, PR',
        resultCount: 1
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Resultado:', JSON.stringify(data.results[0], null, 2))
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

testEnvoxSearch()
