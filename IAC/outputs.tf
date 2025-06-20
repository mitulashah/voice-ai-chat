# =============================================================================
# Voice AI Chat Application Infrastructure Outputs
# =============================================================================

locals {
  # Common computed values to avoid repetition
  app_service_url = "https://${module.app_service.default_site_hostname}"
  static_web_app_url = "https://${module.static_web_app.default_host_name}"
  speech_key = module.cognitive_services.primary_access_key
  speech_region = var.location
}

# =============================================================================
# Core Infrastructure Outputs
# =============================================================================

output "infrastructure" {
  description = "Core infrastructure information"
  value = {
    resource_group_name = module.resource_group.name
    location           = var.location
    environment        = var.environment
    project_name       = var.project_name
  }
}

# =============================================================================
# Service Endpoints and URLs
# =============================================================================

output "service_urls" {
  description = "Public URLs for all deployed services"
  value = {
    backend_api      = local.app_service_url
    frontend_app     = local.static_web_app_url
    health_check     = "${local.app_service_url}/api/health"
    speech_endpoint  = module.cognitive_services.endpoint
    database_server  = module.database.server_fqdn
  }
}

# =============================================================================
# Application Configuration (Environment Variables)
# =============================================================================

output "backend_config" {
  description = "Complete backend application configuration"
  value = {
    # Runtime Configuration
    NODE_ENV = var.environment
    PORT     = "5000"
    WEBSITE_NODE_DEFAULT_VERSION = "~18"
    
    # Azure Speech Services
    AZURE_SPEECH_KEY            = local.speech_key
    AZURE_SPEECH_REGION         = local.speech_region
    COGNITIVE_SERVICES_KEY      = local.speech_key
    COGNITIVE_SERVICES_REGION   = local.speech_region
    
    # Database
    DATABASE_CONNECTION_STRING = module.database.connection_string
  }
  sensitive = true
}

output "frontend_config" {
  description = "Complete frontend application configuration"
  value = {
    REACT_APP_API_URL = local.app_service_url
  }
}

# =============================================================================
# Azure Resource Information
# =============================================================================

output "azure_resources" {
  description = "Azure resource details for management and monitoring"
  value = {
    # Resource Names
    names = {
      resource_group     = module.resource_group.name
      cognitive_services = module.cognitive_services.name
      sql_server        = module.database.server_name
      sql_database      = module.database.database_name
      app_service       = module.app_service.name
      static_web_app    = module.static_web_app.name
    }
    
    # Resource IDs
    ids = {
      cognitive_services = module.cognitive_services.id
      database          = module.database.database_id
      app_service       = module.app_service.id
      static_web_app    = module.static_web_app.id
    }
    
    # Database Details
    database = {
      server_name = module.database.server_name
      server_fqdn = module.database.server_fqdn
      database_name = module.database.database_name
    }
  }
}

# =============================================================================
# Deployment Information
# =============================================================================

output "deployment_info" {
  description = "Information needed for application deployment"
  value = {
    # Static Web App deployment
    static_web_app_token = module.static_web_app.api_key
    
    # Service hostnames
    app_service_hostname = module.app_service.default_site_hostname
    static_web_app_hostname = module.static_web_app.default_host_name
    
    # Portal links
    azure_portal_urls = {
      resource_group = "https://portal.azure.com/#@/resource/subscriptions/${data.azurerm_client_config.current.subscription_id}/resourceGroups/${module.resource_group.name}"
      app_service = "https://portal.azure.com/#@/resource${module.app_service.id}"
      static_web_app = "https://portal.azure.com/#@/resource${module.static_web_app.id}"
    }
  }
  sensitive = true
}

# =============================================================================
# Legacy Outputs (for backward compatibility)
# =============================================================================

# Individual outputs for scripts that expect specific output names
output "cognitive_services_key" {
  description = "Primary access key for Cognitive Services (legacy)"
  value       = local.speech_key
  sensitive   = true
}

output "database_connection_string" {
  description = "Database connection string (legacy)"
  value       = module.database.connection_string
  sensitive   = true
}

output "app_service_url" {
  description = "URL of the App Service (legacy)"
  value       = local.app_service_url
}

output "static_web_app_url" {
  description = "URL of the Static Web App (legacy)"
  value       = local.static_web_app_url
}

output "deployment_token" {
  description = "Deployment token for Static Web App (legacy)"
  value       = module.static_web_app.api_key
  sensitive   = true
}

# =============================================================================
# Data Sources
# =============================================================================

data "azurerm_client_config" "current" {}
