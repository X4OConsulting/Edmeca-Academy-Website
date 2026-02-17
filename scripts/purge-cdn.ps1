# CDN Cache Purge Script
# Triggers Netlify CDN purge function to clear browser-specific cache issues

Write-Host "🔥 EDMECA CDN CACHE PURGE" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

$purgeUrl = "https://edmeca.co.za/.netlify/functions/purge-cdn"
$netlifyUrl = "https://edmecaacademy.netlify.app/.netlify/functions/purge-cdn"

Write-Host "⏳ Waiting for deployment to complete (2-3 minutes)..." -ForegroundColor Yellow
Write-Host "   Check: https://app.netlify.com/sites/edmecaacademy/deploys" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key when deployment shows 'Published' (green checkmark)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🚀 Attempting CDN purge..." -ForegroundColor Cyan

# Try custom domain first
Write-Host ""
Write-Host "Method 1: Via custom domain ($purgeUrl)" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri $purgeUrl -Method GET -UseBasicParsing -TimeoutSec 30
    $body = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 202 -or $body.success) {
        Write-Host "✅ SUCCESS! CDN cache purge initiated" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Gray
        Write-Host ($body | ConvertTo-Json -Depth 10) -ForegroundColor White
        $purgeSuccess = $true
    } else {
        Write-Host "⚠️  Unexpected response (Status: $($response.StatusCode))" -ForegroundColor Yellow
        $purgeSuccess = $false
    }
} catch {
    Write-Host "❌ Custom domain purge failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Method 2: Trying via Netlify URL ($netlifyUrl)" -ForegroundColor White
    
    try {
        $response = Invoke-WebRequest -Uri $netlifyUrl -Method GET -UseBasicParsing -TimeoutSec 30
        $body = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq 202 -or $body.success) {
            Write-Host "✅ SUCCESS! CDN cache purge initiated via Netlify URL" -ForegroundColor Green
            Write-Host ""
            Write-Host "Response:" -ForegroundColor Gray
            Write-Host ($body | ConvertTo-Json -Depth 10) -ForegroundColor White
            $purgeSuccess = $true
        } else {
            Write-Host "⚠️  Unexpected response (Status: $($response.StatusCode))" -ForegroundColor Yellow
            $purgeSuccess = $false
        }
    } catch {
        Write-Host "❌ Netlify URL purge also failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
        Write-Host "1. Check if function deployed: https://app.netlify.com/sites/edmecaacademy/functions" -ForegroundColor Gray
        Write-Host "2. Check function logs for errors" -ForegroundColor Gray
        Write-Host "3. Verify @netlify/functions is installed" -ForegroundColor Gray
        Write-Host "4. Try manual API call (see CDN-PURGE-GUIDE.md)" -ForegroundColor Gray
        $purgeSuccess = $false
    }
}

if ($purgeSuccess) {
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host "⏳ NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Wait 60-90 seconds for purge to propagate globally" -ForegroundColor White
    Write-Host "2. Run verification tests:" -ForegroundColor White
    Write-Host "   node tests/cross-browser-test.js" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Expected result:" -ForegroundColor White
    Write-Host "   ✅ Chromium: ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "   ✅ Firefox: ALL TESTS PASSED (was failing)" -ForegroundColor Green
    Write-Host "   ✅ WebKit: ALL TESTS PASSED (was failing)" -ForegroundColor Green
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "⏳ Waiting 90 seconds before running tests..." -ForegroundColor Yellow
    
    # Countdown
    for ($i = 90; $i -gt 0; $i--) {
        Write-Host "`r   $i seconds remaining..." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
    Write-Host "`r   ✅ Wait complete!                    " -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Running cross-browser tests..." -ForegroundColor Cyan
    Write-Host ""
    
    # Run tests
    node tests/cross-browser-test.js
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 ALL TESTS PASSED! CDN ISSUE RESOLVED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Chrome works" -ForegroundColor Green
        Write-Host "✅ Firefox works" -ForegroundColor Green
        Write-Host "✅ Safari works" -ForegroundColor Green
        Write-Host ""
        Write-Host "Migration complete. Site fully operational on all browsers." -ForegroundColor White
    } else {
        Write-Host "⚠️  Some tests still failing. Check output above." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "If Firefox/Safari still show 404:" -ForegroundColor Yellow
        Write-Host "1. Clear browser caches completely" -ForegroundColor Gray
        Write-Host "2. Test in incognito/private mode" -ForegroundColor Gray
        Write-Host "3. Wait another 2-3 minutes and run tests again" -ForegroundColor Gray
        Write-Host "4. If still failing, see CDN-PURGE-GUIDE.md troubleshooting section" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "❌ Purge failed. See CDN-PURGE-GUIDE.md for alternative methods." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
