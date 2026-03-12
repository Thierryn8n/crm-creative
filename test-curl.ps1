# Teste com curl simples
Write-Output "=== TESTE CURL SIMPLES ==="

$body = '{"query":"agencia de marketing","location":"Florianopolis","resultCount":1}'

try {
    Write-Output "Enviando requisição..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/gemini-search" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
    
    Write-Output "✅ Sucesso!"
    Write-Output "Status: OK"
    Write-Output "Resultados: $($response.results.Count)"
    
    if ($response.error) {
        Write-Output "Erro retornado: $($response.error)"
    }
    
} catch {
    Write-Output "❌ Erro na requisição"
    Write-Output "Mensagem: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        Write-Output "Status Code: $($_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Output "Resposta de erro: $responseBody"
    }
}