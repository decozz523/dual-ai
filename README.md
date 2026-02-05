# dual-ai

## Монетизация (Free / Pro / Max)

В приложении добавлены тарифы:
- **Free** — 30 сообщений в месяц.
- **Pro** — 100 сообщений в месяц.
- **Max** — без лимита.

### Как это работает
1. Пользователь открывает меню **Настройки → Монетизация**.
2. Нажимает `Купить / Update` (переход в Telegram-бота).
3. После оплаты в Telegram получает код.
4. Вставляет код на сайте и нажимает `Активировать код`.
5. Сайт вызывает `POST /api/redeem-code`, код валидируется и тариф обновляется.

## Настройка Vercel ENV

Обязательные:
- `OPENROUTER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Для активации кодов через Supabase (рекомендуется):
- `SUPABASE_SERVICE_ROLE_KEY`

Ссылка на Telegram-бота в фронте:
- в `app.js` обновите `BILLING_PUBLIC_TELEGRAM_URL`.

Fallback (если не используете таблицу Supabase):
- `REDEEM_CODES_JSON` (например: `{"PRO-111":"pro","MAX-999":"max"}`)

## Supabase: таблица кодов

```sql
create table if not exists public.billing_codes (
  code text primary key,
  plan text not null check (plan in ('pro', 'max')),
  redeemed_by text,
  redeemed_at timestamptz
);
```

Пример вставки кодов:

```sql
insert into public.billing_codes (code, plan)
values
  ('PRO-8HF2-KQ9M', 'pro'),
  ('MAX-2JJ7-UU1T', 'max');
```
