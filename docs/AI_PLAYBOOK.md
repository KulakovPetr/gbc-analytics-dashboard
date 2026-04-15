# Инструкция: как выполнить задание и что писать агенту (Cursor)

Цель: **одна сессия / одно сообщение = одна смысловая задача**. Внутри сообщения — **2–3 явных действия** (что сделать в коде → какую команду прогнать → что запушить). Вы не обязаны сами набирать команды: агент выполняет их в терминале, вы проверяете PR и GitHub Actions.

Подготовка: заполните `.env` по [SERVICES_SETUP.md](./SERVICES_SETUP.md) (локально, не в git). В Cursor откройте **корень репозитория** `gbc-analytics-dashboard`.

---

## Цикл на каждую задачу (шаблон)

Повторяйте для каждого блока ниже:

1. **Новая ветка** (можно попросить агента в том же сообщении):
   - `git checkout main && git pull && git checkout -b feat/кратко-о-чем`
2. **Одно сообщение агенту** — копируйте блок из раздела «Промпты» (подставьте свои ветки/имена при необходимости).
3. **После ответа агента:** `git push -u origin HEAD` (или агент уже запушил).
4. **На GitHub:** откройте **Pull Request** → дождитесь **зелёного CI** → **Merge** в `main`.
5. Локально: `git checkout main && git pull`.

Так вы держите `main` рабочим, историю читаемой, а проверки — автоматическими.

---

## Что проверяет CI

В репозитории файл [`.github/workflows/ci.yml`](../.github/workflows/ci.yml):

- Пока **нет** `package.json` — job успешно завершается (фаза загрузки скриптов).
- Когда появится Next.js / Node-проект — в PR должны быть `package.json` и **`package-lock.json`**; CI выполнит `npm ci`, `npm run build`, при наличии — `npm run lint` и `npm test`.

Если CI красный — не мержите; в том же PR напишите агенту: «почини CI по логу job …».

---

## Порядок работ и готовые промпты

Каждый промпт — **одно сообщение** (можно добавить `@docs/ARCHITECTURE.md` `@docs/TASKS.md` в начале для контекста).

### Этап A — Загрузка заказов в RetailCRM

**Цель:** скрипт читает `mock_orders.json`, создаёт заказы через RetailCRM API v5, логирует успех/ошибки.

**Промпт A1 (скопируйте целиком):**

```text
Контекст: @mock_orders.json @docs/ARCHITECTURE.md @.env.example

Задача (одна ветка feat/retailcrm-upload):
1) Добавь в scripts/ Node-скрипт загрузки mock_orders.json в RetailCRM (используй RETAILCRM_API_URL и RETAILCRM_API_KEY из process.env). Сопоставь поля JSON с полями API заказа; при необходимости вынеси маппинг в отдельный модуль.
2) Добавь в package.json в корне scripts: "upload:retailcrm": "node scripts/upload-to-retailcrm.mjs" (или .cjs — на твой выбор), зафиксируй зависимости и package-lock.json.
3) Запусти локально npm run upload:retailcrm (если .env нет — только dry-run или объясни, что нужен .env). Исправь до успешного прогона или честно задокументируй блокер в scripts/README.md.
4) Закоммить, запушь в origin, кратко опиши команды для README.

Критерий готово: PR с зелёным CI, код без секретов в репо.
```

**Ваши 2–3 действия после агента:** push (если не сделал) → открыть PR → merge при зелёном CI.

---

### Этап B — Синк RetailCRM → Supabase

**Промпт B1:**

```text
Контекст: @docs/ARCHITECTURE.md @.env.example

Задача (ветка feat/retailcrm-to-supabase):
1) Добавь SQL в docs/supabase-schema.sql (или supabase/migrations/) — таблица orders с retailcrm id, total_kzt, status, created_at, raw jsonb опционально.
2) Скрипт scripts/sync-retailcrm-to-supabase.mjs: читает заказы из RetailCRM API, upsert в Supabase через service role (SUPABASE_SERVICE_ROLE_KEY), идемпотентность по external id.
3) npm script "sync:supabase"; прогони локально при наличии .env; обнови docs/TASKS.md чекбоксы если уместно.
4) Коммит, push, убедись что CI зелёный.
```

---

### Этап C — Дашборд Next.js + график

**Промпт C1:**

```text
Контекст: @docs/ARCHITECTURE.md

Задача (ветка feat/dashboard):
1) Инициализируй Next.js (App Router, TypeScript) в корне репо без ломания существующих scripts; страница / с графиком заказов по дням из Supabase (через route handler или server component + service role только на сервере; не утекай service key в клиент).
2) Настрой eslint, npm run build, при необходимости npm test.
3) Обнови README: как запустить локально. Коммит + push; CI должен быть зелёным.
```

**Промпт C2 (если разбить):** только график и стили — отдельное короткое сообщение в той же ветке до merge.

---

### Этап D — Telegram и порог 50 000 ₸

**Промпт D1:**

```text
Контекст: @docs/ARCHITECTURE.md @mock_orders.json (структура items)

Задача (ветка feat/telegram-alerts):
1) Серверная логика: при появлении нового заказа с суммой по позициям > 50000 KZT отправляй сообщение в Telegram (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID). Защита от дублей (таблица order_events или флаг в orders).
2) Триггер: выбери один — после sync-скрипта, отдельный npm run notify:telegram, или Vercel Cron + route handler (опиши в README).
3) Прогони сценарий локально или через логи; push; CI зелёный.
```

---

### Этап E — Vercel и сдача

**Руками (не агент):** Vercel → Import Project → репозиторий → Environment Variables = как в `.env.example`.

**Промпт E1:**

```text
Задача (ветка chore/vercel-readme):
1) Добавь vercel.json при необходимости (cron для sync/notify — если используешь).
2) В README: ссылка на прод-дашборд Vercel, как задать env, как вызывать cron/скрипты; раздел «Промпты / затыки / решения» для тестового задания (заглушки заполни своими фактами после ручного прогона).
3) Push; проверь что GitHub Actions и Vercel build зелёные; подготовь текст для отправки @DmitriyKrasnikov (ссылки + что приложить).
```

---

## Как формулировать любую следующую задачу (универсальный шаблон)

Скопируйте и подставьте:

```text
Контекст: @<файлы которые нужны>

Задача (ветка feat/... или fix/...):
1) <конкретное изменение кода/доков>
2) Выполни: <npm run ... / npm test / конкретная команда>
3) Убедись что нет секретов в диффе; commit + push на origin

Критерий готово: <что увидеть в UI или в логах> + зелёный CI на PR.
```

---

## Минимум «команд вам»

| Когда | Вы |
|--------|-----|
| После каждого промпта | Открыть PR, дождаться CI, Merge |
| Конфликт с `main` | Сообщение агенту: «смержи origin/main в эту ветку и почини» |
| Секреты | Только Vercel Env и локальный `.env`; никогда в чат не вставляйте полные ключи |

Агенту не нужно писать «сделай всё задание» одним сообщением — так дольше и чаще ломается CI. **Режьте по этапам A–E.**

---

## Связь с другими документами

- [TASKS.md](./TASKS.md) — чеклист фаз T0–T6.
- [SERVICES_SETUP.md](./SERVICES_SETUP.md) — ключи и URL.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — стек и потоки данных.
