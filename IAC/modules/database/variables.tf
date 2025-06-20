variable "server_name" {
  description = "Name of the SQL Server"
  type        = string
}

variable "database_name" {
  description = "Name of the SQL Database"
  type        = string
}

variable "location" {
  description = "Azure region where the database will be created"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "admin_login" {
  description = "Administrator login for the SQL Server"
  type        = string
}

variable "admin_password" {
  description = "Administrator password for the SQL Server"
  type        = string
  sensitive   = true
}

variable "sku_name" {
  description = "SKU name for the SQL Database"
  type        = string
  default     = "Basic"
}

variable "tags" {
  description = "Tags to be applied to the database resources"
  type        = map(string)
  default     = {}
}
