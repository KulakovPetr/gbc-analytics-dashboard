# Тестовое задание — AI Tools Specialist

Построй мини-дашборд заказов. Используй Claude Code CLI (или другой AI-инструмент).

## Что нужно сделать

### Шаг 1: Создай аккаунты (всё бесплатно)

- [RetailCRM](https://www.retailcrm.ru/) — демо-аккаунт
- [Supabase](https://supabase.com/) — бесплатный проект
- [Vercel](https://vercel.com/) — бесплатный аккаунт
- [Telegram Bot](https://t.me/BotFather) — создай бота

### Шаг 2: Загрузи заказы в RetailCRM

В репо есть `mock_orders.json` — 50 тестовых заказов. Загрузи их в свой RetailCRM через API.

### Шаг 3: RetailCRM > Supabase

Напиши скрипт который забирает заказы из RetailCRM API и кладёт в Supabase.

### Шаг 4: Дашборд

Сделай веб-страницу с графиком заказов (данные из Supabase). Задеплой на Vercel.

### Шаг 5: Telegram-бот

Настрой уведомление в Telegram когда в RetailCRM появляется заказ на сумму больше 50 000 ₸.

## Результат

- Ссылка на работающий дашборд (Vercel)
- Ссылка на GitHub-репо с кодом
- Скриншот уведомления из Telegram
- В README репо опиши: какие промпты давал Claude Code, где застрял, как решил

## Как сдать

Отправь результат в Telegram: @DmitriyKrasnikov

---

## Ссылки по текущему результату

- Рабочий дашборд (Vercel): https://gbc-analytics-dashboard-902955kdk-vovaduolingo-1703s-projects.vercel.app
- GitHub репозиторий: https://github.com/KulakovPetr/gbc-analytics-dashboard

## Проверка перед сдачей заказчику

- Ветка **`main`** запушена на GitHub и совпадает с тем, что импортирует Vercel.
- В настройках проекта Vercel заданы переменные из **`.env.example`**, плюс **`CRON_SECRET`** для вызова `GET /api/cron/sync` (cron или ручной запрос с `Authorization: Bearer …`).
- Убедитесь, что последний **деплой в Vercel зелёный**: в репо для **Hobby** в `vercel.json` задан **суточный** cron (`0 9 * * *`). Если переключите на более частое выражение без **Pro**, деплой может быть отклонён — тогда верните сутки или используйте внешний вызов `GET /api/cron/sync`.
- Локально уже прогоняли: **`npm run sync:supabase`**; перед сдачей имеет смысл ещё раз **`npm run build`** (и при необходимости **`npm run lint`**).

## Промпты для Cursor AI (этап 0 + полный `docs/AI_PLAYBOOK.md`)

Ниже сначала **этап 0**, затем **полный текст** [`docs/AI_PLAYBOOK.md`](./docs/AI_PLAYBOOK.md) — второй блок — копия файла **целиком** (ссылки приведены к путям от корня репозитория). После правок в плейбуке обновите раздел командой `python scripts/refresh-readme-prompts.py`.

### Этап 0 — изучить ТЗ, согласовать архитектуру и план промптов

**Смысл:** ответ на вопрос «с чего начать»: сначала понять задание и документы, потом резать работу на этапы A–E из плейбука.

**Промпт 0 (скопируй целиком):**

```text
Контекст: README (разделы «Что нужно сделать», «Результат»), @docs/TASKS.md @docs/ARCHITECTURE.md @docs/AI_PLAYBOOK.md @mock_orders.json (только структура полей, без переписывания данных)

Задача (ветка docs/tz-readiness или chore/tz-bootstrap):
1) Кратко переформулируй тестовое задание своими словами: входы, выходы, сервисы, критерии сдачи.
2) Проверь согласованность docs/ARCHITECTURE.md и docs/TASKS.md с ТЗ (потоки RetailCRM → Supabase → Next.js → Telegram; границы ответственности).
3) Сверься с AI_PLAYBOOK: этапы A–E должны закрывать ТЗ; если чего-то не хватает — добавь подзадачу или примечание в TASKS.md.
4) В этом шаге не добавляй бизнес-код приложения; допустимы правки только в docs/ и чеклистах. Коммит + push; CI зелёный.

Критерий готово: есть общая картина этапов и можно копировать промпты A1–E1 без двусмысленностей.
```

---

# Инструкция: как выполнить задание и что писать агенту (Cursor)

Цель: **одна сессия / одно сообщение = одна смысловая задача**. Внутри сообщения — **2–3 явных действия** (что сделать в коде → какую команду прогнать → что запушить). Вы не обязаны сами набирать команды: агент выполняет их в терминале, вы проверяете PR и GitHub Actions.

Подготовка: заполните `.env` по [SERVICES_SETUP.md](./docs/SERVICES_SETUP.md) (локально, не в git). В Cursor откройте **корень репозитория** `gbc-analytics-dashboard`.

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

В репозитории файл [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

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

Агенту не нужно писать «сделай всё задание» одним сообщением — так дольше и чаще ломается CI. **Режьте по этапам 0 и A–E.**

---

## Связь с другими документами

- [TASKS.md](./docs/TASKS.md) — чеклист фаз T0–T6.
- [SERVICES_SETUP.md](./docs/SERVICES_SETUP.md) — ключи и URL.
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — стек и потоки данных.


## Где застревал и как решал

- RetailCRM `400 Order is not loaded` из-за несуществующего `orderType` -> взят рабочий код `main` (и авто-детект default типа).
- Supabase `401 Secret API key required` при проверке anon ключа -> проверка перенесена на `/auth/v1/settings`.
- Telegram `409 Conflict` на `getUpdates` -> удалён активный webhook (`deleteWebhook`).
- Telegram `403 bots can't send messages to bots` -> исправлен `TELEGRAM_CHAT_ID` на id приватного чата пользователя.
- Локальный timeout до Telegram API без VPN -> проверка и отправка выполнялись при доступной сети/VPN.

## Быстрый запуск

```bash
npm install
npm run upload:retailcrm
npm run sync:supabase
npm run dev
```

Тот же пайплайн RetailCRM → Supabase (и при настроенном Telegram — уведомления), что и у cron на Vercel, можно прогнать локально: **`npm run sync:supabase`** (переменные окружения — как в `.env.example`).

## Синк, Supabase и Telegram (порог)

Цепочка такая: синк забирает заказы из RetailCRM, **считает сумму заказа** (по позициям или `totalSumm`), пишет строки в Supabase; **Telegram вызывается только** для заказов, у которых эта сумма **строго больше** порога. Порог по умолчанию — **50 000**, задаётся переменной **`TELEGRAM_ALERT_THRESHOLD_KZT`**. Заказы ниже или равные порогу **просто не попадают в рассылку** — синк при этом **не падает с ошибкой** из‑за «тихих» заказов.

Повторная отправка по одному и тому же заказу отсекается дедупом в **`order_events`** (новый `external_id` выше порога снова попадёт в выборку).

**Пример** (если в CRM итог заказа в тех же единицах, что и порог: 40 000 = «40k» и т.д.):

- **Уведомления не будет:** 40k, **50k** (ровно 50 000 не подходит — нужно **строго больше**), 30k, 10k, 15k, 44k, 33k.
- **Уведомление уйдёт** (при первом появлении в синке и при настроенном боте): 55k, 80k, 66k, 77k, 78k, 99k.

На проде Vercel для cron нужны как минимум **`CRON_SECRET`** (Bearer для `GET /api/cron/sync`) и те же RetailCRM / Supabase / Telegram переменные, что и для локального синка — см. `.env.example`.

## Vercel Cron: частота синка

В `vercel.json` маршрут **`GET /api/cron/sync`** вызывается по расписанию. Сейчас в репозитории: **раз в сутки** в 09:00 UTC (`0 9 * * *`) — совместимо с **Hobby**.

По [официальной таблице Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing) на плане **Hobby** cron допускается **только раз в сутки**; выражения чаще (например `*/10 * * * *`) **ломают деплой** с сообщением вроде *«Hobby accounts are limited to daily cron jobs»*. В репозитории задано **раз в сутки** (`0 9 * * *`). Нужен синк чаще без **Pro** — **ручной или внешний** вызов `GET /api/cron/sync` с заголовком `Authorization: Bearer <CRON_SECRET>` (в Vercel задайте `CRON_SECRET`).

На **Pro** допускается интервал до **раз в минуту** (`*/1 * * * *`) — удобно для короткого теста.

