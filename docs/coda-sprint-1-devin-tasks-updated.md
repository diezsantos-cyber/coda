# CODA Sprint 1 - Devin Task List (UPDATED)
**Version:** 1.1 (Google Calendar Integration)  
**Date:** March 23, 2026  
**Timeline:** 10 days to working MVP  
**Phase:** 1 (Foundation + Google Calendar + Bot + Sheets)

---

## Key Changes from Original Plan

**IMPORTANT:** Google Calendar is now Phase 1 (not Phase 2).

**New Flow:**
1. Meetings come from Google Calendar (read-only sync)
2. Users create minutas (minutes) for synced Calendar events
3. Minutas contain agreements/tasks
4. When published → export to Google Sheets + notify via bot

**No manual meeting creation in CODA** - Calendar is the source of truth.

---

## Task Breakdown (13 tasks → 15 tasks)

### Task 1: Project Setup & Monorepo Structure
**Estimated Time:** 30 minutes

**Deliverables:**
```
coda/
├── package.json (workspaces)
├── .gitignore
├── docker-compose.yml
├── README.md
├── packages/
│   ├── backend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   ├── prisma/
│   │   └── src/
│   └── dashboard/
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.local.example
│       ├── next.config.js
│       └── src/
```

**Setup:**
- npm workspaces root `package.json`
- Backend: Node.js 20 + TypeScript + Express
- Dashboard: Next.js 14 + TypeScript
- Docker Compose: PostgreSQL 15 + Redis 7
- ESLint + Prettier configs

**Commands:**
```json
// Root package.json scripts
{
  "dev": "npm run dev --workspaces",
  "build": "npm run build --workspaces",
  "lint": "npm run lint --workspaces"
}
```

---

### Task 2: Prisma Schema (Multi-tenant + Google Calendar)
**Estimated Time:** 45 minutes

**Deliverables:**
- `prisma/schema.prisma` with models:
  - `Organization` (tenant)
  - `User` (admin users)
  - `TeamMember` (bot users)
  - `Meeting` (synced from Google Calendar) ⭐ NEW FIELDS
  - `Minute` (meeting notes)
  - `Agreement` (tasks/decisions)
  - `GoogleIntegration` ⭐ NEW
  - `GoogleCalendarConfig` ⭐ NEW
  - `GoogleSheetsExport`
  - `Notification`
  - `AuditLog`

**Key changes to `Meeting` model:**
```prisma
model Meeting {
  id                     String   @id @default(uuid())
  organizationId         String   @map("organization_id")
  googleCalendarEventId  String?  @map("google_calendar_event_id")
  googleCalendarId       String?  @map("google_calendar_id")
  title                  String
  description            String?
  scheduledAt            DateTime @map("scheduled_at")
  endTime                DateTime? @map("end_time")
  durationMinutes        Int?     @default(60) @map("duration_minutes")
  status                 String   @default("scheduled")
  location               String?
  attendees              Json     @default("[]")
  lastSyncedAt           DateTime? @map("last_synced_at")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  minutes      Minute[]

  @@unique([organizationId, googleCalendarEventId])
  @@index([organizationId])
  @@index([googleCalendarEventId])
  @@index([scheduledAt])
  @@map("meetings")
}
```

**New models:**
```prisma
model GoogleIntegration {
  id                String   @id @default(uuid())
  organizationId    String   @unique @map("organization_id")
  accessToken       String   @map("access_token") // Encrypted
  refreshToken      String   @map("refresh_token") // Encrypted
  tokenExpiresAt    DateTime? @map("token_expires_at")
  scopes            String[]
  connectedEmail    String?  @map("connected_email")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("google_integrations")
}

model GoogleCalendarConfig {
  id              String   @id @default(uuid())
  organizationId  String   @unique @map("organization_id")
  calendarIds     String[] @map("calendar_ids") // Which calendars to sync
  syncEnabled     Boolean  @default(true) @map("sync_enabled")
  syncDaysAhead   Int      @default(30) @map("sync_days_ahead")
  lastSyncAt      DateTime? @map("last_sync_at")
  createdAt       DateTime @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("google_calendar_configs")
}
```

**Run:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### Task 3: JWT Authentication + Multi-tenant Middleware
**Estimated Time:** 1 hour

**Deliverables:**
- `src/middleware/auth.ts` - JWT verification
- `src/middleware/tenantIsolation.ts` - Org context extraction
- `src/services/auth.service.ts` - Login, register, token refresh
- `src/utils/jwt.ts` - Sign/verify tokens
- `src/utils/encryption.ts` ⭐ NEW - Encrypt/decrypt Google tokens

**Routes:**
- `POST /api/auth/register` - Create org + admin user
- `POST /api/auth/login` - Email/password → JWT
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Current user

**Token payload:**
```typescript
interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}
```

**Encryption:**
Use `crypto` module to encrypt/decrypt Google OAuth tokens before storing in DB.

---

### Task 4: Google OAuth Flow (Calendar + Sheets)
**Estimated Time:** 1.5 hours ⭐ NEW TASK

**Deliverables:**
- `src/services/google-oauth.service.ts` - OAuth flow
- `src/controllers/google-integration.controller.ts` - OAuth routes

**Required Scopes:**
```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];
```

**Routes:**
- `POST /api/integrations/google/auth` - Generate OAuth URL
- `GET /api/integrations/google/callback` - Handle OAuth callback
- `GET /api/integrations/google/status` - Check if connected
- `DELETE /api/integrations/google/disconnect` - Revoke tokens

**Flow:**
1. Admin clicks "Connect Google" in dashboard
2. Backend generates OAuth URL with scopes
3. User authorizes in Google
4. Google redirects to callback with code
5. Backend exchanges code for access_token + refresh_token
6. Store encrypted tokens in `google_integrations` table
7. Redirect to dashboard with success message

**Library:** `googleapis` npm package

---

### Task 5: Google Calendar Sync Service
**Estimated Time:** 2 hours ⭐ NEW TASK

**Deliverables:**
- `src/services/google-calendar.service.ts` - Fetch events, sync to DB
- `src/jobs/calendar-sync.job.ts` - Background sync job

**Core Functions:**
```typescript
class GoogleCalendarService {
  async syncEvents(organizationId: string): Promise<void>
  async fetchCalendarEvents(calendarId: string, daysAhead: number): Promise<CalendarEvent[]>
  async upsertMeeting(event: CalendarEvent, organizationId: string): Promise<void>
  async markMeetingCancelled(eventId: string, organizationId: string): Promise<void>
}
```

**Sync Logic:**
1. Get `GoogleIntegration` for org (access_token)
2. Get `GoogleCalendarConfig` (which calendars, how many days ahead)
3. For each calendar:
   - Fetch events from now to `now + syncDaysAhead`
   - Skip all-day events
   - Skip declined events
4. For each event:
   - Check if exists in DB (by `googleCalendarEventId`)
   - If exists → update (title, time, status)
   - If not → create new `Meeting`
5. Mark events as cancelled if no longer in Calendar
6. Update `GoogleCalendarConfig.lastSyncAt`

**Background Job:**
- Run every 15 minutes
- For each org with `syncEnabled: true`
- Handle errors (log + retry with exponential backoff)

**Cron setup:** Use `node-cron` or similar

---

### Task 6: Google Calendar API Endpoints
**Estimated Time:** 1 hour ⭐ NEW TASK

**Deliverables:**
- `src/controllers/google-calendar.controller.ts`

**Routes:**
- `GET /api/integrations/google/calendar/list` - List user's calendars
- `POST /api/integrations/google/calendar/configure` - Select calendars to sync
- `GET /api/integrations/google/calendar/config` - Get current config
- `POST /api/integrations/google/calendar/sync` - Trigger manual sync

**Example:**
```typescript
// GET /api/integrations/google/calendar/list
{
  "calendars": [
    { "id": "primary", "summary": "Manuel's Calendar", "primary": true },
    { "id": "abc@group.calendar.google.com", "summary": "HeyBanco Team" }
  ]
}

// POST /api/integrations/google/calendar/configure
{
  "calendarIds": ["primary", "abc@group.calendar.google.com"],
  "syncDaysAhead": 30
}
```

---

### Task 7: Meetings API (Read-only)
**Estimated Time:** 45 minutes

**Deliverables:**
- `src/controllers/meeting.controller.ts`
- `src/services/meeting.service.ts`

**Routes:**
- `GET /api/meetings` - List synced meetings (filter by date range, status)
- `GET /api/meetings/upcoming` - Next 7 days
- `GET /api/meetings/:id` - Get meeting details
- `POST /api/meetings/sync` - Trigger manual sync (calls GoogleCalendarService)

**No create/update/delete** - meetings are synced from Calendar.

---

### Task 8: Minutes CRUD API
**Estimated Time:** 1 hour

**Deliverables:**
- `src/controllers/minute.controller.ts`
- `src/services/minute.service.ts`

**Routes:**
- `POST /api/meetings/:meetingId/minutes` - Create/update minute
- `GET /api/meetings/:meetingId/minutes` - Get minute for meeting
- `POST /api/meetings/:meetingId/minutes/publish` - Publish minute → trigger Sheets export + notifications

**Minute Model:**
```typescript
{
  content: string; // Markdown or structured JSON
  summary?: string;
  topicsDiscussed: string[];
  status: 'draft' | 'published';
}
```

**On publish:**
1. Extract agreements from minute
2. Create `Agreement` records
3. Export to Google Sheets (Task 10)
4. Send notifications to assigned users (Task 12)

---

### Task 9: Agreements CRUD API
**Estimated Time:** 1 hour

**Deliverables:**
- `src/controllers/agreement.controller.ts`
- `src/services/agreement.service.ts`

**Routes:**
- `GET /api/agreements` - List agreements (filter by status, assignee, meeting)
- `POST /api/agreements` - Create standalone agreement
- `GET /api/agreements/:id` - Get details
- `PATCH /api/agreements/:id` - Update (status, due date, assignee)
- `DELETE /api/agreements/:id` - Delete

**Fields:**
```typescript
{
  title: string;
  description?: string;
  assignedToUser?: string; // UUID
  assignedToMember?: string; // UUID
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  meetingId?: string; // Link to meeting
  minuteId?: string; // Link to minute
}
```

---

### Task 10: Google Sheets Export
**Estimated Time:** 1.5 hours

**Deliverables:**
- `src/services/google-sheets.service.ts`
- `src/controllers/google-sheets.controller.ts`

**Routes:**
- `POST /api/integrations/google/sheets/configure` - Set spreadsheet ID
- `POST /api/integrations/google/sheets/sync` - Manual export

**Export Function:**
```typescript
async exportAgreementsToSheet(minuteId: string, organizationId: string): Promise<void>
```

**Logic:**
1. Get `GoogleSheetsExport` config for org
2. Get all agreements linked to minute
3. Format as rows:
   ```
   Meeting Date | Meeting Title | Agreement | Assigned To | Due Date | Priority | Status
   ```
4. Append to sheet using `googleapis`
5. Update `GoogleSheetsExport.lastSyncAt`

**Sheet creation:** If no spreadsheet exists, create new sheet named "CODA - Agreements"

---

### Task 11: Telegram Bot Foundation
**Estimated Time:** 2 hours

**Deliverables:**
- `src/bot/index.ts` - Bot initialization
- `src/bot/commands/` - Command handlers
- `src/bot/middleware.ts` - User verification
- `src/controllers/telegram-webhook.controller.ts`

**Library:** `node-telegram-bot-api` or `Grammy`

**Commands:**
- `/start` - Link Telegram user to org
- `/reuniones` - Show upcoming meetings from Calendar ⭐ NEW
- `/proxima` - Show next meeting + option to create minute ⭐ NEW
- `/minuta` - Create/update minute for a meeting ⭐ NEW
- `/tareas` - My assigned agreements
- `/pendientes` - All pending agreements
- `/resumen` - Last published minute
- `/help` - Command list

**Webhook:**
- `POST /api/telegram/webhook` - Secured with secret token
- Parse updates → route to command handlers

---

### Task 12: Bot Command Implementations
**Estimated Time:** 2.5 hours

**Deliverables:**
- `src/bot/commands/start.ts` - User linking
- `src/bot/commands/reuniones.ts` ⭐ NEW - List upcoming meetings
- `src/bot/commands/proxima.ts` ⭐ NEW - Next meeting
- `src/bot/commands/minuta.ts` ⭐ NEW - Create minute
- `src/bot/commands/tareas.ts` - My tasks
- `src/bot/commands/pendientes.ts` - All tasks
- `src/bot/commands/resumen.ts` - Last minute summary
- `src/bot/commands/help.ts`

**Example: `/reuniones`**
```
📅 Próximas reuniones:

1. Weekly Sync
   🕐 Hoy 15:00 - 16:00
   📍 Sala de Juntas
   
2. Sprint Planning
   🕐 Mañana 10:00 - 11:30
   📍 Google Meet

3. Client Review
   🕐 25 Mar 14:00 - 15:00
   📍 Zoom

Para crear minuta: /minuta
```

**Example: `/proxima`**
```
📅 Próxima reunión:

Weekly Sync
🕐 Hoy 15:00 - 16:00
📍 Sala de Juntas
👥 Manuel, Juan, María

¿Quieres crear la minuta?
[Crear minuta] [Ver agenda]
```

**Example: `/minuta`** (Interactive)
```
Bot: ¿Para qué reunión?
User: selecciona "Weekly Sync"

Bot: Escribe el contenido de la minuta:
User: [texto largo con puntos, acuerdos, etc.]

Bot: ¿Algún acuerdo para registrar? (formato: @usuario tarea - fecha)
User: @juan Actualizar dashboard - 2026-03-30

Bot: Minuta guardada como borrador. /publicar para publicar.
```

---

### Task 13: Notifications Service
**Estimated Time:** 1 hour

**Deliverables:**
- `src/services/notification.service.ts`
- `src/jobs/notification.job.ts`

**Notification Types:**
- Task assigned: "Nueva tarea: [title] - Vence: [date]"
- Task due soon: "Recordatorio: [title] vence en 2 días"
- Meeting reminder: "Reunión en 1 hora: [title]"
- Minute published: "Nueva minuta: [meeting title]"

**Background Job:**
- Run every hour
- Check for:
  - Tasks due in 2 days (send reminder)
  - Meetings starting in 1 hour (send reminder)
- Send via Telegram bot

---

### Task 14: Dashboard - Google Integration UI
**Estimated Time:** 2 hours ⭐ NEW TASK

**Deliverables:**
- `src/app/dashboard/integrations/page.tsx`
- `src/components/GoogleConnectButton.tsx`
- `src/components/CalendarSyncConfig.tsx`

**UI Flow:**
1. **Not connected:**
   - Show "Connect Google Calendar" button
   - On click → redirect to OAuth URL
2. **Connected:**
   - Show connected email
   - Show list of available calendars (checkboxes)
   - "Sync now" button
   - Last sync timestamp
   - "Disconnect" button

**Components:**
```tsx
<GoogleConnectButton onConnect={() => window.location.href = oauthUrl} />

<CalendarSyncConfig
  calendars={availableCalendars}
  selectedIds={config.calendarIds}
  onSave={handleSave}
/>
```

---

### Task 15: Dashboard - Meetings & Minutes UI
**Estimated Time:** 3 hours

**Deliverables:**
- `src/app/dashboard/meetings/page.tsx` - List synced meetings
- `src/app/dashboard/meetings/[id]/page.tsx` - Meeting details + minute editor
- `src/app/dashboard/agreements/page.tsx` - Agreements table
- `src/components/MeetingCard.tsx`
- `src/components/MinuteEditor.tsx`
- `src/components/AgreementTable.tsx`

**Meetings Page:**
- Calendar view or list view
- Filter: Upcoming, Past, All
- Show synced meetings from Google Calendar
- Click → go to meeting detail page

**Meeting Detail:**
- Meeting info (synced from Calendar): title, time, attendees
- Minute editor (if exists, else "Create minute" button)
- List of agreements from this meeting
- "Publish minute" button

**Minute Editor:**
- Rich text editor (markdown or WYSIWYG)
- Agreements section (add/remove tasks)
- Assign to team members
- Draft/Published status

**Agreements Page:**
- Table: Title | Assigned To | Due Date | Priority | Status | Meeting
- Filters: Status, Assignee, Date range
- Inline editing (status update)

---

## Development Order (Critical Path)

**Day 1-2:**
1. Task 1 (Setup)
2. Task 2 (Schema)
3. Task 3 (Auth)

**Day 3-4:**
4. Task 4 (Google OAuth)
5. Task 5 (Calendar Sync Service)
6. Task 6 (Calendar API)

**Day 5-6:**
7. Task 7 (Meetings API)
8. Task 8 (Minutes API)
9. Task 9 (Agreements API)

**Day 7-8:**
10. Task 10 (Sheets Export)
11. Task 11 (Bot Foundation)
12. Task 12 (Bot Commands)

**Day 9-10:**
13. Task 13 (Notifications)
14. Task 14 (Dashboard - Integrations UI)
15. Task 15 (Dashboard - Meetings/Minutes UI)

---

## Testing Checklist

### Google Calendar Integration
- [ ] OAuth flow works
- [ ] Can list user's calendars
- [ ] Can select calendars to sync
- [ ] Sync job runs every 15 min
- [ ] Events are created/updated correctly
- [ ] Cancelled events are marked in DB
- [ ] Multi-org isolation works

### Bot
- [ ] `/reuniones` shows synced meetings
- [ ] `/proxima` shows next meeting
- [ ] `/minuta` creates minute for selected meeting
- [ ] `/tareas` shows my agreements
- [ ] Notifications are sent

### Sheets Export
- [ ] Publishing minute exports agreements to Sheet
- [ ] Sheet is created if doesn't exist
- [ ] Rows are appended correctly

### Dashboard
- [ ] Can connect Google account
- [ ] Can select calendars to sync
- [ ] Meetings list shows synced events
- [ ] Can create/edit minute for meeting
- [ ] Can publish minute
- [ ] Agreements table works

---

## Environment Variables

**Backend `.env`:**
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/coda"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRY="24h"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"

# Telegram
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_WEBHOOK_SECRET="..."

# Encryption (for Google tokens)
ENCRYPTION_KEY="32-byte-key"
```

**Dashboard `.env.local`:**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

---

## Success Criteria

MVP is complete when:
- [x] Google OAuth works (Calendar + Sheets)
- [x] Calendar sync runs automatically
- [x] Meetings list shows synced events
- [x] Can create minute for meeting via dashboard
- [x] Can create minute via bot (`/minuta`)
- [x] Publishing minute exports to Sheets
- [x] Bot shows meetings (`/reuniones`, `/proxima`)
- [x] Bot shows tasks (`/tareas`, `/pendientes`)
- [x] Notifications are sent
- [x] Multi-tenant isolation verified

---

**Status:** Ready for Devin  
**Next:** Start with Task 1 (Project Setup)
