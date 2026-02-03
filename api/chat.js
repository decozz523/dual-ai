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

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

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
  res.status(resp.status).json(data);
}
