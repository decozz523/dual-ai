export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  res.status(200).json({
    telegramBotUrl: process.env.TELEGRAM_BOT_URL || "https://t.me/your_bot",
  });
}
