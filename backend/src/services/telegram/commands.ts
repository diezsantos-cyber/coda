import { prisma } from '../../config/database';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
}

interface CommandResponse {
  chatId: number;
  text: string;
}

export async function handleTelegramCommand(update: TelegramUpdate): Promise<CommandResponse | null> {
  const message = update.message;
  if (!message?.text || !message.from) return null;

  const chatId = message.chat.id;
  const telegramId = String(message.from.id);
  const text = message.text.trim();

  if (text === '/start') {
    return handleStart(chatId, telegramId, message.from.username);
  }
  if (text === '/tareas') {
    return handleTareas(chatId, telegramId);
  }
  if (text === '/pendientes') {
    return handlePendientes(chatId, telegramId);
  }
  if (text === '/resumen') {
    return handleResumen(chatId, telegramId);
  }
  if (text === '/help') {
    return handleHelp(chatId);
  }

  return { chatId, text: 'Comando no reconocido. Usa /help para ver los comandos disponibles.' };
}

async function handleStart(chatId: number, telegramId: string, username?: string): Promise<CommandResponse> {
  const member = await prisma.teamMember.findFirst({
    where: { telegramId },
    include: { organization: true },
  });

  if (member) {
    return {
      chatId,
      text: `✅ Vinculado a ${member.organization.name}\n\nComandos disponibles:\n/tareas - Ver tus tareas asignadas\n/pendientes - Ver todos los acuerdos pendientes\n/resumen - Ver resumen de la última reunión\n/help - Ayuda`,
    };
  }

  return {
    chatId,
    text: `👋 Bienvenido a CODA\n\nTu Telegram ID: ${telegramId}${username ? `\nUsername: @${username}` : ''}\n\nPara vincular tu cuenta, pide a un administrador que te agregue como miembro del equipo con tu Telegram ID.`,
  };
}

async function handleTareas(chatId: number, telegramId: string): Promise<CommandResponse> {
  const member = await prisma.teamMember.findFirst({
    where: { telegramId },
  });

  if (!member) {
    return { chatId, text: '❌ No estás vinculado a ninguna organización. Usa /start para más información.' };
  }

  const agreements = await prisma.agreement.findMany({
    where: {
      assignedToMemberId: member.id,
      status: { in: ['pending', 'in_progress'] },
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });

  if (agreements.length === 0) {
    return { chatId, text: '✅ No tienes tareas pendientes.' };
  }

  const lines = agreements.map((a, i) => {
    const due = a.dueDate ? ` | Vence: ${a.dueDate.toISOString().split('T')[0]}` : '';
    const priority = a.priority === 'high' ? '🔴' : a.priority === 'medium' ? '🟡' : '🟢';
    return `${i + 1}. ${priority} ${a.title}${due} [${a.status}]`;
  });

  return { chatId, text: `📋 Tus tareas (${agreements.length}):\n\n${lines.join('\n')}` };
}

async function handlePendientes(chatId: number, telegramId: string): Promise<CommandResponse> {
  const member = await prisma.teamMember.findFirst({
    where: { telegramId },
  });

  if (!member) {
    return { chatId, text: '❌ No estás vinculado a ninguna organización.' };
  }

  const agreements = await prisma.agreement.findMany({
    where: {
      organizationId: member.organizationId,
      status: { in: ['pending', 'in_progress'] },
    },
    include: {
      assignedToUser: { select: { name: true } },
      assignedToMember: { select: { name: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 15,
  });

  if (agreements.length === 0) {
    return { chatId, text: '✅ No hay acuerdos pendientes en la organización.' };
  }

  const lines = agreements.map((a, i) => {
    const assignee = a.assignedToUser?.name ?? a.assignedToMember?.name ?? 'Sin asignar';
    const due = a.dueDate ? ` | ${a.dueDate.toISOString().split('T')[0]}` : '';
    return `${i + 1}. ${a.title} → ${assignee}${due}`;
  });

  return { chatId, text: `📋 Acuerdos pendientes (${agreements.length}):\n\n${lines.join('\n')}` };
}

async function handleResumen(chatId: number, telegramId: string): Promise<CommandResponse> {
  const member = await prisma.teamMember.findFirst({
    where: { telegramId },
  });

  if (!member) {
    return { chatId, text: '❌ No estás vinculado a ninguna organización.' };
  }

  const minute = await prisma.minute.findFirst({
    where: { organizationId: member.organizationId, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    include: {
      meeting: true,
      agreements: true,
    },
  });

  if (!minute) {
    return { chatId, text: 'No hay minutas publicadas aún.' };
  }

  const topics = minute.topicsDiscussed.length > 0
    ? `\n\nTemas:\n${minute.topicsDiscussed.map((t) => `• ${t}`).join('\n')}`
    : '';

  const agreementsText = minute.agreements.length > 0
    ? `\n\nAcuerdos (${minute.agreements.length}):\n${minute.agreements.map((a) => `• ${a.title}`).join('\n')}`
    : '';

  return {
    chatId,
    text: `📝 Última minuta: ${minute.meeting.title}\n📅 ${minute.meeting.scheduledAt.toISOString().split('T')[0]}${minute.summary ? `\n\nResumen: ${minute.summary}` : ''}${topics}${agreementsText}`,
  };
}

function handleHelp(chatId: number): CommandResponse {
  return {
    chatId,
    text: `🤖 CODA Bot - Comandos disponibles:\n\n/start - Vincular tu cuenta\n/tareas - Ver tus tareas asignadas\n/pendientes - Ver todos los acuerdos pendientes\n/resumen - Resumen de la última reunión\n/help - Mostrar esta ayuda`,
  };
}
