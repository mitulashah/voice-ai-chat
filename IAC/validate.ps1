# Voice AI Chat Infrastructure Validation Script
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod", "local")]
    [string]$Environment = "local",
    
    [Parameter(Mandatory=$false)]
    [switch]$ValidateOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowPlan
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Voice AI Chat Infrastructure Validation" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Navigate to IAC directory
$IAC_DIR = $PSScriptRoot
Set-Location $IAC_DIR

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Blue

# Check Terraform
try {
    $tfVersion = terraform version -json | ConvertFrom-Json
    Write-Host "✅ Terraform: $($tfVersion.terraform_version)" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform not found. Install with: winget install HashiCorp.Terraform" -ForegroundColor Red
    exit 1
}

# Check Azure CLI
try {
    $azVersion = az version | ConvertFrom-Json
    Write-Host "✅ Azure CLI: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Install with: winget install Microsoft.AzureCLI" -ForegroundColor Red
    exit 1
}

# Check Azure authentication
try {
    $account = az account show | ConvertFrom-Json
    Write-Host "✅ Azure Account: $($account.name) ($($account.id))" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Azure. Run: az login" -ForegroundColor Red
    exit 1
}

# Set variables file
$VarFile = if ($Environment -eq "local") { "local.tfvars" } else { "environments/$Environment/terraform.tfvars" }

if (-not (Test-Path $VarFile)) {
    Write-Host "❌ Variable file not found: $VarFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Using variables file: $VarFile" -ForegroundColor Green

# Initialize Terraform
Write-Host "`n🔧 Initializing Terraform..." -ForegroundColor Blue
terraform init -upgrade

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform initialization failed" -ForegroundColor Red
    exit 1
}

# Validate configuration
Write-Host "`n✅ Validating Configuration..." -ForegroundColor Blue
terraform validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform validation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration is valid!" -ForegroundColor Green

# Format check
Write-Host "`n🎨 Checking Formatting..." -ForegroundColor Blue
$formatResult = terraform fmt -check -recursive

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Formatting issues found. Run 'terraform fmt -recursive' to fix." -ForegroundColor Yellow
    terraform fmt -recursive
    Write-Host "✅ Formatting fixed!" -ForegroundColor Green
} else {
    Write-Host "✅ Formatting is correct!" -ForegroundColor Green
}

# Security scan (if tfsec is available)
Write-Host "`n🔒 Security Scan..." -ForegroundColor Blue
try {
    tfsec . --no-color
    Write-Host "✅ Security scan completed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  tfsec not found. Install for security scanning: https://github.com/aquasecurity/tfsec" -ForegroundColor Yellow
}

# Generate plan
Write-Host "`n📋 Generating Plan..." -ForegroundColor Blue
terraform plan -var-file=$VarFile -out="tfplan-$Environment.out"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Plan generation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Plan generated successfully!" -ForegroundColor Green

# Show plan if requested
if ($ShowPlan) {
    Write-Host "`n📊 Plan Details:" -ForegroundColor Yellow
    terraform show "tfplan-$Environment.out"
}

# Cost estimation (if infracost is available)
Write-Host "`n💰 Cost Estimation..." -ForegroundColor Blue
try {
    infracost breakdown --path . --terraform-var-file $VarFile
    Write-Host "✅ Cost estimation completed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  infracost not found. Install for cost estimation: https://www.infracost.io/docs/" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📊 Validation Summary:" -ForegroundColor Cyan
Write-Host "✅ Prerequisites checked" -ForegroundColor Green
Write-Host "✅ Configuration validated" -ForegroundColor Green
Write-Host "✅ Formatting verified" -ForegroundColor Green
Write-Host "✅ Plan generated" -ForegroundColor Green

if (-not $ValidateOnly) {
    Write-Host "`n🚀 Ready for deployment!" -ForegroundColor Green
    Write-Host "To deploy, run: .\deploy.ps1 -Environment $Environment" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Validation completed successfully!" -ForegroundColor Green
}

# Cleanup plan file
Remove-Item "tfplan-$Environment.out" -ErrorAction SilentlyContinue
