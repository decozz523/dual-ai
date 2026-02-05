import {
  adminFetch,
  getBearerToken,
  getDailyLimitForPlan,
  getEffectivePlan,
  getSupabaseEnv,
  getUserFromAccessToken,
  getAllowedModelsForPlan,
} from "./_supabase-rest.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
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

    const planResp = await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: `/rest/v1/user_plans?user_id=eq.${user.id}&select=plan,status,valid_until`,
    });
    const planRows = await planResp.json();
    const planRow = Array.isArray(planRows) ? planRows[0] : null;
    const plan = getEffectivePlan(planRow);
    const dailyLimit = getDailyLimitForPlan(plan);

    const usageResp = await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: `/rest/v1/daily_usage?user_id=eq.${user.id}&day=eq.${new Date().toISOString().slice(0,10)}&select=messages_used`,
    });
    const usageRows = await usageResp.json();
    const messagesUsed = Number(usageRows?.[0]?.messages_used || 0);

    res.status(200).json({
      plan,
      dailyLimit,
      messagesUsed,
      remaining: Math.max(0, dailyLimit - messagesUsed),
      allowedModels: getAllowedModelsForPlan(plan),
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
