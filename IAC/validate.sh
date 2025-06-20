#!/bin/bash
# Simple validation script for Unix/Linux environments

echo "🔍 Voice AI Chat Infrastructure Validation"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found"
    exit 1
fi

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found"
    exit 1
fi

# Initialize and validate
echo "🔧 Initializing Terraform..."
terraform init

echo "✅ Validating configuration..."
terraform validate

echo "📋 Running plan with local variables..."
terraform plan -var-file="local.tfvars"

echo "✅ Validation completed!"
