// Teste do endpoint de busca melhorado
async function testSearch() {
  try {
    console.log('🚀 Testando endpoint de busca com dados reais...')
    
    const response = await fetch('http://localhost:3001/api/gemini-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'agencias de publicidade',
        location: 'São Paulo',
        type: 'advertising_agency',
        resultCount: 3
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ Busca realizada com sucesso!')
    console.log(`📊 Total de empresas encontradas: ${data.total_found}`)
    console.log(`💾 Empresas salvas: ${data.results?.length || 0}`)
    console.log(`📈 Qualidade média dos dados: ${data.data_quality?.average_score?.toFixed(1) || 0}/100`)
    
    if (data.results && data.results.length > 0) {
      console.log('\n🏢 Empresas salvas:')
      data.results.forEach((company, index) => {
        console.log(`${index + 1}. ${company.company_name}`)
        console.log(`   📧 Email: ${company.email || 'N/A'}`)
        console.log(`   🌐 Website: ${company.website || 'N/A'}`)
        console.log(`   💼 LinkedIn: ${company.linkedin_url || 'N/A'}`)
        console.log(`   📍 Localização: ${company.city}, ${company.state}`)
        console.log(`   📊 Qualidade: ${company.full_company_data?.data_quality?.score || 0}/100`)
        console.log('')
      })
    }

    return data
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return null
  }
}

// Executar teste
testSearch()