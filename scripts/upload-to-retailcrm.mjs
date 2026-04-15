#!/usr/bin/env node
/**
 * Upload orders from mock_orders.json into RetailCRM (API v5).
 *
 * Usage (from repo root):
 *   npm run upload:retailcrm              # real upload (needs .env)
 *   npm run upload:retailcrm -- --dry-run # validate mapping, no HTTP
 *
 * @see docs/RETAILCRM_UPLOAD.md
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { mapMockOrderToRetailOrder } from "./lib/map-mock-order-to-retailcrm.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });

const DRY_RUN =
  process.argv.includes("--dry-run") ||
  process.env.DRY_RUN === "1" ||
  process.env.DRY_RUN === "true";

const API_URL = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.RETAILCRM_API_KEY || "";
const SITE = process.env.RETAILCRM_SITE || "";

const includeCustomFields =
  process.env.RETAILCRM_INCLUDE_CUSTOM_FIELDS === "1" ||
  process.env.RETAILCRM_INCLUDE_CUSTOM_FIELDS === "true";

const mapOpts = {
  countryIso: process.env.RETAILCRM_COUNTRY_ISO || "KZ",
  includeCustomFields,
  orderType: process.env.RETAILCRM_ORDER_TYPE,
  orderMethod: process.env.RETAILCRM_ORDER_METHOD,
  orderStatus: process.env.RETAILCRM_ORDER_STATUS,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createOrder(order) {
  const url = `${API_URL}/api/v5/orders/create?apiKey=${encodeURIComponent(API_KEY)}`;
  const body = new URLSearchParams();
  body.set("order", JSON.stringify(order));
  if (SITE) {
    body.set("site", SITE);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const mockPath = path.join(repoRoot, "mock_orders.json");
  const raw = await readFile(mockPath, "utf8");
  /** @type {object[]} */
  const mocks = JSON.parse(raw);
  if (!Array.isArray(mocks)) {
    throw new Error("mock_orders.json must be a JSON array");
  }

  console.log(`Loaded ${mocks.length} mock orders from mock_orders.json`);

  if (DRY_RUN || !API_KEY) {
    if (!API_KEY) {
      console.log("RETAILCRM_API_KEY not set — running in --dry-run mode (no API calls).");
    }
    const sample = mapMockOrderToRetailOrder(mocks[0], { index: 0 }, mapOpts);
    console.log("Sample mapped order (first):");
    console.log(JSON.stringify(sample, null, 2));
    console.log("Dry-run OK. Set .env and run without --dry-run to upload.");
    return;
  }

  if (!API_URL) {
    console.error("Missing RETAILCRM_API_URL in .env");
    process.exit(1);
  }
  if (!SITE) {
    console.warn(
      "RETAILCRM_SITE is empty. If the API returns an error about «site», set RETAILCRM_SITE to your store symbolic code (Администрирование → Магазины).",
    );
  }

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < mocks.length; i++) {
    const order = mapMockOrderToRetailOrder(mocks[i], { index: i }, mapOpts);
    try {
      const { status, json } = await createOrder(order);
      if (json.success) {
        ok++;
        console.log(`[${i + 1}/${mocks.length}] created id=${json.id ?? "?"} externalId=${order.externalId}`);
      } else {
        fail++;
        console.error(
          `[${i + 1}/${mocks.length}] FAILED externalId=${order.externalId} HTTP ${status}`,
          json.errorMsg || json.error || JSON.stringify(json.errors || json).slice(0, 400),
        );
      }
    } catch (e) {
      fail++;
      console.error(`[${i + 1}/${mocks.length}] ERROR externalId=${order.externalId}`, e.message || e);
    }
    await sleep(Number(process.env.RETAILCRM_UPLOAD_DELAY_MS || 150));
  }

  console.log(`\nDone. Success: ${ok}, failed: ${fail}`);
  if (fail > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
