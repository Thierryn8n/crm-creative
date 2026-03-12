$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    query = "Agência de Marketing"
    location = "Florianópolis, SC"
    resultCount = 3
} | ConvertTo-Json

$apiUrl = "http://localhost:3000/api/gemini-search"

Write-Host "Testando busca com Google Search Grounding..."
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body -TimeoutSec 90
    
    if ($response.success) {
        Write-Host "✅ Sucesso!" -ForegroundColor Green
        Write-Host "Total encontrado: $($response.total_found)"
        
        foreach ($company in $response.results) {
            Write-Host "`nEmpresa: $($company.company_name)" -ForegroundColor Cyan
            Write-Host "Website: $($company.website)"
            Write-Host "Email: $($company.email)"
            Write-Host "Telefone: $($company.phone)"
            Write-Host "Endereço: $($company.address)"
            
            if ($company.google_maps_url) {
                Write-Host "Maps: $($company.google_maps_url)"
            }
        }
    } else {
        Write-Host "❌ Erro na resposta da API:" -ForegroundColor Red
        Write-Host ($response | ConvertTo-Json -Depth 5)
    }
} catch {
    Write-Host "❌ Erro na requisição:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorBody"
    }
}
