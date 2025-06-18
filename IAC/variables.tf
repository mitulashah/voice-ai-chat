# Variables for Voice AI Chat Application Infrastructure

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "voice-ai-chat"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "East US"
}

variable "static_web_app_location" {
  description = "Azure region for Static Web App (limited regions available)"
  type        = string
  default     = "East US 2"
}

variable "cognitive_services_sku" {
  description = "SKU for Cognitive Services"
  type        = string
  default     = "S0"
}

variable "database_sku" {
  description = "SKU for Azure SQL Database"
  type        = string
  default     = "Basic"
}

variable "app_service_sku" {
  description = "SKU for App Service Plan"
  type        = string
  default     = "B1"
}

variable "static_web_app_sku" {
  description = "SKU for Static Web App"
  type        = string
  default     = "Free"
}

variable "sql_admin_login" {
  description = "Admin login for SQL Server"
  type        = string
  default     = "sqladmin"
}

variable "sql_admin_password" {
  description = "Admin password for SQL Server"
  type        = string
  sensitive   = true
}
