const MAX_BODY_BYTES = 60_000;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4_000;

function safeParseBody(input) {
  if (typeof input !== "string") {
    return input;
  }

  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }

  const normalized = [];

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return null;
    }

    const { role, content } = message;
    if (!["system", "user", "assistant"].includes(role) || typeof content !== "string") {
      return null;
    }

    const cleanContent = content.trim();
    if (!cleanContent || cleanContent.length > MAX_MESSAGE_CHARS) {
      return null;
    }

    normalized.push({ role, content: cleanContent });
  }

  return normalized;
}

function buildPayload(rawBody) {
  const rawModel = rawBody?.model;
  const rawMessages = rawBody?.messages;
  const rawTemperature = rawBody?.temperature;
  const rawMaxTokens = rawBody?.max_tokens;

  if (typeof rawModel !== "string" || !rawModel.trim()) {
    return null;
  }

  const messages = normalizeMessages(rawMessages);
  if (!messages) {
    return null;
  }

  const payload = {
    model: rawModel.trim(),
    messages,
  };

  if (typeof rawTemperature === "number" && Number.isFinite(rawTemperature)) {
    payload.temperature = Math.min(2, Math.max(0, rawTemperature));
  }

  if (typeof rawMaxTokens === "number" && Number.isInteger(rawMaxTokens) && rawMaxTokens > 0) {
    payload.max_tokens = Math.min(rawMaxTokens, 2_048);
  }

  return payload;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const bodyLength = Number(req.headers["content-length"] || 0);
  if (bodyLength > MAX_BODY_BYTES) {
    res.status(413).json({ error: "Payload too large" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY is not set" });
    return;
  }

  const parsedBody = safeParseBody(req.body);
  const payload = buildPayload(parsedBody);

  if (!payload) {
    res.status(400).json({
      error:
        "Invalid request body. Expected { model: string, messages: [{ role, content }], temperature?: number, max_tokens?: number }",
    });
    return;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Dual AI Chat",
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { error: "Upstream returned non-JSON response" };
  }

  res.status(response.status).json(data);
}
