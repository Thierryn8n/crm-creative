$url = "http://localhost:3000/api/scrape-company"
$body = @{
    url = "https://www.divia.com.br" 
} | ConvertTo-Json

Write-Host "Testando scraping de site..."
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}
