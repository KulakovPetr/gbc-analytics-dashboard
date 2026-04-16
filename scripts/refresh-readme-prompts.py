# -*- coding: utf-8 -*-
"""Embed docs/AI_PLAYBOOK.md (+ stage 0) into README. Run: python scripts/refresh-readme-prompts.py"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
PLAYBOOK = ROOT / "docs" / "AI_PLAYBOOK.md"

STAGE0 = """## Промпты для Cursor AI (этап 0 + полный `docs/AI_PLAYBOOK.md`)

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

"""


def fix_playbook_links_for_readme(fragment: str) -> str:
    """Paths in AI_PLAYBOOK are relative to docs/; README lives in repo root."""
    repl = [
        ("](./SERVICES_SETUP.md)", "](./docs/SERVICES_SETUP.md)"),
        ("](./TASKS.md)", "](./docs/TASKS.md)"),
        ("](./ARCHITECTURE.md)", "](./docs/ARCHITECTURE.md)"),
        ("](./AI_PLAYBOOK.md)", "](./docs/AI_PLAYBOOK.md)"),
        ("](./LOCAL_WORKFLOW.md)", "](./docs/LOCAL_WORKFLOW.md)"),
        ("](../.github/", "](./.github/"),
    ]
    for a, b in repl:
        fragment = fragment.replace(a, b)
    return fragment


def main() -> None:
    playbook = PLAYBOOK.read_text(encoding="utf-8")
    body = fix_playbook_links_for_readme(playbook.strip())
    body = body.replace("**Режьте по этапам A–E.**", "**Режьте по этапам 0 и A–E.**")
    block = STAGE0.rstrip() + "\n\n---\n\n" + body + "\n"

    readme = README.read_text(encoding="utf-8")
    pattern = r"## (?:Какие промпты[^\n]*|Промпты для Cursor AI[^\n]*)\n\n[\s\S]*?(?=\n## Где застревал)"
    if not re.search(pattern, readme):
        raise SystemExit("README.md: could not find prompts section to replace")
    readme = re.sub(pattern, block.rstrip() + "\n\n", readme, count=1)

    old_check = (
        "- Убедитесь, что последний **деплой в Vercel зелёный**: на **Hobby** расписание `*/10 * * * *` "
        "из репозитория может быть отклонено — тогда либо смените `schedule` на «раз в сутки», либо план **Pro**, "
        "либо внешний триггер синка."
    )
    new_check = (
        "- Убедитесь, что последний **деплой в Vercel зелёный**: в репо для **Hobby** в `vercel.json` задан "
        "**суточный** cron (`0 9 * * *`). Если переключите на более частое выражение без **Pro**, деплой может быть "
        "отклонён — тогда верните сутки или используйте внешний вызов `GET /api/cron/sync`."
    )
    if old_check in readme:
        readme = readme.replace(old_check, new_check)

    readme = readme.replace(
        "Сейчас в репозитории: **каждые 10 минут** (`*/10 * * * *`).",
        "Сейчас в репозитории: **раз в сутки** в 09:00 UTC (`0 9 * * *`) — совместимо с **Hobby**.",
    )

    old_vercel_para = (
        "По [официальной таблице Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing) на плане **Hobby** "
        "cron допускается **только раз в сутки**; более частое выражение **ломает деплой** с сообщением вроде "
        "*«Hobby accounts are limited to daily cron jobs»*. В этом случае либо верните расписание «раз в сутки» "
        "(например `0 9 * * *`), либо перейдите на **Pro**, либо используйте **ручной или внешний** вызов "
        "`GET /api/cron/sync` с заголовком `Authorization: Bearer <CRON_SECRET>` (и заданным в проекте `CRON_SECRET`)."
    )
    new_vercel_para = (
        "По [официальной таблице Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing) на плане **Hobby** "
        "cron допускается **только раз в сутки**; выражения чаще (например `*/10 * * * *`) **ломают деплой** "
        "с сообщением вроде *«Hobby accounts are limited to daily cron jobs»*. В репозитории задано **раз в сутки** "
        "(`0 9 * * *`). Нужен синк чаще без **Pro** — **ручной или внешний** вызов `GET /api/cron/sync` с заголовком "
        "`Authorization: Bearer <CRON_SECRET>` (в Vercel задайте `CRON_SECRET`)."
    )
    if old_vercel_para in readme:
        readme = readme.replace(old_vercel_para, new_vercel_para)

    README.write_text(readme, encoding="utf-8")
    print("OK:", README)


if __name__ == "__main__":
    main()
