# CODA Platform - Azure Infrastructure (Terraform)
# Version: 1.0
# Date: March 23, 2026

terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-coda-tfstate"
    storage_account_name = "stcodatfstate"
    container_name       = "tfstate"
    key                  = "coda-prod.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "location" {
  default = "eastus2"
}

variable "environment" {
  default = "prod"
}

variable "db_admin_password" {
  type      = string
  sensitive = true
}

# Resource Group
resource "azurerm_resource_group" "coda" {
  name     = "rg-coda-${var.environment}-${var.location}"
  location = var.location
  tags = {
    Environment = var.environment
    Project     = "CODA"
    ManagedBy   = "Terraform"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "coda" {
  name                = "vnet-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  address_space       = ["10.0.0.0/16"]
}

# Subnets
resource "azurerm_subnet" "aks_system" {
  name                 = "snet-aks-system"
  resource_group_name  = azurerm_resource_group.coda.name
  virtual_network_name = azurerm_virtual_network.coda.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "aks_user" {
  name                 = "snet-aks-user"
  resource_group_name  = azurerm_resource_group.coda.name
  virtual_network_name = azurerm_virtual_network.coda.name
  address_prefixes     = ["10.0.2.0/23"]
}

resource "azurerm_subnet" "postgresql" {
  name                 = "snet-postgresql"
  resource_group_name  = azurerm_resource_group.coda.name
  virtual_network_name = azurerm_virtual_network.coda.name
  address_prefixes     = ["10.0.4.0/24"]
  
  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_subnet" "redis" {
  name                 = "snet-redis"
  resource_group_name  = azurerm_resource_group.coda.name
  virtual_network_name = azurerm_virtual_network.coda.name
  address_prefixes     = ["10.0.5.0/24"]
}

# Azure Container Registry
resource "azurerm_container_registry" "coda" {
  name                = "acrcoda"
  resource_group_name = azurerm_resource_group.coda.name
  location            = azurerm_resource_group.coda.location
  sku                 = "Premium"
  admin_enabled       = false
  
  georeplications {
    location                = "westus2"
    zone_redundancy_enabled = true
  }
}

# Azure Kubernetes Service
resource "azurerm_kubernetes_cluster" "coda" {
  name                = "aks-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  dns_prefix          = "aks-coda-${var.environment}"
  kubernetes_version  = "1.28"
  
  default_node_pool {
    name                = "system"
    node_count          = 2
    vm_size             = "Standard_D2s_v3"
    vnet_subnet_id      = azurerm_subnet.aks_system.id
    type                = "VirtualMachineScaleSets"
    enable_auto_scaling = false
    
    upgrade_settings {
      max_surge = "10%"
    }
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
  }
  
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.coda.id
  }
  
  azure_active_directory_role_based_access_control {
    managed            = true
    azure_rbac_enabled = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# User Node Pool (auto-scaling)
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.coda.id
  vm_size               = "Standard_D4s_v3"
  node_count            = 2
  min_count             = 2
  max_count             = 10
  enable_auto_scaling   = true
  vnet_subnet_id        = azurerm_subnet.aks_user.id
  
  upgrade_settings {
    max_surge = "33%"
  }
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# ACR access for AKS
resource "azurerm_role_assignment" "aks_acr" {
  principal_id                     = azurerm_kubernetes_cluster.coda.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.coda.id
  skip_service_principal_aad_check = true
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_flexible_server" "coda" {
  name                = "psql-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  
  sku_name   = "GP_Standard_D2s_v3"
  storage_mb = 32768
  version    = "15"
  
  administrator_login    = "codaadmin"
  administrator_password = var.db_admin_password
  
  backup_retention_days        = 7
  geo_redundant_backup_enabled = true
  
  high_availability {
    mode = "ZoneRedundant"
  }
  
  delegated_subnet_id = azurerm_subnet.postgresql.id
  private_dns_zone_id = azurerm_private_dns_zone.postgresql.id
  
  zone = "1"
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
  
  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgresql]
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "coda" {
  name      = "coda"
  server_id = azurerm_postgresql_flexible_server.coda.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgresql" {
  name                = "coda-psql.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.coda.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgresql" {
  name                  = "psql-vnet-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgresql.name
  resource_group_name   = azurerm_resource_group.coda.name
  virtual_network_id    = azurerm_virtual_network.coda.id
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "coda" {
  name                = "redis-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  
  sku_name = "Premium"
  family   = "P"
  capacity = 1
  
  subnet_id = azurerm_subnet.redis.id
  
  redis_configuration {
    enable_authentication = true
    maxmemory_policy      = "allkeys-lru"
  }
  
  zones = ["1", "2"]
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# Azure Key Vault
resource "azurerm_key_vault" "coda" {
  name                = "kv-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "premium"
  
  enable_rbac_authorization = true
  
  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    virtual_network_subnet_ids = [azurerm_subnet.aks_user.id]
  }
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# Grant AKS access to Key Vault
resource "azurerm_role_assignment" "aks_keyvault" {
  principal_id         = azurerm_kubernetes_cluster.coda.kubelet_identity[0].object_id
  role_definition_name = "Key Vault Secrets User"
  scope                = azurerm_key_vault.coda.id
}

# Storage Account
resource "azurerm_storage_account" "coda" {
  name                     = "stcoda${var.environment}"
  resource_group_name      = azurerm_resource_group.coda.name
  location                 = azurerm_resource_group.coda.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  
  blob_properties {
    versioning_enabled = true
    
    delete_retention_policy {
      days = 7
    }
  }
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# Storage Containers
resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.coda.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.coda.name
  container_access_type = "private"
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "coda" {
  name                = "log-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# Application Insights
resource "azurerm_application_insights" "coda" {
  name                = "ai-coda-${var.environment}"
  location            = azurerm_resource_group.coda.location
  resource_group_name = azurerm_resource_group.coda.name
  workspace_id        = azurerm_log_analytics_workspace.coda.id
  application_type    = "Node.JS"
  
  tags = {
    Environment = var.environment
    Project     = "CODA"
  }
}

# Azure Front Door (CDN + WAF)
resource "azurerm_frontdoor" "coda" {
  name                = "fd-coda-${var.environment}"
  resource_group_name = azurerm_resource_group.coda.name
  
  routing_rule {
    name               = "coda-routing-rule"
    accepted_protocols = ["Https"]
    patterns_to_match  = ["/*"]
    frontend_endpoints = ["coda-frontend"]
    
    forwarding_configuration {
      forwarding_protocol = "HttpsOnly"
      backend_pool_name   = "coda-backend-pool"
    }
  }
  
  backend_pool_load_balancing {
    name = "coda-load-balancing"
  }
  
  backend_pool_health_probe {
    name     = "coda-health-probe"
    path     = "/api/health"
    protocol = "Https"
  }
  
  backend_pool {
    name = "coda-backend-pool"
    
    backend {
      host_header = "coda.heybanco.mx"
      address     = azurerm_kubernetes_cluster.coda.fqdn
      http_port   = 80
      https_port  = 443
    }
    
    load_balancing_name = "coda-load-balancing"
    health_probe_name   = "coda-health-probe"
  }
  
  frontend_endpoint {
    name      = "coda-frontend"
    host_name = "coda.heybanco.mx"
  }
}

# Data source
data "azurerm_client_config" "current" {}

# Outputs
output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.coda.name
}

output "acr_login_server" {
  value = azurerm_container_registry.coda.login_server
}

output "postgresql_fqdn" {
  value     = azurerm_postgresql_flexible_server.coda.fqdn
  sensitive = true
}

output "redis_hostname" {
  value     = azurerm_redis_cache.coda.hostname
  sensitive = true
}

output "key_vault_uri" {
  value = azurerm_key_vault.coda.vault_uri
}

output "storage_account_name" {
  value = azurerm_storage_account.coda.name
}

output "application_insights_key" {
  value     = azurerm_application_insights.coda.instrumentation_key
  sensitive = true
}
