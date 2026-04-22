import { NextRequest, NextResponse } from "next/server";
import { generateSignal } from "@/lib/signal-engine";
import { DEFAULT_PROFILE } from "@/lib/profile";
import { readSettings } from "@/lib/alerts/settings";
import type { TradingProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 },
    );
  }

  let body: { message?: string; profile?: Partial<TradingProfile>; images?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const images = Array.isArray(body.images) ? body.images.filter((s) => typeof s === "string" && s.startsWith("data:image/")) : [];
  if (!message && images.length === 0) {
    return NextResponse.json({ error: "Send a message, attach a chart image, or both." }, { status: 400 });
  }
  if (images.length > 4) {
    return NextResponse.json({ error: "Max 4 images per request." }, { status: 400 });
  }

  const settings = await readSettings();
  const profile: TradingProfile = {
    ...DEFAULT_PROFILE,
    ...(settings.profile ?? {}),
    ...(body.profile ?? {}),
  };

  try {
    const result = await generateSignal(message, profile, images);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
