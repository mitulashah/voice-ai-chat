# Main Terraform configuration for Voice AI Chat Application
terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

# Generate a random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Local values for common configurations
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  resource_suffix = "${var.environment}-${random_string.suffix.result}"
}

# Resource Group Module
module "resource_group" {
  source = "./modules/resource-group"

  name     = "${var.project_name}-rg-${local.resource_suffix}"
  location = var.location
  tags     = local.common_tags
}

# Cognitive Services Module (for Azure Speech Services)
module "cognitive_services" {
  source = "./modules/cognitive-services"

  name                = "${var.project_name}-cognitive-${local.resource_suffix}"
  location            = var.location
  resource_group_name = module.resource_group.name
  sku_name            = var.cognitive_services_sku
  tags                = local.common_tags
}

# Database Module (Azure SQL Database)
module "database" {
  source = "./modules/database"

  server_name         = "${var.project_name}-sql-${local.resource_suffix}"
  database_name       = "${var.project_name}-db"
  location            = var.location
  resource_group_name = module.resource_group.name
  admin_login         = var.sql_admin_login
  admin_password      = var.sql_admin_password
  sku_name            = var.database_sku
  tags                = local.common_tags
}

# App Service Module (for Node.js backend)
module "app_service" {
  source = "./modules/app-service"

  app_name            = "${var.project_name}-api-${local.resource_suffix}"
  location            = var.location
  resource_group_name = module.resource_group.name
  sku_size            = var.app_service_sku
  tags                = local.common_tags

  app_settings = {
    "NODE_ENV"                     = var.environment
    "COGNITIVE_SERVICES_KEY"       = module.cognitive_services.primary_access_key
    "COGNITIVE_SERVICES_REGION"    = var.location
    "DATABASE_CONNECTION_STRING"   = module.database.connection_string
    "WEBSITE_NODE_DEFAULT_VERSION" = "~18"
  }

  depends_on = [
    module.cognitive_services,
    module.database
  ]
}

# Static Web App Module (for React frontend)
module "static_web_app" {
  source = "./modules/static-web-app"

  name                = "${var.project_name}-swa-${local.resource_suffix}"
  location            = var.static_web_app_location
  resource_group_name = module.resource_group.name
  sku_tier            = var.static_web_app_sku
  tags                = local.common_tags

  app_settings = {
    "REACT_APP_API_URL" = "https://${module.app_service.default_site_hostname}"
  }

  depends_on = [module.app_service]
}
