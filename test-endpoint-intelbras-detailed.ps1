$url = "http://localhost:3001/api/scrape-company"
$body = @{
    company_name = "Intelbras"
    location = "São José, SC"
} | ConvertTo-Json

Write-Host "Testando endpoint de scraping com Intelbras (com tratamento de erro melhorado)..." -ForegroundColor Green

try {
    Write-Host "Enviando requisição para: $url" -ForegroundColor Yellow
    Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Yellow
    
    # Aumentar timeout para 5 minutos (300 segundos)
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
    
    Write-Host "`n✅ Sucesso! Resposta:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
    
} catch {
    Write-Host "`n❌ Erro:" -ForegroundColor Red
    
    # Tentar obter detalhes da resposta de erro
    if ($_.Exception.Response) {
        Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__ 
        Write-Host "StatusDescription:" $_.Exception.Response.StatusDescription
    }
    Write-Host "Mensagem:" $_.Exception.Message
    
    # Se for um WebException, tentar ler o corpo da resposta
    if ($_.Exception -is [System.Net.WebException]) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            Write-Host "Resposta do servidor:" $responseBody -ForegroundColor Yellow
        } catch {
            Write-Host "Não foi possível ler a resposta do servidor" -ForegroundColor Gray
        }
    }
}