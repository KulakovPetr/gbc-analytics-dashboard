# Stage B quick runbook

1) В Supabase откройте SQL Editor и выполните файл [`docs/supabase-schema.sql`](./supabase-schema.sql).
2) После успешного SQL в терминале проекта:

```bash
npm run sync:supabase
```

Ожидаемо: `Done. Synced <N> orders from RetailCRM to Supabase.`

Если снова 404 на `public.orders` — SQL не применился или применился в другом проекте/схеме.
