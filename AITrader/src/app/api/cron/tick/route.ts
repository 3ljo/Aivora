import { NextRequest, NextResponse } from "next/server";
import { tickOnce } from "@/lib/alerts/monitor";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? req.nextUrl.searchParams.get("token");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (bearer !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }
  const result = await tickOnce();
  return NextResponse.json(result);
}

export const POST = GET;
