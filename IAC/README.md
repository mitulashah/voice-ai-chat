# Voice AI Chat Infrastructure as Code

This directory contains Terraform configurations to deploy the Voice AI Chat application infrastructure on Microsoft Azure.

## Architecture Overview

The infrastructure includes:
- **Azure Resource Group**: Container for all resources
- **Azure Cognitive Services**: Speech Services for voice recognition and synthesis
- **Azure SQL Database**: Data storage for chat history and application data
- **Azure App Service**: Hosting for the Node.js backend API
- **Azure Static Web Apps**: Hosting for the React frontend

## Prerequisites

1. **Install Terraform**: 
   ```powershell
   winget install HashiCorp.Terraform
   ```

2. **Install Azure CLI**:
   ```powershell
   winget install Microsoft.AzureCLI
   ```

3. **Authenticate with Azure**:
   ```powershell
   az login
   az account set --subscription "your-subscription-id"
   ```

## Directory Structure

```
IAC/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf             # Output definitions
├── environments/          # Environment-specific configurations
│   ├── dev/
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── terraform.tfvars
│   └── prod/
│       └── terraform.tfvars
└── modules/               # Reusable Terraform modules
    ├── resource-group/
    ├── cognitive-services/
    ├── database/
    ├── app-service/
    └── static-web-app/
```

## Deployment Instructions

### Development Environment

1. **Navigate to the IAC directory**:
   ```powershell
   cd f:\Git\voice-ai-chat\IAC
   ```

2. **Initialize Terraform**:
   ```powershell
   terraform init
   ```

3. **Validate the configuration**:
   ```powershell
   terraform validate
   ```

4. **Plan the deployment** (using dev environment variables):
   ```powershell
   terraform plan -var-file="environments/dev/terraform.tfvars"
   ```

5. **Apply the configuration**:
   ```powershell
   terraform apply -var-file="environments/dev/terraform.tfvars" -auto-approve
   ```

### Staging Environment

```powershell
terraform plan -var-file="environments/staging/terraform.tfvars"
terraform apply -var-file="environments/staging/terraform.tfvars" -auto-approve
```

### Production Environment

```powershell
# Set password as environment variable for security
$env:TF_VAR_sql_admin_password = "YourSecurePassword123!"
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply -var-file="environments/prod/terraform.tfvars" -auto-approve
```

## Important Security Notes

1. **Database Passwords**: Never commit real passwords to version control. Use:
   - Environment variables: `$env:TF_VAR_sql_admin_password = "password"`
   - Azure Key Vault integration
   - Terraform Cloud variables

2. **Sensitive Outputs**: Some outputs are marked as sensitive and won't be displayed in logs.

3. **State File Security**: Consider using remote state storage (Azure Storage Account with encryption).

## Post-Deployment Configuration

After successful deployment, you'll receive output values including:
- **App Service URL**: For backend API deployment
- **Static Web App Deployment Token**: For frontend deployment
- **Cognitive Services Key**: For speech service integration
- **Database Connection String**: For application configuration

### Configure Your Applications

1. **Update Backend Environment Variables** in your App Service:
   - `COGNITIVE_SERVICES_KEY`
   - `COGNITIVE_SERVICES_REGION`
   - `DATABASE_CONNECTION_STRING`

2. **Update Frontend Environment Variables**:
   - `REACT_APP_API_URL`

## Resource Management

### View Current Resources
```powershell
terraform show
```

### Destroy Infrastructure
```powershell
terraform destroy -var-file="environments/dev/terraform.tfvars"
```

### Update Infrastructure
```powershell
terraform plan -var-file="environments/dev/terraform.tfvars"
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## Troubleshooting

### Common Issues

1. **Resource Name Conflicts**: Resource names must be globally unique. The configuration uses random suffixes to avoid conflicts.

2. **Quota Limitations**: Ensure your Azure subscription has sufficient quota for the requested resources.

3. **Region Availability**: Some services may not be available in all regions. Adjust the `location` variable as needed.

### Getting Help

- Check the [Terraform Azure Provider Documentation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- Review Azure service-specific documentation
- Use `terraform plan` to preview changes before applying

## Cost Optimization

- **Development**: Uses free tiers where possible (F0 Cognitive Services, F1 App Service)
- **Staging**: Balanced performance and cost (S0 tiers)
- **Production**: Optimized for performance and reliability (S1+ tiers)

## Monitoring and Maintenance

Consider implementing:
- Azure Application Insights for monitoring
- Azure Key Vault for secrets management
- Azure DevOps or GitHub Actions for CI/CD
- Backup strategies for the database

---

**Note**: After running `terraform apply`, you can access your resources through the [Azure Portal](https://portal.azure.com) to monitor and manage them.
