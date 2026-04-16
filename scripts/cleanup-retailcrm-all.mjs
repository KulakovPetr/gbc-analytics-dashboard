#!/usr/bin/env node
/**
 * Удаляет все заказы в RetailCRM для выбранного site (постранично).
 * Требует CLEANUP_ALL_CONFIRM=yes — только для пустого демо-аккаунта.
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
const PAGE_LIMIT = Number(process.env.RETAILCRM_SYNC_PAGE_LIMIT || 100);
const DELAY_MS = Number(process.env.RETAILCRM_DELETE_DELAY_MS || 120);

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

async function resolveSite() {
  if (SITE) return SITE;
  const json = await retailGet("/api/credentials");
  const s = Array.isArray(json.sitesAvailable) ? json.sitesAvailable[0] : null;
  if (!s) throw new Error("Set RETAILCRM_SITE in .env");
  return s;
}

async function fetchPage(site, page) {
  const q = `/api/v5/orders?site=${encodeURIComponent(site)}&limit=${PAGE_LIMIT}&page=${page}`;
  return retailGet(q);
}

async function deleteOrder(site, numericId) {
  const u = `${API_URL}/api/v5/orders/${numericId}/delete?apiKey=${encodeURIComponent(API_KEY)}&site=${encodeURIComponent(site)}`;
  const res = await fetch(u, { method: "POST" });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const msg = String(json?.errorMsg || json?.error || "");
  if (msg.includes("API method not found") || msg.includes("not found")) {
    return { ok: false, json, unsupported: true };
  }
  return { ok: res.ok && json.success !== false, json, unsupported: false };
}

async function main() {
  if (process.env.CLEANUP_ALL_CONFIRM !== "yes") {
    throw new Error("Set CLEANUP_ALL_CONFIRM=yes in .env to delete ALL RetailCRM orders for this site.");
  }
  required("RETAILCRM_API_URL", API_URL);
  required("RETAILCRM_API_KEY", API_KEY);

  const site = await resolveSite();
  console.log(`Deleting ALL orders for site=${site} (pages of ${PAGE_LIMIT})…`);

  let deleted = 0;
  let failed = 0;
  let unsupportedNoted = false;

  // Всегда страница 1: после delete список смещается, иначе пропускаются заказы.
  while (true) {
    const json = await fetchPage(site, 1);
    const chunk = Array.isArray(json.orders) ? json.orders : [];
    if (chunk.length === 0) break;

    let pageOk = 0;
    for (const o of chunk) {
      const id = Number(o.id);
      const { ok, json: dj, unsupported } = await deleteOrder(site, id);
      if (unsupported && !unsupportedNoted) {
        unsupportedNoted = true;
        console.warn(
          "\nRetailCRM API v5 не содержит удаления заказа по POST .../orders/{id}/delete (ответ «API method not found»).",
        );
        console.warn("Очистите заказы в CRM вручную: список заказов → массовое удаление (документация RetailCRM).");
        console.warn("Остановка скрипта, чтобы не зациклиться.");
        process.exit(2);
      }
      if (ok) {
        deleted++;
        pageOk++;
        process.stdout.write(".");
      } else {
        failed++;
        console.warn(`\nFAIL id=${id}`, dj?.errorMsg || dj);
      }
      await sleep(DELAY_MS);
    }

    if (pageOk === 0 && chunk.length > 0) {
      console.warn("\nНи один заказ на странице не удалён — выходим (проверьте права API или метод удаления).");
      process.exit(1);
    }
  }

  console.log(`\nDone. Deleted≈${deleted}, failed=${failed}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
