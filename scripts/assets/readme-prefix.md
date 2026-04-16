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

## Шаг 4 — что сделано по графику

На странице **`/`** отображаются:

- **линейный SVG-график** «заказы по дням» и «выручка по дням»;
- столбчатое представление по дням (как дополнение).

Данные читаются из **Supabase** (`public.orders`).

## Шаг 5 — нужно ли всё вручную? Шлёт ли RetailCRM в Telegram сам?

**В текущей реализации RetailCRM сам по себе не вызывает вашего Telegram-бота:** у демо обычно нет готового «из коробки» сценария «новый заказ → POST в произвольный бот без кода».

Как устроено здесь:

1. Заказ попадает в RetailCRM (в т.ч. из `mock_orders.json` через `upload:retailcrm`).
2. Скрипт **`sync:supabase`** или эндпоинт **`GET /api/cron/sync`** забирает заказы из RetailCRM API, считает сумму, пишет в Supabase.
3. Если сумма **строго больше** порога (по умолчанию 50 000, см. раздел про порог ниже) и заказ ещё не был в дедупе — отправляется сообщение в Telegram.

**Если нужно почти «из RetailCRM сразу»**, возможны варианты на стороне CRM (если доступны на вашем тарифе): **вебхук / интеграция** на ваш URL с тем же кодом отправки; либо **внешний частый cron** (GitHub Actions, UptimeRobot и т.д.) с `curl` к `/api/cron/sync`.

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
