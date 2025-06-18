# Removed duplicate terraform, provider, data, and variable blocks. See versions.tf, provider.tf, and variables.tf for these definitions.

# Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "${var.environment_name}acr"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Standard"
  admin_enabled       = false
}

# Key Vault
resource "azurerm_key_vault" "kv" {
  name                        = "${var.environment_name}kv"
  location                    = var.location
  resource_group_name         = var.resource_group_name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  purge_protection_enabled    = true
  enable_rbac_authorization   = true
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "log" {
  name                = "${var.environment_name}log"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Application Insights
resource "azurerm_application_insights" "ai" {
  name                = "${var.environment_name}ai"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.log.id
  application_type    = "web"
}

# Container Apps Environment
resource "azurerm_container_app_environment" "cae" {
  name                       = "${var.environment_name}cae"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log.id
}

# Client Container App
resource "azurerm_container_app" "client" {
  name                         = "${var.environment_name}-client"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    container {
      name   = "client"
      image  = "<client-image>" # Replace with actual image reference
      cpu    = 0.5
      memory = "1.0Gi"
      env {
        name  = "PORT"
        value = "5173"
      }
    }
    min_replicas = 1
    max_replicas = 2
  }
  ingress {
    external_enabled = true
    target_port      = 5173
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# Server Container App
resource "azurerm_container_app" "server" {
  name                         = "${var.environment_name}-server"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  secret {
    name  = "azure-openai-endpoint"
    value = azurerm_key_vault_secret.azure_openai_endpoint.value
  }
  secret {
    name  = "azure-openai-key"
    value = azurerm_key_vault_secret.azure_openai_key.value
  }
  secret {
    name  = "azure-openai-deployment"
    value = azurerm_key_vault_secret.azure_openai_deployment.value
  }
  secret {
    name  = "azure-openai-model"
    value = azurerm_key_vault_secret.azure_openai_model.value
  }
  secret {
    name  = "azure-speech-key"
    value = azurerm_key_vault_secret.azure_speech_key.value
  }
  secret {
    name  = "azure-speech-region"
    value = azurerm_key_vault_secret.azure_speech_region.value
  }
  secret {
    name  = "azure-ai-foundry-project-endpoint"
    value = azurerm_key_vault_secret.azure_ai_foundry_project_endpoint.value
  }
  secret {
    name  = "azure-evaluation-agent-id"
    value = azurerm_key_vault_secret.azure_evaluation_agent_id.value
  }
  template {
    container {
      name   = "server"
      image  = "<server-image>" # Replace with actual image reference
      cpu    = 0.5
      memory = "1.0Gi"
      env {
        name       = "PORT"
        value      = "3000"
      }
      env {
        name       = "AZURE_OPENAI_ENDPOINT"
        secret_name = "azure-openai-endpoint"
      }
      env {
        name       = "AZURE_OPENAI_KEY"
        secret_name = "azure-openai-key"
      }
      env {
        name       = "AZURE_OPENAI_DEPLOYMENT"
        secret_name = "azure-openai-deployment"
      }
      env {
        name       = "AZURE_OPENAI_MODEL"
        secret_name = "azure-openai-model"
      }
      env {
        name       = "AZURE_SPEECH_KEY"
        secret_name = "azure-speech-key"
      }
      env {
        name       = "AZURE_SPEECH_REGION"
        secret_name = "azure-speech-region"
      }
      env {
        name       = "AZURE_AI_FOUNDRY_PROJECT_ENDPOINT"
        secret_name = "azure-ai-foundry-project-endpoint"
      }
      env {
        name       = "AZURE_EVALUATION_AGENT_ID"
        secret_name = "azure-evaluation-agent-id"
      }
      env {
        name       = "MESSAGE_WINDOW_SIZE"
        value      = "20"
      }
    }
    min_replicas = 1
    max_replicas = 2
  }
}

# Key Vault Secrets (names must be lowercase, alphanumeric, and dashes only)
resource "azurerm_key_vault_secret" "azure_openai_endpoint" {
  name         = "azure-openai-endpoint"
  value        = var.azure_openai_endpoint
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_openai_key" {
  name         = "azure-openai-key"
  value        = var.azure_openai_key
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_openai_deployment" {
  name         = "azure-openai-deployment"
  value        = var.azure_openai_deployment
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_openai_model" {
  name         = "azure-openai-model"
  value        = var.azure_openai_model
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_speech_key" {
  name         = "azure-speech-key"
  value        = var.azure_speech_key
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_speech_region" {
  name         = "azure-speech-region"
  value        = var.azure_speech_region
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_ai_foundry_project_endpoint" {
  name         = "azure-ai-foundry-project-endpoint"
  value        = var.azure_ai_foundry_project_endpoint
  key_vault_id = azurerm_key_vault.kv.id
}
resource "azurerm_key_vault_secret" "azure_evaluation_agent_id" {
  name         = "azure-evaluation-agent-id"
  value        = var.azure_evaluation_agent_id
  key_vault_id = azurerm_key_vault.kv.id
}
