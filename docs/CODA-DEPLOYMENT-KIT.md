# CODA - Kit de Deployment
**Version:** 1.0  
**Fecha:** 23 de Marzo, 2026  
**Para:** Equipo de Infraestructura - HeyBanco  
**Proyecto:** CODA (Collaborative Organizational Decision Assistant)

---

## 📋 Índice

1. [¿Qué es CODA?](#qué-es-coda)
2. [¿Cómo funciona?](#cómo-funciona)
3. [Arquitectura técnica](#arquitectura-técnica)
4. [Conectividad](#conectividad)
5. [Deployment Azure AKS](#deployment-azure-aks)
6. [Deployment OpenShift 4](#deployment-openshift-4)
7. [Configuración](#configuración)
8. [Monitoreo](#monitoreo)
9. [Troubleshooting](#troubleshooting)
10. [Checklist de deployment](#checklist-de-deployment)

---

## ¿Qué es CODA?

**CODA** es una plataforma multi-tenant para gestión de reuniones y seguimiento de decisiones organizacionales.

### Problema que resuelve
- Las minutas de reunión se pierden
- Los acuerdos no se dan seguimiento
- No hay un lugar centralizado para ver tareas del equipo
- Dificultad para saber quién debe hacer qué y cuándo

### Solución
CODA integra:
- **Google Calendar** (reuniones ya existentes)
- **Telegram** (interfaz del equipo)
- **Google Sheets** (exportación de tareas)

El flujo es simple:
1. Las reuniones ya están en Google Calendar
2. Alguien crea la minuta después de la reunión (dashboard o Telegram)
3. Se extraen acuerdos/tareas de la minuta
4. Se asignan a personas con fechas límite
5. Auto-exporta a Google Sheets
6. Telegram notifica a los asignados

### Usuarios objetivo
- **Pilot:** Equipo de HeyBanco (10-15 usuarios)
- **Futuro:** Otras organizaciones (multi-tenant)

---

## ¿Cómo funciona?

### Componentes principales

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIOS                             │
├──────────────────┬────────────────────┬─────────────────────┤
│  Admin (Web)     │  Equipo (Telegram) │  Google Calendar    │
│  - Dashboard     │  - Bot commands    │  - Crear reuniones  │
│  - Crear minutas │  - Ver tareas      │  (fuente de verdad) │
└──────────┬───────┴──────────┬─────────┴────────┬────────────┘
           │                  │                   │
┌──────────▼──────────────────▼───────────────────▼────────────┐
│                      CODA BACKEND                             │
│  - API REST (Express + TypeScript)                           │
│  - Telegram Bot (webhook)                                    │
│  - Google Calendar sync (cada 15 min)                        │
│  - Google Sheets export                                      │
└───────────────────────┬───────────────────────────────────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
┌──────────▼────┐  ┌───▼────┐  ┌───▼──────┐
│  PostgreSQL   │  │ Redis  │  │  Blob    │
│  (datos)      │  │ (cache)│  │ Storage  │
└───────────────┘  └────────┘  └──────────┘
```

### Flujo de datos típico

**1. Sync de reuniones (automático cada 15 min):**
```
Google Calendar → CODA Backend → PostgreSQL
```

**2. Creación de minuta (manual):**
```
Usuario (Web o Telegram) → CODA API → PostgreSQL
```

**3. Publicación de minuta:**
```
Admin publica → 
  ├─ Extrae acuerdos → PostgreSQL
  ├─ Exporta a Google Sheets
  └─ Notifica vía Telegram a asignados
```

**4. Consulta de tareas (Telegram):**
```
Usuario: /tareas →
Bot query → PostgreSQL →
Bot responde: "Tienes 3 tareas pendientes..."
```

---

## Arquitectura técnica

### Stack tecnológico

**Backend:**
- Node.js 20
- Express.js (REST API)
- TypeScript
- Prisma (ORM)
- node-telegram-bot-api (bot)
- googleapis (Calendar + Sheets)

**Frontend:**
- Next.js 14
- React 18
- Tailwind CSS

**Base de datos:**
- PostgreSQL 15 (multi-tenant)

**Cache:**
- Redis 7

**Contenedores:**
- Red Hat UBI 9 con Node.js 20
- OpenShift 4 compatible

### Multi-tenancy

Cada organización (HeyBanco, OtraEmpresa, etc.) está aislada:
- Todas las tablas tienen `organization_id`
- JWT incluye `organizationId`
- Middleware filtra automáticamente por org
- Row-level security en PostgreSQL (defensa en profundidad)

**No hay riesgo de fuga de datos entre organizaciones.**

---

## Conectividad

### Puertos

| Servicio | Puerto | Protocolo | Propósito |
|----------|--------|-----------|-----------|
| Backend API | 3000 | HTTP/HTTPS | API REST + Telegram webhook |
| PostgreSQL | 5432 | TCP | Base de datos |
| Redis | 6379 | TCP | Cache + job queue |

### Endpoints externos (salida)

CODA necesita conectarse a:

| Servicio | URL | Puerto | Propósito |
|----------|-----|--------|-----------|
| Telegram API | `api.telegram.org` | 443 | Recibir/enviar mensajes bot |
| Google Calendar API | `www.googleapis.com` | 443 | Sincronizar eventos |
| Google Sheets API | `sheets.googleapis.com` | 443 | Exportar acuerdos |
| Google OAuth | `accounts.google.com` | 443 | Autenticación OAuth |

**Firewall:** Permitir salida HTTPS (443) a estos dominios.

### Webhook entrante (Telegram)

Telegram necesita enviar updates al backend:

```
Telegram servers (149.154.160.0/20, 91.108.56.0/22)
  ↓ HTTPS POST
https://coda.heybanco.mx/api/telegram/webhook
```

**Requisitos:**
- URL pública accesible desde Internet
- HTTPS obligatorio (Telegram no acepta HTTP)
- Certificado SSL válido

### Conexiones internas (VNet/OpenShift)

```
Backend pods → PostgreSQL (port 5432)
Backend pods → Redis (port 6379)
Backend pods → Blob Storage (HTTPS 443)
```

**Seguridad:**
- Backend en subnet privada
- PostgreSQL + Redis solo aceptan conexiones desde backend subnet
- No acceso público a bases de datos

---

## Deployment Azure AKS

### Pre-requisitos

1. **Azure Subscription** con permisos:
   - Crear Resource Groups
   - Crear AKS clusters
   - Crear Azure Database for PostgreSQL
   - Crear Azure Cache for Redis

2. **Herramientas locales:**
   - Terraform >= 1.5
   - Azure CLI >= 2.50
   - kubectl >= 1.28
   - Docker (para builds locales)

3. **Credenciales:**
   - Service Principal para Terraform
   - ACR credentials

### Paso 1: Provisionar infraestructura con Terraform

```bash
# Clonar repo
git clone https://github.com/diezsantos-cyber/coda.git
cd coda/terraform/azure

# Inicializar Terraform
terraform init

# Revisar plan
terraform plan \
  -var="db_admin_password=YOUR_SECURE_PASSWORD" \
  -var="location=eastus2" \
  -var="environment=prod"

# Aplicar
terraform apply \
  -var="db_admin_password=YOUR_SECURE_PASSWORD" \
  -var="location=eastus2" \
  -var="environment=prod"
```

**Recursos creados:**
- Resource Group: `rg-coda-prod-eastus2`
- AKS Cluster: `aks-coda-prod`
- PostgreSQL: `psql-coda-prod`
- Redis: `redis-coda-prod`
- ACR: `acrcoda`
- Key Vault: `kv-coda-prod`
- Storage Account: `stcodaprod`
- VNet + subnets
- Log Analytics + Application Insights

**Tiempo estimado:** 15-20 minutos

### Paso 2: Configurar kubectl

```bash
# Conectar a AKS
az aks get-credentials \
  --resource-group rg-coda-prod-eastus2 \
  --name aks-coda-prod

# Verificar conexión
kubectl get nodes
```

### Paso 3: Crear namespace y secrets

```bash
# Crear namespace
kubectl create namespace coda-prod

# Obtener connection strings de Terraform output
DB_URL=$(terraform output -raw postgresql_connection_string)
REDIS_URL=$(terraform output -raw redis_connection_string)

# Crear secrets
kubectl create secret generic coda-secrets \
  --from-literal=database-url="$DB_URL" \
  --from-literal=redis-url="$REDIS_URL" \
  --from-literal=telegram-token="YOUR_TELEGRAM_BOT_TOKEN" \
  --from-literal=google-client-id="YOUR_GOOGLE_CLIENT_ID" \
  --from-literal=google-client-secret="YOUR_GOOGLE_CLIENT_SECRET" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=encryption-key="$(openssl rand -base64 32)" \
  -n coda-prod
```

### Paso 4: Build y push de imagen

```bash
# Login a ACR
az acr login --name acrcoda

# Build imagen (Red Hat UBI)
docker build \
  -f packages/backend/Dockerfile \
  -t acrcoda.azurecr.io/coda-backend:v1.0.0 \
  .

# Push
docker push acrcoda.azurecr.io/coda-backend:v1.0.0
```

### Paso 5: Deploy a Kubernetes

```bash
# Aplicar manifiestos
kubectl apply -f k8s/azure/ -n coda-prod

# Verificar deployment
kubectl get pods -n coda-prod
kubectl get svc -n coda-prod

# Ver logs
kubectl logs -f deployment/coda-backend -n coda-prod
```

### Paso 6: Configurar Ingress (Azure Front Door)

Ya provisionado por Terraform. Verificar DNS:

```bash
# Obtener Front Door hostname
terraform output frontdoor_hostname

# Crear registro CNAME en DNS
# coda.heybanco.mx → [frontdoor_hostname]
```

### Paso 7: Inicializar base de datos

```bash
# Ejecutar migraciones
kubectl exec -it deployment/coda-backend -n coda-prod -- \
  npm run db:migrate

# (Opcional) Seed data inicial
kubectl exec -it deployment/coda-backend -n coda-prod -- \
  npm run db:seed
```

### Paso 8: Configurar webhook de Telegram

```bash
# Obtener URL pública
PUBLIC_URL="https://coda.heybanco.mx"

# Configurar webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook" \
  -d "url=${PUBLIC_URL}/api/telegram/webhook" \
  -d "secret_token=YOUR_WEBHOOK_SECRET"
```

### Paso 9: Verificación

```bash
# Health check
curl https://coda.heybanco.mx/api/health

# Expected: {"status":"ok","database":"connected","redis":"connected"}

# Probar bot
# En Telegram, enviar: /start
```

---

## Deployment OpenShift 4

### Pre-requisitos

1. **Acceso a OpenShift cluster:**
   - URL: `https://api.ocp.heybanco.local:6443`
   - Credenciales de admin o developer

2. **Herramientas:**
   - oc CLI >= 4.12
   - Podman o Docker

3. **Infraestructura externa:**
   - PostgreSQL 15 (puede ser externo o en OpenShift)
   - Redis 7 (puede ser en OpenShift)

### Paso 1: Login a OpenShift

```bash
# Login
oc login https://api.ocp.heybanco.local:6443 \
  --username=admin \
  --password=YOUR_PASSWORD

# Verificar
oc whoami
oc version
```

### Paso 2: Crear proyecto

```bash
# Crear proyecto (namespace)
oc new-project coda-prod \
  --display-name="CODA Platform" \
  --description="Collaborative Organizational Decision Assistant"

# Configurar límites de recursos
oc create -f openshift/resource-quotas.yaml -n coda-prod
```

### Paso 3: Crear secrets

```bash
oc create secret generic coda-secrets \
  --from-literal=database-url="postgresql://user:pass@psql.heybanco.local:5432/coda" \
  --from-literal=redis-url="redis://redis.coda-prod.svc.cluster.local:6379" \
  --from-literal=telegram-token="YOUR_BOT_TOKEN" \
  --from-literal=google-client-id="YOUR_CLIENT_ID" \
  --from-literal=google-client-secret="YOUR_CLIENT_SECRET" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=encryption-key="$(openssl rand -base64 32)" \
  -n coda-prod
```

### Paso 4: Deploy PostgreSQL (opcional, si en OpenShift)

```bash
# Deploy PostgreSQL template
oc new-app postgresql-persistent \
  -p POSTGRESQL_USER=coda \
  -p POSTGRESQL_PASSWORD=secure_password \
  -p POSTGRESQL_DATABASE=coda \
  -p VOLUME_CAPACITY=50Gi \
  -n coda-prod
```

### Paso 5: Deploy Redis

```bash
# Deploy Redis
oc apply -f openshift/redis-deployment.yaml -n coda-prod
```

### Paso 6: Build imagen (usando S2I o Dockerfile)

**Opción A: Source-to-Image (S2I)**
```bash
# Crear ImageStream
oc create imagestream coda-backend -n coda-prod

# Build desde Git
oc new-build https://github.com/diezsantos-cyber/coda.git \
  --name=coda-backend \
  --context-dir=packages/backend \
  --strategy=docker \
  -n coda-prod
```

**Opción B: Build local y push**
```bash
# Build con Podman (OpenShift-friendly)
podman build \
  -f packages/backend/Dockerfile \
  -t registry.heybanco.local/coda/backend:v1.0.0 \
  .

# Push a registry interno
podman push registry.heybanco.local/coda/backend:v1.0.0
```

### Paso 7: Deploy aplicación

```bash
# Aplicar DeploymentConfig
oc apply -f openshift/backend-deploymentconfig.yaml -n coda-prod

# Crear Service
oc apply -f openshift/backend-service.yaml -n coda-prod

# Crear Route (Ingress)
oc apply -f openshift/backend-route.yaml -n coda-prod
```

### Paso 8: Configurar auto-scaling

```bash
# Horizontal Pod Autoscaler
oc autoscale dc/coda-backend \
  --min=2 --max=10 \
  --cpu-percent=70 \
  -n coda-prod
```

### Paso 9: Inicializar BD

```bash
# Ejecutar migraciones
oc exec deployment/coda-backend -n coda-prod -- \
  npm run db:migrate
```

### Paso 10: Configurar webhook Telegram

```bash
# Obtener Route URL
ROUTE_URL=$(oc get route coda-backend -n coda-prod -o jsonpath='{.spec.host}')

# Configurar webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook" \
  -d "url=https://${ROUTE_URL}/api/telegram/webhook"
```

---

## Configuración

### Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/coda` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | Secret para tokens JWT | `base64-random-string` |
| `ENCRYPTION_KEY` | Para encriptar OAuth tokens | `32-byte-base64-string` |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram | `123456:ABC-DEF...` |
| `TELEGRAM_WEBHOOK_SECRET` | Secret para webhook | `random-string` |
| `GOOGLE_CLIENT_ID` | OAuth Google Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Google Secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Callback URL | `https://coda.heybanco.mx/api/integrations/google/callback` |
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Puerto del servidor | `3000` |

### OAuth Google - Configuración

1. **Google Cloud Console:**
   - Ir a https://console.cloud.google.com
   - Crear proyecto "CODA HeyBanco"
   - Habilitar APIs:
     - Google Calendar API
     - Google Sheets API
   
2. **Credenciales OAuth:**
   - Crear "OAuth 2.0 Client ID"
   - Tipo: Web application
   - Authorized redirect URIs:
     - `https://coda.heybanco.mx/api/integrations/google/callback`
     - `http://localhost:3000/api/integrations/google/callback` (dev)
   
3. **Scopes requeridos:**
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`

### Bot de Telegram - Configuración

1. **Crear bot:**
   ```
   En Telegram, hablar con @BotFather
   /newbot
   Nombre: CODA HeyBanco
   Username: heybanco_coda_bot
   ```

2. **Obtener token:**
   ```
   BotFather responde con:
   Use this token to access the HTTP API:
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

3. **Configurar comandos:**
   ```
   /setcommands
   
   start - Vincular cuenta con organización
   reuniones - Ver próximas reuniones
   proxima - Próxima reunión
   minuta - Crear minuta
   tareas - Mis tareas pendientes
   pendientes - Tareas del equipo
   resumen - Resumen última reunión
   help - Ayuda
   ```

---

## Monitoreo

### Health checks

**Liveness probe:**
```
GET /api/health

Response 200:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

**Readiness probe:**
```
GET /api/health/ready

Response 200 cuando:
- Database connection pool disponible
- Redis conectado
- Ningún job crítico bloqueado
```

### Métricas clave

**Azure (Application Insights):**
- Request rate (req/s)
- Response time (P50, P95, P99)
- Error rate (%)
- Database query duration
- Bot command latency
- Calendar sync success rate
- Sheets export success rate

**OpenShift (Prometheus):**
```
# Métricas custom expuestas en /metrics
coda_bot_commands_total{command="tareas",organization="heybanco"}
coda_calendar_sync_duration_seconds{organization="heybanco"}
coda_sheets_export_errors_total{organization="heybanco"}
```

### Logs

**Estructura de log:**
```json
{
  "timestamp": "2026-03-23T15:30:00Z",
  "level": "info",
  "message": "Calendar sync completed",
  "organizationId": "uuid",
  "eventCount": 15,
  "duration": 234
}
```

**Azure:** Logs van a Log Analytics
**OpenShift:** Logs van a EFK stack

### Alertas recomendadas

1. **API error rate > 5%** (últimos 5 min)
2. **Database connection pool exhausted**
3. **Redis connection failed**
4. **Calendar sync failing** (últimas 3 veces)
5. **Sheets export failing** (> 2 errores/hora)
6. **Pod restart loop** (> 3 restarts en 10 min)

---

## Troubleshooting

### Bot no responde

**Síntomas:**
- Usuarios envían comandos, bot no responde

**Diagnóstico:**
```bash
# 1. Verificar webhook está configurado
curl https://api.telegram.org/bot${TOKEN}/getWebhookInfo

# 2. Ver logs del backend
kubectl logs -f deployment/coda-backend -n coda-prod | grep telegram

# 3. Verificar endpoint es accesible
curl https://coda.heybanco.mx/api/health
```

**Soluciones comunes:**
- Webhook no configurado → reconfigurar con `setWebhook`
- Certificado SSL inválido → verificar Front Door / Route
- Backend caído → verificar pods: `kubectl get pods`
- Firewall bloqueando Telegram IPs → permitir rangos de Telegram

### Calendar sync no funciona

**Síntomas:**
- Reuniones no aparecen en CODA
- Últimas sync más de 15 min

**Diagnóstico:**
```bash
# Ver logs de sync job
kubectl logs -f deployment/coda-backend -n coda-prod | grep "calendar sync"

# Ver estado en dashboard
curl https://coda.heybanco.mx/api/integrations/google/status
```

**Soluciones:**
- OAuth tokens expirados → reconectar Google en dashboard
- Calendar API quota excedido → revisar Google Cloud Console
- Background job no corriendo → verificar cron está habilitado

### Sheets export falla

**Síntomas:**
- Minutas publicadas pero no aparecen en Sheet
- Error en logs: "Failed to export to Sheets"

**Diagnóstico:**
```bash
# Ver logs de export
kubectl logs deployment/coda-backend | grep "sheets export"

# Verificar permisos
# Admin debe tener acceso de escritura al Sheet
```

**Soluciones:**
- OAuth scopes insuficientes → reconectar con scopes correctos
- Sheet ID incorrecto → verificar configuración en dashboard
- Sheet fue eliminado → crear nuevo Sheet

### Pods en CrashLoopBackOff

**Diagnóstico:**
```bash
# Ver status
kubectl get pods -n coda-prod

# Ver logs del pod que falla
kubectl logs pod/coda-backend-xxx -n coda-prod

# Ver eventos
kubectl describe pod coda-backend-xxx -n coda-prod
```

**Causas comunes:**
- Database no accesible → verificar connection string
- Secrets faltantes → verificar `coda-secrets` existe
- Migrations pendientes → ejecutar `npm run db:migrate`
- OOMKilled → aumentar memory limits

### Performance lenta

**Síntomas:**
- API responses > 2s
- Bot responde lento

**Diagnóstico:**
```bash
# Ver métricas de pods
kubectl top pods -n coda-prod

# Ver queries lentas en PostgreSQL
# Conectar a DB y revisar pg_stat_statements
```

**Soluciones:**
- CPU/Memory insuficiente → escalar pods o aumentar resources
- Database queries sin índices → revisar query plan
- Redis no conectado → verificar Redis está corriendo
- Demasiadas organizaciones en 1 instancia → escalar horizontalmente

---

## Checklist de deployment

### Pre-deployment

- [ ] Azure subscription / OpenShift cluster disponible
- [ ] Terraform instalado (Azure) u oc CLI (OpenShift)
- [ ] Service principal creado (Azure)
- [ ] Bot de Telegram creado con BotFather
- [ ] Google Cloud project creado
- [ ] OAuth credentials generadas (Google)
- [ ] DNS preparado (coda.heybanco.mx)
- [ ] Certificado SSL disponible o ACM/Let's Encrypt configurado

### Infrastructure provisioning (Azure)

- [ ] Terraform init + plan + apply exitoso
- [ ] Resource group creado
- [ ] AKS cluster running
- [ ] PostgreSQL provisionado y accesible
- [ ] Redis provisionado y accesible
- [ ] ACR creado
- [ ] Key Vault creado
- [ ] VNet y subnets configuradas
- [ ] Application Insights configurado

### Infrastructure setup (OpenShift)

- [ ] Proyecto creado
- [ ] PostgreSQL deployed o conectado
- [ ] Redis deployed
- [ ] Persistent volumes disponibles
- [ ] ImageStream creado
- [ ] Security policies configuradas

### Application deployment

- [ ] Imagen Docker built con Red Hat UBI
- [ ] Imagen pushed a registry (ACR u OpenShift)
- [ ] Namespace/project creado
- [ ] Secrets creados (database, redis, telegram, google)
- [ ] Deployment/DeploymentConfig aplicado
- [ ] Service creado
- [ ] Ingress/Route configurado
- [ ] HPA (autoscaler) configurado
- [ ] Pods running (mínimo 2 réplicas)

### Database setup

- [ ] Migraciones ejecutadas (`npm run db:migrate`)
- [ ] Database schema verificado
- [ ] (Opcional) Seed data cargado
- [ ] Connection pool testeado

### Integrations

- [ ] Telegram webhook configurado
- [ ] Bot responde a /start
- [ ] Google OAuth callback URL configurado en Google Console
- [ ] OAuth flow testeado (conectar cuenta Google)
- [ ] Calendar sync funcionando
- [ ] Sheets export funcionando

### Monitoring & Logging

- [ ] Health check endpoint respondiendo
- [ ] Logs visibles en Azure Monitor / OpenShift console
- [ ] Application Insights / Prometheus recibiendo métricas
- [ ] Alertas configuradas
- [ ] Dashboard de monitoreo creado

### Testing

- [ ] Health check: `curl https://coda.heybanco.mx/api/health`
- [ ] Admin puede login al dashboard
- [ ] Admin puede conectar Google Calendar
- [ ] Reuniones sincronizadas desde Calendar
- [ ] Admin puede crear minuta
- [ ] Minuta se publica correctamente
- [ ] Acuerdos exportan a Sheets
- [ ] Bot responde en Telegram
- [ ] Bot muestra reuniones (`/reuniones`)
- [ ] Bot muestra tareas (`/tareas`)
- [ ] Notificaciones funcionan

### Documentation

- [ ] Documentación entregada al equipo de IT
- [ ] Runbook para troubleshooting
- [ ] Contactos de soporte definidos
- [ ] Procedimientos de escalado documentados

### Post-deployment

- [ ] Backups configurados (PostgreSQL automated backups)
- [ ] Disaster recovery plan documentado
- [ ] Escalado horizontal testeado
- [ ] Pilot users invitados
- [ ] Training sesión agendada
- [ ] Métricas baseline establecidas

---

## Información de contacto

**Proyecto:** CODA  
**Versión:** 1.0  
**Fecha de entrega:** 23 de Marzo, 2026  

**Equipo técnico:**
- Arquitecto: Franco (Clawdbot AI)
- Sponsor: Manuel Arámburu (HeyBanco)

**Soporte:**
- Issues: https://github.com/diezsantos-cyber/coda/issues
- Documentación: Ver `/docs` en el repo

---

## Anexos

### A. Archivos incluidos en este kit

```
coda-deployment-kit/
├── CODA-DEPLOYMENT-KIT.md (este archivo)
├── coda-architecture.md (arquitectura detallada)
├── coda-terraform-azure-example.tf (infraestructura Azure)
├── coda-dockerfile-redhat-ubi.dockerfile (imagen certificada)
├── coda-sprint-1-devin-tasks-updated.md (tareas de implementación)
├── k8s/
│   ├── azure/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── hpa.yaml
│   └── openshift/
│       ├── deploymentconfig.yaml
│       ├── service.yaml
│       ├── route.yaml
│       └── redis-deployment.yaml
└── README.md
```

### B. Recursos adicionales

- Red Hat UBI Catalog: https://catalog.redhat.com/software/containers/explore
- Azure AKS Documentation: https://docs.microsoft.com/azure/aks/
- OpenShift 4 Documentation: https://docs.openshift.com/
- Telegram Bot API: https://core.telegram.org/bots/api
- Google Calendar API: https://developers.google.com/calendar
- Google Sheets API: https://developers.google.com/sheets

---

**Fin del documento**
