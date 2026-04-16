# Тестовое задание — AI Tools Specialist

Построй мини-дашборд заказов. Используй Claude Code CLI (или другой AI-инструмент).

## Репозиторий

- **Рабочий форк:** [github.com/KulakovPetr/gbc-analytics-dashboard](https://github.com/KulakovPetr/gbc-analytics-dashboard) (`origin`).
- **Исходное описание задания:** [github.com/ruslangbc-code/gbc-analytics-dashboard](https://github.com/ruslangbc-code/gbc-analytics-dashboard).

```bash
git remote add upstream https://github.com/ruslangbc-code/gbc-analytics-dashboard.git   # опционально
```

## Документация для разработки

| Документ | Содержание |
|----------|------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура приложения и потоки данных. |
| [docs/TASKS.md](docs/TASKS.md) | Последовательный список задач с чекбоксами. |
| [docs/SERVICES_SETUP.md](docs/SERVICES_SETUP.md) | Что делать после регистрации RetailCRM, Supabase, Vercel, Telegram; про **не** sales-demo Vercel. |
| [docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md) | Vercel по шагам: Google-логин, **Install GitHub App**, импорт репо, env. |
| [docs/AI_PLAYBOOK.md](docs/AI_PLAYBOOK.md) | **Пошагово:** что писать агенту, промпты по этапам A–E, цикл PR → CI → merge. |
| [docs/RETAILCRM_UPLOAD.md](docs/RETAILCRM_UPLOAD.md) | Ключи RetailCRM, `.env`, команда `npm run upload:retailcrm`. |
| [local/README.md](local/README.md) | Каталог личных черновиков (не сдаётся; в git не попадает содержимое). |

### Загрузка моков в RetailCRM (шаг 2)

```bash
npm install
cp .env.example .env   # заполните RETAILCRM_* — см. docs/RETAILCRM_UPLOAD.md
npm run upload:retailcrm -- --dry-run
npm run upload:retailcrm
```


## Что нужно сделать

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
