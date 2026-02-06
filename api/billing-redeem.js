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

async function supabasePatch(table, query, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

async function supabaseUpsert(table, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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

  const { code } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Invalid code" });
    return;
  }

  const codes = await supabaseSelect(
    "activation_codes",
    `code=eq.${encodeURIComponent(code)}&select=code,plan_id,status,expires_at`
  );
  const record = codes?.[0];
  if (!record || record.status !== "new") {
    res.status(400).json({ error: "Code not valid" });
    return;
  }
  if (record.expires_at && record.expires_at < new Date().toISOString()) {
    res.status(400).json({ error: "Code expired" });
    return;
  }

  await supabasePatch("activation_codes", `code=eq.${encodeURIComponent(code)}`, {
    status: "redeemed",
    redeemed_by_user_id: user.id,
    redeemed_at: new Date().toISOString(),
  });

  await supabaseUpsert("entitlements", {
    user_id: user.id,
    plan_id: record.plan_id,
    status: "active",
    starts_at: new Date().toISOString(),
    ends_at: null,
    updated_at: new Date().toISOString(),
  });

  res.status(200).json({ ok: true, planId: record.plan_id });
}
