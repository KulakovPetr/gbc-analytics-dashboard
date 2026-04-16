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
- Убедитесь, что последний **деплой в Vercel зелёный**: на **Hobby** расписание `*/10 * * * *` из репозитория может быть отклонено — тогда либо смените `schedule` на «раз в сутки», либо план **Pro**, либо внешний триггер синка.
- Локально уже прогоняли: **`npm run sync:supabase`**; перед сдачей имеет смысл ещё раз **`npm run build`** (и при необходимости **`npm run lint`**).

## Какие промпты давал Claude Code (кратко)

1. Этап A: загрузка `mock_orders.json` в RetailCRM, маппинг в API v5, логирование ошибок.
2. Этап B: синк RetailCRM -> Supabase, `upsert` по `external_id`, SQL схема таблиц.
3. Этап C: Next.js App Router + TypeScript, страница `/` с графиком по дням из Supabase.
4. Этап D: Telegram-уведомления > 50 000 ₸ + дедуп через `order_events`.
5. Этап E: `vercel.json`, cron-маршрут `/api/cron/sync`, проверка деплоя.

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

В `vercel.json` маршрут **`GET /api/cron/sync`** вызывается по расписанию. Сейчас в репозитории: **каждые 10 минут** (`*/10 * * * *`).

По [официальной таблице Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing) на плане **Hobby** cron допускается **только раз в сутки**; более частое выражение **ломает деплой** с сообщением вроде *«Hobby accounts are limited to daily cron jobs»*. В этом случае либо верните расписание «раз в сутки» (например `0 9 * * *`), либо перейдите на **Pro**, либо используйте **ручной или внешний** вызов `GET /api/cron/sync` с заголовком `Authorization: Bearer <CRON_SECRET>` (и заданным в проекте `CRON_SECRET`).

На **Pro** допускается интервал до **раз в минуту** (`*/1 * * * *`) — удобно для короткого теста.

