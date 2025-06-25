# Deploys the voice-ai-chat app to Azure App Service using Docker containers (Node.js static client)
# This script is a variant of deploy-azure-containers.ps1, but uses the Node.js/serve version of the client container.

# Requires: Azure CLI, Docker, and permissions to manage Azure resources

param(
    [string]$ResourceGroupName = "voice-ai-rg",
    [string]$AcrName = "voiceaiacr",
    [string]$Location = "eastus",
    [string]$AppServicePlan = "voice-ai-plan",
    [string]$ClientAppName = "voice-ai-client",
    [string]$ServerAppName = "voice-ai-server",
    [string]$KeyVaultName = "voice-ai-kv"
)

# Login to Azure
az account show > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az login
}

# Create resource group if it doesn't exist
az group show --name $ResourceGroupName > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az group create --name $ResourceGroupName --location $Location
}

# Create ACR if it doesn't exist
az acr show --name $AcrName --resource-group $ResourceGroupName > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az acr create --name $AcrName --resource-group $ResourceGroupName --sku Basic --location $Location
}

# Enable ACR admin user (for credential retrieval)
az acr update --name $AcrName --admin-enabled true

# Get ACR credentials
$acrCreds = az acr credential show --name $AcrName | ConvertFrom-Json
$acrServer = az acr show --name $AcrName --query "loginServer" -o tsv
$acrUser = $acrCreds.username
$acrPass = $acrCreds.passwords[0].value

# Build and push server image
Write-Host "Building server image..."
docker build -f server/Dockerfile -t $acrServer/voice-ai-server:latest ./server
Write-Host "Pushing server image..."
docker login $acrServer -u $acrUser -p $acrPass
docker push $acrServer/voice-ai-server:latest

# Build and push client image (Node.js static version)
Write-Host "Building client image (Node.js static)..."
docker build -f client/Dockerfile.node -t $acrServer/voice-ai-client:latest ./client
Write-Host "Pushing client image..."
docker push $acrServer/voice-ai-client:latest

# Create App Service plan if it doesn't exist
az appservice plan show --name $AppServicePlan --resource-group $ResourceGroupName > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az appservice plan create --name $AppServicePlan --resource-group $ResourceGroupName --is-linux --sku B1
}

# Create server web app if it doesn't exist
az webapp show --name $ServerAppName --resource-group $ResourceGroupName > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az webapp create --name $ServerAppName --resource-group $ResourceGroupName --plan $AppServicePlan --deployment-container-image-name $acrServer/voice-ai-server:latest
}

# Create client web app if it doesn't exist
az webapp show --name $ClientAppName --resource-group $ResourceGroupName > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az webapp create --name $ClientAppName --resource-group $ResourceGroupName --plan $AppServicePlan --deployment-container-image-name $acrServer/voice-ai-client:latest
}

# Configure web apps to use ACR
az webapp config container set --name $ServerAppName --resource-group $ResourceGroupName --docker-custom-image-name $acrServer/voice-ai-server:latest --docker-registry-server-url https://$acrServer --docker-registry-server-user $acrUser --docker-registry-server-password $acrPass
az webapp config container set --name $ClientAppName --resource-group $ResourceGroupName --docker-custom-image-name $acrServer/voice-ai-client:latest --docker-registry-server-url https://$acrServer --docker-registry-server-user $acrUser --docker-registry-server-password $acrPass

# Assign managed identity to web apps
az webapp identity assign --name $ServerAppName --resource-group $ResourceGroupName
az webapp identity assign --name $ClientAppName --resource-group $ResourceGroupName

# Assign Key Vault and Storage roles (RBAC)
# (Add your role assignment logic here as needed)

# Set app settings for server and client
az webapp config appsettings set --name $ServerAppName --resource-group $ResourceGroupName --settings "NODE_ENV=production"
az webapp config appsettings set --name $ClientAppName --resource-group $ResourceGroupName --settings "NODE_ENV=production"

Write-Host "Deployment complete."
