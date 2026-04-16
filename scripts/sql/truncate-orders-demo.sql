-- Полный сброс таблиц заказов в Supabase (SQL Editor). Осторожно: удалит все строки.
-- Альтернатива: npm run cleanup:supabase:all с CLEANUP_ALL_CONFIRM=yes в .env

truncate table public.order_events restart identity;
truncate table public.orders restart identity;
