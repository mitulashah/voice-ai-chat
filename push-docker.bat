@echo off
REM Build and push client and server images to Azure Container Registry using Terraform output

REM Get ACR login server from Terraform output
for /f "delims=" %%i in ('terraform -chdir=infra output -raw container_registry_login_server') do set ACR_LOGIN_SERVER=%%i

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
az acr login --name %ACR_LOGIN_SERVER:~0,12%

REM Push images

docker push %CLIENT_IMAGE%
docker push %SERVER_IMAGE%

echo Docker images built and pushed to %ACR_LOGIN_SERVER%.
