$apiKey = $env:GEMINI_API_KEY
if (-not $apiKey) {
    # Tente ler do .env se não estiver no ambiente
    $envContent = Get-Content .env -ErrorAction SilentlyContinue
    if ($envContent) {
        foreach ($line in $envContent) {
            if ($line -match "GEMINI_API_KEY=(.*)") {
                $apiKey = $matches[1]
                break
            }
        }
    }
}

if (-not $apiKey) {
    Write-Host "API Key não encontrada!" -ForegroundColor Red
    exit
}

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get
    $models = $response.models | Where-Object { $_.name -like "*gemini*" }
    
    Write-Host "Modelos Gemini disponíveis:" -ForegroundColor Cyan
    foreach ($model in $models) {
        Write-Host "Name: $($model.name)"
        Write-Host "Supported Generation Methods: $($model.supportedGenerationMethods -join ', ')"
        Write-Host "---"
    }
} catch {
    Write-Host "Erro ao listar modelos: $_" -ForegroundColor Red
}
