$GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
$apiKey = $env:GEMINI_API_KEY

if (-not $apiKey) {
    Write-Host "❌ GEMINI_API_KEY não encontrada nas variáveis de ambiente" -ForegroundColor Red
    exit 1
}

$company = "Intelbras"
$location = "São José, SC"

Write-Host "Testando busca de URL para $company em $location" -ForegroundColor Green

$prompt1 = @"
Encontre o site oficial da empresa "$company" localizada em "$location".

Instruções:
1. Use busca Google para encontrar o site oficial
2. O site deve conter o nome da empresa
3. Prefira domínios .com.br ou .com
4. Verifique se é o site real da empresa (não redes sociais ou diretórios)
5. Retorne apenas a URL completa começando com http/https

Responda no formato: URL: [url completa]
"@

Write-Host "`nPrompt 1:" -ForegroundColor Yellow
Write-Host $prompt1

$body1 = @{
    contents = @(@{
        parts = @(@{
            text = $prompt1
        })
    })
    tools = @(@{
        googleSearch = @{}
    })
    generationConfig = @{
        temperature = 0.1
    }
} | ConvertTo-Json -Depth 5

try {
    Write-Host "`nEnviando requisição para Gemini..." -ForegroundColor Yellow
    $response1 = Invoke-RestMethod -Uri "$GEMINI_API_URL?key=$apiKey" -Method Post -Body $body1 -ContentType "application/json"
    
    Write-Host "`nResposta Gemini:" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json -Depth 5)
    
    $text1 = $response1.candidates[0].content.parts[0].text
    Write-Host "`nTexto extraído:" -ForegroundColor Cyan
    Write-Host $text1
    
    # Tenta extrair URL
    if ($text1 -match 'URL:\s*(https?://[^\s"''>,]+)') {
        $url1 = $matches[1] -replace '[.,;)]*$', ''
        Write-Host "`n✅ URL encontrada (formato esperado): $url1" -ForegroundColor Green
    } elseif ($text1 -match 'https?://[^\s"''>,]+') {
        $url1 = $matches[0] -replace '[.,;)]*$', ''
        Write-Host "`n✅ URL encontrada (regex alternativo): $url1" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Nenhuma URL encontrada no texto" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`n❌ Erro na requisição:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}