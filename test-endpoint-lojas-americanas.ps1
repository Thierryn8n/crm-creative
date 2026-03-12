$url = "http://localhost:3001/api/scrape-company"
$body = @{
    company_name = "Lojas Americanas"
    location = "São Paulo, SP"
} | ConvertTo-Json

Write-Host "Testando endpoint de scraping com Lojas Americanas..." -ForegroundColor Green

try {
    Write-Host "Enviando requisição para: $url" -ForegroundColor Yellow
    Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Yellow
    
    # Aumentar timeout para 5 minutos (300 segundos)
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
    
    Write-Host "`n✅ Sucesso! Resposta:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
    
} catch {
    Write-Host "`n❌ Erro:" -ForegroundColor Red
    Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__ 
    Write-Host "StatusDescription:" $_.Exception.Response.StatusDescription
    Write-Host "Mensagem:" $_.Exception.Message
}