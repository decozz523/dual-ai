import crypto from "node:crypto";

const PLAN_LIMITS = { free: 100, pro: 500, max: 2000 };

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase env is not fully configured");
  }
  return { url, anonKey, serviceRoleKey };
}

export function getBearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || typeof auth !== "string") return null;
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export async function getUserFromAccessToken({ url, anonKey, accessToken }) {
  const resp = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!resp.ok) return null;
  const user = await resp.json();
  return user?.id ? user : null;
}

export async function adminFetch({ url, serviceRoleKey, path, method = "GET", body, headers = {} }) {
  const resp = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp;
}

export function getEffectivePlan(row) {
  if (!row) return "free";
  if (row.status && row.status !== "active") return "free";
  if (row.valid_until && Date.parse(row.valid_until) < Date.now()) return "free";
  return row.plan || "free";
}

export function getDailyLimitForPlan(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function getAllowedModelsForPlan(plan) {
  const base = [
    "arcee-ai/trinity-large-preview:free",
    "deepseek/deepseek-r1-0528:free",
  ];
  if (plan === "pro" || plan === "max") {
    base.push("stepfun/step-3.5-flash:free");
  }
  return base;
}

export function hashActivationCode(rawCode) {
  const salt = process.env.ACTIVATION_CODE_SALT || "";
  return crypto
    .createHash("sha256")
    .update(`${rawCode}:${salt}`)
    .digest("hex");
}

export function rankPlan(plan) {
  if (plan === "max") return 3;
  if (plan === "pro") return 2;
  return 1;
}
