#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const API_URL = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.RETAILCRM_API_KEY || "";
const SITE = process.env.RETAILCRM_SITE || "";
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);

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

async function main() {
  required("RETAILCRM_API_URL", API_URL);
  required("RETAILCRM_API_KEY", API_KEY);
  required("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  required("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_KEY);

  const site = await resolveSite();
  const orders = await fetchRetailOrders(site);
  const rows = orders.map(mapOrder);

  await upsertSupabase(rows);
  console.log(`Done. Synced ${rows.length} orders from RetailCRM to Supabase.`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
