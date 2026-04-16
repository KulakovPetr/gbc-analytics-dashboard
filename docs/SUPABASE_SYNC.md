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
- mode: `TELEGRAM_MODE=live|dry-run` (default `live`)
- required env for sending: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- de-dup key: `(external_id, event_type='telegram_high_value')`

If Telegram env vars are missing, sync still completes and skips notifications.
If your local network cannot reach Telegram API, use `TELEGRAM_MODE=dry-run` to validate de-duplication end-to-end without real sends.

## Vercel cron trigger

`vercel.json` includes a cron call to `GET /api/cron/sync` once per day.

- Add `CRON_SECRET` in Vercel project env.
- Vercel will send `Authorization: Bearer <CRON_SECRET>` to cron route.
- Route performs:
  1) RetailCRM fetch
  2) Supabase upsert into `orders`
  3) Telegram send for new high-value orders
  4) de-dup mark in `order_events`
