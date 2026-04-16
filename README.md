# Тестовое задание — AI Tools Specialist

Построй мини-дашборд заказов. Используй Claude Code CLI (или другой AI-инструмент).

## Оригинальное задание (источник)

Ниже — **дословная** формулировка из репозитория заказчика **[ruslangbc-code/gbc-analytics-dashboard](https://github.com/ruslangbc-code/gbc-analytics-dashboard)** ([README на GitHub](https://github.com/ruslangbc-code/gbc-analytics-dashboard/blob/main/README.md)).

### Шаг 1: Создай аккаунты (всё бесплатно)

- [RetailCRM](https://www.retailcrm.ru/) — демо-аккаунт
- [Supabase](https://supabase.com/) — бесплатный проект
- [Vercel](https://vercel.com/) — бесплатный аккаунт
- [Telegram Bot](https://t.me/BotFather) — создай бота

### Шаг 2: Загрузи заказы в RetailCRM

В репо есть `mock_orders.json` — 50 тестовых заказов. Загрузи их в свой RetailCRM через API.

### Шаг 3: RetailCRM → Supabase

Напиши скрипт который забирает заказы из RetailCRM API и кладёт в Supabase.

### Шаг 4: Дашборд

Сделай веб-страницу с графиком заказов (данные из Supabase). Задеплой на Vercel.

### Шаг 5: Telegram-бот

Настрой уведомление в Telegram когда в RetailCRM появляется заказ на сумму больше 50,000 ₸.

## Результат

- Ссылка на работающий дашборд (Vercel)
- Ссылка на GitHub-репо с кодом
- Скриншот уведомления из Telegram
- В README репо опиши: какие промпты давал Claude Code, где застрял, как решил

## Как сдать

Отправь результат в Telegram: @DmitriyKrasnikov

---

## Этот репозиторий и прод

- **Код (форк / выполнение):** https://github.com/KulakovPetr/gbc-analytics-dashboard  
- **Рабочий дашборд (Vercel):** https://gbc-analytics-dashboard-chwy.vercel.app  
- **Оригинальное ТЗ:** https://github.com/ruslangbc-code/gbc-analytics-dashboard  

## Vercel (бесплатный Hobby) и «уведомления раз в сутки»

На плане **Hobby** встроенный **Vercel Cron** по [официальным лимитам](https://vercel.com/docs/cron-jobs/usage-and-pricing) может выполняться **не чаще одного раза в сутки**; более частое расписание деплой обычно **отклоняет**.

**Важно:** это ограничение относится к **планировщику Vercel** (cron), а не к тому, что «Telegram сам шлёт раз в сутки». В данном проекте блок **`crons` в `vercel.json` отключён**, чтобы не гонять `/api/cron/sync` по расписанию и не раздувать **Error Rate** в метриках функций. Сообщения в Telegram уходят, когда вы запускаете синк вручную: **`npm run sync:supabase`** локально или **`GET /api/cron/sync`** на проде (с `CRON_SECRET`, если задан).

## Данные только из `mock_orders.json` — очистка RetailCRM и Supabase

Чтобы снова пройти путь «с нуля» по данным мока:

1. Очистить **Supabase** от строк с `external_id`, начинающимся на **`gbc-mock-`**, и связанные **`order_events`**.
2. Удалить в **RetailCRM** заказы с тем же префиксом **`gbc-mock-`** в `externalId` (то, что создаёт `npm run upload:retailcrm`).

Команды (нужен заполненный `.env`):

```bash
npm run cleanup:supabase:mocks
npm run cleanup:retailcrm:mocks
npm run upload:retailcrm
npm run sync:supabase
```

По умолчанию префикс задаётся переменной **`CLEANUP_MOCK_PREFIX`** (если не задана — `gbc-mock-`). Другие заказы в CRM и другие строки в Supabase скрипты **не трогают**.

### Полный сброс (осторожно: не только мок)

Если в демо нужно **удалить вообще все** строки в `orders` / `order_events` в Supabase и **все заказы** выбранного магазина в RetailCRM:

1. В `.env` выставить **`CLEANUP_ALL_CONFIRM=yes`** (один раз на запуск).
2. Выполнить:
   - `npm run cleanup:supabase:all`
   - `npm run cleanup:retailcrm:all`
3. Убрать `CLEANUP_ALL_CONFIRM` из `.env` или вернуть в другое значение.

Альтернатива для Supabase без скрипта: SQL в **`scripts/sql/truncate-orders-demo.sql`** (Supabase SQL Editor).

Цепочка «только данные из `mock_orders.json` заново»: **`npm run reset:mock`** (очистка моков → загрузка в CRM → синк в Supabase).

**Важно (RetailCRM API):** в публичной документации **API v5 нет метода удаления заказа**; вызов `POST …/orders/{id}/delete` на облаке даёт **«API method not found»**. Скрипт **`cleanup:retailcrm:all`** при таком ответе **сразу останавливается** — полную очистку аккаунта делают **в интерфейсе** (массовое удаление заказов). После этого: **`npm run upload:retailcrm`** и **`npm run demo:sync-mock-only`** — в **Supabase** останутся **только 50 моков** (фильтр по `gbc-mock-` + полная замена таблиц заказов). Лишние заказы могут остаться только в CRM, дашборд читает Supabase.

## Шаг 4 — что сделано по графику

На странице **`/`** отображаются:

- **линейный SVG-график** «заказы по дням» и «выручка по дням»;
- **столбчатый SVG-график** (гистограмма) числа заказов по дням;
- таблица по дням.

Данные читаются из **Supabase** (`public.orders`).

## Шаг 5 — нужно ли всё вручную? Можно ли «запустить из RetailCRM»?

**Не обязательно только вручную**, но **из коробки RetailCRM не шлёт в ваш личный Telegram-бот** без настройки: это не встроенная кнопка «уведомить бота @…».

Как устроено **в этом репозитории**:

1. Заказ попадает в RetailCRM (в т.ч. из `mock_orders.json` через `upload:retailcrm`).
2. Скрипт **`npm run sync:supabase`** или **`GET /api/cron/sync`** (с `CRON_SECRET`, если задан) забирает заказы из RetailCRM API, считает сумму, пишет в Supabase.
3. Если сумма **строго больше** порога (по умолчанию 50 000 ₸) и заказ ещё не был в дедупе — отправляется сообщение в Telegram.

**Чтобы RetailCRM «сам» дергал ваш код при новом заказе** (почти мгновенно), нужна интеграция на стороне CRM, если она доступна в вашем тарифе/демо: например **вебхук** или **HTTP-запрос** на ваш URL (тот же обработчик, что у cron/sync, или отдельный route). Тогда ручной запуск не нужен, но **настройка в панели RetailCRM всё равно делается вручную один раз**.

Если вебхуков нет или не хотите их настраивать — остаётся **периодический опрос**: внешний cron (GitHub Actions, свой сервер и т.д.) с `curl` к `/api/cron/sync` чаще, чем раз в сутки на Vercel Hobby.

---

## Промпты, затыки и решение (текст для сдачи в README)

Ниже — развёрнутый ответ на требование ТЗ: *«какие промпты давал Claude Code, где застрял, как решил»*. Полные копируемые блоки промптов и цикл ветка → PR → merge лежат в разделе **«Промпты для Cursor AI»** ниже (встроенная копия `docs/AI_PLAYBOOK.md`).

### Какие промпты (логика работы)

Использовался подход **этап 0 → A–E**: сначала зафиксировать архитектуру и чеклисты, затем загрузка моков в RetailCRM, синк в Supabase, Next.js-дашборд, Telegram с порогом и дедупом, выкладка на Vercel. Детальные формулировки — в встроенном плейбуке (разделы A1–E1, цикл, CI).

### Где застряли

- **RetailCRM:** `400 Order is not loaded` из‑за несуществующего `orderType` в демо — взяли рабочий код типа из референса / авто-детект `RETAILCRM_SITE`.
- **Supabase:** путаница с ключами (`401`) при проверке — явно разделили **anon** и **service_role**, проверку вынесли на корректные REST-вызовы.
- **Telegram:** `409` из‑за чужого webhook на `getUpdates` — `deleteWebhook`; `403` при отправке «в бота» — исправили **`TELEGRAM_CHAT_ID`** на **числовой id пользователя**, а не бота.
- **Главная на Vercel «не грузится»:** серверный `fetch` на **`localhost`** без `NEXT_PUBLIC_SITE_URL` — убрали self-fetch: агрегация в **`lib/orders-series.ts`** напрямую из Supabase.
- **Метрики Vercel Error Rate:** частые падения **`/api/cron/sync`** при проблемах с env/внешними API — **отключили `crons`** в `vercel.json`, оставили ручной/внешний вызов.
- **Кодировка README:** часть правок через инструменты ломала UTF-8 — README пересобирается из валидного фрагмента git + этого префикса (`npm run readme:build`).

### Как решили

Сузили контур до **RetailCRM API + Supabase + Next.js**, вынесли общую логику рядов в **`lib/orders-series.ts`**, добавили **`/api/health`**, скрипты **`cleanup:*`** для чистого прогона мока, график на **SVG** без лишних npm-зависимостей, расширили README под сдачу и задеплоили на Vercel.

---

## Проверка перед сдачей заказчику

- Ветка **`main`** запушена на GitHub и совпадает с тем, что импортирует Vercel.
- В настройках проекта Vercel заданы переменные из **`.env.example`**, плюс **`CRON_SECRET`** для ручного или внешнего вызова `GET /api/cron/sync` (заголовок `Authorization: Bearer …`).
- Убедитесь, что последний **деплой в Vercel зелёный**: в `vercel.json` **нет** блока `crons` — автосинк отключён.
- Локально: **`npm run sync:supabase`**, **`npm run build`**, при необходимости **`npm run lint`**.

---

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

## Vercel: синк без автоматического cron

Автоматический Vercel Cron в репозитории **отключён** (блок `crons` удалён из `vercel.json`), чтобы не было постоянных вызовов `/api/cron/sync` и завышенного **Error Rate** в метриках, если env или внешние API временно недоступны. Эндпоинт **`GET /api/cron/sync`** остаётся для **ручного или внешнего** запуска с заголовком `Authorization: Bearer <CRON_SECRET>` (переменная **`CRON_SECRET`** в настройках Vercel).

По [таблице лимитов cron](https://vercel.com/docs/cron-jobs/usage-and-pricing) на **Hobby** допускается не чаще раза в сутки; при необходимости частого синка без **Pro** используйте внешний cron (curl) или локально `npm run sync:supabase`.

На **Pro** при возврате `crons` в `vercel.json` можно интервал до **раз в минуту** (`*/1 * * * *`).

## Сайт не открывается («This page could not be loaded»)

1. **Deployment Protection** — Vercel → проект → **Settings** → **Deployment Protection**. Для публичного демо: **Protection: None** или отключите **Vercel Authentication** для Production/Preview → **Save** → **Redeploy**. [Документация](https://vercel.com/docs/security/deployment-protection).
2. Открывайте **основной прод-домен** из **Settings → Domains** (Production). URL отдельного деплоя может требовать входа в Vercel при защите.
3. **Переменные**: без `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` главная покажет текст ошибки. **Settings → Environment Variables** → **Redeploy**.
4. Сеть: инкогнито, отключите VPN/блокировщики на время проверки.

Проверка без БД: **`GET /api/health`** → `{"ok":true,...}`.
