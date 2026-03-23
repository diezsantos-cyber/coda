# CODA Architecture Changes - Google Calendar Integration
**Date:** March 23, 2026  
**Requested by:** Manuel  
**Implemented by:** Franco

---

## Summary

**Key Change:** Google Calendar integration moved from Phase 2 to Phase 1.

**Reason:** Manuel doesn't want to manually create meetings in CODA. He wants to use Google Calendar (where he already works) and have CODA sync meetings from there.

---

## What Changed

### Before (Original Plan)
- Users create meetings manually in CODA dashboard
- Dashboard has full CRUD for meetings
- Google Calendar integration in Phase 2

### After (Updated Plan)
- **Google Calendar is the source of truth**
- CODA syncs meetings automatically (read-only)
- Users create minutas for synced Calendar events
- No manual meeting creation in CODA

---

## Technical Changes

### Database Schema
**New tables:**
- `google_integrations` - Store OAuth tokens
- `google_calendar_configs` - Which calendars to sync

**Updated `meetings` table:**
- Added `google_calendar_event_id` (unique per org)
- Added `google_calendar_id` (which calendar)
- Added `end_time`
- Added `attendees` (JSON array from Calendar)
- Added `last_synced_at`
- Removed `created_by` (no longer user-created)

### New APIs
**Google Calendar endpoints:**
- `POST /api/integrations/google/auth` - OAuth flow
- `GET /api/integrations/google/callback` - OAuth callback
- `GET /api/integrations/google/calendar/list` - List calendars
- `POST /api/integrations/google/calendar/configure` - Select calendars
- `POST /api/integrations/google/calendar/sync` - Manual sync

**Updated Meetings endpoints:**
- Removed `POST /api/meetings` (no create)
- Removed `PATCH /api/meetings/:id` (no edit)
- Removed `DELETE /api/meetings/:id` (no delete)
- Kept `GET /api/meetings` (list synced)
- Kept `GET /api/meetings/:id` (view details)
- Added `POST /api/meetings/sync` (trigger sync)

### New Services
- `GoogleCalendarService` - Fetch events, sync to DB
- Background job - Sync every 15 minutes

### Bot Changes
**New commands:**
- `/reuniones` - Show upcoming meetings from Calendar
- `/proxima` - Show next meeting + create minute option
- `/minuta` - Interactive minute creation flow

### Dashboard Changes
**New page:** Integrations
- Connect Google account button
- Select calendars to sync
- Last sync timestamp
- Manual sync button

**Updated Meetings page:**
- Shows synced Calendar events (not user-created)
- Click meeting → create/edit minute
- Can't create/edit meetings directly

---

## User Flow (Phase 1 MVP)

### Setup (One-time)
1. Admin logs into CODA dashboard
2. Goes to Integrations page
3. Clicks "Connect Google Calendar"
4. Authorizes CODA (Calendar + Sheets scopes)
5. Selects which calendars to sync (e.g., "Work Calendar")
6. CODA starts syncing events automatically

### Daily Usage
1. **Create meeting in Google Calendar** (as usual)
2. **Before/during meeting:** Bot notifies "Reunión en 1 hora: Weekly Sync"
3. **After meeting:** 
   - Option A: Admin creates minute in dashboard
   - Option B: Team member uses `/minuta` in Telegram
4. **Publish minute:** Agreements are extracted → exported to Sheets
5. **Bot notifies assigned users:** "Nueva tarea: Update dashboard - Vence: 30 Mar"
6. **Check tasks:** `/tareas` (my tasks), `/pendientes` (team tasks)

---

## Implementation Impact

### Timeline
- **Before:** 6 weeks
- **After:** Still 6 weeks (Calendar integration simpler than expected)

### Task Count
- **Before:** 13 tasks
- **After:** 15 tasks (added OAuth + Calendar sync)

### Complexity
- **Reduced:** No meeting CRUD in dashboard
- **Added:** OAuth flow, Calendar API integration, background sync job

### Net Result
About the same complexity, but better UX (no duplicate work).

---

## Benefits

1. **No duplicate entry** - Meetings created once (in Calendar)
2. **Natural workflow** - Users already use Calendar
3. **Auto-sync** - CODA always has latest events
4. **Simpler UI** - Dashboard shows meetings, can't edit (less confusion)
5. **Better adoption** - Lower friction for pilot users

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Calendar sync fails | Exponential backoff, admin alerts, manual sync button |
| OAuth scope issues | Clear consent screen, error messages with troubleshooting |
| Rate limits | Batch requests (50 events/call), cache results |
| Multi-calendar confusion | Clear UI to select which calendars to sync |

---

## Files Updated

1. `coda-architecture.md` - Full architecture rewrite
2. `coda-sprint-1-devin-tasks-updated.md` - Updated task list (15 tasks)
3. `CODA-CHANGES-SUMMARY.md` (this file)

---

## Next Steps

1. Review updated architecture with Manuel
2. Confirm this is the desired approach
3. Start Devin implementation with updated tasks
4. Test OAuth flow + Calendar sync first (critical path)

---

**Status:** Architecture updated, ready for implementation  
**Approved by:** Pending Manuel confirmation
