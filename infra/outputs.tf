# Output resource IDs and connection info for use in CI/CD or manual deployment
output "container_registry_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}

output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.log.id
}

output "application_insights_instrumentation_key" {
  value     = azurerm_application_insights.ai.instrumentation_key
  sensitive = true
}

output "container_app_environment_id" {
  value = azurerm_container_app_environment.cae.id
}

# Storage Account outputs for database persistence
output "storage_account_name" {
  value       = azurerm_storage_account.voice_ai_storage.name
  description = "Name of the storage account used for database persistence"
}

output "storage_account_primary_connection_string" {
  value       = azurerm_storage_account.voice_ai_storage.primary_connection_string
  sensitive   = true
  description = "Primary connection string for the storage account"
}

output "database_file_share_name" {
  value       = azurerm_storage_share.database_share.name
  description = "Name of the Azure File Share used for SQLite database storage"
}

output "database_file_share_url" {
  value       = azurerm_storage_share.database_share.url
  description = "URL of the Azure File Share used for SQLite database storage"
}

# Container App URLs
output "server_container_app_url" {
  value       = "https://${azurerm_container_app.server.latest_revision_fqdn}"
  description = "URL of the server container app"
}

output "client_container_app_url" {
  value       = "https://${azurerm_container_app.client.latest_revision_fqdn}"
  description = "URL of the client container app"
}
