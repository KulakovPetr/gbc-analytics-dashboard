# RetailCRM -> Supabase sync (Stage B)

Run this SQL first in Supabase SQL Editor:

```sql
-- file: docs/supabase-schema.sql
```

Then sync:

```bash
npm run sync:supabase
```

The script reads all orders from RetailCRM (with site auto-detection fallback) and performs idempotent upsert into Supabase table `orders` by `external_id`.
