# RetailCRM -> Supabase sync (Stage B + D base)

Run this SQL first in Supabase SQL Editor:

```sql
-- file: docs/supabase-schema.sql
```

Then sync:

```bash
npm run sync:supabase
```

The script reads all orders from RetailCRM (with site auto-detection fallback) and performs idempotent upsert into Supabase table `orders` by `external_id`.

## Telegram alerts (> 50,000 KZT)

The same sync script can send Telegram alerts for high-value orders and de-duplicate notifications using `order_events`:

- threshold: `TELEGRAM_ALERT_THRESHOLD_KZT` (default `50000`)
- required env for sending: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- de-dup key: `(external_id, event_type='telegram_high_value')`

If Telegram env vars are missing, sync still completes and skips notifications.
