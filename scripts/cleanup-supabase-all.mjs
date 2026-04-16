#!/usr/bin/env node
/**
 * Полностью очищает public.order_events и public.orders (все строки).
 * Требует CLEANUP_ALL_CONFIRM=yes в .env.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function required(name, v) {
  if (!v) throw new Error(`Missing ${name} in .env`);
}

async function main() {
  if (process.env.CLEANUP_ALL_CONFIRM !== "yes") {
    throw new Error('Set CLEANUP_ALL_CONFIRM=yes in .env to delete ALL rows in orders + order_events.');
  }
  required("NEXT_PUBLIC_SUPABASE_URL", url);
  required("SUPABASE_SERVICE_ROLE_KEY", key);

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { error: e1 } = await sb.from("order_events").delete().not("id", "is", null);
  if (e1) throw new Error(`order_events: ${e1.message}`);

  const { error: e2 } = await sb.from("orders").delete().not("id", "is", null);
  if (e2) throw new Error(`orders: ${e2.message}`);

  console.log("Supabase: all rows removed from order_events and orders.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
