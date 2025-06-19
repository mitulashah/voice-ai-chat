# PowerShell script to build and push client and server images to Azure Container Registry using Terraform output

# Stop on error
$ErrorActionPreference = 'Stop'

Write-Host "Retrieving ACR login server from Terraform output..."
$acrLoginServer = terraform -chdir=infra output -raw container_registry_login_server
if (-not $acrLoginServer) {
    Write-Error "Failed to get ACR login server from Terraform output."
    exit 1
}
Write-Host "ACR_LOGIN_SERVER is [$acrLoginServer]"

# Extract ACR registry name (before first dot)
$acrName = $acrLoginServer.Split('.')[0]
Write-Host "ACR_NAME is [$acrName]"

# Set image tags
$clientImage = "$acrLoginServer/client:latest"
$serverImage = "$acrLoginServer/server:latest"

# Build client image
Write-Host "Building client image..."
Push-Location client
npm install
npm run build
docker build -t $clientImage .
Pop-Location

# Build server image
Write-Host "Building server image..."
Push-Location server
npm install
npm run build
docker build -t $serverImage .
Pop-Location

# Login to ACR
Write-Host "Logging in to ACR..."
az acr login --name $acrName

# Push images
Write-Host "Pushing client image..."
docker push $clientImage
Write-Host "Pushing server image..."
docker push $serverImage

Write-Host "Docker images built and pushed to $acrLoginServer."
