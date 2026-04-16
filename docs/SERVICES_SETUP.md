# Пошагово: сервисы из задания — что регистрировать и что класть в код

Интеграция идёт **не через SSH и не через логин/пароль в репозиторий**. В программу и в Vercel вы передаёте **URL-адреса сервисов** и **токены/API-ключи** через переменные окружения (файл `.env` локально, «Environment Variables» в панели Vercel). Логин и пароль от веб-интерфейсов нужны вам только чтобы зайти в кабинет и **создать** эти ключи.

---

## 1. RetailCRM (демо)

**Что вам нужно от аккаунта:**

| Что | Где взять | Зачем |
|-----|-----------|--------|
| **URL API** | Обычно `https://<ваш-поддомен>.retailcrm.ru` | Базовый адрес для запросов API v5. |
| **API-ключ** | Администрирование → Интеграции → Ключи API (формулировки могут слегка отличаться в демо) | Заголовок `X-API-KEY` (или параметр, см. [документацию RetailCRM API](https://docs.retailcrm.ru/Developers/Documentation/APIVersions/APIv5)). |

**Не требуется:** SSH, пароль от API в коде, публикация логина в GitHub.

**Пошагово, что нажимать в CRM после регистрации** (магазин, ключ API, права): [RETAILCRM_UPLOAD.md](./RETAILCRM_UPLOAD.md) — раздел в начале файла «Начальная настройка на retailcrm.ru».

**Дальше:** выпишите URL и ключ в `.env` (локально), продублируйте в Vercel после деплоя. Маппинг полей заказа уже в скрипте загрузки; при ошибках справочников см. тот же документ.

---

## 2. Supabase (бесплатный проект)

**Что вам нужно:**

| Что | Где взять | Зачем |
|-----|-----------|--------|
| **Project URL** | Project Settings → API | Например `https://xxxxx.supabase.co`. |
| **anon public** ключ | Там же | Можно использовать на клиенте **только** если таблицы защищены RLS или вы отдаёте только безопасные данные. |
| **service_role** ключ | Там же | **Только сервер** (Next.js Route Handlers, Server Actions, скрипты `scripts/`). Никогда в браузер. |

**Не требуется:** SSH для подключения приложения. (Прямое подключение к Postgres по строке `postgresql://...` возможно для миграций с вашего ПК, но для задания достаточно HTTPS API Supabase.)

**Дальше:** в SQL Editor создайте таблицы (см. [ARCHITECTURE.md](./ARCHITECTURE.md)), вставьте URL и ключи в `.env` и в Vercel.

---

## 3. Vercel (бесплатный аккаунт)

### Важно: не путать с Sales / Enterprise

Страница вида **`vercel.com/contact/sales/demo`** — это **заявка на демо для бизнеса**. Для тестового задания **не нужна**.

### Подробно: куда нажимать, Google vs GitHub, сообщение «Install the GitHub application…»

Отдельная инструкция с пошаговыми экранами: **[VERCEL_SETUP.md](./VERCEL_SETUP.md)**.

Кратко:

1. Регистрация на [vercel.com/signup](https://vercel.com/signup) через **Google** — нормально.
2. Импорт репо (**Add New → Project**) требует **GitHub-аккаунт с кодом** и установленного **GitHub App «Vercel»** (это не то же самое, что логин в Vercel через Google). Если GitHub «пустой» — создайте репозиторий на GitHub и подключите Git в **Vercel → Account Settings → Git → Connect GitHub**.
3. **Environment Variables:** проект → **Settings → Environment Variables** — те же имена, что в `.env.example`.
4. Для деплоя достаточно URL вида `*.vercel.app`; свой домен не обязателен.

---

## 4. Telegram Bot

**Что вам нужно:**

| Что | Как получить |
|-----|----------------|
| **Токен бота** | В Telegram: [@BotFather](https://t.me/BotFather) → `/newbot` → имя и username → выдаст токен вида `123456:ABC...` |
| **chat_id** | Куда слать уведомления: ваш user id (боту пишите `/start`, затем можно узнать id через `@userinfobot` / `@getidsbot`) или id группы, если бот добавлен в группу. |

Токен — в `.env` и Vercel, **не** в Git.

**Дальше:** серверный код вызывает метод Bot API, например `sendMessage`, с токеном в URL или заголовке (как в [документации Telegram](https://core.telegram.org/bots/api)).

---

## Сводка: что лежит в `.env`

См. корневой `.env.example`. Типичный набор:

- `RETAILCRM_API_URL`, `RETAILCRM_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (если нужны на клиенте), `SUPABASE_SERVICE_ROLE_KEY` (сервер)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

Имена можно слегка поменять, но тогда обновите и документацию, и Vercel.

---

## Автоматическая разработка (Cursor / AI)

Для агента достаточно:

- Локального `.env` (в `.gitignore`) с реальными значениями — **файл не коммитить**.
- В репозитории — только `.env.example` без секретов.

SSH к Vercel/Supabase для **разработки не обязателен**: деплой идёт через Git push и интеграцию GitHub ↔ Vercel.
