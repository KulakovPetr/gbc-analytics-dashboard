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

Откройте в Supabase: **Project Settings** (шестерёнка) → **API**.

### Куда копировать в `.env` (два ключа из панели)

В блоке **Project API keys** у проекта обычно два длинных JWT (строки на сотни символов). Подписи в интерфейсе могут называться так:

| В панели Supabase (подпись / роль) | Переменная в `.env` и в Vercel | Важно |
|-----------------------------------|----------------------------------|--------|
| **`anon`** / **public** («публичный», для браузера при RLS) | **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | Копируйте **целиком** ключ с меткой **anon**, без кавычек и пробелов. Это **не** секрет service_role. |
| **`service_role`** («секретный», полный доступ к БД) | **`SUPABASE_SERVICE_ROLE_KEY`** | Копируйте ключ с меткой **service_role**. **Никогда** не вставляйте его в префикс `NEXT_PUBLIC_` и не отдавайте в клиентский JS. |

Дополнительно:

| В панели | Переменная |
|----------|------------|
| **Project URL** (например `https://abcdefgh.supabase.co`) | **`NEXT_PUBLIC_SUPABASE_URL`** |

**Типичная ошибка:** в `NEXT_PUBLIC_SUPABASE_ANON_KEY` вставили **service_role** (или наоборот) — тогда в REST будет **401**. Ещё раз скопируйте: в строке anon при декодировании JWT (необязательно) в payload обычно есть `"role":"anon"`, у service_role — `"role":"service_role"`.

### Новые ключи (`sb_publishable_…` и `sb_secret_…`)

В части проектов в разделе **API** вместо подписей `anon` / `service_role` показывают **Publishable** и **Secret** со строками вида `sb_publishable_…` и `sb_secret_…`. Это [новая модель ключей Supabase](https://supabase.com/docs/guides/api/api-keys); для приложения это те же роли:

| В панели Supabase | Переменная в `.env` |
|-------------------|---------------------|
| **Publishable** (`sb_publishable_…`) | **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** |
| **Secret** (`sb_secret_…`) | **`SUPABASE_SERVICE_ROLE_KEY`** |

**Копировать нужно всю строку целиком, вместе с префиксом** `sb_publishable_` или `sb_secret_` — это часть значения ключа, не отдельный «префикс для настройки». Без кавычек в `.env`, без пробелов в начале/конце.

Имена переменных в коде и в Vercel **не меняйте** (`NEXT_PUBLIC_SUPABASE_ANON_KEY` и `SUPABASE_SERVICE_ROLE_KEY`) — подставляйте туда новые значения; клиентские библиотеки Supabase принимают оба формата (JWT и `sb_*`) в заголовке `apikey` / `Authorization: Bearer …`.

**Не требуется:** SSH для приложения. Строка `postgresql://...` из раздела **Database** для этого задания не обязательна, если вы ходите в БД через HTTP API.

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

### Telegram дома без VPN не открывается, с VPN — да

Часто это **ограничение провайдера / региона** до хоста `api.telegram.org` на вашем домашнем интернете, а не ошибка токена.

- **Локально** (`npm run check:env`, Postman с ПК) запрос может **не дойти** — это ожидаемо.
- **Vercel** (сборка и функции в датацентрах вне вашей сети) и **GitHub Actions** обычно **достучаться до Telegram могут** без вашего VPN.

Проверка **не с вашего ПК:** в репозитории есть workflow **[`.github/workflows/telegram-ping.yml`](../.github/workflows/telegram-ping.yml)** (запуск вручную: **Actions → Telegram API ping → Run workflow**). Предварительно добавьте в GitHub **Settings → Secrets and variables → Actions** секрет `TELEGRAM_BOT_TOKEN`. В логе не печатайте токен публично.

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
