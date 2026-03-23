# CODA Platform - Technical Architecture Document
**Version:** 1.2  
**Date:** March 23, 2026 (Updated - Infrastructure Standards)  
**Project:** Collaborative Organizational Decision Assistant  
**Pilot Client:** HeyBanco  
**Deployment:** Azure AKS (Cloud) / OpenShift 4 (On-premise)

---

## 1. Executive Summary

CODA is a multi-tenant SaaS platform for organizational collaboration, meeting management, and AI-powered decision assistance. This document defines the technical architecture for Phase 1 MVP, with extensibility for Phases 2-3.

**Core Architecture Principles:**
- Multi-tenant from day 1 (database isolation per organization)
- API-first design (enables future mobile apps, integrations)
- Event-driven for notifications and async processing
- Security-first (RBAC, data isolation, audit logs)
- **HeyBanco Infrastructure Standards Compliance:**
  - Red Hat UBI containers (certified images)
  - OpenShift 4 compatible (on-premise)
  - Azure AKS deployment (cloud)
  - Infrastructure as Code (Terraform)
- **Google Calendar as source of truth for meetings** (Phase 1)

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Admin Dashboard (React/Next.js)    │  Telegram Bot Client  │
└─────────────────┬───────────────────┴──────────┬────────────┘
                  │                               │
                  │         HTTPS/WSS             │
                  │                               │
┌─────────────────▼───────────────────────────────▼────────────┐
│                      API GATEWAY (Kong/NGINX)                │
└─────────────────┬────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  REST API Server (Node.js/Express)                          │
│  - Authentication & Authorization (JWT + RBAC)              │
│  - Multi-tenant Context Middleware                          │
│  - Business Logic Services                                  │
│  - Telegram Webhook Handler                                 │
└─────────────────┬──────────────────┬─────────────────────────┘
                  │                  │
      ┌───────────▼─────┐   ┌────────▼────────┐
      │   PostgreSQL    │   │  Redis Cache    │
      │  (Multi-tenant) │   │  & Job Queue    │
      └─────────────────┘   └─────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   INTEGRATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  - Telegram Bot API (Phase 1)                               │
│  - Google Calendar API (Phase 1 - Read-only)                │
│  - Google Sheets API (Phase 1 - Export agreements)          │
│  - Google Drive API (Phase 2)                               │
│  - OpenAI/Anthropic API (Phase 2)                           │
│  - WhatsApp Business API (Phase 3)                          │
│  - Gmail API (Phase 3)                                      │
│  - Notion API (Phase 3+)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **Language:** TypeScript
- **ORM:** Prisma (type-safe, migrations, multi-schema support)
- **Validation:** Zod

### Database
- **Primary DB:** PostgreSQL 15
- **Cache/Queue:** Redis 7
- **Schema Strategy:** Row-level multi-tenancy (single DB, tenant_id on all tables)

### Frontend (Admin Dashboard)
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Query + Zustand
- **Auth:** NextAuth.js

### Telegram Bot
- **Library:** node-telegram-bot-api or Grammy
- **Webhook Mode:** HTTPS webhook (more reliable than polling)

### Cloud Infrastructure (Azure)
- **Compute:** Azure Kubernetes Service (AKS)
- **Database:** Azure Database for PostgreSQL (Flexible Server)
- **Cache:** Azure Cache for Redis (Premium tier)
- **Storage:** Azure Blob Storage (document storage, backups)
- **CDN:** Azure Front Door (dashboard assets)
- **Load Balancer:** Azure Load Balancer / Ingress Controller
- **DNS:** Azure DNS
- **Secrets:** Azure Key Vault
- **Monitoring:** Azure Monitor + Application Insights
- **IaC:** Terraform (infrastructure provisioning)

### On-Premise Infrastructure (OpenShift 4)
- **Compute:** Red Hat OpenShift Container Platform 4.x
- **Database:** PostgreSQL 15 (external or containerized)
- **Cache:** Redis 7 (containerized)
- **Storage:** OpenShift Persistent Volumes (PV/PVC)
- **Ingress:** OpenShift Routes
- **Secrets:** OpenShift Secrets / External Secrets Operator
- **Monitoring:** OpenShift built-in monitoring + Prometheus

### Development Tools
- **Containerization:** Docker + Docker Compose (local), Podman compatible
- **Base Images:** Red Hat Universal Base Image (UBI 9) - Node.js 20
- **CI/CD:** GitHub Actions → Azure Container Registry (ACR) → AKS
- **IaC:** Terraform (Azure resources), Helm charts (Kubernetes)
- **API Documentation:** OpenAPI 3.0 (Swagger)
- **Testing:** Jest + Supertest (backend), Playwright (e2e)

---

## 4. Database Schema (Phase 1)

### Multi-tenant Strategy
All tables include `organization_id` (UUID). Row-level security policies enforce data isolation. Admin users belong to one organization; system queries filter by `organization_id` automatically via middleware.

### Core Tables

```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (admin role only in Phase 1)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, secretary, viewer
  telegram_id VARCHAR(50), -- for linking Telegram users
  telegram_username VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Team members (linked via Telegram, no web access)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  telegram_id VARCHAR(50) NOT NULL,
  telegram_username VARCHAR(100),
  name VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, telegram_id)
);

-- Meetings (synced from Google Calendar)
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  google_calendar_event_id VARCHAR(255), -- Google Calendar event ID
  google_calendar_id VARCHAR(255), -- Which calendar this event is from
  title VARCHAR(500) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INT DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  location VARCHAR(255),
  attendees JSONB DEFAULT '[]', -- Array of attendee emails from Calendar
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, google_calendar_event_id)
);

-- Meeting participants
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  team_member_id UUID REFERENCES team_members(id),
  role VARCHAR(50) DEFAULT 'attendee', -- organizer, secretary, attendee
  attendance_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, declined, attended
  CHECK (user_id IS NOT NULL OR team_member_id IS NOT NULL)
);

-- Minutes (meeting notes/summaries)
CREATE TABLE minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- structured markdown/JSON
  summary TEXT,
  topics_discussed TEXT[],
  status VARCHAR(50) DEFAULT 'draft', -- draft, published
  created_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id) -- one minute per meeting
);

-- Agreements/Tasks
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  minute_id UUID REFERENCES minutes(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  assigned_to_user UUID REFERENCES users(id),
  assigned_to_member UUID REFERENCES team_members(id),
  due_date DATE,
  priority VARCHAR(50) DEFAULT 'medium', -- high, medium, low
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, overdue, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Google integrations (Phase 1)
CREATE TABLE google_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT NOT NULL, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[], -- calendar.readonly, sheets, etc.
  connected_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Google Calendar sync config (Phase 1)
CREATE TABLE google_calendar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_ids TEXT[], -- Which calendars to sync (default: primary)
  sync_enabled BOOLEAN DEFAULT true,
  sync_days_ahead INT DEFAULT 30, -- How many days forward to sync
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Google Sheets export config (Phase 1)
CREATE TABLE google_sheets_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  spreadsheet_id VARCHAR(255) NOT NULL,
  sheet_name VARCHAR(255) DEFAULT 'Agreements',
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications/Bot messages log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_telegram_id VARCHAR(50) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- task_assigned, task_due_soon, meeting_reminder, etc.
  message_content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- meeting.created, minute.published, agreement.updated
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_meetings_org ON meetings(organization_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_gcal_event ON meetings(google_calendar_event_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_agreements_org ON agreements(organization_id);
CREATE INDEX idx_agreements_assigned ON agreements(assigned_to_user, assigned_to_member);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_telegram ON team_members(telegram_id);
CREATE INDEX idx_google_integrations_org ON google_integrations(organization_id);
```

---

## 5. API Structure (Phase 1)

### Authentication
- **POST** `/api/auth/register` - Create organization + admin user
- **POST** `/api/auth/login` - Email/password → JWT
- **POST** `/api/auth/logout` - Invalidate session
- **GET** `/api/auth/me` - Current user profile

### Organizations
- **GET** `/api/organization` - Get current org details
- **PATCH** `/api/organization` - Update org settings

### Users (Admin Management)
- **GET** `/api/users` - List users in org
- **POST** `/api/users` - Invite new admin user
- **PATCH** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Deactivate user

### Team Members
- **GET** `/api/team-members` - List team members
- **POST** `/api/team-members` - Add team member (manual or via Telegram link)
- **PATCH** `/api/team-members/:id` - Update member
- **DELETE** `/api/team-members/:id` - Remove member

### Meetings (Synced from Google Calendar)
- **GET** `/api/meetings` - List synced meetings (filter by date range, status)
- **GET** `/api/meetings/upcoming` - Get upcoming meetings (next 7 days)
- **GET** `/api/meetings/:id` - Get meeting details + attendees
- **POST** `/api/meetings/sync` - Trigger manual sync from Google Calendar

### Minutes
- **POST** `/api/meetings/:meetingId/minutes` - Create/update minute
- **GET** `/api/meetings/:meetingId/minutes` - Get minute for meeting
- **POST** `/api/meetings/:meetingId/minutes/publish` - Publish minute → triggers Sheets export + notifications

### Agreements
- **GET** `/api/agreements` - List agreements (filter by status, assignee, date)
- **POST** `/api/agreements` - Create standalone agreement
- **GET** `/api/agreements/:id` - Get agreement details
- **PATCH** `/api/agreements/:id` - Update agreement (status, details)
- **DELETE** `/api/agreements/:id` - Delete agreement

### Telegram Webhook
- **POST** `/api/telegram/webhook` - Receive Telegram updates (secured with secret token)

### Google Integrations
- **POST** `/api/integrations/google/auth` - OAuth flow start (Calendar + Sheets scopes)
- **GET** `/api/integrations/google/callback` - OAuth callback
- **GET** `/api/integrations/google/status` - Check connection status
- **DELETE** `/api/integrations/google/disconnect` - Revoke access

#### Google Calendar
- **GET** `/api/integrations/google/calendar/list` - List available calendars
- **POST** `/api/integrations/google/calendar/configure` - Select calendars to sync
- **POST** `/api/integrations/google/calendar/sync` - Manual sync trigger
- **GET** `/api/integrations/google/calendar/config` - Get current sync config

#### Google Sheets
- **POST** `/api/integrations/google/sheets/configure` - Set up Sheets export
- **POST** `/api/integrations/google/sheets/sync` - Manual sync trigger (export agreements)

### Dashboard Stats (Phase 1 basic)
- **GET** `/api/dashboard/stats` - Summary: upcoming meetings, pending agreements, recent activity

---

## 6. Telegram Bot Design (Phase 1)

### Bot Commands

| Command | Description | Response |
|---------|-------------|----------|
| `/start` | Link Telegram account to organization | Sends verification code or auth link |
| `/reuniones` | Show upcoming meetings (from Calendar) | List of next 5 meetings with dates/times |
| `/proxima` | Show next meeting details | Next meeting from Calendar with option to create minute |
| `/minuta` | Create/update minute for a meeting | Interactive flow to select meeting and add content |
| `/tareas` | List my assigned tasks | Formatted list with due dates, priority |
| `/pendientes` | List all pending agreements in org | Team-wide view |
| `/resumen` | Get summary of last published meeting | Meeting title, date, key points, my tasks |
| `/help` | Bot usage guide | Command list |

### Notification Types (Phase 1)
- **Task assigned:** "Nueva tarea asignada: [title] - Vence: [date]"
- **Task due soon:** "Recordatorio: [title] vence en 2 días"
- **Meeting reminder:** "Reunión mañana: [title] a las [time]"
- **Minute published:** "Nueva minuta publicada: [meeting title]"

### Bot Flow: User Linking
1. Admin adds team member to dashboard with Telegram username (optional)
2. User sends `/start` to bot
3. Bot asks for verification code (sent to admin) OR admin pre-approves via link
4. Bot confirms: "Vinculado a [Org Name]"
5. User can now use commands

### Technical Implementation
- **Webhook mode:** Telegram sends updates to `/api/telegram/webhook`
- **Message handling:** Express middleware → parse command → query DB → format response
- **Rate limiting:** Redis-backed rate limiter (prevent abuse)
- **Error handling:** Graceful error messages to user

---

## 7. Google Calendar Integration (Phase 1)

### Integration Strategy
**Google Calendar is the source of truth for meetings.** CODA syncs events read-only.

### Sync Flow
1. Admin connects Google account via OAuth in dashboard
2. System requests scopes: `calendar.readonly`, `calendar.events.readonly`
3. Admin selects which calendars to sync (default: primary calendar)
4. Background job syncs events every 15 minutes
5. Events are stored in `meetings` table with `google_calendar_event_id`

### What Gets Synced
- **Event title** → `meetings.title`
- **Event description** → `meetings.description`
- **Start time** → `meetings.scheduled_at`
- **End time** → `meetings.end_time`
- **Duration** → calculated from start/end
- **Location** → `meetings.location`
- **Attendees** → `meetings.attendees` (JSONB array)
- **Status** → `meetings.status`

### Sync Rules
- Only sync events in the next 30 days (configurable)
- Skip all-day events (optional filter)
- Skip declined events
- Update existing meetings if event changes in Calendar
- Mark meeting as `cancelled` if event is deleted in Calendar

### Bot Integration
When a user asks about meetings (`/reuniones`, `/proxima`), bot shows synced Calendar events. User can then create a minute for any upcoming/past meeting.

### Technical Implementation
- **Library:** `googleapis` npm package
- **Sync job:** Cron job every 15 min (or webhook via Google Calendar API push notifications)
- **Rate limits:** Batch requests (up to 50 events per API call)
- **Error handling:** If sync fails, retry with exponential backoff

---

## 8. Google Sheets Integration (Phase 1)

### Export Strategy
When a minute is published (`POST /api/meetings/:id/minutes/publish`):
1. System extracts all agreements linked to the minute
2. Appends rows to configured Google Sheet:
   - **Columns:** Meeting Date | Meeting Title | Agreement | Assigned To | Due Date | Priority | Status
3. Sheet is shared (view-only) with team

### OAuth Setup
- Admin authorizes Google via OAuth 2.0 in dashboard
- System requests scopes: `spreadsheets`, `drive.file`, `calendar.readonly`
- Refresh token stored encrypted in `google_integrations` table

### Sheet Template
System creates a new sheet or appends to existing. Format:

| Meeting Date | Meeting Title | Agreement | Assigned To | Due Date | Priority | Status |
|--------------|---------------|-----------|-------------|----------|----------|--------|
| 2026-03-20   | Weekly Sync   | Update KPI dashboard | Manuel | 2026-03-27 | High | Pending |

**No reverse sync in Phase 1** — Sheet is output-only.

---

## 9. Security & Authentication

### Authentication Flow
1. **Admin login:** Email/password → bcrypt hash verification → JWT (24h expiry)
2. **JWT payload:** `{ userId, organizationId, role, email }`
3. **Token refresh:** Automatic refresh before expiry (stored in httpOnly cookie)

### Authorization (RBAC)
- **Roles:** `admin`, `secretary`, `viewer` (Phase 1 only uses `admin`)
- **Middleware:** Extract JWT → verify org context → check role permissions
- **API protection:** All `/api/*` routes require valid JWT except `/auth/*`

### Multi-tenant Isolation
- **Middleware:** `organizationContext` extracts `organizationId` from JWT
- **Query filtering:** Prisma queries automatically filter by `organizationId`
- **Row-level security:** PostgreSQL policies as fallback (defense in depth)

### Secrets Management
- **Environment variables:** Loaded from AWS Secrets Manager
- **Encrypted at rest:** Database credentials, API keys, OAuth tokens
- **Telegram webhook:** Secured with secret token (validated on each request)

### Data Privacy
- **GDPR compliance:** User data export, deletion on request
- **Audit logs:** All critical actions logged with user, timestamp, IP
- **Encryption:** TLS 1.3 in transit, AES-256 at rest (RDS encryption enabled)

---

## 10. Deployment Architecture

### 10.1 Azure AKS Deployment (Cloud - Production)

#### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│         Azure Front Door (CDN + WAF + SSL termination)      │
│                  coda.heybanco.mx                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│            Azure Kubernetes Service (AKS)                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ingress Controller (nginx or Azure App Gateway)    │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────▼─────────────┬───────────────────────────┐  │
│  │  Backend Deployment      │  Dashboard Deployment     │  │
│  │  (API + Bot)             │  (Next.js SSR)           │  │
│  │  Replicas: 2-10          │  Replicas: 2-5           │  │
│  │  Red Hat UBI Node.js 20  │  Red Hat UBI Node.js 20  │  │
│  └──────────────────────────┴───────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
           │                              │
           │                              │
┌──────────▼──────────┐    ┌──────────────▼────────────┐
│  Azure Database     │    │  Azure Cache for Redis    │
│  for PostgreSQL     │    │  Premium tier             │
│  Flexible Server    │    │  HA enabled               │
│  HA enabled         │    │  6GB memory               │
└─────────────────────┘    └───────────────────────────┘
           │
           │
┌──────────▼──────────┐
│  Azure Blob Storage │
│  Hot tier (docs)    │
│  Cool tier (backups)│
└─────────────────────┘
```

#### Terraform Infrastructure

**Resource Group Structure:**
```
rg-coda-prod-eastus2
├── AKS Cluster (aks-coda-prod)
│   ├── System node pool (2 nodes, Standard_D2s_v3)
│   └── User node pool (2-10 nodes, Standard_D4s_v3, autoscaling)
├── Azure Database for PostgreSQL (psql-coda-prod)
│   ├── SKU: General Purpose, 2 vCores, 8GB RAM
│   ├── HA enabled (zone-redundant)
│   └── Automated backups (7 days retention)
├── Azure Cache for Redis (redis-coda-prod)
│   ├── SKU: Premium P1 (6GB)
│   └── HA enabled
├── Azure Container Registry (acrcoda)
├── Azure Key Vault (kv-coda-prod)
├── Azure Storage Account (stcodaprod)
├── Azure Front Door (fd-coda-prod)
└── Application Insights (ai-coda-prod)
```

#### Container Image Strategy

**Base Image:** Red Hat Universal Base Image (UBI 9)
```dockerfile
# Dockerfile (Red Hat certified)
FROM registry.access.redhat.com/ubi9/nodejs-20:latest AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:latest

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Non-root user (OpenShift compatible)
USER 1001

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Image Registry:** Azure Container Registry (ACR)
- Repo: `acrcoda.azurecr.io/coda-backend:${GIT_SHA}`
- Geo-replication enabled
- Image scanning enabled (Defender for Containers)

#### Kubernetes Manifests

**Deployment (backend):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coda-backend
  namespace: coda-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: coda-backend
  template:
    metadata:
      labels:
        app: coda-backend
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: backend
        image: acrcoda.azurecr.io/coda-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: coda-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: coda-secrets
              key: redis-url
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Horizontal Pod Autoscaler:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: coda-backend-hpa
  namespace: coda-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: coda-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Azure Services Configuration

**Azure Database for PostgreSQL:**
```hcl
# Terraform
resource "azurerm_postgresql_flexible_server" "coda" {
  name                = "psql-coda-prod"
  location            = var.location
  resource_group_name = azurerm_resource_group.coda.name
  
  sku_name   = "GP_Standard_D2s_v3"
  storage_mb = 32768
  version    = "15"
  
  high_availability {
    mode = "ZoneRedundant"
  }
  
  backup_retention_days = 7
  geo_redundant_backup_enabled = true
  
  administrator_login    = "codaadmin"
  administrator_password = var.db_password
  
  zone = "1"
}
```

**Azure Cache for Redis:**
```hcl
resource "azurerm_redis_cache" "coda" {
  name                = "redis-coda-prod"
  location            = var.location
  resource_group_name = azurerm_resource_group.coda.name
  
  sku_name = "Premium"
  family   = "P"
  capacity = 1
  
  redis_configuration {
    enable_authentication = true
  }
  
  zones = ["1", "2"]
}
```

#### Networking

**VNet Configuration:**
- VNet: `10.0.0.0/16`
- Subnets:
  - AKS system: `10.0.1.0/24`
  - AKS user: `10.0.2.0/23`
  - PostgreSQL: `10.0.4.0/24`
  - Redis: `10.0.5.0/24`

**Network Security:**
- Network Policies enabled (Calico or Azure CNI)
- Private endpoints for PostgreSQL and Redis
- Public access disabled on databases (VNet integration only)
- NSG rules: only AKS → DB/Redis allowed

#### CI/CD Pipeline (GitHub Actions → AKS)

```yaml
# .github/workflows/deploy-aks.yml
name: Deploy to AKS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to ACR
        uses: azure/docker-login@v1
        with:
          login-server: acrcoda.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      
      - name: Build and push Docker image
        run: |
          docker build -f packages/backend/Dockerfile \
            -t acrcoda.azurecr.io/coda-backend:${{ github.sha }} \
            -t acrcoda.azurecr.io/coda-backend:latest .
          docker push acrcoda.azurecr.io/coda-backend:${{ github.sha }}
          docker push acrcoda.azurecr.io/coda-backend:latest
      
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Login to AKS
        uses: azure/aks-set-context@v3
        with:
          resource-group: rg-coda-prod-eastus2
          cluster-name: aks-coda-prod
      
      - name: Deploy to AKS
        run: |
          kubectl set image deployment/coda-backend \
            backend=acrcoda.azurecr.io/coda-backend:${{ github.sha }} \
            -n coda-prod
          kubectl rollout status deployment/coda-backend -n coda-prod
```

---

### 10.2 OpenShift 4 Deployment (On-Premise)

#### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenShift Container Platform 4.x         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OpenShift Routes (TLS termination)                  │  │
│  │  coda.heybanco.local                                 │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────▼─────────────┬───────────────────────────┐  │
│  │  DeploymentConfig        │  DeploymentConfig         │  │
│  │  coda-backend            │  coda-dashboard           │  │
│  │  Replicas: 2-10          │  Replicas: 2-5           │  │
│  │  Red Hat UBI Node.js 20  │  Red Hat UBI Node.js 20  │  │
│  └──────────────────────────┴───────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────┬───────────────────────────┐  │
│  │  PostgreSQL              │  Redis                    │  │
│  │  (StatefulSet or         │  (StatefulSet)           │  │
│  │   external DB)           │  Persistent storage      │  │
│  └──────────────────────────┴───────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### OpenShift Template

**DeploymentConfig (backend):**
```yaml
apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: coda-backend
  namespace: coda-prod
spec:
  replicas: 2
  selector:
    app: coda-backend
  template:
    metadata:
      labels:
        app: coda-backend
    spec:
      containers:
      - name: backend
        image: registry.heybanco.local/coda/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: coda-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: coda-secrets
              key: redis-url
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 10
  triggers:
  - type: ConfigChange
  - type: ImageChange
    imageChangeParams:
      automatic: true
      containerNames:
      - backend
      from:
        kind: ImageStreamTag
        name: coda-backend:latest
```

**Route (Ingress):**
```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: coda-backend
  namespace: coda-prod
spec:
  host: coda.heybanco.local
  to:
    kind: Service
    name: coda-backend
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
  port:
    targetPort: 3000
```

#### OpenShift-Specific Features

**Image Streams:**
```bash
# Create ImageStream from Red Hat registry
oc import-image nodejs-20 \
  --from=registry.access.redhat.com/ubi9/nodejs-20:latest \
  --confirm

# Tag custom image
oc tag registry.heybanco.local/coda/backend:${GIT_SHA} \
  coda-backend:latest
```

**Security Context Constraints (SCC):**
- Use `restricted-v2` SCC (default for most workloads)
- No privileged containers required
- Runs as non-root user (UID 1001)
- ReadOnlyRootFilesystem enabled where possible

**Persistent Storage:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: coda-prod
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: openshift-storage
```

#### Deployment Process (OpenShift)

```bash
# Login to OpenShift
oc login https://api.ocp.heybanco.local:6443

# Create project
oc new-project coda-prod

# Create secrets
oc create secret generic coda-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=telegram-token="..." \
  -n coda-prod

# Apply manifests
oc apply -f k8s/openshift/ -n coda-prod

# Trigger deployment
oc rollout latest dc/coda-backend -n coda-prod

# Monitor
oc rollout status dc/coda-backend -n coda-prod
```

---

### 10.3 Monitoring & Observability

#### Azure (AKS)
- **Application Insights:** APM, distributed tracing
- **Azure Monitor:** Metrics, alerts, dashboards
- **Log Analytics:** Centralized logging
- **Container Insights:** Node/pod/container metrics

#### OpenShift
- **Built-in Prometheus:** Metrics collection
- **Grafana:** Dashboards
- **Elasticsearch + Fluentd + Kibana (EFK):** Log aggregation
- **OpenShift Console:** Built-in monitoring UI

#### Custom Metrics
```typescript
// Track custom metrics
import { Counter, Histogram } from 'prom-client';

const botCommandCounter = new Counter({
  name: 'coda_bot_commands_total',
  help: 'Total bot commands received',
  labelNames: ['command', 'organization']
});

const calendarSyncDuration = new Histogram({
  name: 'coda_calendar_sync_duration_seconds',
  help: 'Calendar sync duration',
  labelNames: ['organization']
});
```

---

## 11. Development Workflow (Phase 1)

### Sprint Breakdown (6 weeks)

**Sprint 1 (Weeks 1-2): Foundation**
- Set up monorepo structure (`/backend`, `/dashboard`)
- Prisma schema + migrations (with Google Calendar fields)
- JWT auth + user registration
- Basic REST API (organizations, users, team members)
- Docker setup + local dev environment

**Sprint 2 (Weeks 3-4): Google Integration + Core Features**
- Google OAuth flow (Calendar + Sheets scopes)
- Google Calendar sync service (read events, store in DB)
- Background job for periodic sync (every 15 min)
- Minutes creation + publishing (link to synced meetings)
- Agreements CRUD
- Telegram bot: `/start`, `/reuniones`, `/proxima`, `/minuta`, `/tareas`

**Sprint 3 (Weeks 5-6): Bot + Dashboard + Export**
- Telegram bot: `/pendientes`, `/resumen` + notifications
- Webhook setup + command routing
- Google Sheets export on minute publish
- Admin dashboard: upcoming meetings (from Calendar), minutes, agreements
- Calendar sync config UI (select calendars)
- AWS deployment + production setup

### Devin Task Assignments
**Devin handles:**
- Boilerplate API endpoints (CRUD operations for agreements, minutes)
- Database schema implementation (Prisma migrations with Google Calendar fields)
- Google OAuth flow (Calendar + Sheets)
- Google Calendar sync service (fetch events, store/update in DB)
- Background job for periodic Calendar sync
- Telegram bot command handlers (all commands)
- Google Sheets export API integration
- Dashboard UI components (meetings list from Calendar, minutes, agreements)
- Docker + AWS deployment scripts

**Franco reviews/refines:**
- Architecture decisions
- Security implementation
- Multi-tenant middleware
- Bot conversation flow
- Dashboard UX
- Testing + bug fixes

---

## 12. Phase 2 & 3 Preparation

### Phase 2 Extensions (AI + Workspace)
- **AI Service Layer:** New microservice for AI operations (LangChain/LlamaIndex)
- **Vector DB:** Pinecone or pgvector for RAG
- **New tables:** `knowledge_base`, `kpis`, `pre_meeting_briefs`
- **Calendar write access:** Create/update events from CODA (currently read-only)
- **Drive integration:** Index documents, extract text from meeting attachments

### Phase 3 Extensions (WhatsApp + Advanced)
- **WhatsApp integration:** Separate service (compliance + rate limits)
- **Gmail integration:** OAuth + message parsing
- **Sheets reverse sync:** Webhook from Google Apps Script or polling
- **Notion integration:** API client + sync service

### Extensibility Points
- **Plugin architecture:** Each integration as pluggable module
- **Event bus:** Redis Pub/Sub for decoupled services
- **API versioning:** `/api/v1/...` for backward compatibility

---

## 13. Success Metrics (Phase 1 Validation)

**After 60 days with HeyBanco pilot:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bot retention (active users) | >60% | Users who sent at least 1 command in last 7 days / total invited |
| Meeting logging rate | >80% | Meetings with published minutes / total scheduled meetings |
| Average response time (bot) | <3s | P95 latency for bot commands |
| Sheets export success rate | >99% | Successful syncs / total publish events |
| Dashboard uptime | >99% | Measured via AWS health checks |

**Validation decision:** If metrics hit targets, proceed to Phase 2. If not, iterate on UX before investing in AI.

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low bot adoption | High | Clear onboarding, push notifications, admin can see usage |
| Google Calendar sync failures | Medium | Exponential backoff, retry logic, admin alerts |
| Google API rate limits | Medium | Batch requests, caching, implement exponential backoff |
| Multi-tenant data leak | Critical | Automated tests for org isolation, row-level security policies |
| Telegram bot downtime | Medium | Webhook retry logic, health monitoring, fallback to polling |
| Slow dashboard performance | Medium | Redis caching, pagination, lazy loading |
| Calendar permissions issues | Medium | Clear OAuth consent screen, error messages with troubleshooting |

---

## 15. Next Steps

1. **Architecture review** (Franco + Manuel) - validate decisions
2. **Create GitHub repos** (`coda-backend`, `coda-dashboard`)
3. **Devin kickoff** - Sprint 1 implementation plan
4. **AWS account setup** - VPC, RDS, ECR, secrets
5. **HeyBanco pilot prep** - identify 10-15 team members, set expectations

---

**Document Owner:** Franco (Clawdbot AI)  
**Approved by:** Manuel Arámburu (HeyBanco)  
**Devin API Key:** `apk_user_Z2l0aHVifDI2ODc2NzMwOV9vcmctYzAwZTg4ZjVhZGIyNDZiZGJiNWZjMTViNzlmYzRiNzY6NWY1NjNmMDA2MmVhNGIxMmIzZTJkMGQyYjlkZDc5Nzg=`

**Status:** Ready for implementation - Phase 1 MVP (6 weeks)
