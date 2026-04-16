#!/usr/bin/env node
/**
 * Проверяет заполненность и доступность сервисов из .env.
 * Секреты в консоль НЕ выводятся — только OK / FAIL / SKIP и хосты.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

function hostFromUrl(u) {
  try {
    return new URL(u).host;
  } catch {
    return "(invalid URL)";
  }
}

function status(name, ok, detail = "") {
  const s = ok ? "OK " : "FAIL";
  console.log(`${s.padEnd(5)} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function checkRetailCrm() {
  const url = (process.env.RETAILCRM_API_URL || "").replace(/\/$/, "");
  const key = process.env.RETAILCRM_API_KEY || "";
  if (!url || !key) {
    status("RetailCRM", false, "нужны RETAILCRM_API_URL и RETAILCRM_API_KEY");
    return;
  }
  try {
    const res = await fetch(`${url}/api/credentials?apiKey=${encodeURIComponent(key)}`);
    const json = await res.json();
    if (json.success) {
      const sites = Array.isArray(json.sitesAvailable) ? json.sitesAvailable.join(", ") : "—";
      status("RetailCRM", true, `${hostFromUrl(url)}; sitesAvailable: ${sites}`);
    } else {
      status("RetailCRM", false, json.errorMsg || JSON.stringify(json).slice(0, 120));
    }
  } catch (e) {
    status("RetailCRM", false, e.message);
  }
}

async function checkSupabaseAnon() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anon) {
    status("Supabase (anon)", false, "нужны NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return;
  }
  try {
    // NOTE:
    // /rest/v1/ root introspection currently requires a secret key on many projects,
    // so for publishable/anon validation we probe Auth settings endpoint instead.
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: anon,
      },
    });
    const ok = res.ok;
    status("Supabase (anon/publishable)", ok, `${hostFromUrl(url)} HTTP ${res.status}`);
  } catch (e) {
    status("Supabase (anon/publishable)", false, e.message);
  }
}

async function checkSupabaseService() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !sr) {
    status("Supabase (service_role)", false, "нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: sr,
        Authorization: `Bearer ${sr}`,
      },
    });
    const ok = res.ok || res.status === 404 || res.status === 406;
    status("Supabase (service_role)", ok, `HTTP ${res.status}`);
  } catch (e) {
    status("Supabase (service_role)", false, e.message);
  }
}

async function checkTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!token) {
    status("Telegram", false, "нужен TELEGRAM_BOT_TOKEN");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`);
    const json = await res.json();
    if (json.ok) {
      status("Telegram (getMe)", true, `@${json.result?.username || "bot"}`);
    } else {
      status("Telegram (getMe)", false, json.description || "unknown");
    }
  } catch (e) {
    const extra = e.cause ? ` (${e.cause.message || e.cause})` : "";
    status("Telegram (getMe)", false, `${e.message}${extra} — проверьте токен и доступ к api.telegram.org`);
  }
  if (!chatId) {
    status("Telegram chat_id", false, "пустой TELEGRAM_CHAT_ID (для sendMessage нужен id чата)");
  } else {
    status("Telegram chat_id", true, "задан (отправку не проверяем)");
  }
}

function checkPresence() {
  const pairs = [
    ["RETAILCRM_SITE", process.env.RETAILCRM_SITE],
    ["RETAILCRM_ORDER_TYPE", process.env.RETAILCRM_ORDER_TYPE],
    ["RETAILCRM_ORDER_METHOD", process.env.RETAILCRM_ORDER_METHOD],
    ["RETAILCRM_ORDER_STATUS", process.env.RETAILCRM_ORDER_STATUS],
  ];
  for (const [k, v] of pairs) {
    if (v) {
      status(`${k} (optional)`, true, "задан");
    }
  }
}

async function main() {
  let envExists = true;
  try {
    await readFile(path.join(root, ".env"), "utf8");
  } catch {
    envExists = false;
  }
  if (!envExists) {
    console.log("FAIL  Файл .env не найден. Скопируйте .env.example → .env и заполните.\n");
    process.exit(1);
  }

  console.log("Проверка .env (секреты не печатаются)\n");
  checkPresence();
  await checkRetailCrm();
  await checkSupabaseAnon();
  await checkSupabaseService();
  await checkTelegram();
  console.log("\nГотово. FAIL — проверьте значение в .env или права ключа; для RetailCRM см. docs/RETAILCRM_UPLOAD.md.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
