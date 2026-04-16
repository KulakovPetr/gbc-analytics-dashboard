import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type OrdersSeriesPoint = { day: string; orders: number; revenueKzt: number };

export type OrdersSeriesResult = {
  points: OrdersSeriesPoint[];
  totalOrders: number;
  totalRevenueKzt: number;
};

type Row = { created_at: string | null; total_kzt: number | null };

function dayKey(iso: string | null) {
  if (!iso) return "unknown";
  return iso.slice(0, 10);
}

/** Агрегация заказов по дням из Supabase (общая логика для страницы и API). */
export async function fetchOrdersSeries(): Promise<OrdersSeriesResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("created_at,total_kzt")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
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

  return { points, totalOrders, totalRevenueKzt };
}
