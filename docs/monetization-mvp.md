# Monetization MVP (Telegram Stars + activation code)

## 1) Цель MVP

На первом этапе используем Telegram Stars без автоподписок:

1. Пользователь нажимает на сайте кнопку **Upgrade / Купить Pro**.
2. Пользователь оплачивает в Telegram-боте.
3. Бот генерирует и отправляет пользователю **одноразовый код активации**.
4. Пользователь вводит код на сайте.
5. Сервер валидирует код и активирует тариф для текущего `user_id`.

Ключевой принцип: **без авторизации покупка/активация недоступна**.

---

## 2) Предложение по схеме Supabase

Не добавлять поля `is_pro` прямо в `dialogs`.

Лучше использовать отдельные таблицы для:
- профиля тарифа,
- фактов активации,
- лимитов/использования,
- кодов активации.

Это масштабируемо для Free / Pro / Max и удобно для бота + сайта.

### 2.1 Таблица `user_plans`
Одна активная запись на пользователя.

Поля:
- `user_id uuid primary key` -> `auth.users(id)`
- `plan text not null default 'free'` (`free | pro | max`)
- `status text not null default 'active'` (`active | blocked | expired`)
- `valid_until timestamptz null` (для time-based доступа)
- `source text not null default 'manual'` (`telegram_stars`, `admin`, ...)
- `updated_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

### 2.2 Таблица `activation_codes`
Коды, которые выдает Telegram-бот.

Поля:
- `id uuid primary key default gen_random_uuid()`
- `code_hash text not null unique` (храним только хеш, не plaintext)
- `plan text not null` (`pro | max`)
- `duration_days int null` (например 30/90) или `null` для бессрочного
- `max_activations int not null default 1`
- `used_count int not null default 0`
- `expires_at timestamptz null`
- `created_by text not null default 'telegram_bot'`
- `created_at timestamptz not null default now()`

### 2.3 Таблица `plan_activations`
Журнал активаций (аудит и поддержка).

Поля:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null` -> `auth.users(id)`
- `code_id uuid not null` -> `activation_codes(id)`
- `plan_before text not null`
- `plan_after text not null`
- `valid_until_before timestamptz null`
- `valid_until_after timestamptz null`
- `activated_at timestamptz not null default now()`
- `meta jsonb not null default '{}'::jsonb`

### 2.4 Таблица `daily_usage`
Серверный лимит по сообщениям.

Поля:
- `user_id uuid not null` -> `auth.users(id)`
- `day date not null`
- `messages_used int not null default 0`
- `updated_at timestamptz not null default now()`

Ключ:
- `primary key (user_id, day)`

---

## 3) Тарифы и лимиты (зафиксировано для MVP)

- **Free**
  - `daily_messages_limit = 100`
  - модели: `arcee-ai/trinity-large-preview:free`, `deepseek/deepseek-r1-0528:free`
- **Pro**
  - `daily_messages_limit = 500`
  - модели: Free + `stepfun/step-3.5-flash:free`
  - приоритет: soft-priority (позже можно добавить отдельную очередь)
- **Max**
  - `daily_messages_limit = 2000` (или без лимита, если решим включить unlimited)
  - все модели
  - запас для premium-фич

Важно:
- `arcee` и `deepseek` доступны на Free.
- третья модель (`stepfun/step-3.5-flash:free`) только для Pro/Max.

Срок действия кода активации для MVP: **30 дней**.

---

## 4) Серверные проверки (обязательно)

Все ограничения применяются на сервере в `/api/chat`:

1. Проверить авторизацию и получить `user_id`.
2. Получить `user_plans.plan`.
3. Проверить доступ к выбранной модели по тарифу.
4. Проверить/инкрементировать `daily_usage.messages_used` атомарно.
5. Если лимит превышен — вернуть `429` + понятный payload для UI.

Нельзя полагаться только на фронт.

---

## 5) Минимальный UX (MVP)

### Для авторизованного пользователя
- Показывать текущий тариф: Free / Pro / Max.
- Показывать дневной остаток: `used / limit`.
- Кнопка **Upgrade / Купить Pro**.
- Поле ввода кода + кнопка **Активировать**.

### Для анонимного пользователя
- Кнопка **Покупки** открывает auth flow (sign in / sign up).
- Текст: «Покупка и активация доступны только после входа в аккаунт».

---

## 6) Что фиксируем сейчас

1. Используем отдельные таблицы (`user_plans`, `activation_codes`, `plan_activations`, `daily_usage`) вместо `is_pro` в `dialogs`.
2. Все лимиты/доступы валидируются сервером.
3. Покупка только для авторизованных пользователей.
4. Free сохраняет доступ к `arcee` + `deepseek`; третья модель — только Pro/Max.

---

## 7) Готовый SQL + пошаговый план запуска в Supabase

Чтобы тебе было проще, я добавил готовый SQL-файл миграции:

- `supabase/migrations/001_monetization_mvp.sql`

Что делает SQL:
- создаёт таблицы `user_plans`, `activation_codes`, `plan_activations`, `daily_usage`;
- добавляет `check`-ограничения и индексы;
- проставляет `free`-план существующим пользователям;
- включает RLS и базовые политики чтения «только своих данных»;
- оставляет `activation_codes` без user-policy (только backend/service role).

### Пошагово (что делать тебе)

1. Открыть Supabase Project -> **SQL Editor**.
2. Вставить SQL из `supabase/migrations/001_monetization_mvp.sql`.
3. Выполнить скрипт и проверить, что все таблицы появились.
4. В `Table Editor` убедиться, что у новых пользователей появляется `free` в `user_plans` (или вставлять при signup через backend).
5. Дальше на сервере реализовать 2 endpoint:
   - `POST /api/activate-code`
   - обновлённый `POST /api/chat` с проверкой плана/лимитов.

### Что нужно от тебя для следующего шага

- Telegram bot secret / API ключ (можно через env, не в коде);
- подтверждение: у `max` лимит 2000 или unlimited;
- можно ли хранить service role key в env деплоя.
