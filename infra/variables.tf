variable "resource_group_name" {
  description = "Name of the resource group."
  type        = string
}

variable "location" {
  description = "Azure region for resources."
  type        = string
  default     = "eastus"
}

variable "environment_name" {
  description = "Deployment environment name (e.g., dev, prod)."
  type        = string
}

variable "azure_openai_endpoint" {
  description = "Azure OpenAI endpoint URL."
  type        = string
}

variable "azure_openai_key" {
  description = "Azure OpenAI API key."
  type        = string
  sensitive   = true
}

variable "azure_openai_deployment" {
  description = "Azure OpenAI deployment name."
  type        = string
}

variable "azure_openai_model" {
  description = "Azure OpenAI model name."
  type        = string
}

variable "azure_speech_key" {
  description = "Azure Speech API key."
  type        = string
  sensitive   = true
}

variable "azure_speech_region" {
  description = "Azure Speech region."
  type        = string
}

variable "azure_ai_foundry_project_endpoint" {
  description = "Azure AI Foundry project endpoint."
  type        = string
}

variable "azure_evaluation_agent_id" {
  description = "Azure Evaluation Agent ID."
  type        = string
}

variable "subscription_id" {
  description = "Azure Subscription ID."
  type        = string
}
