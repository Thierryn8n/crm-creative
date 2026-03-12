# Testar modelos válidos do Gemini API
$apiKey = $env:GEMINI_API_KEY

if (-not $apiKey) {
    Write-Output "❌ GEMINI_API_KEY não configurada"
    exit 1
}

Write-Output "=== TESTANDO MODELOS GEMINI ==="

# Lista de modelos para testar (baseado na documentação e tentativas anteriores)
$models = @(
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-1.5-flash-latest", 
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-pro-latest",
    "gemini-flash-latest",
    "gemini-flash"
)

foreach ($model in $models) {
    Write-Output "`nTestando modelo: $model"
    
    $url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey"
    
    $body = @{
        contents = @(
            @{
                parts = @(
                    @{
                        text = "Teste simples"
                    }
                )
            }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
        Write-Output "✅ SUCESSO - Modelo disponível"
        Write-Output "Response: $($response.candidates[0].content.parts[0].text)"
    } catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Output "❌ ERRO $statusCode - $errorMessage"
        } else {
            Write-Output "❌ ERRO - $errorMessage"
        }
    }
}

# Também testar o endpoint de listagem de modelos
Write-Output "`n=== LISTANDO TODOS OS MODELOS DISPONÍVEIS ==="
$listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey"

try {
    $modelsList = Invoke-RestMethod -Uri $listUrl -Method GET -TimeoutSec 10
    Write-Output "Modelos disponíveis:"
    foreach ($model in $modelsList.models) {
        Write-Output "- $($model.name) (version: $($model.version))"
    }
} catch {
    Write-Output "❌ Erro ao listar modelos: $($_.Exception.Message)"
}