#!/usr/bin/env node
/**
 * Демо: Supabase = только заказы с externalId из мока (префикс gbc-mock- или CLEANUP_MOCK_PREFIX).
 * Очищает таблицы заказов в Supabase, затем подтягивает из RetailCRM только отфильтрованные строки.
 *
 * RetailCRM через публичный API v5 удалить заказ нельзя — лишние заказы в CRM остаются,
 * но дашборд показывает только 50 моков после upload + этот скрипт.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

process.env.SYNC_ONLY_MOCK_PREFIX =
  process.env.SYNC_ONLY_MOCK_PREFIX || process.env.CLEANUP_MOCK_PREFIX || "gbc-mock-";
process.env.SYNC_FULL_REPLACE = "yes";

const { runRetailCrmSync } = await import("./sync-retailcrm-to-supabase.mjs");
await runRetailCrmSync();
