output "id" {
  description = "ID of the Cognitive Services account"
  value       = azurerm_cognitive_account.main.id
}

output "name" {
  description = "Name of the Cognitive Services account"
  value       = azurerm_cognitive_account.main.name
}

output "endpoint" {
  description = "Endpoint URL of the Cognitive Services account"
  value       = azurerm_cognitive_account.main.endpoint
}

output "primary_access_key" {
  description = "Primary access key for the Cognitive Services account"
  value       = azurerm_cognitive_account.main.primary_access_key
  sensitive   = true
}

output "secondary_access_key" {
  description = "Secondary access key for the Cognitive Services account"
  value       = azurerm_cognitive_account.main.secondary_access_key
  sensitive   = true
}
