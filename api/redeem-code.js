function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function redeemViaSupabase({ code, userId }) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  const selectResp = await fetch(
    `${url}/rest/v1/billing_codes?code=eq.${encodeURIComponent(code)}&select=code,plan,redeemed_by&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!selectResp.ok) {
    return { error: "Supabase billing_codes select failed" };
  }

  const rows = await selectResp.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Код не найден" };
  }

  const row = rows[0];
  if (row.redeemed_by) {
    return { error: "Код уже использован" };
  }

  const updateResp = await fetch(
    `${url}/rest/v1/billing_codes?code=eq.${encodeURIComponent(code)}&redeemed_by=is.null`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        redeemed_by: userId,
        redeemed_at: new Date().toISOString(),
      }),
    }
  );

  if (!updateResp.ok) {
    return { error: "Код уже был активирован параллельно" };
  }

  const updatedRows = await updateResp.json();
  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    return { error: "Код уже был активирован" };
  }

  const plan = updatedRows[0].plan || row.plan;
  return { plan };
}

function redeemViaEnv(code) {
  const raw = process.env.REDEEM_CODES_JSON;
  if (!raw) return { error: "Не настроено хранилище кодов" };
  try {
    const map = JSON.parse(raw);
    const plan = map[code];
    if (!plan) return { error: "Код не найден" };
    if (!["pro", "max"].includes(plan)) return { error: "Неверный тариф в коде" };
    return { plan };
  } catch {
    return { error: "REDEEM_CODES_JSON содержит некорректный JSON" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const userId = req.headers["x-user-id"] || "anonymous";
  const body = readBody(req);
  const code = String(body?.code || "").trim();

  if (!code) {
    res.status(400).json({ error: "Код обязателен" });
    return;
  }

  const supabaseResult = await redeemViaSupabase({ code, userId });
  if (supabaseResult?.plan) {
    res.status(200).json({ ok: true, plan: supabaseResult.plan });
    return;
  }
  if (supabaseResult?.error && supabaseResult.error !== "Supabase billing_codes select failed") {
    res.status(400).json({ error: supabaseResult.error });
    return;
  }

  const envResult = redeemViaEnv(code);
  if (envResult.plan) {
    res.status(200).json({ ok: true, plan: envResult.plan, source: "env" });
    return;
  }

  res.status(400).json({ error: envResult.error || "Не удалось активировать код" });
}
