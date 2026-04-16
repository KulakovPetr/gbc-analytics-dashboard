#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const token = process.env.TELEGRAM_BOT_TOKEN || "";
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`;
const res = await fetch(url);
const json = await res.json();
if (!json.ok) {
  console.error(json);
  process.exit(1);
}

const updates = Array.isArray(json.result) ? json.result : [];
if (updates.length === 0) {
  console.log("No updates yet. Send /start to your bot in Telegram, then rerun.");
  process.exit(0);
}

for (const u of updates.slice(-10)) {
  const chat = u.message?.chat || u.channel_post?.chat;
  const text = u.message?.text || u.channel_post?.text || "(no text)";
  if (chat) {
    console.log(`chat_id=${chat.id} type=${chat.type} title_or_user=${chat.title || chat.username || chat.first_name || "unknown"} text=${text}`);
  }
}
