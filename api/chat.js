import {
  adminFetch,
  getAllowedModelsForPlan,
  getBearerToken,
  getDailyLimitForPlan,
  getEffectivePlan,
  getSupabaseEnv,
  getUserFromAccessToken,
} from "./_supabase-rest.js";

async function consumeQuota({ env, userId, dailyLimit }) {
  const rpc = await adminFetch({
    url: env.url,
    serviceRoleKey: env.serviceRoleKey,
    path: "/rest/v1/rpc/consume_message_quota",
    method: "POST",
    body: { p_user_id: userId, p_limit: dailyLimit },
  });

  if (!rpc.ok) {
    const text = await rpc.text();
    throw new Error(`quota rpc failed: ${text}`);
  }

  const rows = await rpc.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  return {
    allowed: !!row?.allowed,
    used: Number(row?.used || 0),
  };
}

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

  try {
    const env = getSupabaseEnv();
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await getUserFromAccessToken({
      url: env.url,
      anonKey: env.anonKey,
      accessToken: token,
    });
    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const model = String(body?.model || "").trim();
    if (!model) {
      res.status(400).json({ error: "Model is required" });
      return;
    }

    const planResp = await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: `/rest/v1/user_plans?user_id=eq.${user.id}&select=plan,status,valid_until`,
    });
    const planRows = await planResp.json();
    const plan = getEffectivePlan(Array.isArray(planRows) ? planRows[0] : null);
    const allowedModels = getAllowedModelsForPlan(plan);

    if (!allowedModels.includes(model)) {
      res.status(403).json({
        error: "Эта модель недоступна на текущем тарифе",
        code: "MODEL_NOT_ALLOWED",
        plan,
        allowedModels,
      });
      return;
    }

    const dailyLimit = getDailyLimitForPlan(plan);
    const quota = await consumeQuota({ env, userId: user.id, dailyLimit });
    if (!quota.allowed) {
      res.status(429).json({
        error: "Дневной лимит сообщений исчерпан",
        code: "DAILY_LIMIT_REACHED",
        plan,
        dailyLimit,
        used: quota.used,
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
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
