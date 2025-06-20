# Static Web App Module for React Frontend

resource "azurerm_static_web_app" "main" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier
  tags                = var.tags

  # Identity is only supported on Standard tier and above
  dynamic "identity" {
    for_each = var.sku_tier != "Free" ? [1] : []
    content {
      type = "SystemAssigned"
    }
  }
}

# Configure custom domains for the Static Web App
resource "azurerm_static_web_app_custom_domain" "main" {
  count             = length(var.custom_domains)
  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = var.custom_domains[count.index]
  validation_type   = "cname-delegation"
}
