$url = "http://localhost:3001/api/scrape-company"
$body = @{
    company_name = "Intelbras"
    location = "São José, SC"
} | ConvertTo-Json

Write-Host "Testando endpoint de scraping..." -ForegroundColor Green

try {
    Write-Host "Enviando requisição para: $url" -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "`n✅ Sucesso! Resposta:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
    
} catch {
    Write-Host "`n❌ Erro:" -ForegroundColor Red
    Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__ 
    Write-Host "StatusDescription:" $_.Exception.Response.StatusDescription
    Write-Host "Mensagem:" $_.Exception.Message
}