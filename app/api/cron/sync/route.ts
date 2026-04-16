import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const API_URL = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.RETAILCRM_API_KEY || "";
const SITE = process.env.RETAILCRM_SITE || "";
const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TELEGRAM_THRESHOLD_KZT = Number(process.env.TELEGRAM_ALERT_THRESHOLD_KZT || 50000);
const TELEGRAM_MODE = (process.env.TELEGRAM_MODE || "live").toLowerCase();

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function ensureCronAuth(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  if (!cronSecret) return true;

  const auth = req.headers.get("authorization") || "";
  const bearerOk = auth === `Bearer ${cronSecret}`;
  const queryOk = req.nextUrl.searchParams.get("key") === cronSecret;
  return bearerOk || queryOk;
}

function required(name: string, value: string) {
  if (!value) throw new Error(`Missing ${name}`);
}

function orderTotal(order: any) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum: number, item: any) => {
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.initialPrice ?? item.prices?.[0]?.price ?? 0);
      return sum + qty * price;
    }, 0);
  }
  return Number(order.totalSumm ?? 0);
}

function toIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function mapOrder(order: any) {
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
    total_kzt: Number(orderTotal(order).toFixed(2)),
    created_at: toIso(order.createdAt),
    updated_at: toIso(order.statusUpdatedAt || order.createdAt),
    synced_at: new Date().toISOString(),
    raw_payload: order,
  };
}

async function retailGet(pathname: string) {
  const url = `${API_URL}${pathname}${pathname.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`RetailCRM API error ${res.status}: ${json.errorMsg || JSON.stringify(json.errors || json)}`);
  }
  return json;
}

async function resolveSite() {
  if (SITE) return SITE;
  const json = await retailGet("/api/credentials");
  const candidate = Array.isArray(json.sitesAvailable) ? json.sitesAvailable[0] : null;
  if (!candidate) throw new Error("Cannot resolve site. Set RETAILCRM_SITE");
  return candidate;
}

async function fetchRetailOrders(site: string) {
  let page = 1;
  const all: any[] = [];
  while (true) {
    const query = `/api/v5/orders?site=${encodeURIComponent(site)}&limit=${PAGE_LIMIT}&page=${page}`;
    const json = await retailGet(query);
    const chunk = Array.isArray(json.orders) ? json.orders : [];
    all.push(...chunk);

    const totalPageCount = Number(json.pagination?.totalPageCount || page);
    if (page >= totalPageCount || chunk.length === 0) break;
    page += 1;
  }
  return all;
}

async function upsertOrders(rows: any[]) {
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
  return new Set((data || []).map((r: any) => String(r.external_id)));
}

function formatTelegramMessage(row: any) {
  const number = row.order_number ? `№${row.order_number}` : `external_id=${row.external_id}`;
  const customer = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(" ");
  return [
    "High-value order detected (> 50,000 KZT)",
    `Order: ${number}`,
    `External ID: ${row.external_id}`,
    `Total: ${Math.round(Number(row.total_kzt || 0)).toLocaleString("ru-RU")} KZT`,
    `Status: ${row.status || "-"}`,
    `Customer: ${customer || "-"}`,
    `Phone: ${row.phone || "-"}`,
  ].join("\n");
}

async function sendTelegram(text: string) {
  if (TELEGRAM_MODE === "dry-run") return;
  const url = `https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(`Telegram sendMessage failed: ${JSON.stringify(json)}`);
}

async function markNotified(externalIds: string[]) {
  if (externalIds.length === 0) return;
  const supabase = getSupabaseAdmin();
  const rows = externalIds.map((external_id) => ({
    external_id,
    event_type: "telegram_high_value",
    sent_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("order_events").upsert(rows, { onConflict: "external_id,event_type" });
  if (error) throw new Error(`Supabase upsert order_events failed: ${error.message}`);
}

async function notifyHighValue(rows: any[]) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { attempted: 0, sent: 0, skipped: "missing_telegram_env" };
  }

  const notifiedSet = await fetchNotifiedSet();
  const candidates = rows.filter((r) => Number(r.total_kzt || 0) > TELEGRAM_THRESHOLD_KZT && !notifiedSet.has(r.external_id));
  if (candidates.length === 0) return { attempted: 0, sent: 0, skipped: "no_new_high_value" };

  const sentExternalIds: string[] = [];
  for (const row of candidates) {
    try {
      await sendTelegram(formatTelegramMessage(row));
      sentExternalIds.push(row.external_id);
    } catch (e) {
      console.error("Telegram send failed", row.external_id, e);
    }
  }
  await markNotified(sentExternalIds);
  return { attempted: candidates.length, sent: sentExternalIds.length, mode: TELEGRAM_MODE };
}

export async function GET(req: NextRequest) {
  if (!ensureCronAuth(req)) return unauthorized();

  try {
    required("RETAILCRM_API_URL", API_URL);
    required("RETAILCRM_API_KEY", API_KEY);

    const site = await resolveSite();
    const orders = await fetchRetailOrders(site);
    const rows = orders.map(mapOrder);
    await upsertOrders(rows);
    const telegram = await notifyHighValue(rows);

    return NextResponse.json({ ok: true, site, synced: rows.length, telegram });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}