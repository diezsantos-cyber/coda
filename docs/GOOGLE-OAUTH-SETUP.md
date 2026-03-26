# Google OAuth Setup - CODA

Esta guía explica cómo configurar Google OAuth para Google Calendar y Google Sheets en CODA.

## 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "CODA - HeyBanco" (o el nombre de tu organización)

## 2. Habilitar APIs necesarias

### Google Calendar API
1. En el menú lateral, ve a **APIs & Services → Library**
2. Busca "Google Calendar API"
3. Click en "Enable"

### Google Sheets API
1. En el menú lateral, ve a **APIs & Services → Library**
2. Busca "Google Sheets API"
3. Click en "Enable"

## 3. Configurar pantalla de consentimiento OAuth

1. Ve a **APIs & Services → OAuth consent screen**
2. Selecciona **Internal** si es para uso interno en tu organización (Google Workspace)
   - O **External** si quieres permitir cualquier cuenta de Google
3. Completa los campos requeridos:
   - **App name:** CODA
   - **User support email:** tu email
   - **Developer contact email:** tu email
4. Click "Save and Continue"
5. En **Scopes**, agrega los siguientes scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
6. Click "Save and Continue"
7. Review y confirma

## 4. Crear credenciales OAuth

1. Ve a **APIs & Services → Credentials**
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: "CODA Web App"
5. **Authorized JavaScript origins:**
   - http://localhost:3000 (desarrollo)
   - https://tu-dominio.com (producción)
6. **Authorized redirect URIs:**
   ```
   http://localhost:3001/api/integrations/google/calendar/callback
   http://localhost:3001/api/integrations/google/sheets/callback
   https://api.tu-dominio.com/api/integrations/google/calendar/callback
   https://api.tu-dominio.com/api/integrations/google/sheets/callback
   ```
7. Click "Create"
8. **Copia el Client ID y Client Secret** - los necesitarás para el .env

## 5. Configurar variables de entorno

En tu archivo `.env` del backend, agrega:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/integrations/google/callback"
GOOGLE_CALENDAR_REDIRECT_URI="http://localhost:3001/api/integrations/google/calendar/callback"
GOOGLE_SHEETS_REDIRECT_URI="http://localhost:3001/api/integrations/google/sheets/callback"
```

**En producción**, cambia las URLs a tu dominio real:
```bash
GOOGLE_REDIRECT_URI="https://api.tu-dominio.com/api/integrations/google/callback"
GOOGLE_CALENDAR_REDIRECT_URI="https://api.tu-dominio.com/api/integrations/google/calendar/callback"
GOOGLE_SHEETS_REDIRECT_URI="https://api.tu-dominio.com/api/integrations/google/sheets/callback"
```

## 6. Probar la integración

### Conectar Google Calendar

1. Inicia el backend: `npm run dev` (en `/backend`)
2. Inicia el dashboard: `npm run dev` (en `/dashboard`)
3. Login en el dashboard
4. Ve a **Settings → Integraciones**
5. Click en "Conectar" en Google Calendar
6. Autoriza el acceso en la pantalla de Google
7. Serás redirigido de vuelta al dashboard
8. Ve a **Reuniones** - deberías ver tus eventos de Calendar sincronizados

### Conectar Google Sheets

1. En **Settings → Integraciones**
2. Click en "Conectar" en Google Sheets
3. Autoriza el acceso en la pantalla de Google
4. Crea una minuta para una reunión
5. Publica la minuta
6. Los acuerdos se exportarán automáticamente a Google Sheets

## 7. Sincronización automática

El backend sincroniza automáticamente eventos de Google Calendar cada **15 minutos**.

También puedes forzar una sincronización manual:
```bash
curl -X POST http://localhost:3001/api/integrations/google/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que las Redirect URIs en Google Cloud Console coincidan exactamente con las de tu .env
- No olvides agregar `/api/integrations/google/calendar/callback`

### Error: "Access blocked: This app's request is invalid"
- Asegúrate de haber completado la pantalla de consentimiento OAuth
- Verifica que los scopes estén configurados correctamente

### No se sincronizan eventos
- Verifica que el token de Google esté guardado en la base de datos (`GoogleIntegration` table)
- Revisa los logs del backend para ver errores de sincronización
- Verifica que `syncEnabled` sea `true` en `GoogleCalendarConfig`

### Token expirado
- El backend renueva automáticamente el access token usando el refresh token
- Si el refresh token es inválido, necesitarás reconectar la integración

## Calendario por defecto

CODA usa el calendario "primary" por defecto (tu calendario principal de Google).

Si quieres usar un calendario diferente:
```bash
curl -X POST http://localhost:3001/api/integrations/google/calendar/configure \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"calendarId": "tu-calendar-id@group.calendar.google.com"}'
```

Para obtener el Calendar ID:
1. Ve a Google Calendar
2. Click en el calendario → Settings
3. Copia el "Calendar ID"

## Seguridad

**IMPORTANTE:**
- Nunca compartas tu `GOOGLE_CLIENT_SECRET` públicamente
- No lo subas al repositorio Git
- Usa variables de entorno o un gestor de secretos (Azure Key Vault, AWS Secrets Manager)
- En producción, usa HTTPS para todas las URLs

## Más información

- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
