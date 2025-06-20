variable "name" {
  description = "Name of the Static Web App"
  type        = string
}

variable "location" {
  description = "Azure region where the Static Web App will be created"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "sku_tier" {
  description = "SKU tier for the Static Web App"
  type        = string
  default     = "Free"
}

variable "app_settings" {
  description = "Application settings for the Static Web App"
  type        = map(string)
  default     = {}
}

variable "custom_domains" {
  description = "List of custom domains for the Static Web App"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to be applied to the Static Web App"
  type        = map(string)
  default     = {}
}
