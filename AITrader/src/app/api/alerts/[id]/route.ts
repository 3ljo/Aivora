import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteRule, updateRule, getRule } from "@/lib/alerts/store";

export const runtime = "nodejs";

const PatchSchema = z.object({
  status: z.enum(["active", "triggered", "disabled"]).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid patch.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await updateRule(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ rule: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = await deleteRule(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rule = await getRule(id);
  if (!rule) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ rule });
}
