#!/usr/bin/env node
/**
 * Удаляет в RetailCRM заказы с externalId, начинающимся на gbc-mock- (загрузка из mock_orders.json).
 * Нужны RETAILCRM_API_URL, RETAILCRM_API_KEY; при необходимости RETAILCRM_SITE.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const API_URL = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.RETAILCRM_API_KEY || "";
const SITE = process.env.RETAILCRM_SITE || "";
const PREFIX = process.env.CLEANUP_MOCK_PREFIX || "gbc-mock-";
const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);

function required(name, v) {
  if (!v) throw new Error(`Missing ${name} in .env`);
}

async function retailGet(pathname) {
  const u = `${API_URL}${pathname}${pathname.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(u);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`RetailCRM ${res.status}: ${json.errorMsg || JSON.stringify(json.errors || json)}`);
  }
  return json;
}

async function resolveSite() {
  if (SITE) return SITE;
  const json = await retailGet("/api/credentials");
  const s = Array.isArray(json.sitesAvailable) ? json.sitesAvailable[0] : null;
  if (!s) throw new Error("Set RETAILCRM_SITE in .env");
  console.log(`Using site=${s}`);
  return s;
}

async function fetchAllOrders(site) {
  let page = 1;
  const all = [];
  while (true) {
    const q = `/api/v5/orders?site=${encodeURIComponent(site)}&limit=${PAGE_LIMIT}&page=${page}`;
    const json = await retailGet(q);
    const chunk = Array.isArray(json.orders) ? json.orders : [];
    all.push(...chunk);
    const total = Number(json.pagination?.totalPageCount || page);
    if (page >= total || chunk.length === 0) break;
    page += 1;
  }
  return all;
}

async function deleteOrder(site, numericId) {
  const u = `${API_URL}/api/v5/orders/${numericId}/delete?apiKey=${encodeURIComponent(API_KEY)}&site=${encodeURIComponent(site)}`;
  const res = await fetch(u, { method: "POST" });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return { ok: res.ok && json.success !== false, json, status: res.status };
}

async function main() {
  required("RETAILCRM_API_URL", API_URL);
  required("RETAILCRM_API_KEY", API_KEY);
  const site = await resolveSite();
  const orders = await fetchAllOrders(site);
  const targets = orders.filter((o) => typeof o.externalId === "string" && o.externalId.startsWith(PREFIX));

  if (targets.length === 0) {
    console.log(`No orders with externalId starting with '${PREFIX}'.`);
    return;
  }

  console.log(`Deleting ${targets.length} orders…`);
  let ok = 0;
  let fail = 0;
  for (const o of targets) {
    const id = Number(o.id);
    const { ok: success, json, status } = await deleteOrder(site, id);
    if (success) {
      ok++;
      console.log(`OK delete id=${id} externalId=${o.externalId}`);
    } else {
      fail++;
      console.warn(`FAIL id=${id} externalId=${o.externalId} HTTP ${status}`, json.errorMsg || json);
    }
  }
  console.log(`Done. OK=${ok} FAIL=${fail}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
