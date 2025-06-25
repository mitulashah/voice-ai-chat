# Voice AI Chat - Azure Container Apps Deployment Script
# This script builds and deploys client and server containers to Azure Container Apps
# Assumes: Container Apps Environment, Storage Account, Key Vault already exist
# Requires: Azure CLI, PowerShell 7+, appropriate Azure permissions
#
# USAGE EXAMPLE:
# .\deploy-azure-containers.ps1 `
#     -SubscriptionId "12345678-1234-1234-1234-123456789012" `
#     -ResourceGroupName "voice-ai-rg" `
#     -EnvironmentName "dev" `
#     -Location "eastus" `
#     -ContainerAppEnvironmentName "devcae" `
#     -StorageAccountName "devst123456" `
#     -KeyVaultName "devkv123456" `
#     -AcrName "devacr123456"
#
# FOR REDEPLOY (just rebuild images and update apps):
# .\deploy-azure-containers.ps1 `
#     -SubscriptionId "12345678-1234-1234-1234-123456789012" `
#     -ResourceGroupName "voice-ai-rg" `
#     -EnvironmentName "dev" `
#     -ContainerAppEnvironmentName "devcae" `
#     -StorageAccountName "devst123456" `
#     -KeyVaultName "devkv123456" `
#     -AcrName "devacr123456" `
#     -Redeploy
#
# IMPORTANT: Update the Azure service secrets in the configuration section below before running!

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$EnvironmentName,
    
    [Parameter(Mandatory=$true)]
    [string]$ContainerAppEnvironmentName,
    
    [Parameter(Mandatory=$true)]
    [string]$StorageAccountName,
    
    [Parameter(Mandatory=$true)]
    [string]$KeyVaultName,
    
    [Parameter(Mandatory=$true)]
    [string]$AcrName,
    
    [Parameter(Mandatory=$false)]
    [switch]$Redeploy
)

# =============================================================================
# CONFIGURATION VARIABLES AND SECRETS - Update these values for your deployment
# =============================================================================

# **IMPORTANT: Update these secret values before running the script**
# Azure OpenAI Configuration (REQUIRED)
$AZURE_OPENAI_ENDPOINT = "https://your-openai-resource.openai.azure.com/"
$AZURE_OPENAI_KEY = "your-openai-api-key-here"
$AZURE_OPENAI_DEPLOYMENT = "gpt-4o"
$AZURE_OPENAI_MODEL = "gpt-4o"

# Azure Speech Services Configuration (REQUIRED)
$AZURE_SPEECH_KEY = "your-speech-service-key-here"
$AZURE_SPEECH_REGION = $Location

# Azure AI Foundry Configuration (REQUIRED)
$AZURE_AI_FOUNDRY_PROJECT_ENDPOINT = "https://your-ai-foundry-project.cognitiveservices.azure.com/"
$AZURE_EVALUATION_AGENT_ID = "your-evaluation-agent-id-here"

# Application Authentication (Update if needed)
$AUTH_USERS = '[{"username":"demo","password":"demo123"}]'
$SESSION_SECRET = (New-Guid).ToString().Replace('-', '')

# =============================================================================
# RESOURCE NAMING - Using existing resources and auto-generating container apps
# =============================================================================

# Container Image Configuration
$CLIENT_IMAGE_TAG = "latest"
$SERVER_IMAGE_TAG = "latest"
$CLIENT_IMAGE_NAME = "client"
$SERVER_IMAGE_NAME = "server"

# Container Apps Configuration (will be created)
$CLIENT_APP_NAME = "${EnvironmentName}-client"
$SERVER_APP_NAME = "${EnvironmentName}-server"
$MANAGED_IDENTITY_NAME = "${EnvironmentName}-shared-identity"

# Storage Container Names (assume containers exist in provided storage account)
$DATABASE_CONTAINER_NAME = "data"
$BACKUP_CONTAINER_NAME = "database-backups"

# Application Configuration (Auto-generated - will be updated after server deployment)
$VITE_API_URL = "https://${EnvironmentName}-server.placeholder.azurecontainerapps.io"

# Log Analytics Configuration
$LOG_ANALYTICS_WORKSPACE_NAME = "${EnvironmentName}log"

# Application Configuration (Auto-generated - will be updated after server deployment)
$VITE_API_URL = "https://${EnvironmentName}-server.placeholder.azurecontainerapps.io"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Write-Step($message) {
    Write-Host "===== $message =====" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "INFO: $message" -ForegroundColor Blue
}

function Write-Error($message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
}

function Test-CommandExists($command) {
    try {
        Get-Command $command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Wait-ForRoleAssignment($principalId, $scope, $roleName, $maxWaitMinutes = 5) {
    Write-Info "Waiting for role assignment '$roleName' to propagate for principal $principalId..."
    $maxWaitSeconds = $maxWaitMinutes * 60
    $waitSeconds = 0
    $intervalSeconds = 30
    
    do {
        Start-Sleep -Seconds $intervalSeconds
        $waitSeconds += $intervalSeconds
        
        $assignment = az role assignment list --assignee $principalId --scope $scope --role $roleName --query "[0]" -o json 2>$null | ConvertFrom-Json
        if ($assignment) {
            Write-Info "Role assignment propagated successfully"
            return $true
        }
        
        Write-Info "Still waiting... ($waitSeconds/$maxWaitSeconds seconds)"
    } while ($waitSeconds -lt $maxWaitSeconds)
    
    Write-Error "Role assignment did not propagate within $maxWaitMinutes minutes"
    return $false
}

# =============================================================================
# PREREQUISITES CHECK AND VALIDATION
# =============================================================================

Write-Step "Validating Configuration and Prerequisites"

# Validate required secrets are provided
$requiredSecrets = @{
    "AZURE_OPENAI_ENDPOINT" = $AZURE_OPENAI_ENDPOINT
    "AZURE_OPENAI_KEY" = $AZURE_OPENAI_KEY
    "AZURE_SPEECH_KEY" = $AZURE_SPEECH_KEY
    "AZURE_AI_FOUNDRY_PROJECT_ENDPOINT" = $AZURE_AI_FOUNDRY_PROJECT_ENDPOINT
    "AZURE_EVALUATION_AGENT_ID" = $AZURE_EVALUATION_AGENT_ID
}

$hasValidationErrors = $false
foreach ($secret in $requiredSecrets.GetEnumerator()) {
    if ($secret.Value -like "*your-*" -or $secret.Value -like "*placeholder*" -or [string]::IsNullOrWhiteSpace($secret.Value)) {
        Write-Error "Please update the $($secret.Key) variable at the top of the script"
        $hasValidationErrors = $true
    }
}

if ($hasValidationErrors) {
    Write-Error "Configuration validation failed. Please update the required variables at the top of the script and try again."
    exit 1
}

if (-not (Test-CommandExists "az")) {
    Write-Error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in to Azure
$currentAccount = az account show --query "name" -o tsv 2>$null
if (-not $currentAccount) {
    Write-Info "Not logged in to Azure. Please log in..."
    az login
}

Write-Info "Current Azure account: $currentAccount"

# =============================================================================
# AZURE SETUP AND VALIDATION
# =============================================================================

if ($Redeploy) {
    Write-Step "Redeploy Mode - Validating Basic Azure Context"
} else {
    Write-Step "Setting up Azure Context and Validating Existing Resources"
}

# Set subscription
Write-Info "Setting subscription to: $SubscriptionId"
az account set --subscription $SubscriptionId

# Validate resource group exists
Write-Info "Validating resource group: $ResourceGroupName"
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Error "Resource group $ResourceGroupName does not exist"
    exit 1
}

if (-not $Redeploy) {
    # Validate Container Apps Environment exists
    Write-Info "Validating Container Apps Environment: $ContainerAppEnvironmentName"
    $caeExists = az containerapp env show --name $ContainerAppEnvironmentName --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
    if (-not $caeExists) {
        Write-Error "Container Apps Environment $ContainerAppEnvironmentName does not exist in resource group $ResourceGroupName"
        exit 1
    }

    # Validate Storage Account exists
    Write-Info "Validating Storage Account: $StorageAccountName"
    $storageExists = az storage account show --name $StorageAccountName --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
    if (-not $storageExists) {
        Write-Error "Storage Account $StorageAccountName does not exist in resource group $ResourceGroupName"
        exit 1
    }

    # Validate Key Vault exists
    Write-Info "Validating Key Vault: $KeyVaultName"
    $kvExists = az keyvault show --name $KeyVaultName --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
    if (-not $kvExists) {
        Write-Error "Key Vault $KeyVaultName does not exist in resource group $ResourceGroupName"
        exit 1
    }
}

# Validate ACR exists
Write-Info "Validating Azure Container Registry: $AcrName"
$acrExists = az acr show --name $AcrName --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
if (-not $acrExists) {
    Write-Error "Azure Container Registry $AcrName does not exist in resource group $ResourceGroupName"
    exit 1
}

# Get ACR login server
Write-Info "Getting ACR login server"
$ACR_LOGIN_SERVER = az acr show --name $AcrName --resource-group $ResourceGroupName --query "loginServer" -o tsv

if (-not $Redeploy) {
    # Get current user object ID for Key Vault access
    $CURRENT_USER_OBJECT_ID = az ad signed-in-user show --query "id" -o tsv
}

# =============================================================================
# USER-ASSIGNED MANAGED IDENTITY (Skip in Redeploy mode)
# =============================================================================

if (-not $Redeploy) {
    Write-Step "Creating User-Assigned Managed Identity"

    Write-Info "Creating managed identity: $MANAGED_IDENTITY_NAME"
    az identity create --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --location $Location

    Write-Info "Getting managed identity details"
    $MANAGED_IDENTITY_ID = az identity show --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --query "id" -o tsv
    $MANAGED_IDENTITY_CLIENT_ID = az identity show --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --query "clientId" -o tsv
    $MANAGED_IDENTITY_PRINCIPAL_ID = az identity show --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --query "principalId" -o tsv

    Write-Info "Managed Identity ID: $MANAGED_IDENTITY_ID"
    Write-Info "Managed Identity Client ID: $MANAGED_IDENTITY_CLIENT_ID"
    Write-Info "Managed Identity Principal ID: $MANAGED_IDENTITY_PRINCIPAL_ID"

    # =============================================================================
    # ROLE ASSIGNMENTS
    # =============================================================================

    Write-Step "Setting up Role Assignments"

    # Get resource IDs for role assignments
    $ACR_RESOURCE_ID = az acr show --name $AcrName --resource-group $ResourceGroupName --query "id" -o tsv
    $STORAGE_RESOURCE_ID = az storage account show --name $StorageAccountName --resource-group $ResourceGroupName --query "id" -o tsv

    Write-Info "Assigning AcrPull role to managed identity"
    az role assignment create `
        --assignee $MANAGED_IDENTITY_PRINCIPAL_ID `
        --role "AcrPull" `
        --scope $ACR_RESOURCE_ID

    Write-Info "Assigning Storage Blob Data Contributor role to managed identity"
    az role assignment create `
        --assignee $MANAGED_IDENTITY_PRINCIPAL_ID `
        --role "Storage Blob Data Contributor" `
        --scope $STORAGE_RESOURCE_ID

    Write-Info "Assigning Storage Account Contributor role to managed identity"
    az role assignment create `
        --assignee $MANAGED_IDENTITY_PRINCIPAL_ID `
        --role "Storage Account Contributor" `
        --scope $STORAGE_RESOURCE_ID

    # Wait for role assignments to propagate
    Wait-ForRoleAssignment $MANAGED_IDENTITY_PRINCIPAL_ID $ACR_RESOURCE_ID "AcrPull"
    Wait-ForRoleAssignment $MANAGED_IDENTITY_PRINCIPAL_ID $STORAGE_RESOURCE_ID "Storage Blob Data Contributor"

    # =============================================================================
    # KEY VAULT SECRETS SETUP
    # =============================================================================

    Write-Step "Setting up Key Vault Secrets"

    Write-Info "Setting Key Vault access policies for managed identity"
    # Access policy for managed identity
    az keyvault set-policy `
        --name $KeyVaultName `
        --object-id $MANAGED_IDENTITY_PRINCIPAL_ID `
        --secret-permissions get list

    Write-Info "Creating/Updating Key Vault secrets"
    az keyvault secret set --vault-name $KeyVaultName --name "azure-openai-endpoint" --value $AZURE_OPENAI_ENDPOINT
    az keyvault secret set --vault-name $KeyVaultName --name "azure-openai-key" --value $AZURE_OPENAI_KEY
    az keyvault secret set --vault-name $KeyVaultName --name "azure-openai-deployment" --value $AZURE_OPENAI_DEPLOYMENT
    az keyvault secret set --vault-name $KeyVaultName --name "azure-openai-model" --value $AZURE_OPENAI_MODEL
    az keyvault secret set --vault-name $KeyVaultName --name "azure-speech-key" --value $AZURE_SPEECH_KEY
    az keyvault secret set --vault-name $KeyVaultName --name "azure-speech-region" --value $AZURE_SPEECH_REGION
    az keyvault secret set --vault-name $KeyVaultName --name "azure-ai-foundry-project-endpoint" --value $AZURE_AI_FOUNDRY_PROJECT_ENDPOINT
    az keyvault secret set --vault-name $KeyVaultName --name "azure-evaluation-agent-id" --value $AZURE_EVALUATION_AGENT_ID
} else {
    Write-Step "Redeploy Mode - Getting Existing Managed Identity"
    
    Write-Info "Getting existing managed identity details: $MANAGED_IDENTITY_NAME"
    $MANAGED_IDENTITY_ID = az identity show --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --query "id" -o tsv
    $MANAGED_IDENTITY_CLIENT_ID = az identity show --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --query "clientId" -o tsv
    $MANAGED_IDENTITY_PRINCIPAL_ID = az identity show --resource-group $ResourceGroupName --name $MANAGED_IDENTITY_NAME --query "principalId" -o tsv

    if (-not $MANAGED_IDENTITY_ID) {
        Write-Error "Managed identity $MANAGED_IDENTITY_NAME does not exist. Please run without -Redeploy flag first."
        exit 1
    }

    Write-Info "Using existing Managed Identity ID: $MANAGED_IDENTITY_ID"
    Write-Info "Using existing Managed Identity Client ID: $MANAGED_IDENTITY_CLIENT_ID"
}
# =============================================================================
# BUILD AND PUSH DOCKER IMAGES
# =============================================================================

Write-Step "Building and Pushing Docker Images"

# Build client image
Write-Info "Building client image via ACR Build"
az acr build --registry $AcrName --image "${CLIENT_IMAGE_NAME}:${CLIENT_IMAGE_TAG}" --file "client/Dockerfile" .

# Build server image
Write-Info "Building server image via ACR Build"
az acr build --registry $AcrName --image "${SERVER_IMAGE_NAME}:${SERVER_IMAGE_TAG}" --file "server/Dockerfile" .

# =============================================================================
# DELETE EXISTING CONTAINER APPS (Redeploy mode only)
# =============================================================================

if ($Redeploy) {
    Write-Step "Redeploy Mode - Deleting Existing Container Apps"
    
    # Check if client app exists and delete it
    $clientExists = az containerapp show --name $CLIENT_APP_NAME --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
    if ($clientExists) {
        Write-Info "Deleting existing client container app: $CLIENT_APP_NAME"
        az containerapp delete --name $CLIENT_APP_NAME --resource-group $ResourceGroupName --yes
    } else {
        Write-Info "Client container app $CLIENT_APP_NAME does not exist, skipping deletion"
    }
    
    # Check if server app exists and delete it
    $serverExists = az containerapp show --name $SERVER_APP_NAME --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
    if ($serverExists) {
        Write-Info "Deleting existing server container app: $SERVER_APP_NAME"
        az containerapp delete --name $SERVER_APP_NAME --resource-group $ResourceGroupName --yes
    } else {
        Write-Info "Server container app $SERVER_APP_NAME does not exist, skipping deletion"
    }
    
    # Wait a moment for deletions to complete
    Write-Info "Waiting for container app deletions to complete..."
    Start-Sleep -Seconds 30
}

# =============================================================================
# DEPLOY CONTAINER APPS
# =============================================================================

Write-Step "Deploying Container Apps"

# Deploy Client Container App
Write-Info "Deploying Client Container App: $CLIENT_APP_NAME"
az containerapp create `
    --name $CLIENT_APP_NAME `
    --resource-group $ResourceGroupName `
    --environment $ContainerAppEnvironmentName `
    --image "${ACR_LOGIN_SERVER}/${CLIENT_IMAGE_NAME}:${CLIENT_IMAGE_TAG}" `
    --registry-server $ACR_LOGIN_SERVER `
    --registry-identity $MANAGED_IDENTITY_ID `
    --user-assigned $MANAGED_IDENTITY_ID `
    --ingress external `
    --target-port 80 `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --env-vars "PORT=5173" "VITE_API_URL=$VITE_API_URL"

# Deploy Server Container App
Write-Info "Deploying Server Container App: $SERVER_APP_NAME"
az containerapp create `
    --name $SERVER_APP_NAME `
    --resource-group $ResourceGroupName `
    --environment $ContainerAppEnvironmentName `
    --image "${ACR_LOGIN_SERVER}/${SERVER_IMAGE_NAME}:${SERVER_IMAGE_TAG}" `
    --registry-server $ACR_LOGIN_SERVER `
    --registry-identity $MANAGED_IDENTITY_ID `
    --user-assigned $MANAGED_IDENTITY_ID `
    --ingress external `
    --target-port 3000 `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --secrets "azure-openai-endpoint=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-openai-endpoint,identityref:$MANAGED_IDENTITY_ID" `
             "azure-openai-key=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-openai-key,identityref:$MANAGED_IDENTITY_ID" `
             "azure-openai-deployment=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-openai-deployment,identityref:$MANAGED_IDENTITY_ID" `
             "azure-openai-model=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-openai-model,identityref:$MANAGED_IDENTITY_ID" `
             "azure-speech-key=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-speech-key,identityref:$MANAGED_IDENTITY_ID" `
             "azure-speech-region=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-speech-region,identityref:$MANAGED_IDENTITY_ID" `
             "azure-ai-foundry-project-endpoint=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-ai-foundry-project-endpoint,identityref:$MANAGED_IDENTITY_ID" `
             "azure-evaluation-agent-id=keyvaultref:${KeyVaultName}.vault.azure.net/secrets/azure-evaluation-agent-id,identityref:$MANAGED_IDENTITY_ID" `
    --env-vars "PORT=5000" `
               "USE_SEED_DATA_MODE=true" `
               "DATABASE_PATH=/app/voice-ai-documents.db" `
               "MESSAGE_WINDOW_SIZE=20" `
               "NODE_ENV=production" `
               "AUTH_ENABLED=true" `
               "SESSION_SECRET=$SESSION_SECRET" `
               "AUTH_USERS=$AUTH_USERS" `
               "AZURE_STORAGE_ACCOUNT_NAME=$StorageAccountName" `
               "CONTAINER_APP_NAME=$SERVER_APP_NAME" `
               "AZURE_CLIENT_ID=$MANAGED_IDENTITY_CLIENT_ID" `
               "SKIP_RESTORE=false" `
               "AZURE_OPENAI_ENDPOINT=secretref:azure-openai-endpoint" `
               "AZURE_OPENAI_KEY=secretref:azure-openai-key" `
               "AZURE_OPENAI_DEPLOYMENT=secretref:azure-openai-deployment" `
               "AZURE_OPENAI_MODEL=secretref:azure-openai-model" `
               "AZURE_SPEECH_KEY=secretref:azure-speech-key" `
               "AZURE_SPEECH_REGION=secretref:azure-speech-region" `
               "AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=secretref:azure-ai-foundry-project-endpoint" `
               "AZURE_EVALUATION_AGENT_ID=secretref:azure-evaluation-agent-id"

# Get server URL to update client
$SERVER_URL = az containerapp show --name $SERVER_APP_NAME --resource-group $ResourceGroupName --query "properties.configuration.ingress.fqdn" -o tsv

# Update VITE_API_URL with actual server URL after deployment
Write-Info "Updating client app with correct API URL"
$VITE_API_URL = "https://$SERVER_URL"
az containerapp update `
    --name $CLIENT_APP_NAME `
    --resource-group $ResourceGroupName `
    --set-env-vars "VITE_API_URL=$VITE_API_URL"
# =============================================================================
# RETRIEVE DEPLOYMENT INFORMATION
# =============================================================================

Write-Step "Deployment Complete - Retrieving Information"

# Get Container App URLs
$CLIENT_URL = az containerapp show --name $CLIENT_APP_NAME --resource-group $ResourceGroupName --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "`n==============================================================================" -ForegroundColor Green
if ($Redeploy) {
    Write-Host "REDEPLOY COMPLETED SUCCESSFULLY" -ForegroundColor Green
} else {
    Write-Host "DEPLOYMENT COMPLETED SUCCESSFULLY" -ForegroundColor Green
}
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "Environment: $EnvironmentName" -ForegroundColor Yellow
Write-Host ""
if ($Redeploy) {
    Write-Host "Redeploy Mode - Updated Resources:" -ForegroundColor Yellow
    Write-Host "  Client Container App: $CLIENT_APP_NAME (rebuilt and redeployed)" -ForegroundColor White
    Write-Host "  Server Container App: $SERVER_APP_NAME (rebuilt and redeployed)" -ForegroundColor White
    Write-Host "  Docker Images: ${CLIENT_IMAGE_NAME}:${CLIENT_IMAGE_TAG}, ${SERVER_IMAGE_NAME}:${SERVER_IMAGE_TAG}" -ForegroundColor White
    Write-Host ""
    Write-Host "Existing Resources Used:" -ForegroundColor Yellow
    Write-Host "  Container Registry: $AcrName" -ForegroundColor White
    Write-Host "  Managed Identity: $MANAGED_IDENTITY_NAME" -ForegroundColor White
    Write-Host "  Container Apps Environment: $ContainerAppEnvironmentName" -ForegroundColor White
} else {
    Write-Host "Existing Resources Used:" -ForegroundColor Yellow
    Write-Host "  Container Registry: $AcrName" -ForegroundColor White
    Write-Host "  Storage Account: $StorageAccountName" -ForegroundColor White
    Write-Host "  Key Vault: $KeyVaultName" -ForegroundColor White
    Write-Host "  Container Apps Environment: $ContainerAppEnvironmentName" -ForegroundColor White
    Write-Host ""
    Write-Host "Created Resources:" -ForegroundColor Yellow
    Write-Host "  Managed Identity: $MANAGED_IDENTITY_NAME" -ForegroundColor White
    Write-Host "  Client Container App: $CLIENT_APP_NAME" -ForegroundColor White
    Write-Host "  Server Container App: $SERVER_APP_NAME" -ForegroundColor White
}
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  Client:  https://$CLIENT_URL" -ForegroundColor White
Write-Host "  Server:  https://$SERVER_URL" -ForegroundColor White
Write-Host ""
Write-Host "Authentication:" -ForegroundColor Cyan
Write-Host "  Username: demo" -ForegroundColor White
Write-Host "  Password: demo123" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test the application at: https://$CLIENT_URL" -ForegroundColor White
Write-Host "2. Login with username: demo, password: demo123" -ForegroundColor White
Write-Host "3. Monitor logs using Azure Portal or CLI" -ForegroundColor White
Write-Host ""
Write-Host "To view application logs, run:" -ForegroundColor Cyan
Write-Host "az containerapp logs show --name $CLIENT_APP_NAME --resource-group $ResourceGroupName --follow" -ForegroundColor White
Write-Host "az containerapp logs show --name $SERVER_APP_NAME --resource-group $ResourceGroupName --follow" -ForegroundColor White
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
