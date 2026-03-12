# Teste das correções implementadas
Write-Output "=== TESTE DAS CORREÇÕES DA IA ==="

$tests = @(
    @{
        name = "Teste de dados reais - agencia de marketing"
        body = @{
            query = "agencia de marketing"
            location = "Santa Catarina"
            resultCount = 3
        } | ConvertTo-Json
    },
    @{
        name = "Teste timeout 60s - busca complexa"
        body = @{
            query = "empresas de tecnologia e desenvolvimento de software"
            location = "São Paulo"
            resultCount = 2
        } | ConvertTo-Json
    },
    @{
        name = "Teste validação de dados - restaurantes"
        body = @{
            query = "restaurantes"
            location = "Rio de Janeiro"
            resultCount = 2
        } | ConvertTo-Json
    }
)

foreach ($test in $tests) {
    Write-Output "`n=== $($test.name) ==="
    $startTime = Get-Date
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/gemini-search" -Method POST -ContentType "application/json" -Body $test.body -TimeoutSec 65
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Output "Duration: $([math]::Round($duration, 2)) seconds"
        Write-Output "Success: $($response.success)"
        Write-Output "Total found: $($response.total_found)"
        Write-Output "Results count: $($response.results.Count)"
        
        if ($response.results.Count -gt 0) {
            $firstResult = $response.results[0]
            Write-Output "First result company: $($firstResult.company_name)"
            Write-Output "Has website: $(!([string]::IsNullOrEmpty($firstResult.website)))"
            Write-Output "Has email: $(!([string]::IsNullOrEmpty($firstResult.email)))"
            Write-Output "Has phone: $(!([string]::IsNullOrEmpty($firstResult.phone)))"
            Write-Output "Has Google Maps data: $(!([string]::IsNullOrEmpty($firstResult.maps_data.google_maps_url)))"
            
            # Verificar se dados parecem reais (não genéricos)
            if ($firstResult.email -and ($firstResult.email.Contains("example") -or $firstResult.email.Contains("test"))) {
                Write-Output "⚠️  WARNING: Email appears to be generic/fake: $($firstResult.email)"
            }
            if ($firstResult.phone -and ($firstResult.phone.Contains("0000") -or $firstResult.phone.Contains("1234"))) {
                Write-Output "⚠️  WARNING: Phone appears to be generic/fake: $($firstResult.phone)"
            }
        }
        
        if ($response.error) {
            Write-Output "❌ ERROR: $($response.error)"
        }
        
        if ($duration -gt 60) {
            Write-Output "⚠️  WARNING: Request took longer than 60 seconds"
        }
        
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        Write-Output "Duration: $([math]::Round($duration, 2)) seconds (FAILED)"
        Write-Output "❌ Exception: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            Write-Output "Status code: $($_.Exception.Response.StatusCode)"
        }
    }
}

Write-Output "`n=== TESTES CONCLUÍDOS ==="