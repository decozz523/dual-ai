import secrets
import string

import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = "PASTE_TELEGRAM_BOT_TOKEN_HERE"
ADMIN_ID = 123456789

SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "PASTE_SUPABASE_SERVICE_ROLE_KEY"


def generate_code() -> str:
    suffix = "".join(
        secrets.choice(string.ascii_lowercase + string.digits) for _ in range(7)
    )
    return f"dual-{suffix}"


def supabase_insert_code(code: str, plan: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/activation_codes"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    payload = {"code": code, "plan": plan, "is_used": False}
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    if resp.status_code >= 300:
        raise RuntimeError(f"Supabase error: {resp.status_code} {resp.text}")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Привет! Временный режим без оплаты.\n"
        "Администратор может выдать код командой /gen plus|pro."
    )


async def gen_code(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message.from_user.id != ADMIN_ID:
        return
    if not context.args or context.args[0] not in ("plus", "pro"):
        await update.message.reply_text("Использование: /gen plus|pro")
        return
    plan = context.args[0]
    code = generate_code()
    try:
        supabase_insert_code(code, plan)
    except Exception as exc:
        await update.message.reply_text(f"Ошибка при создании кода: {exc}")
        return
    await update.message.reply_text(f"Код для {plan}: {code}")


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("gen", gen_code))
    app.run_polling()


if __name__ == "__main__":
    main()
