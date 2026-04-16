#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const API_URL = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.RETAILCRM_API_KEY || "";
const SITE = process.env.RETAILCRM_SITE || "";
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TELEGRAM_THRESHOLD_KZT = Number(process.env.TELEGRAM_ALERT_THRESHOLD_KZT || 50000);
const TELEGRAM_MODE = (process.env.TELEGRAM_MODE || "live").toLowerCase();

function required(name, value) {
  if (!value) {
    throw new Error(`Missing ${name} in .env`);
  }
}

function orderTotal(order) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => {
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.initialPrice ?? item.prices?.[0]?.price ?? 0);
      return sum + qty * price;
    }, 0);
  }
  return Number(order.totalSumm ?? 0);
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function mapOrder(order) {
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

async function retailGet(pathname) {
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
  if (!candidate) throw new Error("Cannot resolve site. Set RETAILCRM_SITE in .env");
  console.log(`Auto-detected RETAILCRM_SITE=${candidate}`);
  return candidate;
}

async function fetchRetailOrders(site) {
  let page = 1;
  const all = [];
  while (true) {
    const query = `/api/v5/orders?site=${encodeURIComponent(site)}&limit=${PAGE_LIMIT}&page=${page}`;
    const json = await retailGet(query);
    const chunk = Array.isArray(json.orders) ? json.orders : [];
    all.push(...chunk);

    const totalPageCount = Number(json.pagination?.totalPageCount || page);
    console.log(`RetailCRM page ${page}/${totalPageCount}, got ${chunk.length}`);
    if (page >= totalPageCount || chunk.length === 0) break;
    page += 1;
  }
  return all;
}

async function wipeSupabaseOrders() {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: e1 } = await sb.from("order_events").delete().not("id", "is", null);
  if (e1) throw new Error(`order_events wipe: ${e1.message}`);
  const { error: e2 } = await sb.from("orders").delete().not("id", "is", null);
  if (e2) throw new Error(`orders wipe: ${e2.message}`);
  console.log("Supabase: cleared order_events + orders (SYNC_FULL_REPLACE).");
}

async function upsertSupabase(rows) {
  if (rows.length === 0) {
    console.log("No rows to upsert.");
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/orders?on_conflict=external_id`;
  const batchSize = 200;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Supabase upsert failed HTTP ${res.status}: ${body}\nRun docs/supabase-schema.sql in SQL Editor first.`,
      );
    }
    upserted += batch.length;
    console.log(`Supabase upserted ${upserted}/${rows.length}`);
  }
}

async function fetchNotifiedExternalIds() {
  const url = `${SUPABASE_URL}/rest/v1/order_events?event_type=eq.telegram_high_value&select=external_id`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Supabase query order_events failed HTTP ${res.status}: ${body}\nRun updated docs/supabase-schema.sql in SQL Editor first.`,
    );
  }
  const rows = await res.json();
  return new Set((rows || []).map((r) => String(r.external_id)));
}

function formatTelegramMessage(row) {
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

async function sendTelegram(text) {
  if (TELEGRAM_MODE === "dry-run") {
    console.log(`Telegram dry-run: ${text.split("\n")[1] || "message prepared"}`);
    return;
  }
  const url = `https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(json)}`);
  }
}

async function markTelegramNotified(externalIds) {
  if (externalIds.length === 0) return;
  const rows = externalIds.map((externalId) => ({
    external_id: externalId,
    event_type: "telegram_high_value",
    sent_at: new Date().toISOString(),
  }));
  const url = `${SUPABASE_URL}/rest/v1/order_events?on_conflict=external_id,event_type`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert order_events failed HTTP ${res.status}: ${body}`);
  }
}

async function notifyHighValueOrders(rows) {
  if (!["live", "dry-run"].includes(TELEGRAM_MODE)) {
    console.warn(`Unknown TELEGRAM_MODE=${TELEGRAM_MODE}. Expected "live" or "dry-run". Using "live".`);
  }
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("Telegram token/chat_id not configured. Skipping notifications.");
    return;
  }
  let notifiedSet;
  try {
    notifiedSet = await fetchNotifiedExternalIds();
  } catch (e) {
    console.warn(`Telegram notifications skipped: ${e.message || e}`);
    return;
  }
  const candidates = rows.filter((r) => Number(r.total_kzt || 0) > TELEGRAM_THRESHOLD_KZT && !notifiedSet.has(r.external_id));

  if (candidates.length === 0) {
    console.log(`Telegram: no new orders above ${TELEGRAM_THRESHOLD_KZT} KZT.`);
    return;
  }
  console.log(`Telegram mode: ${TELEGRAM_MODE}. Candidates above threshold: ${candidates.length}`);

  const sentExternalIds = [];
  for (const row of candidates) {
    try {
      await sendTelegram(formatTelegramMessage(row));
      sentExternalIds.push(row.external_id);
      console.log(`Telegram sent for ${row.external_id}`);
    } catch (e) {
      console.error(`Telegram send failed for ${row.external_id}:`, e.message || e);
    }
  }
  await markTelegramNotified(sentExternalIds);
  console.log(`Telegram notifications: sent ${sentExternalIds.length}/${candidates.length}.`);
}

export async function runRetailCrmSync() {
  required("RETAILCRM_API_URL", API_URL);
  required("RETAILCRM_API_KEY", API_KEY);
  required("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  required("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_KEY);

  const syncOnlyPrefix = (process.env.SYNC_ONLY_MOCK_PREFIX || "").trim();
  const syncFullReplace =
    process.env.SYNC_FULL_REPLACE === "yes" ||
    process.env.SYNC_FULL_REPLACE === "1" ||
    process.env.SYNC_FULL_REPLACE === "true";

  const site = await resolveSite();
  let orders = await fetchRetailOrders(site);
  const totalFetched = orders.length;

  if (syncOnlyPrefix) {
    orders = orders.filter((o) => typeof o.externalId === "string" && o.externalId.startsWith(syncOnlyPrefix));
    console.log(`Filter SYNC_ONLY_MOCK_PREFIX='${syncOnlyPrefix}': ${orders.length}/${totalFetched} orders.`);
  }

  if (syncFullReplace) {
    await wipeSupabaseOrders();
  }

  const rows = orders.map(mapOrder);

  await upsertSupabase(rows);
  await notifyHighValueOrders(rows);
  console.log(`Done. Synced ${rows.length} orders from RetailCRM to Supabase (fetched ${totalFetched} from CRM).`);
}

const syncSelfPath = fileURLToPath(import.meta.url);
const isMain = Boolean(process.argv[1] && path.resolve(process.argv[1]) === path.resolve(syncSelfPath));

if (isMain) {
  runRetailCrmSync().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
