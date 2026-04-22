import fs from "fs/promises";
import path from "path";
import type { TradingProfile } from "../types";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

export interface UserSettings {
  profile: TradingProfile | null;
  telegram: {
    chatId: string | null;
    username: string | null;
    linkedAt: string | null;
  };
  channels: {
    telegram: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  profile: null,
  telegram: { chatId: null, username: null, linkedAt: null },
  channels: { telegram: false },
};

let cache: UserSettings | null = null;
let writeLock: Promise<void> = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
}

export async function readSettings(): Promise<UserSettings> {
  if (cache) return cache;
  await ensureDir();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    cache = {
      profile: parsed.profile ?? null,
      telegram: {
        chatId: parsed.telegram?.chatId ?? null,
        username: parsed.telegram?.username ?? null,
        linkedAt: parsed.telegram?.linkedAt ?? null,
      },
      channels: {
        telegram: parsed.channels?.telegram ?? false,
      },
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      cache = {
        profile: null,
        telegram: { ...DEFAULT_SETTINGS.telegram },
        channels: { ...DEFAULT_SETTINGS.channels },
      };
      await writeSettingsInternal(cache);
    } else {
      throw err;
    }
  }
  return cache!;
}

async function writeSettingsInternal(s: UserSettings): Promise<void> {
  await ensureDir();
  const tmp = SETTINGS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(s, null, 2), "utf8");
  await fs.rename(tmp, SETTINGS_FILE);
  cache = s;
}

export interface SettingsPatch {
  profile?: TradingProfile | null;
  telegram?: Partial<UserSettings["telegram"]>;
  channels?: Partial<UserSettings["channels"]>;
}

export async function saveSettings(patch: SettingsPatch): Promise<UserSettings> {
  const next = writeLock.then(async () => {
    const current = await readSettings();
    const merged: UserSettings = {
      profile: patch.profile !== undefined ? patch.profile : current.profile,
      telegram: {
        chatId: patch.telegram?.chatId !== undefined ? patch.telegram.chatId : current.telegram.chatId,
        username: patch.telegram?.username !== undefined ? patch.telegram.username : current.telegram.username,
        linkedAt: patch.telegram?.linkedAt !== undefined ? patch.telegram.linkedAt : current.telegram.linkedAt,
      },
      channels: {
        telegram: patch.channels?.telegram !== undefined ? patch.channels.telegram : current.channels.telegram,
      },
    };
    await writeSettingsInternal(merged);
    return merged;
  });
  writeLock = next.then(() => undefined, () => undefined);
  return next;
}

export function getServerCapabilities(): { telegramBot: boolean } {
  return {
    telegramBot: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME),
  };
}
