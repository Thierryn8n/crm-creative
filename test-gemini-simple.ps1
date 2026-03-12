$GEMINI_API_KEY = "AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc"
$GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

Write-Host "Testando conexão com Gemini API..." -ForegroundColor Green

$body = @{
    contents = @(@{
        parts = @(@{
            text = "Qual é o site oficial da Intelbras?"
        })
    })
    generationConfig = @{
        temperature = 0.1
    }
} | ConvertTo-Json -Depth 5

try {
    Write-Host "Enviando requisição para: $GEMINI_API_URL?key=$GEMINI_API_KEY" -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$GEMINI_API_URL?key=$GEMINI_API_KEY" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "`n✅ Sucesso! Resposta:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
    
    $text = $response.candidates[0].content.parts[0].text
    Write-Host "`nTexto extraído: $text" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        Write-Host "Conteúdo do erro: $errorContent"
    }
}