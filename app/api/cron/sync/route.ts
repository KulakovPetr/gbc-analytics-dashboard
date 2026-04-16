import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type RetailOrder = {
  id: number;
  number?: string;
  externalId?: string;
  status?: string;
  orderType?: string;
  orderMethod?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  statusUpdatedAt?: string;
  totalSumm?: number;
  items?: Array<{ quantity?: number; initialPrice?: number; prices?: Array<{ price?: number }> }>;
};

const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);
const THRESHOLD = Number(process.env.TELEGRAM_ALERT_THRESHOLD_KZT || 50000);

function required(name: string, value?: string) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function total(order: RetailOrder): number {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => {
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.initialPrice ?? item.prices?.[0]?.price ?? 0);
      return sum + qty * price;
    }, 0);
  }
  return Number(order.totalSumm ?? 0);
}

function toIso(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapOrder(order: RetailOrder) {
  return {
    external_id: String(order.externalId || `retailcrm-${order.id}`),
    retailcrm_id: Number(order.id),
    order_number: order.number ? String(order.number) : null,
    status: order.status ? String(order.status) : null,
    order_type: order.orderType ? String(order.orderType) : null,
    order_method: order.orderMethod ? String(order.orderMethod) : null,
    customer_first_name: order.firstName ? String(order.firstName) : null,
    customer_last_name: order.lastName ? String(order.lastName) : null,
    phone: order.phone ? String(order.phone) : null,
    email: order.email ? String(order.email) : null,
    total_kzt: Number(total(order).toFixed(2)),
    created_at: toIso(order.createdAt),
    updated_at: toIso(order.statusUpdatedAt || order.createdAt),
    synced_at: new Date().toISOString(),
    raw_payload: order,
  };
}

async function retailGet(pathname: string) {
  const base = required("RETAILCRM_API_URL", process.env.RETAILCRM_API_URL).replace(/\/$/, "");
  const key = encodeURIComponent(required("RETAILCRM_API_KEY", process.env.RETAILCRM_API_KEY));
  const url = `${base}${pathname}${pathname.includes("?") ? "&" : "?"}apiKey=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`RetailCRM ${res.status}: ${json.errorMsg || JSON.stringify(json.errors || json)}`);
  }
  return json;
}

async function resolveSite(): Promise<string> {
  if (process.env.RETAILCRM_SITE) return process.env.RETAILCRM_SITE;
  const json = await retailGet("/api/credentials");
  const site = Array.isArray(json.sitesAvailable) ? json.sitesAvailable[0] : null;
  if (!site) throw new Error("Cannot resolve RETAILCRM_SITE");
  return site;
}

async function fetchOrders(site: string): Promise<RetailOrder[]> {
  let page = 1;
  const all: RetailOrder[] = [];
  while (true) {
    const q = `/api/v5/orders?site=${encodeURIComponent(site)}&limit=${PAGE_LIMIT}&page=${page}`;
    const json = await retailGet(q);
    const rows = Array.isArray(json.orders) ? (json.orders as RetailOrder[]) : [];
    all.push(...rows);
    const totalPages = Number(json.pagination?.totalPageCount || page);
    if (page >= totalPages || rows.length === 0) break;
    page += 1;
  }
  return all;
}

async function upsertOrders(rows: ReturnType<typeof mapOrder>[]) {
  if (rows.length === 0) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("orders").upsert(rows, { onConflict: "external_id" });
  if (error) throw new Error(`Supabase upsert orders failed: ${error.message}`);
}

async function fetchNotifiedSet() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_events")
    .select("external_id")
    .eq("event_type", "telegram_high_value");
  if (error) throw new Error(`Supabase query order_events failed: ${error.message}`);
  return new Set((data || []).map((r) => String((r as { external_id: string }).external_id)));
}

function formatMessage(row: ReturnType<typeof mapOrder>) {
  return [
    "High-value order detected (> 50,000 KZT)",
    `Order: ${row.order_number ? `#${row.order_number}` : row.external_id}`,
    `External ID: ${row.external_id}`,
    `Total: ${Math.round(Number(row.total_kzt || 0)).toLocaleString("ru-RU")} KZT`,
    `Status: ${row.status || "-"}`,
  ].join("\n");
}

async function sendTelegram(text: string) {
  const token = required("TELEGRAM_BOT_TOKEN", process.env.TELEGRAM_BOT_TOKEN);
  const chatId = required("TELEGRAM_CHAT_ID", process.env.TELEGRAM_CHAT_ID);
  const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(`Telegram send failed: ${JSON.stringify(json)}`);
}

async function markNotified(externalIds: string[]) {
  if (externalIds.length === 0) return;
  const rows = externalIds.map((external_id) => ({
    external_id,
    event_type: "telegram_high_value",
    sent_at: new Date().toISOString(),
  }));
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("order_events").upsert(rows, { onConflict: "external_id,event_type" });
  if (error) throw new Error(`Supabase upsert order_events failed: ${error.message}`);
}

function checkCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const site = await resolveSite();
    const retailOrders = await fetchOrders(site);
    const rows = retailOrders.map(mapOrder);
    await upsertOrders(rows);

    const notifiedSet = await fetchNotifiedSet();
    const candidates = rows.filter((r) => Number(r.total_kzt || 0) > THRESHOLD && !notifiedSet.has(r.external_id));
    const sent: string[] = [];

    for (const row of candidates) {
      try {
        await sendTelegram(formatMessage(row));
        sent.push(row.external_id);
      } catch {
        // keep running for remaining rows
      }
    }
    await markNotified(sent);

    return NextResponse.json({
      ok: true,
      syncedOrders: rows.length,
      telegramCandidates: candidates.length,
      telegramSent: sent.length,
      thresholdKzt: THRESHOLD,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}