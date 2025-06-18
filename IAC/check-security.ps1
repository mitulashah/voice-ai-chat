# Security Check Script for Voice AI Chat Project
# Checks for potential security issues and sensitive data exposure

Write-Host "🔐 Security Check for Voice AI Chat Project" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Using consolidated .gitignore in project root" -ForegroundColor Green

$issues = @()
$warnings = @()

# Check for sensitive files that shouldn't be committed
$sensitivePatterns = @(
    "*.tfstate*",
    "*.tfvars", 
    "*.env",
    "*api-key*",
    "*secret*",
    "*password*",
    "APPLICATION_KEYS.md",
    "DEPLOYMENT_SUCCESS.md"
)

Write-Host "`n🔍 Checking for sensitive files in git..." -ForegroundColor Yellow

foreach ($pattern in $sensitivePatterns) {
    $trackedFiles = git ls-files $pattern 2>$null
    if ($trackedFiles) {
        $issues += "❌ CRITICAL: Sensitive files tracked in git: $($trackedFiles -join ', ')"
    }
}

# Check for untracked sensitive files that should be ignored
Write-Host "🔍 Checking for untracked sensitive files..." -ForegroundColor Yellow

$untrackedSensitive = git ls-files --others --exclude-standard | Where-Object { 
    $_ -match "\.(tfstate|tfvars|env)$" -or 
    $_ -match "(api-key|secret|password)" -or
    $_ -match "APPLICATION_KEYS|DEPLOYMENT_SUCCESS"
}

if ($untrackedSensitive) {
    $warnings += "⚠️  Untracked sensitive files found (should be ignored): $($untrackedSensitive -join ', ')"
}

# Check if .gitignore patterns are working
Write-Host "🔍 Testing .gitignore patterns..." -ForegroundColor Yellow

$testFile = "test-secret.tfvars"
"secret=test" | Out-File -FilePath $testFile
$isIgnored = $null -ne (git check-ignore $testFile)
Remove-Item $testFile -ErrorAction SilentlyContinue

if (-not $isIgnored) {
    $issues += "❌ CRITICAL: .gitignore not properly configured for .tfvars files"
}

# Results
Write-Host "`n📊 Security Check Results:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All security checks passed!" -ForegroundColor Green
} else {
    if ($issues.Count -gt 0) {
        Write-Host "`n🚨 CRITICAL ISSUES:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host $issue -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️  WARNINGS:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host $warning -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🛡️  Security Recommendations:" -ForegroundColor Cyan
Write-Host "- Never commit .tfvars, .tfstate, or .env files" -ForegroundColor White
Write-Host "- Use template files (.example) for sharing configuration structure" -ForegroundColor White
Write-Host "- Regularly audit git history for accidentally committed secrets" -ForegroundColor White
Write-Host "- Use environment variables for sensitive configuration in CI/CD" -ForegroundColor White
