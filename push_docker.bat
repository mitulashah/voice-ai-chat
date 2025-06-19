@echo off
REM Build and push client and server images to Azure Container Registry using Terraform output

REM Get ACR login server from Terraform output and write to temp file
terraform -chdir=infra output -raw container_registry_login_server > acr_login_server.txt

REM Read the value from the file
set /p ACR_LOGIN_SERVER=<acr_login_server.txt

REM Clean up temp file
del acr_login_server.txt

REM Print the value for debugging
echo ACR_LOGIN_SERVER is [%ACR_LOGIN_SERVER%]

REM Check if ACR_LOGIN_SERVER is set
if "%ACR_LOGIN_SERVER%"=="" (
  echo Failed to get ACR login server from Terraform output.
  exit /b 1
)

REM Extract ACR registry name (before first dot)
for /f "tokens=1 delims=." %%a in ("%ACR_LOGIN_SERVER%") do set ACR_NAME=%%a

REM Print the registry name for debugging
echo ACR_NAME is [%ACR_NAME%]

REM Set image tags (edit as needed)
set CLIENT_IMAGE=%ACR_LOGIN_SERVER%/client:latest
set SERVER_IMAGE=%ACR_LOGIN_SERVER%/server:latest

REM Build images
cd client
call npm install
call npm run build
docker build -t %CLIENT_IMAGE% .
cd ..
cd server
call npm install
call npm run build
docker build -t %SERVER_IMAGE% .
cd ..

REM Login to ACR
az acr login --name %ACR_NAME%

REM Push images
docker push %CLIENT_IMAGE%
docker push %SERVER_IMAGE%

echo Docker images built and pushed to %ACR_LOGIN_SERVER%.
