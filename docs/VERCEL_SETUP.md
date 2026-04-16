# Vercel: подробно (Google-аккаунт, GitHub, импорт проекта)

## Разделение идей

| Что | Зачем |
|-----|--------|
| **Аккаунт Vercel** | Куда вы вошли (Google, GitHub, email). Это **логин на vercel.com**. |
| **GitHub** | Где **лежит код** (репозиторий). Vercel при деплое **читает** репо с GitHub. |
| **Связка Vercel ↔ GitHub** | Одноразовая установка **GitHub App «Vercel»** на стороне GitHub, чтобы Vercel мог клонировать выбранные репозитории. |

Регистрация через **Google** — нормально. GitHub при этом **не обязан** быть тем же email. Нужно **отдельно** подключить GitHub-аккаунт, где лежит ваш форк.

---

## 1. Регистрация (у вас уже сделано)

1. Откройте [vercel.com/signup](https://vercel.com/signup).
2. Войдите через **Continue with Google** (или другой способ).
3. На вопросы плана выберите **Hobby** (бесплатно). Страницы **Sales / Enterprise / contact/sales/demo** для тестового задания **не нужны**.

---

## 2. Почему появляется текст про GitHub App

Когда вы нажимаете **Add New… → Project** и выбираете **Import Git Repository**, Vercel показывает:

> Install the GitHub application for the accounts you wish to Import from to continue

Это значит: **на аккаунте GitHub, где лежит репозиторий, ещё не установлено приложение Vercel** (или вы не авторизованы тем GitHub-пользователем, у которого есть репо).

**Важно:** если вы зашли в Vercel через Google, а **репозиторий создан на GitHub под другим логином** (или GitHub у вас вообще нет) — импорт не продолжится, пока не выполните один из вариантов ниже.

---

## 3. Вариант A (рекомендуется): есть или создаёте GitHub

### 3.1. Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com) под нужным пользователем (тот, у кого будет код).
2. **New repository** → имя, например `gbc-analytics-dashboard` → **Create repository**.
3. Запушьте локальный проект (или сделайте fork с [KulakovPetr/gbc-analytics-dashboard](https://github.com/KulakovPetr/gbc-analytics-dashboard), если так удобнее).

### 3.2. Подключите GitHub к Vercel

1. В Vercel: откройте [vercel.com/dashboard](https://vercel.com/dashboard).
2. Вверху справа **аватар** → **Account Settings** (или **Settings** из меню аккаунта).
3. Слева найдите раздел **Git** / **Connected Git Accounts** (название может быть «Git Providers»).
4. Нажмите **Connect** рядом с **GitHub** (или **Reconnect**).
5. Откроется **GitHub** → страница авторизации **GitHub App «Vercel»**:
   - выберите **Install** для вашего **личного аккаунта** или **организации**;
   - при выборе репозиториев можно указать **All repositories** или **Only select repositories** и отметить только `gbc-analytics-dashboard`.
6. Подтвердите установку (**Install** / **Save**). Вернётесь в Vercel.

### 3.3. Импорт проекта

1. **Dashboard** → **Add New…** → **Project**.
2. В блоке **Import Git Repository** должен появиться список репозиториев того GitHub, куда поставили App.
3. Найдите `gbc-analytics-dashboard` → **Import**.
4. **Framework Preset:** если уже есть Next.js — Vercel подставит сам; если пока только Node-скрипты — можно выбрать **Other** или оставить авто.
5. **Root Directory** — корень, если приложение в корне репо.
6. **Build Command** / **Output** — для чистого Node без фронта позже уточните; для Next.js обычно `npm run build` и `.next`.
7. Нажмите **Deploy**.

После первого деплоя проект получит URL вида **`https://<имя-проекта>.vercel.app`**.

### 3.4. Переменные окружения на Vercel

1. Откройте проект → вкладка **Settings**.
2. Слева **Environment Variables**.
3. Добавьте **имена** как в [`.env.example`](../.env.example) (например `RETAILCRM_API_URL`, `RETAILCRM_API_KEY`, …), **значения** — те же, что в локальном `.env` (вставляйте вручную; не коммитьте в git).
4. Выберите окружения: **Production** (и при необходимости **Preview**).
5. **Save** → заново **Redeploy** последнего деплоя (**Deployments** → … → **Redeploy**), чтобы сборка увидела новые переменные.

---

## 4. Вариант B: GitHub пока не хотите / другой аккаунт

- Создайте **отдельный** GitHub-аккаунт под проект (бесплатно), залейте туда код, затем выполните **вариант A**.
- Либо деплой **с компьютера** через [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`, `vercel login`, в папке проекта `vercel` / `vercel --prod`. Репозиторий на GitHub при этом всё равно удобен для задания («ссылка на репо»), но импорт через UI можно отложить.

---

## 5. Что «требует» Vercel при обычном деплое с GitHub

| Требование | Где это |
|------------|---------|
| Доступ к репозиторию | Установленный **GitHub App Vercel** + выбранный репо при импорте. |
| Команда сборки | В настройках проекта / авто из `package.json` (`npm run build`). |
| Переменные | **Settings → Environment Variables**. |
| Свой домен | **Не обязателен** — достаточно `*.vercel.app`. |

Корпоративный сайт и звонки sales **не нужны** для Hobby.

---

## 6. Если снова видите «Install the GitHub application…»

Проверьте по порядку:

1. В **том же браузере** залогинены ли вы на [github.com](https://github.com) под аккаунтом, где есть репо.
2. **Vercel → Account Settings → Git** — GitHub в статусе **Connected**?
3. На GitHub: **Settings → Applications → Installed GitHub Apps** — есть **Vercel** и у него есть доступ к нужному репозиторию?

После этого снова **Add New → Project** — список репозиториев должен загрузиться.

---

## 7. Ошибка: «The provided GitHub repository does not contain the requested branch or commit reference…» / «repository is not empty»

Текст Vercel означает: **с GitHub не удаётся взять указанную ветку или коммит** (или репозиторий с точки зрения git **пустой** — нет ни одного коммита с файлами).

### Проверьте на GitHub (в браузере)

1. Откройте страницу репозитория: `https://github.com/<ваш-логин>/gbc-analytics-dashboard`.
2. Убедитесь, что есть **хотя бы один коммит** и в корне видны файлы (`package.json`, `README.md` и т.д.), а не только стартовый экран «Quick setup» без пуша.
3. Запомните **имя ветки по умолчанию**: **Settings** репозитория → **General** → **Default branch** (часто `main`, реже `master`).

Если коммиты только на компьютере — выполните push:

```bash
git remote -v
git branch
git push -u origin main
```

(Если основная ветка называется иначе — подставьте её вместо `main`.)

### Проверьте в мастере импорта Vercel

При **Import** иногда в расширенных настройках задают **не ту ветку**. Должна совпадать с **Default branch** на GitHub.

После создания проекта: **Project → Settings → Git** → поле **Production Branch** — должно быть **то же имя**, что default branch на GitHub (например `main`). Если там `main`, а на GitHub только `master` — смените на `master` или переименуйте ветку на GitHub.

### Репозиторий только что создан «пустым» на GitHub

Если вы нажали **Create repository** с галкой «Initialize with README», но **ни разу не делали** `git push` с компьютера — на GitHub может быть только один коммит README — это **не пусто**, импорт обычно проходит. Если репо **вообще без коммитов** (редко) — сделайте первый коммит и push.

### Разные аккаунты

Импортируйте репозиторий того **GitHub-пользователя**, к которому у приложения Vercel есть доступ. Если репо лежит у **организации** — при установке GitHub App выберите org и репозиторий.

---

## 8. Локальная проверка `.env` без утечки секретов

В корне репозитория:

```bash
npm run check:env
```

Скрипт вызывает RetailCRM `/api/credentials`, Supabase REST (anon и service_role), Telegram `getMe`. В консоль **не** печатаются ключи. Интерпретация:

| Результат | Что делать |
|-----------|------------|
| **Supabase HTTP 401** | Чаще всего неверный или обрезанный **anon** / **service_role** ключ (скопируйте заново из Supabase → Project Settings → API, без пробелов и кавычек). |
| **Telegram «fetch failed»** | Нет маршрута до `api.telegram.org` (фаервол/VPN) или неверный URL; при неверном токене обычно приходит JSON с `401`/`Unauthorized` — тогда замените токен в BotFather. |
| **RetailCRM FAIL** | Проверьте URL и API-ключ, права ключа на заказы. |
