export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY is not set" });
    return;
  }
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: "Supabase server keys not configured" });
    return;
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceKey,
    },
  });
  if (!userResp.ok) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await userResp.json();
  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const requestedModel = body?.model;
  const today = new Date().toISOString().slice(0, 10);

  const entResp = await fetch(
    `${supabaseUrl}/rest/v1/entitlements?user_id=eq.${user.id}&select=plan_id,status,ends_at`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }
  );
  if (!entResp.ok) {
    res.status(500).json({ error: "Entitlements lookup failed" });
    return;
  }
  const entitlements = await entResp.json();
  const planId =
    entitlements?.[0]?.status === "active" &&
    (!entitlements?.[0]?.ends_at || entitlements?.[0]?.ends_at > new Date().toISOString())
      ? entitlements?.[0]?.plan_id
      : "free";

  const planResp = await fetch(
    `${supabaseUrl}/rest/v1/plans?id=eq.${planId}&select=id,title,daily_limit_messages,allowed_models`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }
  );
  if (!planResp.ok) {
    res.status(500).json({ error: "Plan lookup failed" });
    return;
  }
  const plans = await planResp.json();
  const plan = plans?.[0];
  if (!plan) {
    res.status(500).json({ error: "Plan not found" });
    return;
  }

  if (!plan.allowed_models?.includes(requestedModel)) {
    res.status(403).json({ error: "Model not allowed for current plan" });
    return;
  }

  const usageResp = await fetch(
    `${supabaseUrl}/rest/v1/usage_daily?user_id=eq.${user.id}&date_utc=eq.${today}&select=messages_used`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }
  );
  if (!usageResp.ok) {
    res.status(500).json({ error: "Usage lookup failed" });
    return;
  }
  const usageRows = await usageResp.json();
  const used = usageRows?.[0]?.messages_used || 0;
  const limit = plan.daily_limit_messages || 0;
  if (used >= limit) {
    res.status(429).json({ error: "Daily limit exceeded" });
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
    const nextUsed = used + 1;
    const hasRow = usageRows?.length > 0;
    if (hasRow) {
      await fetch(
        `${supabaseUrl}/rest/v1/usage_daily?user_id=eq.${user.id}&date_utc=eq.${today}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages_used: nextUsed, updated_at: new Date().toISOString() }),
        }
      );
    } else {
      await fetch(`${supabaseUrl}/rest/v1/usage_daily`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          date_utc: today,
          messages_used: nextUsed,
          updated_at: new Date().toISOString(),
        }),
      });
    }
  }
  res.status(resp.status).json(data);
}
