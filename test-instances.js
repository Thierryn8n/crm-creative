
async function testInstances() {
  console.log('🚀 Testando busca em duas instâncias (Site NULL)...')
  
  const payload = {
    company_name: 'Envox Agência de Marketing Digital',
    location: 'Curitiba, PR',
    cnpj: '21.033.453/0001-28', // Exemplo de CNPJ da Envox (fictício para teste se necessário)
    description: 'Agência especializada em tráfego pago e inbound marketing'
  }

  try {
    const response = await fetch('http://127.0.0.1:3000/api/scrape-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    console.log('✅ Resultado:', JSON.stringify(data, null, 2))
    
    if (data.found_url) {
      console.log('💎 Site localizado na Instância 2:', data.found_url)
    } else {
      console.log('❌ Site não localizado, mas dados do Google retornados.')
    }

    if (data.google_rating) {
      console.log('⭐ Rating encontrado:', data.google_rating)
    }

    if (data.working_hours) {
      console.log('⏰ Horários encontrados:', data.working_hours)
    }

    if (data.meta_tags) {
      console.log('🏷️ Meta tags encontradas:', data.meta_tags)
    }

    if (data.address && data.address.includes('-')) {
      console.log('📍 Endereço com CEP encontrado:', data.address)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testInstances()
