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

Настрой уведомление в Telegram когда в RetailCRM появляется заказ на сумму больше 50,000 ?.

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

## Какие промпты давал Claude Code (кратко)

1. Этап A: загрузка `mock_orders.json` в RetailCRM, маппинг в API v5, логирование ошибок.
2. Этап B: синк RetailCRM -> Supabase, `upsert` по `external_id`, SQL схема таблиц.
3. Этап C: Next.js App Router + TypeScript, страница `/` с графиком по дням из Supabase.
4. Этап D: Telegram-уведомления > 50,000 ? + дедуп через `order_events`.
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
