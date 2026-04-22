import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerCapabilities, readSettings, saveSettings } from "@/lib/alerts/settings";
import { TradingProfileSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const [settings, capabilities] = await Promise.all([readSettings(), Promise.resolve(getServerCapabilities())]);
  return NextResponse.json({
    settings,
    capabilities,
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
  });
}

const PatchSchema = z.object({
  profile: z.union([TradingProfileSchema, z.null()]).optional(),
  telegram: z
    .object({
      chatId: z.union([z.string(), z.null()]).optional(),
      username: z.union([z.string(), z.null()]).optional(),
      linkedAt: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
  channels: z
    .object({
      telegram: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings patch.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const saved = await saveSettings(parsed.data);
  return NextResponse.json({ settings: saved, capabilities: getServerCapabilities() });
}
