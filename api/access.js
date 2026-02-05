import {
  getBearerToken,
  getTodayUsage,
  getUserFromToken,
  loadAccess,
} from "./_access.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const token = getBearerToken(req);
  const user = await getUserFromToken(token);
  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const access = await loadAccess(user.id);
    const usage = await getTodayUsage(user.id);
    res.status(200).json({
      plan: access.planKey,
      planLabel: access.planLabel,
      dailyLimit: access.dailyLimit,
      usedMessages: usage.used,
      remainingMessages: Math.max(access.dailyLimit - usage.used, 0),
      models: access.models,
      validUntil: access.validUntil,
    });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
}
