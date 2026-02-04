import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { anon_id } = req.body || {};
    if (!anon_id) return res.status(400).send("anon_id required");

    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRole) {
      return res.status(500).send("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const admin = createClient(supabaseUrl, serviceRole);

    // Переносим все гостевые чаты на user_id текущего пользователя нельзя узнать без JWT.
    // Но мы можем получить user из Authorization заголовка, если добавить его (лучше).
    // В текущем app.js мы не отправляем Authorization, поэтому делаем проще:
    // Миграцию делаем на user_id из auth.users через access token — правильнее так:

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      // Чтобы работало, лучше передавать Authorization из клиента.
      return res.status(401).send("Missing Authorization Bearer token");
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return res.status(401).send("Invalid token");
    }

    const userId = userData.user.id;

    const { data, error } = await admin
      .from("chats")
      .update({ user_id: userId, anon_id: null })
      .eq("anon_id", anon_id)
      .is("user_id", null)
      .select("id");

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ migrated: data?.length || 0 });
  } catch (e) {
    return res.status(500).send(String(e?.message || e));
  }
}
