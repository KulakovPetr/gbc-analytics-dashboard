# Скрипты (часть сдачи)

Сюда помещайте воспроизводимые скрипты задания:

- проверка `.env` без вывода секретов: из корня `npm run check:env` — [`check-env.mjs`](./check-env.mjs);
- загрузка `mock_orders.json` в RetailCRM — [`upload-to-retailcrm.mjs`](./upload-to-retailcrm.mjs), маппинг в [`lib/map-mock-order-to-retailcrm.mjs`](./lib/map-mock-order-to-retailcrm.mjs);
- синхронизация RetailCRM → Supabase (будет добавлена на этапе B).

Ключи и инструкция: [docs/RETAILCRM_UPLOAD.md](../docs/RETAILCRM_UPLOAD.md).

Черновики и личные заметки — в каталог `local/` у себя на диске (см. [docs/LOCAL_WORKFLOW.md](../docs/LOCAL_WORKFLOW.md), в git не коммитится).
