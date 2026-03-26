# CODA - Collaborative Organizational Decision Assistant

Multi-tenant SaaS platform for meeting management, agreement tracking, and team collaboration.

## Tech Stack

- **Backend:** Node.js 20, Express, TypeScript, Prisma, PostgreSQL
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Zustand, React Query
- **Integrations:** Telegram Bot, Google Sheets
- **Infrastructure:** Docker, Docker Compose, GitHub Actions CI

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL and Redis)

### 1. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend runs at http://localhost:3001

### 3. Dashboard Setup

```bash
cd dashboard
cp .env.example .env.local
npm install
npm run dev
```

Dashboard runs at http://localhost:3000

### Test Credentials

- **Admin:** manuel@heybanco.mx / test123
- **Secretary:** franco@heybanco.mx / test123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create organization + admin user
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/me` - Current user profile

### Meetings
- `GET /api/meetings` - List meetings (filter by status, date range)
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Meeting details with participants
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Cancel meeting
- `POST /api/meetings/:id/participants` - Add participants
- `DELETE /api/meetings/:id/participants/:pid` - Remove participant

### Minutes
- `GET /api/meetings/:meetingId/minutes` - Get minute
- `POST /api/meetings/:meetingId/minutes` - Create/update minute draft
- `POST /api/meetings/:meetingId/minutes/publish` - Publish minute

### Agreements
- `GET /api/agreements` - List agreements (filter by status, assignee)
- `POST /api/agreements` - Create agreement
- `GET /api/agreements/:id` - Agreement details
- `PATCH /api/agreements/:id` - Update agreement
- `DELETE /api/agreements/:id` - Delete agreement

### Team Members
- `GET /api/team-members` - List team members
- `POST /api/team-members` - Add team member
- `PATCH /api/team-members/:id` - Update member
- `DELETE /api/team-members/:id` - Remove member

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Telegram
- `POST /api/telegram/webhook` - Telegram webhook

### Integrations
- `POST /api/integrations/google/auth` - Get Google OAuth URL
- `GET /api/integrations/google/callback` - OAuth callback
- `POST /api/integrations/google/sheets/configure` - Configure spreadsheet
- `POST /api/integrations/google/sheets/sync` - Manual sync

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

## Telegram Bot Commands

- `/start` - Link account
- `/tareas` - Your assigned tasks
- `/pendientes` - All pending agreements
- `/resumen` - Last meeting summary
- `/help` - Available commands

## Docker

```bash
# Start all services
docker-compose up

# Start only infrastructure
docker-compose up -d postgres redis
```

## Environment Variables

See `backend/.env.example` and `dashboard/.env.example` for required variables.

## Architecture

- **Multi-tenant:** Row-level isolation via `organizationId` on all tables
- **Authentication:** JWT with role-based access (admin, secretary, viewer)
- **Validation:** Zod schemas on all API endpoints
- **Error handling:** Custom error classes with consistent JSON responses
- **Event system:** Internal event bus for notifications and integrations
