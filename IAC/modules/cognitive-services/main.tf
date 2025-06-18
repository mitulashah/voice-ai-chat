# Cognitive Services Module for Azure Speech Services

resource "azurerm_cognitive_account" "main" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "SpeechServices"
  sku_name            = var.sku_name
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }
}
