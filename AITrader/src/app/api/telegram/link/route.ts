import { NextRequest, NextResponse } from "next/server";
import { findStartCode } from "@/lib/alerts/channels/telegram";
import { createLinkCode, consumeLinkCode, hasLinkCode } from "@/lib/alerts/telegram-link";
import { saveSettings } from "@/lib/alerts/settings";

export const runtime = "nodejs";

/** Start a new link flow — returns a code + deep link to send user into Telegram. */
export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (!token || !username) {
    return NextResponse.json(
      { error: "Telegram bot is not configured on the server. Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME." },
      { status: 400 },
    );
  }
  const code = createLinkCode();
  const deepLink = `https://t.me/${username}?start=${code}`;
  return NextResponse.json({ code, deepLink, botUsername: username });
}

/** Poll status — the UI calls this every few seconds after opening the deep link. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code." }, { status: 400 });
  if (!hasLinkCode(code)) {
    return NextResponse.json({ status: "expired" });
  }
  const match = await findStartCode(code);
  if (!match) return NextResponse.json({ status: "pending" });

  await saveSettings({
    telegram: {
      chatId: match.chatId,
      username: match.username,
      linkedAt: new Date().toISOString(),
    },
    channels: { telegram: true },
  });
  consumeLinkCode(code);
  return NextResponse.json({ status: "linked", username: match.username });
}
