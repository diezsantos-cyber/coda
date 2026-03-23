# CODA - Diagrama Simple

## ¿Qué hace CODA?

```
                    ANTES (sin CODA)
┌──────────────────────────────────────────────────┐
│ ❌ Minutas en diferentes lugares                 │
│ ❌ No se da seguimiento a acuerdos               │
│ ❌ No se sabe quién debe hacer qué               │
│ ❌ Todo por email/WhatsApp → se pierde           │
└──────────────────────────────────────────────────┘

                    DESPUÉS (con CODA)
┌──────────────────────────────────────────────────┐
│ ✅ Minutas centralizadas                         │
│ ✅ Acuerdos con responsables y fechas            │
│ ✅ Notificaciones automáticas                    │
│ ✅ Export a Google Sheets                        │
│ ✅ Interfaz simple (Telegram)                    │
└──────────────────────────────────────────────────┘
```

---

## Flujo de usuario

```
1. REUNIÓN EN GOOGLE CALENDAR (ya lo haces)
   └─→ Creas reuniones como siempre

2. CODA SINCRONIZA (automático)
   └─→ Cada 15 min, CODA importa tus reuniones

3. DESPUÉS DE LA REUNIÓN
   └─→ Alguien crea la minuta (Web o Telegram)

4. EXTRAER ACUERDOS
   └─→ "Juan: Actualizar dashboard - 30 Marzo"
   └─→ "María: Revisar budget - 25 Marzo"

5. PUBLICAR MINUTA
   └─→ Acuerdos se guardan
   └─→ Se exporta a Google Sheets
   └─→ Telegram notifica a Juan y María

6. SEGUIMIENTO
   └─→ Juan: /tareas → "Actualizar dashboard (vence en 5 días)"
   └─→ María marca como completada
```

---

## Arquitectura en 1 imagen

```
┌─────────────────────────────────────────────────┐
│              USUARIOS                           │
│                                                 │
│  👤 Admin        📱 Equipo      📅 Calendar     │
│  (Dashboard)    (Telegram)     (Reuniones)     │
└────────┬────────────┬─────────────┬────────────┘
         │            │             │
         └────────────┼─────────────┘
                      │
         ┌────────────▼────────────┐
         │    CODA Backend         │
         │  (Azure AKS /           │
         │   OpenShift 4)          │
         │                         │
         │  • API REST             │
         │  • Bot Telegram         │
         │  • Calendar Sync        │
         │  • Sheets Export        │
         └────────┬────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼──────┐
│ Datos │    │ Cache │    │ Archivos │
│(Postgres)  │(Redis)│    │ (Blob)   │
└───────┘    └───────┘    └──────────┘
```

---

## Conectividad

### Internet → CODA
```
Telegram servers
  ↓ HTTPS
https://coda.heybanco.mx/api/telegram/webhook
```

### CODA → Internet
```
CODA Backend
  ↓ HTTPS (salida)
  ├─→ api.telegram.org (enviar mensajes)
  ├─→ www.googleapis.com (Calendar API)
  └─→ sheets.googleapis.com (Sheets API)
```

### Interno (VNet / OpenShift)
```
Backend pods
  ├─→ PostgreSQL (puerto 5432)
  └─→ Redis (puerto 6379)
```

---

## Comandos del Bot (Telegram)

```
/start         → Vincular tu cuenta
/reuniones     → Ver próximas reuniones
/proxima       → Siguiente reunión
/minuta        → Crear minuta
/tareas        → Mis tareas pendientes
/pendientes    → Tareas de todo el equipo
/resumen       → Resumen última reunión
/help          → Ayuda
```

---

## Dashboard (Web Admin)

```
┌─────────────────────────────────────┐
│  CODA Dashboard                     │
├─────────────────────────────────────┤
│  📅 Reuniones (desde Calendar)      │
│     • Próximas                      │
│     • Pasadas                       │
│                                     │
│  📝 Minutas                         │
│     • Crear nueva                   │
│     • Editar borrador               │
│     • Publicar                      │
│                                     │
│  ✅ Acuerdos                        │
│     • Pendientes                    │
│     • Completados                   │
│     • Atrasados                     │
│                                     │
│  ⚙️  Configuración                  │
│     • Conectar Google Calendar      │
│     • Configurar Sheets export      │
│     • Gestionar equipo              │
└─────────────────────────────────────┘
```

---

## Deployment Options

### Azure AKS (Cloud)
```
✅ Totalmente gestionado
✅ Auto-scaling
✅ Alta disponibilidad
✅ Backups automáticos
✅ Terraform para infraestructura

Costo: ~$1,000 USD/mes
```

### OpenShift 4 (On-Premise HeyBanco)
```
✅ Control total
✅ Mismos contenedores que Azure
✅ Sin costos de cloud
✅ Integración con infra existente
✅ Compliance on-prem

Usa hardware existente
```

---

## Seguridad

```
✅ Contenedores certificados (Red Hat UBI)
✅ HTTPS everywhere (TLS 1.3)
✅ Secrets en Key Vault / OpenShift Secrets
✅ Multi-tenant (cada org aislada)
✅ OAuth 2.0 (Google)
✅ JWT tokens (API)
✅ Webhook secret (Telegram)
✅ Database encryption at rest
✅ No root containers (OpenShift SCC)
```

---

## Monitoreo

### Health Checks
```
GET /api/health
→ {"status":"ok","database":"connected"}
```

### Métricas
```
• Request rate (req/s)
• Response time (ms)
• Error rate (%)
• Bot command latency
• Calendar sync success
• Sheets export success
```

### Logs
```
• Application logs → Azure Monitor / EFK
• Structured JSON logs
• Trace IDs para debugging
```

---

## Timeline de Deployment

```
Semana 1: Infraestructura
  ├─ Provisionar Azure/OpenShift
  ├─ Configurar databases
  └─ Setup networking

Semana 2-4: Desarrollo MVP
  ├─ Backend + Bot
  ├─ Google Calendar sync
  ├─ Sheets export
  └─ Dashboard básico

Semana 5: Testing
  ├─ Unit tests
  ├─ Integration tests
  └─ User acceptance testing

Semana 6: Producción
  ├─ Deploy a prod
  ├─ Pilot con 10-15 usuarios
  └─ Ajustes basados en feedback
```

---

## FAQ

**P: ¿Debo crear reuniones en CODA?**  
R: No. Sigues creando reuniones en Google Calendar como siempre. CODA las importa automáticamente.

**P: ¿Quién puede usar el bot?**  
R: Todo el equipo de HeyBanco (previa vinculación de cuenta).

**P: ¿Se pueden editar minutas?**  
R: Sí, mientras están en borrador. Una vez publicadas, se pueden agregar acuerdos pero no editar contenido.

**P: ¿Qué pasa si alguien borra una reunión del Calendar?**  
R: CODA la marca como cancelada, pero la minuta (si existe) se mantiene.

**P: ¿Puedo tener múltiples organizaciones?**  
R: Sí, CODA es multi-tenant. Cada org está completamente aislada.

**P: ¿Funciona sin Internet?**  
R: No, necesita conexión para Telegram y Google APIs.

**P: ¿Cuánto cuesta?**  
R: Azure: ~$1,000 USD/mes. OpenShift on-prem: usa hardware existente (sin costos cloud).

---

**Para más detalles técnicos, ver:**
- `CODA-DEPLOYMENT-KIT.md` (manual completo)
- `coda-architecture.md` (arquitectura detallada)
