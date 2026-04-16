#!/usr/bin/env node
/**
 * Массово "трогает" заказы в RetailCRM, чтобы сработал триггер "Изменение заказа".
 * По умолчанию добавляет пробел в конце firstName и сохраняет заказ.
 *
 * Важно: если в триггере стоит условие "Новый заказ" — на edit он НЕ сработает.
 * Для теста изменения временно отключите условие "Новый заказ" или сделайте отдельный триггер.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const API_URL = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.RETAILCRM_API_KEY || "";
const SITE = process.env.RETAILCRM_SITE || "";
const PREFIX = (process.env.TOUCH_PREFIX || process.env.CLEANUP_MOCK_PREFIX || "gbc-mock-").trim();
// append (default) | trim
const MODE = (process.env.TOUCH_MODE || "append").toLowerCase();
const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);
const DELAY_MS = Number(process.env.RETAILCRM_TOUCH_DELAY_MS || 120);

function required(name, v) {
  if (!v) throw new Error(`Missing ${name} in .env`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

async function retailPostForm(pathname, form) {
  const u = `${API_URL}${pathname}${pathname.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(u, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form.toString(),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
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

async function touchOrder(externalId, site, newFirstName) {
  const form = new URLSearchParams();
  form.set("site", site);
  form.set("order", JSON.stringify({ firstName: newFirstName }));
  // По докам: POST /api/v5/orders/{externalId}/edit
  return retailPostForm(`/api/v5/orders/${encodeURIComponent(externalId)}/edit`, form);
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

  console.log(`Touching ${targets.length} orders (prefix='${PREFIX}', mode='${MODE}') on site=${site}…`);
  let ok = 0;
  let fail = 0;

  for (const o of targets) {
    const externalId = String(o.externalId);
    const firstName = typeof o.firstName === "string" ? o.firstName : "";
    const newFirstName =
      MODE === "trim"
        ? firstName.replace(/\s+$/g, "")
        : firstName.endsWith(" ")
          ? firstName
          : `${firstName} `;
    try {
      await touchOrder(externalId, site, newFirstName);
      ok++;
      console.log(`OK  ${externalId}`);
    } catch (e) {
      fail++;
      console.warn(`FAIL ${externalId}: ${e?.message || e}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`Done. OK=${ok} FAIL=${fail}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

