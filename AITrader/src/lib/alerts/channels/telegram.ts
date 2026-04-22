import { readSettings } from "../settings";

export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return { ok: false, error: "Telegram bot not configured on server." };

  const settings = await readSettings();
  const chatId = settings.telegram.chatId;
  if (!chatId) return { ok: false, error: "Telegram not linked yet — open /settings." };

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Telegram HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: {
      id: number;
      type: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

/** Scan recent Telegram updates for a /start <code> message and return its chat info. */
export async function findStartCode(code: string): Promise<{ chatId: string; username: string } | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=100&timeout=0`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[] };
    if (!data.ok || !data.result) return null;

    const wanted1 = `/start ${code}`;
    const wanted2 = `/start${code}`;
    for (let i = data.result.length - 1; i >= 0; i--) {
      const update = data.result[i];
      const msg = update.message;
      if (!msg || typeof msg.text !== "string") continue;
      if (msg.text === wanted1 || msg.text === wanted2) {
        const uname = msg.chat.username
          ? `@${msg.chat.username}`
          : [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" ") || `id:${msg.chat.id}`;
        return { chatId: String(msg.chat.id), username: uname };
      }
    }
    return null;
  } catch {
    return null;
  }
}
