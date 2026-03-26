import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { handleTelegramCommand } from '../services/telegram/commands';

const router = Router();

router.post(
  '/webhook',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const secretToken = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;
    if (config.telegram.webhookSecret && secretToken !== config.telegram.webhookSecret) {
      res.status(403).json({ error: 'Invalid webhook secret' });
      return;
    }

    try {
      const update = req.body as { message?: { chat: { id: number }; from?: { id: number; username?: string }; text?: string } };
      const response = await handleTelegramCommand(update);

      if (response && config.telegram.botToken) {
        const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: response.chatId, text: response.text }),
        });
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(200).json({ ok: true });
    }
  },
);

export default router;
