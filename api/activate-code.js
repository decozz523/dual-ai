import {
  adminFetch,
  getBearerToken,
  getDailyLimitForPlan,
  getEffectivePlan,
  getSupabaseEnv,
  getUserFromAccessToken,
  hashActivationCode,
  rankPlan,
} from "./_supabase-rest.js";

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const code = String(body?.code || "").trim();
    if (!code) {
      res.status(400).json({ error: "Code is required" });
      return;
    }

    const codeHash = hashActivationCode(code);
    const codeResp = await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: `/rest/v1/activation_codes?code_hash=eq.${codeHash}&select=id,plan,duration_days,used_count,max_activations,expires_at`,
    });
    const codeRows = await codeResp.json();
    const codeRow = Array.isArray(codeRows) ? codeRows[0] : null;
    if (!codeRow) {
      res.status(400).json({ error: "Код не найден" });
      return;
    }

    if (codeRow.expires_at && Date.parse(codeRow.expires_at) < Date.now()) {
      res.status(400).json({ error: "Код истёк" });
      return;
    }

    if (Number(codeRow.used_count || 0) >= Number(codeRow.max_activations || 1)) {
      res.status(400).json({ error: "Код уже использован" });
      return;
    }

    const planResp = await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: `/rest/v1/user_plans?user_id=eq.${user.id}&select=plan,status,valid_until`,
    });
    const planRows = await planResp.json();
    const current = Array.isArray(planRows) ? planRows[0] : null;
    const currentPlan = getEffectivePlan(current);

    const codePlan = codeRow.plan;
    const nextPlan = rankPlan(codePlan) >= rankPlan(currentPlan) ? codePlan : currentPlan;

    const now = new Date();
    const validBase = current?.valid_until && Date.parse(current.valid_until) > Date.now()
      ? new Date(current.valid_until)
      : now;
    const durationDays = Number(codeRow.duration_days || 30);
    const validUntil = addDays(validBase, durationDays);

    await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: "/rest/v1/user_plans?on_conflict=user_id",
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: {
        user_id: user.id,
        plan: nextPlan,
        status: "active",
        valid_until: validUntil.toISOString(),
        source: "telegram_stars",
      },
    });

    await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: `/rest/v1/activation_codes?id=eq.${codeRow.id}`,
      method: "PATCH",
      body: { used_count: Number(codeRow.used_count || 0) + 1 },
    });

    await adminFetch({
      url: env.url,
      serviceRoleKey: env.serviceRoleKey,
      path: "/rest/v1/plan_activations",
      method: "POST",
      body: {
        user_id: user.id,
        code_id: codeRow.id,
        plan_before: currentPlan,
        plan_after: nextPlan,
        valid_until_before: current?.valid_until || null,
        valid_until_after: validUntil.toISOString(),
      },
    });

    res.status(200).json({
      ok: true,
      plan: nextPlan,
      validUntil: validUntil.toISOString(),
      dailyLimit: getDailyLimitForPlan(nextPlan),
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
