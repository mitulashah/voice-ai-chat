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
