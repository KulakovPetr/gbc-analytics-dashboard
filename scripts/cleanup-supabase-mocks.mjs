#!/usr/bin/env node
/**
 * Удаляет из Supabase строки, связанные с моками из mock_orders.json (external_id gbc-mock-*)
 * и соответствующие записи в order_events. Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.
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
const PREFIX = process.env.CLEANUP_MOCK_PREFIX || "gbc-mock-";

function required(name, v) {
  if (!v) throw new Error(`Missing ${name} in .env`);
}

async function main() {
  required("NEXT_PUBLIC_SUPABASE_URL", url);
  required("SUPABASE_SERVICE_ROLE_KEY", key);

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const like = `${PREFIX}%`;
  const { error: e1 } = await sb.from("order_events").delete().like("external_id", like);
  if (e1) throw new Error(`order_events delete: ${e1.message}`);

  const { error: e2 } = await sb.from("orders").delete().like("external_id", like);
  if (e2) throw new Error(`orders delete: ${e2.message}`);

  console.log(`Supabase: deleted rows with external_id LIKE '${like}' (order_events + orders).`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
