# Debug script to test blog extraction with longer time period
$uri = "https://josben.app.n8n.cloud/webhook/lansstyrelsen-insights"
$body = @{
    mode = "test"
    dateFrom = "2025-11-01"  # Extended to November 1
    dateTo = "2025-12-07"     # Until today
} | ConvertTo-Json

Write-Host "Testing with extended date range (Nov 1 - Dec 7)..." -ForegroundColor Yellow
Write-Host ""

$response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body

Write-Host "=== FOI Reports Found ===" -ForegroundColor Cyan
Write-Host "Count: $($response.sourceData.foi.Length)"
if ($response.sourceData.foi.Length -gt 0) {
    $response.sourceData.foi | ForEach-Object {
        Write-Host "  - $($_.title) ($($_.date))"
    }
}

Write-Host ""
Write-Host "=== Carl Heath Blog ===" -ForegroundColor Cyan
Write-Host "Count: $($response.sourceData.carlHeath.Length)"
if ($response.sourceData.carlHeath.Length -gt 0) {
    Write-Host "HTML Length: $($response.sourceData.carlHeath[0].htmlContent.Length) chars"
}

Write-Host ""
Write-Host "=== One Useful Thing ===" -ForegroundColor Cyan
Write-Host "Count: $($response.sourceData.oneUsefulThing.Length)"
if ($response.sourceData.oneUsefulThing.Length -gt 0) {
    Write-Host "HTML Length: $($response.sourceData.oneUsefulThing[0].htmlContent.Length) chars"
}

Write-Host ""
Write-Host "=== AI Insights Summary ===" -ForegroundColor Green
Write-Host $response.aiInsights.executiveSummary
