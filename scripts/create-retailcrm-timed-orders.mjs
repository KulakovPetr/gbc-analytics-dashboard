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
const ORDER_TYPE = process.env.RETAILCRM_ORDER_TYPE || "main";
const ORDER_METHOD = process.env.RETAILCRM_ORDER_METHOD || "shopping-cart";
const STATUS = process.env.RETAILCRM_ORDER_STATUS || "new";

const COUNT = Number(process.env.RETAILCRM_TIMED_COUNT || 30);
const MIN_SEC = Number(process.env.RETAILCRM_TIMED_MIN_SEC || 10);
const MAX_SEC = Number(process.env.RETAILCRM_TIMED_MAX_SEC || 180);

function required(name, value) {
  if (!value) throw new Error(`Missing ${name}`);
}

function fmt(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createOrder(order) {
  const url = `${API_URL}/api/v5/orders/create?apiKey=${encodeURIComponent(API_KEY)}`;
  const body = new URLSearchParams();
  body.set("order", JSON.stringify(order));
  if (SITE) body.set("site", SITE);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString(),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  required("RETAILCRM_API_URL", API_URL);
  required("RETAILCRM_API_KEY", API_KEY);

  let createdAt = new Date();
  const baseExternal = `timed-${Date.now()}`;
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < COUNT; i++) {
    const delta = randomInt(MIN_SEC, MAX_SEC);
    createdAt = new Date(createdAt.getTime() - delta * 1000);

    const highValue = i % 3 !== 0;
    const total = highValue ? 70000 : 30000;
    const qty = highValue ? 2 : 1;
    const itemPrice = Math.round(total / qty);

    const order = {
      externalId: `${baseExternal}-${String(i + 1).padStart(3, "0")}`,
      firstName: "Petr",
      lastName: "Kulakov",
      phone: "+77009998877",
      email: "petr.kulakov@example.com",
      orderType: ORDER_TYPE,
      orderMethod: ORDER_METHOD,
      status: STATUS,
      countryIso: "KZ",
      createdAt: fmt(createdAt),
      items: [
        {
          productName: highValue ? "High Value Test Item" : "Low Value Test Item",
          quantity: qty,
          initialPrice: itemPrice,
        },
      ],
      delivery: {
        address: {
          city: "Алматы",
          text: "Тестовый адрес",
        },
      },
    };

    const { status, json } = await createOrder(order);
    if (json.success) {
      ok++;
      console.log(`[${i + 1}/${COUNT}] created id=${json.id} externalId=${order.externalId} total=${total} createdAt=${order.createdAt}`);
    } else {
      fail++;
      console.log(`[${i + 1}/${COUNT}] FAILED HTTP ${status} externalId=${order.externalId}`, json.errorMsg || JSON.stringify(json.errors || json));
    }
  }

  console.log(`Done. Created=${ok}, failed=${fail}, highValue=${Math.ceil((COUNT * 2) / 3)}, lowValue=${Math.floor(COUNT / 3)}.`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
