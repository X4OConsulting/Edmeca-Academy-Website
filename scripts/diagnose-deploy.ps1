# Netlify Deploy Diagnostic Script
# Checks which deploy is being served by custom domain vs Netlify URL

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "NETLIFY DEPLOY DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Function to get deploy info from response
function Get-DeployInfo {
    param($url, $name)
    
    Write-Host "🔍 Checking: $name" -ForegroundColor White
    Write-Host "   URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
        
        Write-Host "   Status: ✅ HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Size: $($response.Content.Length) bytes" -ForegroundColor Gray
        
        # Check for Netlify-specific headers
        if ($response.Headers.ContainsKey('x-nf-request-id')) {
            Write-Host "   Request ID: $($response.Headers['x-nf-request-id'])" -ForegroundColor Gray
        }
        
        if ($response.Headers.ContainsKey('age')) {
            Write-Host "   Cache Age: $($response.Headers['age'])s" -ForegroundColor Gray
        }
        
        # Check content for hidden deploy marker
        $content = $response.Content
        if ($content -match 'index-([a-zA-Z0-9]+)\.js') {
            $hash = $Matches[1]
            Write-Host "   Asset Hash: $hash" -ForegroundColor Yellow
        }
        
        if ($content -match 'index-([a-zA-Z0-9]+)\.css') {
            $cssHash = $Matches[1]
            Write-Host "   CSS Hash: $cssHash" -ForegroundColor Yellow
        }
        
        return @{
            Success = $true
            Status = $response.StatusCode
            Size = $response.Content.Length
            Hash = $hash
        }
    }
    catch {
        Write-Host "   Status: ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

Write-Host "COMPARING DEPLOYMENTS" -ForegroundColor Cyan
Write-Host "-" * 70 -ForegroundColor Gray
Write-Host ""

# Test Netlify URL
$netlifyResult = Get-DeployInfo -url "https://edmecaacademy.netlify.app/" -name "Netlify URL (edmecaacademy.netlify.app)"

# Test Custom Domain
$customResult = Get-DeployInfo -url "https://edmeca.co.za/" -name "Custom Domain (edmeca.co.za)"

# Analysis
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "ANALYSIS" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

if ($netlifyResult.Success -and $customResult.Success) {
    if ($netlifyResult.Hash -eq $customResult.Hash) {
        Write-Host "✅ BOTH URLS SERVE THE SAME DEPLOY" -ForegroundColor Green
        Write-Host "   Asset hash matches: $($netlifyResult.Hash)" -ForegroundColor Gray
    } else {
        Write-Host "❌ DIFFERENT DEPLOYS DETECTED!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Netlify URL asset: $($netlifyResult.Hash)" -ForegroundColor Yellow
        Write-Host "   Custom domain asset: $($customResult.Hash)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "LIKELY CAUSE:" -ForegroundColor Red
        Write-Host "Custom domain is locked to an old deploy or branch preview" -ForegroundColor White
    }
}
elseif ($netlifyResult.Success -and -not $customResult.Success) {
    Write-Host "❌ CUSTOM DOMAIN NOT WORKING" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Netlify URL: ✅ Works (HTTP $($netlifyResult.Status))" -ForegroundColor Green
    Write-Host "   Custom domain: ❌ Failed ($($customResult.Error))" -ForegroundColor Red
    Write-Host ""
    Write-Host "LIKELY CAUSES:" -ForegroundColor Red
    Write-Host "1. Custom domain pointing to NON-EXISTENT or WRONG deploy" -ForegroundColor White
    Write-Host "2. Domain not properly configured in Netlify Dashboard" -ForegroundColor White
    Write-Host "3. DNS configured but domain not added to site" -ForegroundColor White
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "RECOMMENDED ACTIONS" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "1. CHECK NETLIFY DASHBOARD:" -ForegroundColor Yellow
Write-Host "   Go to: https://app.netlify.com/sites/edmecaacademy/settings/domain" -ForegroundColor White
Write-Host "   Verify:" -ForegroundColor Gray
Write-Host "   - edmeca.co.za is listed as custom domain" -ForegroundColor Gray
Write-Host "   - Shows as 'Primary domain' or at least 'Active'" -ForegroundColor Gray
Write-Host "   - No errors or warnings displayed" -ForegroundColor Gray
Write-Host ""

Write-Host "2. CHECK DEPLOY SETTINGS:" -ForegroundColor Yellow
Write-Host "   Go to: https://app.netlify.com/sites/edmecaacademy/deploys" -ForegroundColor White
Write-Host "   Verify:" -ForegroundColor Gray
Write-Host "   - Latest deploy shows 'Published'" -ForegroundColor Gray
Write-Host "   - No deploy contexts (branch-deploys) interfering" -ForegroundColor Gray
Write-Host "   - Production branch is 'clean-deploy'" -ForegroundColor Gray
Write-Host ""

Write-Host "3. CHECK DEPLOY FILE BROWSER:" -ForegroundColor Yellow
Write-Host "   Go to latest deploy → 'Deploy log' → 'Browse' tab" -ForegroundColor White
Write-Host "   Verify:" -ForegroundColor Gray
Write-Host "   - index.html exists at root" -ForegroundColor Gray
Write-Host "   - assets/ folder exists with JS/CSS files" -ForegroundColor Gray
Write-Host "   - favicon.png exists" -ForegroundColor Gray
Write-Host ""

Write-Host "4. TRY MANUAL FIX:" -ForegroundColor Yellow
Write-Host "   Option A - Re-add custom domain:" -ForegroundColor White
Write-Host "   1. Domain management → Remove 'edmeca.co.za'" -ForegroundColor Gray
Write-Host "   2. Wait 1 minute" -ForegroundColor Gray
Write-Host "   3. Add custom domain → 'edmeca.co.za'" -ForegroundColor Gray
Write-Host "   4. Set as primary domain" -ForegroundColor Gray
Write-Host ""
Write-Host "   Option B - Trigger new production deploy:" -ForegroundColor White
Write-Host "   1. Deploysettings → clear cache and deploy" -ForegroundColor Gray
Write-Host "   2. Or: git commit --allow-empty -m 'trigger' && git push" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""
