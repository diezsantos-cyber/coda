# CODA - Bot Telegram UX Specification
**Version:** 1.0  
**Fecha:** 23 de Marzo, 2026  
**Proyecto:** CODA Platform

---

## 📱 Experiencia de Usuario - Bot de Telegram

### Objetivos de UX
1. **Onboarding simple** - Usuario vinculado en < 30 segundos
2. **Descubrimiento fácil** - Menú visible, comandos claros
3. **Interacciones naturales** - Botones, no solo comandos
4. **Feedback inmediato** - Respuestas < 2 segundos
5. **Mobile-first** - Optimizado para pantalla pequeña

---

## 🎬 Primera interacción (Onboarding)

### Flujo: Usuario envía `/start`

```
Usuario: /start

Bot: 👋 ¡Hola! Soy CODA, tu asistente para reuniones.

Para empezar, necesito vincular tu cuenta de Telegram 
con tu organización.

¿Cuál es tu email corporativo?
(Ejemplo: manuel@heybanco.mx)
```

**Opciones de vinculación:**

**Opción A: Auto-vinculación (si admin ya lo agregó)**
```
Usuario: manuel@heybanco.mx

Bot: ✅ ¡Perfecto! Te he vinculado a HeyBanco.

Ya puedes usar todos los comandos. 
Toca el botón ☰ Menu (abajo a la izquierda) 
para ver qué puedo hacer.

[Botones inline:]
[📅 Próximas reuniones] [✅ Mis tareas]
```

**Opción B: Verificación requerida**
```
Usuario: manuel@heybanco.mx

Bot: ⏳ He enviado un código de verificación al administrador.

En cuanto lo apruebe, recibirás una notificación aquí.
Normalmente toma menos de 1 minuto.
```

```
(Cuando admin aprueba)

Bot: ✅ ¡Listo! Ya estás vinculado a HeyBanco.

Usa el botón Menu ☰ para explorar comandos.

[Botones inline:]
[📅 Próximas reuniones] [✅ Mis tareas]
```

---

## 🎛️ Menú del Bot (Menu Button)

**Telegram Menu Button** (inferior izquierda, siempre visible)

```
☰ Menu
├─ 📅 Reuniones
│  ├─ Próximas reuniones
│  └─ Siguiente reunión
├─ 📝 Minutas
│  └─ Nueva minuta
├─ ✅ Tareas
│  ├─ Mis tareas
│  └─ Tareas del equipo
├─ 📊 Resúmenes
│  └─ Última reunión
└─ ❓ Ayuda
```

**Configuración en BotFather:**
```
/setmenubutton

Menu button text: Menu
Commands:
reuniones - Ver próximas reuniones
proxima - Siguiente reunión  
minuta - Crear minuta
tareas - Mis tareas
pendientes - Tareas del equipo
resumen - Última reunión
help - Ayuda
```

---

## 💬 Comandos principales

### 1. `/reuniones` - Ver próximas reuniones

```
Usuario: /reuniones

Bot: 📅 Próximas reuniones:

┌─────────────────────────────────────┐
│ 1. Weekly Sync                      │
│ 🕐 Hoy 15:00 - 16:00               │
│ 📍 Sala de Juntas                  │
│ 👥 Manuel, Juan, María             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 2. Sprint Planning                  │
│ 🕐 Mañana 10:00 - 11:30            │
│ 📍 Google Meet                      │
│ 👥 Todo el equipo                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3. Client Review                    │
│ 🕐 25 Mar 14:00 - 15:00            │
│ 📍 Zoom                             │
│ 👥 Manuel, externos                │
└─────────────────────────────────────┘

[Botones inline:]
[📝 Crear minuta] [🔄 Actualizar]
```

**Casos especiales:**

**Sin reuniones:**
```
Bot: 📅 No tienes reuniones próximas.

(Tus reuniones se sincronizan desde Google Calendar)
```

**Muchas reuniones (>5):**
```
Bot: 📅 Tienes 12 reuniones próximas.

Mostrando las próximas 5:
[lista...]

[Botones:]
[Ver más] [Filtrar por fecha]
```

---

### 2. `/proxima` - Siguiente reunión

```
Usuario: /proxima

Bot: 📅 Tu próxima reunión es:

━━━━━━━━━━━━━━━━━━━━━━━
Weekly Sync
━━━━━━━━━━━━━━━━━━━━━━━

🕐 Hoy 15:00 - 16:00 (en 2 horas)
📍 Sala de Juntas
👥 Manuel, Juan, María

📋 Agenda:
• Review de KPIs
• Planning próxima semana
• Bloqueos del equipo

[Botones inline:]
[📝 Crear minuta] [🔔 Recordarme 15 min antes]
```

**Sin próxima reunión:**
```
Bot: 📅 No tienes reuniones programadas hoy.

Tu siguiente reunión es:
Sprint Planning - Mañana 10:00

[Botón:]
[Ver todas las reuniones]
```

---

### 3. `/minuta` - Crear minuta (flujo interactivo)

```
Usuario: /minuta

Bot: 📝 ¿Para qué reunión quieres crear la minuta?

[Botones inline con últimas 3 reuniones:]
[1. Weekly Sync - Hoy 15:00]
[2. Sprint Planning - Ayer 10:00]
[3. Otra reunión...]

(o escribe el nombre de la reunión)
```

**Usuario selecciona reunión:**
```
Usuario: [toca botón "Weekly Sync - Hoy 15:00"]

Bot: 📝 Minuta para: Weekly Sync

Escribe el contenido de la minuta.
Puedes incluir:
• Puntos discutidos
• Decisiones tomadas
• Acuerdos y tareas

(Puedes usar formato Markdown si quieres)
```

**Usuario escribe contenido:**
```
Usuario: 
Discutimos los KPIs del mes.

Decisiones:
- Aumentar presupuesto de marketing 20%
- Contratar 2 developers

Acuerdos:
@juan Actualizar dashboard de KPIs - 30 marzo
@maria Revisar budget marketing - 25 marzo
```

**Bot procesa y confirma:**
```
Bot: ✅ Minuta guardada como borrador.

He detectado 2 acuerdos:
1. @juan - Actualizar dashboard de KPIs (30 Mar)
2. @maria - Revisar budget marketing (25 Mar)

[Botones:]
[✅ Publicar] [✏️ Editar] [❌ Cancelar]
```

**Usuario publica:**
```
Usuario: [toca "✅ Publicar"]

Bot: 🎉 ¡Minuta publicada!

✅ Exportado a Google Sheets
📢 Juan y María han sido notificados

[Botón:]
[Ver en dashboard]
```

---

### 4. `/tareas` - Mis tareas

```
Usuario: /tareas

Bot: ✅ Tienes 3 tareas pendientes:

━━━━━━━━━━━━━━━━━━━━━━━
🔴 Alta prioridad
━━━━━━━━━━━━━━━━━━━━━━━

📌 Actualizar dashboard de KPIs
   Reunión: Weekly Sync
   ⏰ Vence: 30 Mar (en 5 días)
   [Botones:]
   [✅ Completar] [📅 Posponer] [👁️ Ver]

━━━━━━━━━━━━━━━━━━━━━━━
🟡 Media prioridad
━━━━━━━━━━━━━━━━━━━━━━━

📌 Revisar propuesta de cliente
   Reunión: Client Review
   ⏰ Vence: 2 Abr (en 8 días)
   [Botones:]
   [✅ Completar] [📅 Posponer] [👁️ Ver]

📌 Preparar presentación Q1
   Reunión: Board Meeting
   ⏰ Vence: 5 Abr (en 11 días)
   [Botones:]
   [✅ Completar] [📅 Posponer] [👁️ Ver]

[Botón inferior:]
[📊 Ver estadísticas]
```

**Usuario completa tarea:**
```
Usuario: [toca "✅ Completar" en primera tarea]

Bot: ¿Quieres agregar un comentario? (opcional)

[Botones:]
[Sin comentario] [Agregar comentario]
```

```
Usuario: [toca "Sin comentario"]

Bot: ✅ Tarea completada: Actualizar dashboard de KPIs

Buen trabajo! 🎉
Te quedan 2 tareas pendientes.
```

**Sin tareas:**
```
Bot: ✅ ¡Todo al día! No tienes tareas pendientes.

[Botón:]
[Ver tareas del equipo]
```

---

### 5. `/pendientes` - Tareas del equipo

```
Usuario: /pendientes

Bot: 📊 Tareas del equipo (8 pendientes):

━━━━━━━━━━━━━━━━━━━━━━━
Por persona:
━━━━━━━━━━━━━━━━━━━━━━━

👤 Juan (3 tareas)
   • Actualizar dashboard - 30 Mar 🔴
   • Revisar código backend - 28 Mar 🟢
   • Testing API endpoints - 1 Abr 🟡

👤 María (2 tareas)
   • Revisar budget - 25 Mar 🔴
   • Actualizar docs - 29 Mar 🟡

👤 Tú (2 tareas)
   • Revisar propuesta - 2 Abr 🟡
   • Preparar presentación - 5 Abr 🟡

👤 Pedro (1 tarea)
   • Deploy a staging - 26 Mar 🟢

[Botones:]
[🔴 Ver urgentes] [👤 Filtrar por persona] [📅 Ver calendario]
```

---

### 6. `/resumen` - Última reunión

```
Usuario: /resumen

Bot: 📋 Última reunión: Weekly Sync

━━━━━━━━━━━━━━━━━━━━━━━
📅 24 Mar 2026, 15:00-16:00
👥 Manuel, Juan, María, Pedro
━━━━━━━━━━━━━━━━━━━━━━━

📌 Puntos clave:
• KPIs del mes superaron expectativas
• Se aprobó aumento de presupuesto 20%
• Decisión de contratar 2 developers

✅ Acuerdos (4):
• Juan: Dashboard KPIs - 30 Mar
• María: Budget marketing - 25 Mar
• Pedro: Deploy staging - 26 Mar
• Manuel: Entrevistas developers - 1 Abr

[Botones:]
[📄 Ver minuta completa] [📊 Ver acuerdos]
```

**Sin reuniones recientes:**
```
Bot: 📋 No hay reuniones recientes con minuta.

Tu última reunión fue:
Weekly Sync - Hace 3 días (sin minuta)

[Botón:]
[Crear minuta]
```

---

## 🔔 Notificaciones automáticas

### Notificación: Tarea asignada

```
Bot: 📬 Nueva tarea asignada

━━━━━━━━━━━━━━━━━━━━━━━
Actualizar dashboard de KPIs
━━━━━━━━━━━━━━━━━━━━━━━

📝 De la reunión: Weekly Sync (24 Mar)
⏰ Vence: 30 Mar (en 5 días)
🔴 Prioridad: Alta

📋 Descripción:
Actualizar el dashboard con los KPIs de marzo.
Incluir métricas de nuevos usuarios y retención.

[Botones:]
[✅ Aceptar] [👁️ Ver detalles] [💬 Comentar]
```

### Notificación: Tarea próxima a vencer

```
Bot: ⏰ Recordatorio de tarea

Tu tarea "Actualizar dashboard de KPIs" 
vence en 2 días (30 Mar).

Estado: Pendiente
Asignado en: Weekly Sync

[Botones:]
[✅ Completar] [📅 Posponer] [👁️ Ver]
```

### Notificación: Reunión próxima

```
Bot: 🔔 Reunión en 1 hora

━━━━━━━━━━━━━━━━━━━━━━━
Weekly Sync
━━━━━━━━━━━━━━━━━━━━━━━

🕐 Hoy 15:00 - 16:00
📍 Sala de Juntas
👥 Manuel, Juan, María

[Botones:]
[📝 Crear minuta ahora] [🔕 Silenciar]
```

### Notificación: Minuta publicada

```
Bot: 📢 Nueva minuta publicada

Weekly Sync - 24 Mar 2026

Tienes 1 tarea asignada:
• Actualizar dashboard de KPIs (30 Mar) 🔴

[Botones:]
[👁️ Ver minuta] [✅ Ver mis tareas]
```

---

## 🎨 Elementos de UI

### Botones Inline (en mensajes)

**Primarios (acciones principales):**
```
[✅ Completar] [📝 Crear minuta] [🔔 Recordarme]
```

**Secundarios (acciones opcionales):**
```
[👁️ Ver detalles] [✏️ Editar] [🔄 Actualizar]
```

**Destructivos (peligrosos):**
```
[❌ Cancelar] [🗑️ Eliminar]
```

### Teclado persistente (Reply Keyboard)

**Opción:** Teclado personalizado que reemplaza el teclado normal

```
┌────────────┬────────────┐
│ 📅 Reuniones│ ✅ Tareas  │
├────────────┼────────────┤
│ 📝 Minuta  │ 📊 Resumen │
└────────────┴────────────┘
```

**Ventaja:** Siempre visible, fácil acceso  
**Desventaja:** Oculta teclado normal

**Recomendación:** Usar Menu Button + Inline Buttons (más flexible)

---

## 🎯 Flujos interactivos avanzados

### Crear minuta con asistente

```
Bot: 📝 Asistente de minuta

Voy a ayudarte a crear la minuta con algunas preguntas.

1️⃣ ¿De qué reunión es?
[Botones con últimas reuniones]

2️⃣ ¿Qué se discutió? (puntos principales)
(Usuario escribe)

3️⃣ ¿Hubo decisiones importantes?
[Sí] [No]

4️⃣ ¿Hay acuerdos o tareas?
(Formato: @persona tarea - fecha)

5️⃣ Revisión final
[Vista previa de minuta]
[Publicar] [Editar] [Cancelar]
```

### Posponer tarea

```
Usuario: [toca "📅 Posponer" en una tarea]

Bot: 📅 ¿Cuándo quieres que venza?

[Botones inline:]
[+1 día] [+3 días] [+1 semana]
[Elegir fecha]

Usuario: [+3 días]

Bot: ✅ Tarea pospuesta a 28 Mar

¿Quieres notificar al admin?
[Sí, notificar] [No]
```

### Ver detalles de reunión

```
Usuario: [toca botón "Ver detalles" en una reunión]

Bot: 📅 Detalles: Weekly Sync

━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha: 24 Mar 2026
🕐 Hora: 15:00 - 16:00
📍 Ubicación: Sala de Juntas
🔗 Link: meet.google.com/abc-defg
━━━━━━━━━━━━━━━━━━━━━━━

👥 Participantes (4):
• Manuel Arámburu
• Juan Pérez
• María González  
• Pedro Rodríguez

📋 Agenda:
• Review de KPIs del mes
• Planning próxima semana
• Bloqueos del equipo
• AOB

📝 Minuta: ✅ Publicada
✅ Acuerdos: 4 tareas asignadas

[Botones:]
[📄 Ver minuta] [✏️ Editar] [🗓️ Ver en Calendar]
```

---

## 🌐 Internacionalización (i18n)

### Español (primario)
```
✅ Tarea completada
📝 Crear minuta
🔔 Recordarme
```

### English (futuro)
```
✅ Task completed
📝 Create minute
🔔 Remind me
```

**Detección automática:** Por idioma del usuario en Telegram  
**Comando:** `/language` para cambiar manualmente

---

## 📏 Best Practices implementadas

### 1. Mobile-first
- ✅ Mensajes cortos (< 300 chars ideal)
- ✅ Botones grandes y claros
- ✅ Sin scroll horizontal
- ✅ Emojis para escaneo rápido

### 2. Feedback inmediato
- ✅ Respuestas < 2 segundos
- ✅ Estados de carga: "⏳ Cargando..."
- ✅ Confirmaciones explícitas: "✅ Tarea completada"

### 3. Prevención de errores
- ✅ Botones en lugar de comandos cuando es posible
- ✅ Confirmación para acciones destructivas
- ✅ Validación inline de inputs

### 4. Descubribilidad
- ✅ Menu Button siempre visible
- ✅ Comandos en /help
- ✅ Sugerencias contextuales

### 5. Consistencia
- ✅ Emojis consistentes por tipo
- ✅ Formato de fechas uniforme
- ✅ Botones con labels predecibles

---

## 🔧 Configuración técnica

### Menu Button (BotFather)

```bash
# Hablar con @BotFather en Telegram
/setmenubutton

# Seleccionar bot
@heybanco_coda_bot

# Configurar
Menu button text: Menu

# Pegar comandos:
reuniones - Ver próximas reuniones
proxima - Siguiente reunión
minuta - Crear minuta
tareas - Mis tareas
pendientes - Tareas del equipo
resumen - Última reunión
help - Ayuda y comandos
```

### Comandos (BotFather)

```bash
/setcommands

start - Iniciar y vincular cuenta
reuniones - Ver próximas reuniones
proxima - Siguiente reunión
minuta - Crear minuta de reunión
tareas - Mis tareas pendientes
pendientes - Tareas de todo el equipo
resumen - Resumen de última reunión
help - Ver todos los comandos
```

### Inline Buttons (implementación)

```javascript
// Ejemplo en node-telegram-bot-api
const opts = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📝 Crear minuta', callback_data: 'create_minute' },
        { text: '✅ Mis tareas', callback_data: 'my_tasks' }
      ],
      [
        { text: '🔄 Actualizar', callback_data: 'refresh' }
      ]
    ]
  }
};

bot.sendMessage(chatId, 'Elige una opción:', opts);
```

---

## 📊 Métricas de UX a monitorear

### Engagement
- Command usage rate (comandos/usuario/día)
- Button click rate (clicks/mensaje con botones)
- Session duration (tiempo entre primer y último mensaje)

### Onboarding
- Time to first command (desde /start)
- Completion rate (usuarios que completan vinculación)

### Feature adoption
- % usuarios que usan cada comando
- % usuarios que completan flujo de minuta
- % usuarios que marcan tareas como completadas

### Satisfaction
- Task completion rate (tareas completadas / asignadas)
- Bot response time (P95 latency)
- Error rate (mensajes con error / total mensajes)

---

## 🚀 Roadmap de UX

### Phase 1 (MVP) - Actual
- ✅ Comandos básicos
- ✅ Menu Button
- ✅ Inline buttons
- ✅ Notificaciones

### Phase 2 (Futuro)
- [ ] Búsqueda de reuniones/tareas
- [ ] Estadísticas personales
- [ ] Recordatorios customizables
- [ ] Atajos (quick replies)

### Phase 3 (Avanzado)
- [ ] Voice messages → transcripción
- [ ] OCR para fotos de pizarrón
- [ ] Integración con IA para sugerencias
- [ ] Modo offline (queue de comandos)

---

**Fin del documento**
