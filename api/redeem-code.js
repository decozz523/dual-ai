import {
  getBearerToken,
  getUserFromToken,
  redeemActivationCode,
} from "./_access.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const token = getBearerToken(req);
  const user = await getUserFromToken(token);
  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const code = String(body?.code || "").trim();
  if (!code) {
    res.status(400).json({ error: "Введите код активации." });
    return;
  }

  try {
    const redeemed = await redeemActivationCode({ userId: user.id, code });
    if (!redeemed) {
      res.status(404).json({ error: "Код не найден, истёк или уже использован." });
      return;
    }
    res.status(200).json({ ok: true, plan: redeemed.planTier, validUntil: redeemed.validUntil });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
}
