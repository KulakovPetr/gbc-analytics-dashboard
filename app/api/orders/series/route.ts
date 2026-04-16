import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Row = { created_at: string | null; total_kzt: number | null };

function dayKey(iso: string | null) {
  if (!iso) return "unknown";
  return iso.slice(0, 10);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select("created_at,total_kzt")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const byDay = new Map<string, { orders: number; revenueKzt: number }>();
    for (const row of (data || []) as Row[]) {
      const day = dayKey(row.created_at);
      const prev = byDay.get(day) || { orders: 0, revenueKzt: 0 };
      prev.orders += 1;
      prev.revenueKzt += Number(row.total_kzt || 0);
      byDay.set(day, prev);
    }

    const points = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, orders: v.orders, revenueKzt: Number(v.revenueKzt.toFixed(2)) }));

    const totalOrders = points.reduce((s, p) => s + p.orders, 0);
    const totalRevenueKzt = Number(points.reduce((s, p) => s + p.revenueKzt, 0).toFixed(2));

    return NextResponse.json({ points, totalOrders, totalRevenueKzt });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}