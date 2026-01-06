# Test FOI webhook directly
$uri = "https://josben.app.n8n.cloud/webhook/foi-reports"

Write-Host "Testing FOI webhook..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json"

    Write-Host "Success: $($response.success)" -ForegroundColor Green
    Write-Host "Total reports: $($response.reports.Length)" -ForegroundColor Cyan
    Write-Host ""

    if ($response.reports.Length -gt 0) {
        Write-Host "First 5 reports:" -ForegroundColor Cyan
        $response.reports[0..4] | ForEach-Object {
            Write-Host "  Title: $($_.title)" -ForegroundColor White
            Write-Host "  Date: $($_.date)" -ForegroundColor Yellow
            Write-Host "  URL: $($_.url)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "No reports returned!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Full response:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5
    }

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
