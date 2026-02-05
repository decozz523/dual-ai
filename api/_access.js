import crypto from "node:crypto";

export const PLAN_CONFIG = {
  free: {
    label: "Free",
    dailyLimit: 80,
    models: [
      "arcee-ai/trinity-large-preview:free",
      "deepseek/deepseek-r1-0528:free",
    ],
    priority: 0,
  },
  pro: {
    label: "Pro",
    dailyLimit: 400,
    models: [
      "arcee-ai/trinity-large-preview:free",
      "deepseek/deepseek-r1-0528:free",
      "stepfun/step-3.5-flash:free",
    ],
    priority: 1,
  },
  max: {
    label: "Max",
    dailyLimit: 1200,
    models: [
      "arcee-ai/trinity-large-preview:free",
      "deepseek/deepseek-r1-0528:free",
      "stepfun/step-3.5-flash:free",
    ],
    priority: 2,
  },
};

function getEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { supabaseUrl, anonKey, serviceRole };
}

export function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

export async function getUserFromToken(token) {
  const { supabaseUrl, anonKey } = getEnv();
  if (!supabaseUrl || !anonKey || !token) return null;
  const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) return null;
  return resp.json();
}

function adminHeaders() {
  const { serviceRole } = getEnv();
  if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function restUrl(path) {
  const { supabaseUrl } = getEnv();
  if (!supabaseUrl) throw new Error("SUPABASE_URL is not set");
  return `${supabaseUrl}/rest/v1/${path}`;
}

export async function loadAccess(userId) {
  const resp = await fetch(
    restUrl(`user_access?user_id=eq.${userId}&select=plan_tier,daily_limit,valid_until`),
    { headers: adminHeaders() },
  );
  if (!resp.ok) {
    throw new Error(`Failed to load user_access: ${resp.status}`);
  }
  const rows = await resp.json();
  const row = rows[0];
  const planKey = row?.plan_tier && PLAN_CONFIG[row.plan_tier] ? row.plan_tier : "free";
  const plan = PLAN_CONFIG[planKey];
  return {
    planKey,
    planLabel: plan.label,
    dailyLimit: Number(row?.daily_limit) || plan.dailyLimit,
    models: plan.models,
    priority: plan.priority,
    validUntil: row?.valid_until || null,
  };
}

export async function getTodayUsage(userId) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const resp = await fetch(
    restUrl(`user_daily_usage?user_id=eq.${userId}&usage_date=eq.${dateKey}&select=used_messages`),
    { headers: adminHeaders() },
  );
  if (!resp.ok) throw new Error(`Failed to load user_daily_usage: ${resp.status}`);
  const rows = await resp.json();
  const used = Number(rows[0]?.used_messages || 0);
  return { dateKey, used };
}

export async function incrementUsage(userId, dateKey, nextUsed) {
  const payload = {
    user_id: userId,
    usage_date: dateKey,
    used_messages: nextUsed,
    updated_at: new Date().toISOString(),
  };
  const resp = await fetch(restUrl("user_daily_usage?on_conflict=user_id,usage_date"), {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Failed to upsert user_daily_usage: ${resp.status}`);
}

export function hashActivationCode(code) {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export async function redeemActivationCode({ userId, code }) {
  const codeHash = hashActivationCode(code);
  const nowIso = new Date().toISOString();
  const findResp = await fetch(
    restUrl(
      `activation_codes?code_hash=eq.${codeHash}&redeemed_at=is.null&or=(expires_at.is.null,expires_at.gt.${nowIso})&select=id,plan_tier,daily_limit,valid_days`,
    ),
    { headers: adminHeaders() },
  );
  if (!findResp.ok) throw new Error(`Failed to load activation code: ${findResp.status}`);
  const rows = await findResp.json();
  const activation = rows[0];
  if (!activation) return null;

  const markResp = await fetch(
    restUrl(`activation_codes?id=eq.${activation.id}&redeemed_at=is.null`),
    {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({
        redeemed_at: nowIso,
        redeemed_by: userId,
      }),
    },
  );
  if (!markResp.ok) throw new Error(`Failed to mark activation code: ${markResp.status}`);

  const validUntil = activation.valid_days
    ? new Date(Date.now() + Number(activation.valid_days) * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const upsertResp = await fetch(restUrl("user_access?on_conflict=user_id"), {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      user_id: userId,
      plan_tier: activation.plan_tier,
      daily_limit:
        Number(activation.daily_limit) || PLAN_CONFIG[activation.plan_tier]?.dailyLimit || PLAN_CONFIG.free.dailyLimit,
      source: "telegram_stars",
      updated_at: nowIso,
      valid_until: validUntil,
    }),
  });
  if (!upsertResp.ok) throw new Error(`Failed to upsert user_access: ${upsertResp.status}`);

  return {
    planTier: activation.plan_tier,
    validUntil,
  };
}
