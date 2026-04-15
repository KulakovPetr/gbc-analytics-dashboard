# Agent instructions — gbc-analytics-dashboard

Тестовое задание из корневого [README.md](../README.md): мини-дашборд заказов (RetailCRM → Supabase → веб-график на Vercel + Telegram при заказе > 50 000 ₸).

## Репозиторий

| Путь | Назначение |
|------|------------|
| `README.md` | Полное ТЗ, шаги 1–5, формат сдачи (@DmitriyKrasnikov). |
| `mock_orders.json` | 50 тестовых заказов для загрузки в RetailCRM (API). |
| `docs/ARCHITECTURE.md` | Архитектура и стек. |
| `docs/TASKS.md` | Порядок выполнения задач. |
| `docs/SERVICES_SETUP.md` | Настройка сервисов и переменных окружения. |
| `docs/AI_PLAYBOOK.md` | Промпты для агента по этапам, PR, CI, merge. |
| `local/` | Личные черновики (содержимое в `.gitignore`, не для сдачи). |

Код дашборда и `scripts/` для синка — в репо; секреты только в `.env` и в Vercel Environment Variables.

## Задание по шагам (кратко)

1. Бесплатные аккаунты: RetailCRM (демо), Supabase, Vercel, Telegram Bot.
2. Загрузить `mock_orders.json` в RetailCRM через API.
3. Скрипт: RetailCRM API → таблица(ы) в Supabase.
4. Веб-страница с графиком заказов (данные из Supabase), деплой на Vercel.
5. Бот: уведомление в Telegram при новом заказе в RetailCRM на сумму **> 50 000 ₸** (логика суммы — из позиций заказа, в т.ч. из `items[].initialPrice` × quantity в `mock_orders.json`).

## Результат для сдачи

- Ссылка на дашборд (Vercel).
- Ссылка на GitHub-репо с кодом.
- Скрин уведомления Telegram.
- В README: какие промпты давали AI, где застряли, как решили.

## Проверки (локально)

Зависят от выбранного стека. Минимум перед «готово»:

- Скрипт синка или CI-совместимая команда документирована в README.
- `npm run build` (или аналог) без ошибок для фронта.
- Не коммитить `.env` / секреты — только `.env.example` с плейсхолдерами.

## Безопасность

Не коммитить API-ключи RetailCRM, Supabase service role, токен бота, webhook секреты. Пример переменных — в `.env.example`.
