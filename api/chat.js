import {
  getBearerToken,
  getTodayUsage,
  getUserFromToken,
  incrementUsage,
  loadAccess,
} from "./_access.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY is not set" });
    return;
  }

  const token = getBearerToken(req);
  const user = await getUserFromToken(token);
  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const requestedModel = String(body?.model || "").trim();

  let access;
  let usage;
  try {
    access = await loadAccess(user.id);
    usage = await getTodayUsage(user.id);
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
    return;
  }

  if (!access.models.includes(requestedModel)) {
    res.status(403).json({
      error: `Модель ${requestedModel} недоступна для тарифа ${access.planLabel}.`,
    });
    return;
  }

  if (usage.used >= access.dailyLimit) {
    res.status(429).json({
      error: `Достигнут дневной лимит (${access.dailyLimit}). Обновите тариф для увеличения лимита.`,
    });
    return;
  }

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Dual AI Chat",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (resp.ok) {
    try {
      await incrementUsage(user.id, usage.dateKey, usage.used + 1);
    } catch {
      // no-op: ответ уже получен, не блокируем пользователя из-за ошибки метрики
    }
  }

  res.status(resp.status).json(data);
}
