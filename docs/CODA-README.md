# CODA - Collaborative Organizational Decision Assistant
**Version:** 1.0  
**Fecha:** 23 de Marzo, 2026  
**Cliente:** HeyBanco

---

## 🎯 ¿Qué es CODA?

CODA es una plataforma multi-tenant para gestión de reuniones y seguimiento de decisiones organizacionales que integra:

- ✅ **Google Calendar** - Sincroniza reuniones automáticamente
- ✅ **Telegram Bot** - Interfaz simple para el equipo
- ✅ **Google Sheets** - Exportación automática de acuerdos
- ✅ **Dashboard Web** - Panel de administración

**Problema que resuelve:**
- Las minutas de reunión se pierden
- Los acuerdos no se dan seguimiento
- No hay visibilidad de tareas del equipo

**Solución:**
Después de cada reunión, alguien crea la minuta → extrae acuerdos → asigna responsables → auto-exporta a Sheets → notifica por Telegram.

---

## 📦 Archivos en este deployment kit

```
coda-deployment-kit/
├── CODA-README.md                      ← Este archivo (start here)
├── CODA-DEPLOYMENT-KIT.md              ← Manual completo de deployment
├── CODA-DIAGRAMA-SIMPLE.md             ← Diagramas visuales simplificados
├── coda-architecture.md                ← Arquitectura técnica detallada
├── coda-terraform-azure-example.tf     ← Terraform para Azure AKS
├── coda-dockerfile-redhat-ubi.dockerfile ← Dockerfile con Red Hat UBI
├── coda-sprint-1-devin-tasks-updated.md ← Tareas de implementación (15 tasks)
└── coda-k8s-manifests/
    ├── azure/
    │   ├── deployment.yaml             ← Kubernetes Deployment
    │   ├── service.yaml                ← Kubernetes Service
    │   ├── hpa.yaml                    ← Horizontal Pod Autoscaler
    │   └── ingress.yaml                ← Ingress (nginx)
    └── openshift/
        ├── deploymentconfig.yaml       ← OpenShift DeploymentConfig
        ├── service.yaml                ← OpenShift Service
        └── route.yaml                  ← OpenShift Route
```

---

## 🚀 Quick Start

### Para equipo de IT (Deployment)

1. **Leer arquitectura:**
   - [`CODA-DIAGRAMA-SIMPLE.md`](./CODA-DIAGRAMA-SIMPLE.md) - Entender qué hace
   - [`coda-architecture.md`](./coda-architecture.md) - Arquitectura detallada

2. **Deployment completo:**
   - [`CODA-DEPLOYMENT-KIT.md`](./CODA-DEPLOYMENT-KIT.md) - Manual paso a paso

3. **Opciones de deployment:**
   - **Azure AKS:** Usar `coda-terraform-azure-example.tf` + manifiestos en `coda-k8s-manifests/azure/`
   - **OpenShift 4:** Usar manifiestos en `coda-k8s-manifests/openshift/`

### Para equipo de desarrollo

1. **Ver tareas de implementación:**
   - [`coda-sprint-1-devin-tasks-updated.md`](./coda-sprint-1-devin-tasks-updated.md)

2. **Repo de código:**
   - https://github.com/diezsantos-cyber/coda

3. **Docker image:**
   - Base: Red Hat UBI 9 con Node.js 20
   - Ver: `coda-dockerfile-redhat-ubi.dockerfile`

---

## 🏗️ Opciones de Deployment

### Opción 1: Azure AKS (Cloud)

**Ventajas:**
- Totalmente gestionado
- Auto-scaling
- Alta disponibilidad
- Backups automáticos

**Pasos:**
1. Provisionar infraestructura con Terraform
2. Deploy a AKS con kubectl
3. Configurar Ingress + DNS

**Ver:** `CODA-DEPLOYMENT-KIT.md` sección "Deployment Azure AKS"

**Costo estimado:** ~$1,000 USD/mes

---

### Opción 2: OpenShift 4 (On-Premise)

**Ventajas:**
- Control total
- Sin costos de cloud
- Compliance on-prem
- Mismos contenedores que Azure

**Pasos:**
1. Login a OpenShift cluster
2. Crear proyecto
3. Deploy con oc CLI

**Ver:** `CODA-DEPLOYMENT-KIT.md` sección "Deployment OpenShift 4"

**Costo:** Usa hardware existente

---

## 🔧 Stack Tecnológico

**Backend:**
- Node.js 20
- Express.js
- TypeScript
- Prisma ORM
- Telegram Bot API
- Google Calendar API
- Google Sheets API

**Frontend:**
- Next.js 14
- React 18
- Tailwind CSS

**Infraestructura:**
- Red Hat UBI 9 containers (OpenShift certified)
- PostgreSQL 15 (Azure Database or on-prem)
- Redis 7 (Azure Cache or on-prem)
- Azure AKS o OpenShift 4

---

## 🔌 Conectividad requerida

### Salida (HTTPS 443)
- `api.telegram.org` - Bot API
- `www.googleapis.com` - Calendar API
- `sheets.googleapis.com` - Sheets API
- `accounts.google.com` - OAuth

### Entrada (HTTPS 443)
- Telegram webhook: `https://coda.heybanco.mx/api/telegram/webhook`

### Interno
- Backend → PostgreSQL (5432)
- Backend → Redis (6379)

---

## 📊 Monitoreo

**Health check:**
```bash
curl https://coda.heybanco.mx/api/health
```

**Métricas:**
- Request rate, response time, error rate
- Bot command latency
- Calendar sync success
- Sheets export success

**Azure:** Application Insights + Azure Monitor  
**OpenShift:** Prometheus + Grafana

---

## ✅ Checklist de Deployment

### Pre-deployment
- [ ] Infraestructura disponible (Azure/OpenShift)
- [ ] Bot de Telegram creado
- [ ] Google OAuth configurado
- [ ] DNS preparado (coda.heybanco.mx)

### Deployment
- [ ] Infraestructura provisionada
- [ ] Secrets creados
- [ ] Aplicación deployed
- [ ] Migraciones ejecutadas
- [ ] Webhook Telegram configurado

### Testing
- [ ] Health check OK
- [ ] Admin login funciona
- [ ] Google Calendar sync funciona
- [ ] Bot responde en Telegram
- [ ] Sheets export funciona

**Ver checklist completo:** `CODA-DEPLOYMENT-KIT.md` sección "Checklist de deployment"

---

## 🆘 Soporte

**Documentación:**
- Deployment completo: [`CODA-DEPLOYMENT-KIT.md`](./CODA-DEPLOYMENT-KIT.md)
- Arquitectura: [`coda-architecture.md`](./coda-architecture.md)
- Diagramas: [`CODA-DIAGRAMA-SIMPLE.md`](./CODA-DIAGRAMA-SIMPLE.md)

**Troubleshooting:**
Ver sección "Troubleshooting" en `CODA-DEPLOYMENT-KIT.md`

**Repo:**
https://github.com/diezsantos-cyber/coda

**Issues:**
https://github.com/diezsantos-cyber/coda/issues

---

## 📞 Contactos

**Proyecto:** CODA  
**Cliente:** HeyBanco  
**Sponsor:** Manuel Arámburu

**Equipo técnico:**
- Arquitecto: Franco (Clawdbot AI)
- Implementación: Devin AI

---

## 📝 Próximos pasos

### Para IT (Deployment)
1. Leer `CODA-DEPLOYMENT-KIT.md`
2. Elegir opción: Azure AKS o OpenShift 4
3. Seguir pasos de deployment
4. Configurar monitoreo
5. Invitar pilot users

### Para Development
1. Leer `coda-sprint-1-devin-tasks-updated.md`
2. Setup ambiente local
3. Implementar 15 tareas
4. Testing local
5. Deploy a staging

### Para Usuarios
1. Recibir invitación
2. Vincular Telegram con `/start`
3. Conectar Google Calendar (admin)
4. Crear primera minuta
5. Dar feedback

---

## 📚 Recursos adicionales

- **Red Hat UBI Catalog:** https://catalog.redhat.com/software/containers/explore
- **Azure AKS Docs:** https://docs.microsoft.com/azure/aks/
- **OpenShift 4 Docs:** https://docs.openshift.com/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Google Calendar API:** https://developers.google.com/calendar
- **Google Sheets API:** https://developers.google.com/sheets

---

**Última actualización:** 23 de Marzo, 2026  
**Versión del kit:** 1.0
