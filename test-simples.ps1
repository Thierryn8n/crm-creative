# Teste simples para validar as correções
Write-Output "=== TESTE SIMPLES DAS CORREÇÕES ==="

try {
    Write-Output "Testando endpoint com busca simples..."
    
    $body = @{
        query = "agencia de marketing"
        location = "Florianopolis"
        resultCount = 2
    } | ConvertTo-Json
    
    $startTime = Get-Date
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/gemini-search" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 70
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Output "✅ Sucesso! Duração: $([math]::Round($duration, 2)) segundos"
    Write-Output "Resultados encontrados: $($response.results.Count)"
    
    if ($response.results.Count -gt 0) {
        foreach ($result in $response.results) {
            Write-Output "`nEmpresa: $($result.company_name)"
            Write-Output "Website: $($result.website)"
            Write-Output "Email: $($result.email)"
            Write-Output "Telefone: $($result.phone)"
            Write-Output "Localização: $($result.city), $($result.state)"
            
            # Verificar se dados parecem reais
            $emailValido = $result.email -and !$result.email.Contains("example") -and !$result.email.Contains("test")
            $telefoneValido = $result.phone -and !$result.phone.Contains("0000") -and !$result.phone.Contains("1234")
            
            if ($emailValido) { Write-Output "✅ Email parece real" }
            if ($telefoneValido) { Write-Output "✅ Telefone parece real" }
        }
    }
    
} catch {
    Write-Output "❌ Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Output "Status: $($_.Exception.Response.StatusCode)"
    }
}

Write-Output "`n=== TESTE CONCLUÍDO ==="