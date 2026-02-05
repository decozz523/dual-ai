# Dual AI Chat

MVP-чат с двумя ИИ-персонами и авторизацией через Supabase.

## MVP-монетизация (Telegram Stars)

Поток оплаты:
1. На сайте пользователь нажимает **Купить Pro / Max**.
2. Переходит в Telegram-бота (Stars-оплата).
3. После оплаты бот выдаёт **одноразовый код активации**.
4. Пользователь вводит код на сайте в разделе аккаунта.
5. Сервер валидирует код и обновляет тариф пользователя.

> В текущей версии это сознательно **временная MVP-схема**: без автопривязки Telegram-аккаунта и без автосписаний.

## Рекомендуемая схема Supabase

Чтобы сайт и бот работали с одной логикой, используем отдельные таблицы доступа (не перегружаем `auth.users`).

### 1) `user_access`

Хранит текущий тариф и ограничения пользователя.

```sql
create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_tier text not null default 'free' check (plan_tier in ('free','pro','max')),
  daily_limit integer not null default 80,
  source text not null default 'system',
  valid_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2) `user_daily_usage`

Счётчик потребления по дням (для серверной проверки лимитов).

```sql
create table if not exists public.user_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  used_messages integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);
```

### 3) `activation_codes`

Коды, которые создаёт/выдаёт Telegram-бот.

```sql
create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  plan_tier text not null check (plan_tier in ('pro','max')),
  daily_limit integer not null,
  valid_days integer null,
  expires_at timestamptz null,
  issued_by text null,
  redeemed_by uuid null references auth.users(id),
  redeemed_at timestamptz null,
  created_at timestamptz not null default now()
);
```

## Тарифы и лимиты (MVP)

- **Free**
  - 80 сообщений/день
  - модели: `arcii`, `deepseek`
- **Pro**
  - 400 сообщений/день
  - приоритет выше Free
  - модели: `arcii`, `deepseek`, третья модель
- **Max**
  - 1200 сообщений/день
  - максимальный приоритет
  - все модели Pro + запас под расширенные функции

## Что проверяется сервером

- Пользователь авторизован.
- Имеет доступ к выбранной модели по тарифу.
- Не превышен дневной лимит.
- При успехе запроса к модели — увеличивается дневной счётчик.

## API

- `GET /api/access` — текущий тариф, лимит, остаток, доступные модели.
- `POST /api/redeem-code` — активация кода.
- `POST /api/chat` — чат с серверной проверкой доступа/лимитов.

## Минимальный UX Free / Pro / Max

Только для авторизованных:
- кнопки покупки Pro/Max;
- поле ввода кода активации;
- отображение текущего тарифа, дневного лимита и остатка.

Для анонимных:
- отдельная кнопка “Покупки (вход/регистрация)” открывает auth flow;
- купить тариф без аккаунта нельзя.
