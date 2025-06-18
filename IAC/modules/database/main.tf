# Database Module for Azure SQL Database

resource "azurerm_mssql_server" "main" {
  name                         = var.server_name
  location                     = var.location
  resource_group_name          = var.resource_group_name
  version                      = "12.0"
  administrator_login          = var.admin_login
  administrator_login_password = var.admin_password
  tags                         = var.tags

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_mssql_database" "main" {
  name         = var.database_name
  server_id    = azurerm_mssql_server.main.id
  collation    = "SQL_Latin1_General_CP1_CI_AS"
  license_type = "LicenseIncluded"
  sku_name     = var.sku_name
  tags         = var.tags
  # Auto-pause configuration for serverless tier
  auto_pause_delay_in_minutes = var.sku_name == "GP_S_Gen5_1" ? 60 : null
  min_capacity                = var.sku_name == "GP_S_Gen5_1" ? 0.5 : null
  max_size_gb                 = var.sku_name == "Basic" ? 2 : 32
}

# Firewall rule to allow Azure services
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
