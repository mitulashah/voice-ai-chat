output "id" {
  description = "ID of the Static Web App"
  value       = azurerm_static_web_app.main.id
}

output "name" {
  description = "Name of the Static Web App"
  value       = azurerm_static_web_app.main.name
}

output "default_host_name" {
  description = "Default hostname of the Static Web App"
  value       = azurerm_static_web_app.main.default_host_name
}

output "api_key" {
  description = "API key for deploying to the Static Web App"
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}

output "identity_principal_id" {
  description = "Principal ID of the system-assigned managed identity (only available for non-Free tiers)"
  value       = length(azurerm_static_web_app.main.identity) > 0 ? azurerm_static_web_app.main.identity[0].principal_id : null
}
