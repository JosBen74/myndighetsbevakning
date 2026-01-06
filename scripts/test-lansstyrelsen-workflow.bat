@echo off
echo ========================================
echo Testing Lansstyrelsen AI Insights Workflow
echo ========================================
echo.
echo Calling webhook with test data...
echo Date range: 2025-11-01 to 2025-12-07
echo Mode: test (no email sending)
echo.

curl -X POST "https://josben.app.n8n.cloud/webhook/lansstyrelsen-insights" ^
  -H "Content-Type: application/json" ^
  -d "{\"mode\": \"test\", \"dateFrom\": \"2025-11-01\", \"dateTo\": \"2025-12-07\"}" ^
  -o test-response.json ^
  -w "\n\nHTTP Status: %%{http_code}\nTime: %%{time_total}s\n"

echo.
echo ========================================
echo Response saved to: test-response.json
echo ========================================
echo.

if exist test-response.json (
  echo Opening response file...
  notepad test-response.json
) else (
  echo ERROR: Response file not created
)

pause
