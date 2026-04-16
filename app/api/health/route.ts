import { NextResponse } from "next/server";

/** Лёгкая проверка, что edge/Node отвечает (без Supabase и внешних API). */
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
