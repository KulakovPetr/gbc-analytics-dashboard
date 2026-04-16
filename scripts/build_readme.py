# -*- coding: utf-8 -*-
"""Собирает README.md: scripts/assets/readme-prefix.md + встроенный плейбук из git (4db518a) + хвост с 4db518a с «Быстрый запуск»."""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREFIX_FILE = ROOT / "scripts" / "assets" / "readme-prefix.md"
README_OUT = ROOT / "README.md"
BASE_COMMIT = "4db518a"


def load_base_lines() -> list[str]:
    p = subprocess.run(
        ["git", "show", f"{BASE_COMMIT}:README.md"],
        cwd=ROOT,
        capture_output=True,
    )
    if p.returncode != 0:
        raise SystemExit(p.stderr.decode())
    return p.stdout.decode("utf-8").splitlines()


def patch_tail(tail: str) -> str:
    old = (
        "## Vercel Cron: частота синка\n\n"
        "В `vercel.json` маршрут **`GET /api/cron/sync`** вызывается по расписанию. Сейчас в репозитории: **раз в сутки** "
        "в 09:00 UTC (`0 9 * * *`) — совместимо с **Hobby**.\n\n"
        "По [официальной таблице Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing) на плане **Hobby** cron "
        "допускается **только раз в сутки**; выражения чаще (например `*/10 * * * *`) **ломают деплой** с сообщением "
        "вроде *«Hobby accounts are limited to daily cron jobs»*. В репозитории задано **раз в сутки** (`0 9 * * *`). "
        "Нужен синк чаще без **Pro** — **ручной или внешний** вызов `GET /api/cron/sync` с заголовком "
        "`Authorization: Bearer <CRON_SECRET>` (в Vercel задайте `CRON_SECRET`).\n\n"
        "На **Pro** допускается интервал до **раз в минуту** (`*/1 * * * *`) — удобно для короткого теста.\n"
    )
    new = (
        "## Vercel: синк без автоматического cron\n\n"
        "Автоматический Vercel Cron в репозитории **отключён** (блок `crons` удалён из `vercel.json`), чтобы не было "
        "постоянных вызовов `/api/cron/sync` и завышенного **Error Rate** в метриках, если env или внешние API временно "
        "недоступны. Эндпоинт **`GET /api/cron/sync`** остаётся для **ручного или внешнего** запуска с заголовком "
        "`Authorization: Bearer <CRON_SECRET>` (переменная **`CRON_SECRET`** в настройках Vercel).\n\n"
        "По [таблице лимитов cron](https://vercel.com/docs/cron-jobs/usage-and-pricing) на **Hobby** допускается не чаще "
        "раза в сутки; при необходимости частого синка без **Pro** используйте внешний cron (curl) или локально "
        "`npm run sync:supabase`.\n\n"
        "На **Pro** при возврате `crons` в `vercel.json` можно интервал до **раз в минуту** (`*/1 * * * *`).\n\n"
        "## Сайт не открывается («This page could not be loaded»)\n\n"
        "1. **Deployment Protection** — Vercel → проект → **Settings** → **Deployment Protection**. Для публичного демо: "
        "**Protection: None** или отключите **Vercel Authentication** для Production/Preview → **Save** → **Redeploy**. "
        "[Документация](https://vercel.com/docs/security/deployment-protection).\n"
        "2. Открывайте **основной прод-домен** из **Settings → Domains** (Production). URL отдельного деплоя может требовать входа в Vercel при защите.\n"
        "3. **Переменные**: без `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` главная покажет текст ошибки. "
        "**Settings → Environment Variables** → **Redeploy**.\n"
        "4. Сеть: инкогнито, отключите VPN/блокировщики на время проверки.\n\n"
        "Проверка без БД: **`GET /api/health`** → `{\"ok\":true,...}`.\n"
    )
    if old in tail:
        tail = tail.replace(old, new)
    return tail


def main() -> None:
    prefix = PREFIX_FILE.read_text(encoding="utf-8")
    lines = load_base_lines()
    # Строки 55–236 файла 4db518a (1-based): индексы 54–236
    playbook = "\n".join(lines[54:237]).rstrip() + "\n"
    tail = "\n".join(lines[245:]).rstrip() + "\n"
    tail = patch_tail(tail)
    out = prefix.rstrip() + "\n\n" + playbook + "\n" + tail
    README_OUT.write_text(out, encoding="utf-8")
    print("Wrote", README_OUT, "lines", out.count("\n") + 1)


if __name__ == "__main__":
    main()
