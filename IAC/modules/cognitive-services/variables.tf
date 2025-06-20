variable "name" {
  description = "Name of the Cognitive Services account"
  type        = string
}

variable "location" {
  description = "Azure region where the Cognitive Services account will be created"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "sku_name" {
  description = "SKU name for the Cognitive Services account"
  type        = string
  default     = "S0"
}

variable "tags" {
  description = "Tags to be applied to the Cognitive Services account"
  type        = map(string)
  default     = {}
}
