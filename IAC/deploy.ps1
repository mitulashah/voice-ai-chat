# PowerShell script to deploy Voice AI Chat infrastructure

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$SqlPassword,
    
    [Parameter(Mandatory=$false)]
    [switch]$PlanOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$Destroy
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Voice AI Chat Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Navigate to IAC directory
$IAC_DIR = Join-Path $PSScriptRoot ""
Set-Location $IAC_DIR

# Check if Terraform is installed
try {
    terraform version | Out-Null
} catch {
    Write-Host "❌ Terraform is not installed. Please install it using:" -ForegroundColor Red
    Write-Host "winget install HashiCorp.Terraform" -ForegroundColor Yellow
    exit 1
}

# Check if Azure CLI is installed and authenticated
try {
    az account show | Out-Null
} catch {
    Write-Host "❌ Azure CLI is not authenticated. Please run:" -ForegroundColor Red
    Write-Host "az login" -ForegroundColor Yellow
    exit 1
}

# Set SQL password as environment variable if provided
if ($SqlPassword) {
    $env:TF_VAR_sql_admin_password = $SqlPassword
    Write-Host "✅ SQL password set via environment variable" -ForegroundColor Green
} elseif ($Environment -eq "prod" -and -not $env:TF_VAR_sql_admin_password) {
    Write-Host "❌ SQL password is required for production deployment" -ForegroundColor Red
    Write-Host "Use: -SqlPassword 'YourSecurePassword' or set TF_VAR_sql_admin_password environment variable" -ForegroundColor Yellow
    exit 1
}

# Initialize Terraform
Write-Host "🔧 Initializing Terraform..." -ForegroundColor Blue
terraform init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform initialization failed" -ForegroundColor Red
    exit 1
}

# Validate Terraform configuration
Write-Host "✅ Validating Terraform configuration..." -ForegroundColor Blue
terraform validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform validation failed" -ForegroundColor Red
    exit 1
}

# Set variables file path
$VarFile = "environments/$Environment/terraform.tfvars"

if ($Destroy) {
    # Destroy infrastructure
    Write-Host "🗑️  Destroying infrastructure for $Environment environment..." -ForegroundColor Red
    terraform destroy -var-file=$VarFile -auto-approve
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Infrastructure destroyed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Infrastructure destruction failed" -ForegroundColor Red
        exit 1
    }
} else {
    # Plan deployment
    Write-Host "📋 Planning deployment for $Environment environment..." -ForegroundColor Blue
    terraform plan -var-file=$VarFile

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Terraform planning failed" -ForegroundColor Red
        exit 1
    }

    if (-not $PlanOnly) {
        # Apply deployment
        Write-Host "🚀 Deploying infrastructure for $Environment environment..." -ForegroundColor Green
        terraform apply -var-file=$VarFile -auto-approve

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Infrastructure deployed successfully!" -ForegroundColor Green
            Write-Host "🌐 Access your resources at: https://portal.azure.com" -ForegroundColor Cyan
            
            # Show outputs
            Write-Host "📊 Deployment Outputs:" -ForegroundColor Yellow
            terraform output
        } else {
            Write-Host "❌ Infrastructure deployment failed" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "🎉 Operation completed!" -ForegroundColor Green
