# Тестовое задание — AI Tools Specialist

Построй мини-дашборд заказов. Используй **Cursor AI** (или другой AI-инструмент).

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
- В README репо опиши: какие промпты давал **Cursor AI**, где застрял, как решил

## Как сдать

Отправь результат в Telegram: @DmitriyKrasnikov

---

## Этот репозиторий и прод

- **Код (форк / выполнение):** https://github.com/KulakovPetr/gbc-analytics-dashboard  
- **Рабочий дашборд (Vercel):** https://gbc-analytics-dashboard-chwy.vercel.app  
- **Оригинальное ТЗ:** https://github.com/ruslangbc-code/gbc-analytics-dashboard  

## Шаг 5 — уведомления через Vercel (рекомендуемый рабочий путь в этом репозитории)

В этом проекте уведомление о заказе **> 50 000 ₸** делается **не “магией RetailCRM”**, а через **синхронизацию заказов** и отправку Telegram из кода:

1. RetailCRM содержит заказы.
2. **`GET /api/cron/sync`** (на Vercel) забирает заказы из RetailCRM API, upsert в Supabase, и **шлёт Telegram** для новых кандидатов выше порога (с дедупом через `order_events`).
3. Дашборд читает Supabase.

### Vercel Cron (Hobby) — что реально автоматизируется

В `vercel.json` включён cron:

- `GET /api/cron/sync` **раз в сутки** (`0 9 * * *`, UTC).

Это сделано осознанно: на плане **Hobby** Vercel Cron по [лимитам](https://vercel.com/docs/cron-jobs/usage-and-pricing) обычно **не чаще 1 раза в сутки** (более частое расписание часто отклоняется деплоем).

**Важно:** это означает, что уведомление **не обязано прийти мгновенно** в момент создания заказа — оно придёт **на ближайшем запуске cron** (в пределах суток), если заказ уже попал в выборку RetailCRM.

### Защита эндпоинта

Если задан `CRON_SECRET`, вызов должен быть с заголовком:

`Authorization: Bearer <CRON_SECRET>`

### Ручной запуск (локально / для проверки)

```bash
npm run sync:supabase
```

## Почему “напрямую через триггеры RetailCRM → api.telegram.org” у нас не взлетело

Мы пробовали **Автоматизация → Триггеры → HTTP‑запрос** на `https://api.telegram.org/.../sendMessage`.

По факту получилось два класса проблем:

1) **Инфраструктура / доступность `api.telegram.org` из контура RetailCRM**  
Для аккаунтов на `retailcrm.ru` (данные в РФ‑контуре) **исходящие HTTPS к Telegram могут быть недоступны/обрываться**. В журнале это выглядит как **`No response given`**, хотя **с того же токена** `sendMessage` работает с обычного ПК.

2) **Ошибки конфигурации HTTP‑действия** (они тоже встречались)  
Например, невалидные заголовки (`Content-Type:` как “пустое имя заголовка”), смешение режимов `raw` vs `urlencoded`, битый JSON (вместо `\n` случайно получалось `\Н` из‑за кириллицы).

Итог: **надёжный прод‑путь для этой задачи — через Vercel/сервер вне блокировки**, а триггеры CRM оставляем как “возможный, но зависит от сети/контура”.

### Если нужна почти мгновенность без триггеров

Используйте **внешний cron** (GitHub Actions / VPS) с `curl` к `GET /api/cron/sync` **чаще**, чем раз в сутки — это обходит лимит Vercel Cron Hobby.

### Промпт для Cursor AI (вернуть уведомления через Vercel)

```text
Контекст: репозиторий gbc-analytics-dashboard, Next.js App Router, есть /app/api/cron/sync/route.ts и scripts/sync-retailcrm-to-supabase.mjs.

Задача:
1) Верни автоматический синк для уведомлений через Vercel: добавь/восстанови vercel.json crons на GET /api/cron/sync с daily расписанием (Hobby-friendly).
2) Обнови README (scripts/assets/readme-prefix.md + npm run readme:build): основной путь уведомлений — Vercel cron + /api/cron/sync; объясни почему прямой RetailCRM→api.telegram.org мог не работать (сеть/контур + типовые ошибки HTTP-действия) и почему “не мгновенно” на Hobby (cron раз в сутки).
3) Укажи нужные env на Vercel: RETAILCRM_*, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_ALERT_THRESHOLD_KZT, CRON_SECRET.
4) Прогони npm run build.

Критерий готово: деплой на Vercel подхватывает cron, ручной GET /api/cron/sync работает с Bearer CRON_SECRET, README честно описывает ограничения.
```

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

**Полностью “из RetailCRM без сервера”** можно попробовать через **триггеры → HTTP‑запрос** на Telegram Bot API, но на практике это упирается в **доступность `api.telegram.org` из контура RetailCRM** и в корректность настройки HTTP‑действия (см. раздел выше).

**В этом репозитории “канонический” путь для демо/сдачи** — **Vercel**:

- **Vercel Cron** дергает `GET /api/cron/sync` (раз в сутки на Hobby).
- Эндпоинт синканет RetailCRM → Supabase и отправляет Telegram при пороге.

Если нужна частота выше “раз в сутки”, используйте **внешний cron** (GitHub Actions и т.п.) с `curl` к `GET /api/cron/sync`.

---

## Промпты, затыки и решение (текст для сдачи в README)

Ниже — развёрнутый ответ на требование ТЗ: *«какие промпты давал AI-инструмент, где застрял, как решил»*. В качестве инструмента использовался **Cursor AI**. Полные копируемые блоки промптов и цикл ветка → PR → merge лежат в разделе **«Промпты для Cursor AI»** ниже (встроенная копия `docs/AI_PLAYBOOK.md`).

### Какие промпты (логика работы)

Использовался подход **этап 0 → A–E** и «короткий цикл разработки»:

- **Сформулировать задачу агенту** (что сделать, где, как проверить), затем выполнить.
- **Проверить** локально (`npm run build` / `npm run lint` при необходимости).
- **Коммит → push → PR → merge** (держать `main` всегда рабочим).

Далее по этапам:

- **0**: прочитать ТЗ/доки, зафиксировать архитектуру и чеклисты (что является источником правды, какие данные где лежат).
- **A**: загрузить `mock_orders.json` в RetailCRM через API.
- **B**: синк RetailCRM → Supabase (upsert в `orders`, дедуп через `external_id`, события в `order_events`).
- **C**: Next.js дашборд, чтение данных из Supabase, агрегирование по дням.
- **D**: деплой на Vercel и проверка env, health-check, доступность страницы.
- **E**: Telegram-уведомление по порогу и защита от повторов.

Детальные формулировки промптов — в плейбуке (`docs/AI_PLAYBOOK.md`) ниже.

### Где застряли

- **RetailCRM:** `400 Order is not loaded` из‑за несуществующего `orderType` в демо — взяли рабочий код типа из референса / авто-детект `RETAILCRM_SITE`.
- **Supabase:** путаница с ключами (`401`) при проверке — явно разделили **anon** и **service_role**, проверку вынесли на корректные REST-вызовы.
- **Telegram:** `409` из‑за чужого webhook на `getUpdates` — `deleteWebhook`; `403` при отправке «в бота» — исправили **`TELEGRAM_CHAT_ID`** на **числовой id пользователя**, а не бота.
- **Главная на Vercel «не грузится»:** серверный `fetch` на **`localhost`** без `NEXT_PUBLIC_SITE_URL` — убрали self-fetch: агрегация в **`lib/orders-series.ts`** напрямую из Supabase.
- **Уведомления Telegram “напрямую из CRM”:** упёрлись в **недоступность/нестабильность `api.telegram.org` из контура `retailcrm.ru`** (в логах `No response given`, при этом `sendMessage` с ПК работает) + типовые ошибки HTTP‑действия (заголовки/режим `raw` vs `urlencode`/битый JSON). Поэтому для стабильной сдачи вернули **путь через Vercel** (`/api/cron/sync` + cron).
- **Графики:** сначала попытка отрисовать **заказы и выручку на одном поле** выглядела некорректно: ось/сетка были подписаны под **заказы**, а **выручка** масштабировалась отдельно — из‑за этого зелёные точки визуально «попадали» на значения количества заказов. Решение: **разнести на две панели** с отдельными осями Y (сверху выручка зелёная, ниже заказы синие) и добавить гистограмму по заказам.
- **Кодировка README:** часть правок через инструменты ломала UTF-8 — README пересобирается из валидного фрагмента git + этого префикса (`npm run readme:build`).

### Как решили

Сузили контур до **RetailCRM API + Supabase + Next.js**, вынесли общую логику рядов в **`lib/orders-series.ts`**, добавили **`/api/health`**, скрипты **`cleanup:*`** и **`demo:*`** для чистого прогона мока, графики сделали на **SVG** без внешних npm-библиотек (чтобы не упираться в сетевые сбои установки), расширили README под сдачу и задеплоили на Vercel.

Для уведомлений закрепили **Vercel Cron → `/api/cron/sync`** (ежедневно на Hobby) как основной автоматический механизм.

---

## Проверка перед сдачей заказчику

- Ветка **`main`** запушена на GitHub и совпадает с тем, что импортирует Vercel.
- В настройках проекта Vercel заданы переменные из **`.env.example`** (Supabase ключи + RetailCRM ключи для синка).
- В Vercel заданы **`TELEGRAM_BOT_TOKEN`**, **`TELEGRAM_CHAT_ID`**, порог **`TELEGRAM_ALERT_THRESHOLD_KZT`** (по умолчанию 50000) и **`CRON_SECRET`** (если хотите закрыть `GET /api/cron/sync` Bearer‑токеном).
- Убедитесь, что в Vercel включены **Cron Jobs** и деплой подхватил `vercel.json` с расписанием.
- Локально: **`npm run sync:supabase`**, **`npm run build`**, при необходимости **`npm run lint`**.

---
