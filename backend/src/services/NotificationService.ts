import { prisma } from '../config/database';
import { config } from '../config';

export class NotificationService {
  async sendTaskAssigned(organizationId: string, agreementTitle: string, recipientTelegramId: string, dueDate?: string, priority?: string): Promise<void> {
    const message = `📋 Nueva tarea asignada: ${agreementTitle}\nVence: ${dueDate ?? 'Sin fecha'}\nPrioridad: ${priority ?? 'medium'}`;

    await this.sendTelegramMessage(recipientTelegramId, message);
    await this.logNotification(organizationId, recipientTelegramId, 'task_assigned', message);
  }

  async sendTaskDueSoon(organizationId: string, agreementTitle: string, recipientTelegramId: string, daysUntilDue: number): Promise<void> {
    const message = `⏰ Recordatorio: ${agreementTitle} vence en ${daysUntilDue} días`;

    await this.sendTelegramMessage(recipientTelegramId, message);
    await this.logNotification(organizationId, recipientTelegramId, 'task_due_soon', message);
  }

  async sendMeetingReminder(organizationId: string, meetingTitle: string, recipientTelegramIds: string[]): Promise<void> {
    const message = `📅 Recordatorio de reunión mañana: ${meetingTitle}`;

    for (const telegramId of recipientTelegramIds) {
      await this.sendTelegramMessage(telegramId, message);
      await this.logNotification(organizationId, telegramId, 'meeting_reminder', message);
    }
  }

  async sendMinutePublished(organizationId: string, meetingTitle: string, recipientTelegramIds: string[]): Promise<void> {
    const message = `📝 Nueva minuta publicada: ${meetingTitle}\nUsa /resumen para ver detalles`;

    for (const telegramId of recipientTelegramIds) {
      await this.sendTelegramMessage(telegramId, message);
      await this.logNotification(organizationId, telegramId, 'minute_published', message);
    }
  }

  private async sendTelegramMessage(chatId: string, text: string): Promise<void> {
    if (!config.telegram.botToken) {
      console.info(`[Telegram stub] To ${chatId}: ${text}`);
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });

      if (!response.ok) {
        console.error(`Telegram API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
    }
  }

  private async logNotification(organizationId: string, recipientTelegramId: string, messageType: string, messageContent: string): Promise<void> {
    try {
      await prisma.notification.create({
        data: { organizationId, recipientTelegramId, messageType, messageContent },
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
