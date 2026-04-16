# —крипты (часть сдачи)

—юда помещайте воспроизводимые скрипты задани€:

- проверка `.env` без вывода секретов: из корн€ `npm run check:env` Ч [`check-env.mjs`](./check-env.mjs);
- загрузка `mock_orders.json` в RetailCRM Ч [`upload-to-retailcrm.mjs`](./upload-to-retailcrm.mjs), маппинг в [`lib/map-mock-order-to-retailcrm.mjs`](./lib/map-mock-order-to-retailcrm.mjs);
- синхронизаци€ RetailCRM > Supabase Ч [`sync-retailcrm-to-supabase.mjs`](./sync-retailcrm-to-supabase.mjs);
- получение `chat_id` через Telegram Bot API `getUpdates` Ч `npm run telegram:chat-id` ([`get-telegram-updates.mjs`](./get-telegram-updates.mjs)).

 лючи и инструкции:

- [docs/RETAILCRM_UPLOAD.md](../docs/RETAILCRM_UPLOAD.md)
- [docs/SUPABASE_SYNC.md](../docs/SUPABASE_SYNC.md)

„ерновики и личные заметки Ч в каталог `local/` у себ€ на диске (см. [docs/LOCAL_WORKFLOW.md](../docs/LOCAL_WORKFLOW.md), в git не коммититс€).
