const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getUserFromToken(token) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SERVICE_KEY,
    },
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function supabaseSelect(table, query) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: "Supabase server keys not configured" });
    return;
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUserFromToken(token);
  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const entitlements = await supabaseSelect(
    "entitlements",
    `user_id=eq.${user.id}&select=plan_id,status,ends_at`
  );
  const planId =
    entitlements?.[0]?.status === "active" &&
    (!entitlements?.[0]?.ends_at || entitlements?.[0]?.ends_at > new Date().toISOString())
      ? entitlements?.[0]?.plan_id
      : "free";

  const plans = await supabaseSelect(
    "plans",
    `id=eq.${planId}&select=id,title,daily_limit_messages,allowed_models`
  );
  const plan = plans?.[0];
  if (!plan) {
    res.status(500).json({ error: "Plan not found" });
    return;
  }

  const usage = await supabaseSelect(
    "usage_daily",
    `user_id=eq.${user.id}&date_utc=eq.${today}&select=messages_used`
  );
  const used = usage?.[0]?.messages_used || 0;
  const limit = plan.daily_limit_messages || 0;
  const remaining = Math.max(0, limit - used);

  res.status(200).json({
    planId: plan.id,
    planTitle: plan.title,
    limit,
    used,
    remaining,
    allowedModels: plan.allowed_models || [],
  });
}
