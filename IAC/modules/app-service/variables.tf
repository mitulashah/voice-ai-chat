variable "app_name" {
  description = "Name of the App Service"
  type        = string
}

variable "location" {
  description = "Azure region where the App Service will be created"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "sku_size" {
  description = "SKU size for the App Service Plan"
  type        = string
  default     = "B1"
}

variable "app_settings" {
  description = "Application settings for the App Service"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to be applied to the App Service resources"
  type        = map(string)
  default     = {}
}
