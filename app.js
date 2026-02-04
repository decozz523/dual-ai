import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_KEY = "dual-ai-chat-settings-v1";
const AUTH_KEY = "dual-ai-chat-auth-v1";
const ANON_ID_KEY = "dual-ai-chat-anon-id-v1";
const CHAT_ID_KEY = "dual-ai-chat-id-v1";

const $ = (id) => document.getElementById(id);
const modelEl = $("model");
const turnsEl = $("turns");
const messagesEl = $("messages");
const inputEl = $("input");
const sendBtn = $("sendBtn");
const demoBtn = $("demoBtn");
const saveBtn = $("saveBtn");
const clearBtn = $("clearBtn");
const statusEl = $("status");
const menuBtn = $("menuBtn");
const openDrawerBtn = $("openDrawerBtn");
const newChatBtn = $("newChatBtn");
const toggleViewBtn = $("toggleViewBtn");
const enterChatBtn = $("enterChatBtn");
const drawer = $("drawer");
const drawerOverlay = $("drawerOverlay");
const closeDrawerBtn = $("closeDrawerBtn");
const authBtn = $("authBtn");
const googleAuthBtn = $("googleAuthBtn");
const logoutBtn = $("logoutBtn");
const authStatus = $("authStatus");
const authCard = $("authCard");
const authAvatar = $("authAvatar");
const authName = $("authName");
const authEmail = $("authEmail");
const authMeta = $("authMeta");
const authBirthday = $("authBirthday");
const supabaseStatus = $("supabaseStatus");
const supabaseEmailEl = $("supabaseEmail");
const emailAuthBtn = $("emailAuthBtn");
const supabaseLogoutBtn = $("supabaseLogoutBtn");
const saveDialogBtn = $("saveDialogBtn");

let supabaseClient = null;
let supabaseSession = null;

const PERSONAS = {
  R: {
    label: "Bot R",
    system:
      "Ты — Bot R, рациональный и аналитический ИИ-собеседник. " +
      "В этом чате есть только три участника: Человек, Bot R и Bot S. " +
      "Ты — Bot R и остаёшься им; не выдумывай других ролей или участников. " +
      "Говори структурированно и логично, уточняй вводные и допущения. " +
      "Без лишней эмоциональности. " +
      "Ты общаешься с человеком и Bot S как равноправный участник.",
  },
  S: {
    label: "Bot S",
    system:
      "Ты — Bot S, эмоциональный и творческий ИИ-собеседник. " +
      "В этом чате есть только три участника: Человек, Bot R и Bot S. " +
      "Ты — Bot S и остаёшься им; не выдумывай других ролей или участников. " +
      "Говори живо, образно и поддерживающе. " +
      "Можно немного метафор. " +
      "Ты общаешься с человеком и Bot R как равноправный участник.",
  },
};

/** @type {{speaker: 'user'|'R'|'S', content: string, ts: number}[]} */
let transcript = [];

function setStatus(text, kind = "muted") {
  statusEl.textContent = text;
  statusEl.classList.remove("error", "ok");
  if (kind === "error") statusEl.classList.add("error");
  if (kind === "ok") statusEl.classList.add("ok");
}

function formatAuthDate(ts) {
  if (!ts) return "Привязка активна";
  return `Привязано ${new Date(ts).toLocaleDateString("ru-RU")}`;
}

function getAvatarPlaceholder(label = "G") {
  const safeLabel = encodeURIComponent(label.slice(0, 1).toUpperCase());
  return (
    "data:image/svg+xml;utf8," +
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">` +
    `<rect width="100%" height="100%" fill="%23131a2a"/>` +
    `<text x="50%" y="54%" font-size="20" fill="%23ffffff" text-anchor="middle" font-family="Arial">${safeLabel}</text>` +
    "</svg>"
  );
}

function getStoredAuth() {
  const authRaw = localStorage.getItem(AUTH_KEY);
  if (!authRaw) return null;
  try {
    return JSON.parse(authRaw);
  } catch {
    return null;
  }
}

function getAnonId() {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = window.crypto?.randomUUID?.() || generateRandomString(16);
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

function clearAnonId() {
  localStorage.removeItem(ANON_ID_KEY);
}

function getStoredChatId() {
  return localStorage.getItem(CHAT_ID_KEY);
}

function setStoredChatId(id) {
  if (id) {
    localStorage.setItem(CHAT_ID_KEY, id);
  } else {
    localStorage.removeItem(CHAT_ID_KEY);
  }
}

const VIEW_MODE_KEY = "dual-ai-view-mode";
const CHAT_MODE_CLASS = "chat-mode";

const OAUTH_STATE_KEY = "dual-ai-oauth-state-v1";
const OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/user.birthday.readonly",
];

function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function generateRandomString(length = 64) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

function formatBirthday(birthday) {
  if (!birthday) return "Дата рождения: не указана";
  const { day, month, year } = birthday;
  const parts = [];
  if (day) parts.push(String(day).padStart(2, "0"));
  if (month) parts.push(String(month).padStart(2, "0"));
  if (year) parts.push(year);
  return parts.length ? `Дата рождения: ${parts.join(".")}` : "Дата рождения: не указана";
}

function updateAuthUI() {
  const auth = getStoredAuth();
  const googleClientId = getGoogleClientId();
  if (!auth) {
    authStatus.textContent = "Аккаунт не привязан";
    authBtn.textContent = "Войти";
    googleAuthBtn.textContent = "Войти через Google";
    googleAuthBtn.disabled = !googleClientId;
    authCard.hidden = true;
    logoutBtn.hidden = true;
    return;
  }

  authStatus.textContent = "Аккаунт привязан";
  authBtn.textContent = "Профиль";
  googleAuthBtn.textContent = "Обновить привязку Google";
  googleAuthBtn.disabled = !googleClientId;
  authCard.hidden = false;
  authAvatar.src = auth.picture || getAvatarPlaceholder(auth.name || "G");
  authAvatar.alt = auth.name || "Google avatar";
  authName.textContent = auth.name || "Google User";
  authEmail.textContent = auth.email || "Google account";
  authMeta.textContent = formatAuthDate(auth.linkedAt);
  authBirthday.textContent = formatBirthday(auth.birthday);
  logoutBtn.hidden = false;
}

function updateSupabaseSaveState() {
  const isReady = Boolean(supabaseClient && transcript.length > 0);
  saveDialogBtn.disabled = !isReady;
}

function getSupabaseConfig() {
  const env = window.__ENV__ || {};
  const postgresUrl = window.POSTGRES_URL || env.POSTGRES_URL || "";
  let derivedUrl = "";
  if (postgresUrl) {
    try {
      const parsed = new URL(postgresUrl);
      const host = parsed.hostname || "";
      if (host.startsWith("db.")) {
        const ref = host.replace(/^db\./, "").replace(/\.supabase\.co$/, "");
        if (ref) {
          derivedUrl = `https://${ref}.supabase.co`;
        }
      }
    } catch {
      derivedUrl = "";
    }
  }
  return {
    url:
      window.SUPABASE_URL ||
      env.SUPABASE_URL ||
      window.SUPABASE_PROJECT_URL ||
      env.SUPABASE_PROJECT_URL ||
      derivedUrl,
    anonKey:
      window.SUPABASE_ANON_KEY ||
      env.SUPABASE_ANON_KEY ||
      window.SUPABASE_ANON_PUBLIC_KEY ||
      env.SUPABASE_ANON_PUBLIC_KEY ||
      "",
  };
}

function getGoogleClientId() {
  const env = window.__ENV__ || {};
  return window.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || "";
}

async function updateSupabaseUI() {
  if (!supabaseClient) {
    supabaseStatus.textContent = "Supabase не настроен (нет ENV)";
    supabaseLogoutBtn.hidden = true;
    emailAuthBtn.disabled = true;
    supabaseSession = null;
    updateSupabaseSaveState();
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    supabaseStatus.textContent = "Ошибка авторизации Supabase";
    supabaseSession = null;
    supabaseLogoutBtn.hidden = true;
    updateSupabaseSaveState();
    return;
  }

  if (data.session) {
    supabaseSession = data.session;
    supabaseStatus.textContent = `Вошли как ${data.session.user.email || "пользователь"}`;
    supabaseLogoutBtn.hidden = false;
    emailAuthBtn.disabled = true;
    clearAnonId();
  } else {
    supabaseSession = null;
    supabaseStatus.textContent = "Нет активной сессии";
    supabaseLogoutBtn.hidden = true;
    emailAuthBtn.disabled = false;
    if (!localStorage.getItem(ANON_ID_KEY)) {
      getAnonId();
    }
  }
  updateSupabaseSaveState();
}

async function handleSupabaseRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code || !supabaseClient) return;

  const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
  if (error) {
    setStatus(`Supabase: ${error.message}`, "error");
  } else {
    setStatus("Supabase: вход подтверждён.", "ok");
  }
  window.history.replaceState({}, document.title, getRedirectUri());
}

async function initSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    supabaseClient = null;
    supabaseStatus.textContent = "Supabase не настроен (нет ENV)";
    updateSupabaseUI();
    return;
  }

  supabaseClient = createClient(url, anonKey);
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    supabaseSession = session;
    if (session?.user?.id) {
      await migrateAnonChats(session.user.id);
    }
    updateSupabaseUI();
    await loadLatestChat();
  });
  await handleSupabaseRedirect();
  await updateSupabaseUI();
  await loadLatestChat();
}

async function startGoogleOAuth() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    setStatus("Google Client ID не настроен в ENV.", "error");
    return;
  }

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = generateRandomString(24);
  const redirectUri = getRedirectUri();

  sessionStorage.setItem(
    OAUTH_STATE_KEY,
    JSON.stringify({ state, codeVerifier, createdAt: Date.now() })
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OAUTH_SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    prompt: "consent",
    access_type: "online",
    include_granted_scopes: "true",
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

function signOut() {
  const auth = getStoredAuth();
  if (auth?.accessToken) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(auth.accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).catch(() => {});
  }
  localStorage.removeItem(AUTH_KEY);
  updateAuthUI();
  setStatus("Привязка Google аккаунта удалена.", "ok");
}

async function exchangeCodeForToken({ code, codeVerifier, clientId }) {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: getRedirectUri(),
  });
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Google OAuth: ${text || resp.statusText}`);
  }
  return resp.json();
}

async function fetchGoogleProfile(accessToken) {
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    throw new Error("Google OAuth: не удалось получить профиль.");
  }
  return resp.json();
}

async function fetchGoogleBirthday(accessToken) {
  const resp = await fetch(
    "https://people.googleapis.com/v1/people/me?personFields=birthdays",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  const birthday =
    data?.birthdays?.find((item) => item?.metadata?.primary)?.date ||
    data?.birthdays?.[0]?.date ||
    null;
  return birthday;
}

async function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code) return;

  const storedRaw = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  let stored = null;
  if (storedRaw) {
    try {
      stored = JSON.parse(storedRaw);
    } catch {
      stored = null;
    }
  }
  if (!stored || stored.state !== state) {
    setStatus("Ошибка проверки OAuth состояния.", "error");
    window.history.replaceState({}, document.title, getRedirectUri());
    return;
  }

  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      throw new Error("Google Client ID не настроен в ENV.");
    }
    const tokenData = await exchangeCodeForToken({
      code,
      codeVerifier: stored.codeVerifier,
      clientId,
    });
    const accessToken = tokenData.access_token;
    const profile = await fetchGoogleProfile(accessToken);
    const birthday = await fetchGoogleBirthday(accessToken);
    const authProfile = {
      accessToken,
      expiresAt: Date.now() + (tokenData.expires_in || 0) * 1000,
      name: profile?.name || profile?.email || "Google User",
      email: profile?.email || "",
      picture: profile?.picture || "",
      provider: "google",
      linkedAt: Date.now(),
      birthday,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authProfile));
    updateAuthUI();
    setStatus("Google аккаунт привязан.", "ok");
  } catch (e) {
    setStatus(String(e?.message || e), "error");
  } finally {
    window.history.replaceState({}, document.title, getRedirectUri());
  }
}

function openDrawer() {
  drawer.classList.add("open");
  drawerOverlay.hidden = false;
  drawerOverlay.classList.add("visible");
}

function closeDrawer() {
  drawer.classList.remove("open");
  drawerOverlay.hidden = true;
  drawerOverlay.classList.remove("visible");
}

function isChatMode() {
  return document.body.classList.contains(CHAT_MODE_CLASS);
}

function updateViewToggleLabel() {
  if (isChatMode()) {
    toggleViewBtn.textContent = "Главное меню";
  } else {
    toggleViewBtn.textContent = "Перейти в чат";
  }
}

function setChatMode(enabled, { scroll } = { scroll: true }) {
  document.body.classList.toggle(CHAT_MODE_CLASS, enabled);
  localStorage.setItem(VIEW_MODE_KEY, enabled ? "chat" : "menu");
  updateViewToggleLabel();
  if (enabled && scroll) {
    document.getElementById("chatSection")?.scrollIntoView({ behavior: "smooth" });
  }
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function render() {
  messagesEl.innerHTML = "";
  if (transcript.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML =
      "<strong>Диалог ещё пуст.</strong><br />" +
      "Напишите сообщение или воспользуйтесь демо-вопросом, чтобы запустить разговор.";
    messagesEl.appendChild(empty);
    updateSupabaseSaveState();
    return;
  }
  for (const m of transcript) {
    const wrap = document.createElement("div");
    wrap.className = `msg msg-${m.speaker}`;
    const meta = document.createElement("div");
    meta.className = "meta";
    const left = document.createElement("div");
    const right = document.createElement("div");
    right.textContent = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const badge = document.createElement("span");
    badge.className = "badge " + (m.speaker === "user" ? "user" : m.speaker === "R" ? "r" : "s");
    badge.textContent = m.speaker === "user" ? "you" : m.speaker;
    left.appendChild(badge);

    meta.appendChild(left);
    meta.appendChild(right);

    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = escapeHtml(m.content);

    wrap.appendChild(meta);
    wrap.appendChild(content);
    messagesEl.appendChild(wrap);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
  updateSupabaseSaveState();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.model === "string") modelEl.value = s.model;
    if (typeof s.turns === "number") turnsEl.value = String(s.turns);
    if (typeof s.supabaseEmail === "string") supabaseEmailEl.value = s.supabaseEmail;
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = Number(turnsEl.value || 0);
  const supabaseEmail = supabaseEmailEl.value.trim();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ model, turns, supabaseEmail })
  );
  void initSupabaseClient();
  setStatus("Настройки сохранены.", "ok");
}

function clearChat() {
  transcript = [];
  setStoredChatId(null);
  render();
  setStatus("Чат очищен.", "ok");
}

function toOpenRouterMessages() {
  // Транскрипт -> messages для OpenRouter. Мы маркируем "кто сказал" в тексте,
  // чтобы модель понимала контекст, т.к. реальных ролей несколько.
  return transcript.map((m) => {
    const prefix =
      m.speaker === "user" ? "Человек" : m.speaker === "R" ? "Bot R" : "Bot S";
    return { role: "user", content: `${prefix}: ${m.content}` };
  });
}

async function callOpenRouter({ model, persona, messages }) {
  const payload = {
    model,
    messages: [{ role: "system", content: persona.system }, ...messages],
  };

  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenRouter ${resp.status}: ${text || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenRouter: invalid response");
  }
  return content;
}

async function runTurn(speaker) {
  const model = modelEl.value.trim();
  if (!model) {
    setStatus("Укажи модель (OpenRouter slug).", "error");
    return;
  }

  const messages = toOpenRouterMessages();
  setStatus(`${speaker === "R" ? "Bot R" : "Bot S"} думает…`);
  const text = await callOpenRouter({
    model,
    persona: PERSONAS[speaker],
    messages,
  });
  transcript.push({ speaker, content: text, ts: Date.now() });
  render();
  await persistChat();
  setStatus("Готов.", "ok");
}

async function sendUserMessage(text) {
  transcript.push({ speaker: "user", content: text, ts: Date.now() });
  render();
  await persistChat();
  await runTurn("R");
  await runTurn("S");

  const extraTurns = Math.max(0, Math.min(10, Number(turnsEl.value || 0)));
  // Авто-диалог: R<->S. Последний говорил S, значит следующий R.
  for (let i = 0; i < extraTurns; i++) {
    await runTurn(i % 2 === 0 ? "R" : "S");
  }
}

async function onSend() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  sendBtn.disabled = true;
  demoBtn.disabled = true;
  try {
    await sendUserMessage(text);
  } catch (e) {
    setStatus(String(e?.message || e), "error");
  } finally {
    sendBtn.disabled = false;
    demoBtn.disabled = false;
  }
}

async function signInWithEmail() {
  if (!supabaseClient) {
    setStatus("Supabase не настроен: нет ENV переменных.", "error");
    return;
  }
  const email = supabaseEmailEl.value.trim();
  if (!email) {
    setStatus("Укажи email для входа.", "error");
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: getRedirectUri() },
  });
  if (error) {
    setStatus(`Supabase: ${error.message}`, "error");
    return;
  }
  setStatus("Письмо с подтверждением отправлено.", "ok");
}

async function supabaseSignOut() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setStatus(`Supabase: ${error.message}`, "error");
    return;
  }
  setStoredChatId(null);
  setStatus("Вы вышли из Supabase.", "ok");
}

async function migrateAnonChats(userId) {
  if (!supabaseClient || !userId) return;
  const anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) return;
  const { error } = await supabaseClient
    .from("chats")
    .update({ user_id: userId, anon_id: null, updated_at: new Date().toISOString() })
    .eq("anon_id", anonId);
  if (!error) {
    clearAnonId();
  }
}

async function persistChat() {
  if (!supabaseClient) return;
  if (transcript.length === 0) return;

  const chatId = getStoredChatId();
  const userId = supabaseSession?.user?.id || null;
  const anonId = userId ? null : getAnonId();
  const payload = {
    user_id: userId,
    anon_id: anonId,
    messages: transcript,
    updated_at: new Date().toISOString(),
  };

  if (chatId) {
    const { error } = await supabaseClient.from("chats").update(payload).eq("id", chatId);
    if (!error) {
      setStatus("Диалог сохранён в Supabase.", "ok");
      return;
    }
  }

  const { data, error } = await supabaseClient
    .from("chats")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    setStatus(`Supabase: ${error.message}`, "error");
    return;
  }
  setStoredChatId(data?.id);
  setStatus("Диалог сохранён в Supabase.", "ok");
}

async function loadLatestChat() {
  if (!supabaseClient) return;
  const userId = supabaseSession?.user?.id || null;
  const anonId = userId ? null : localStorage.getItem(ANON_ID_KEY);
  if (!userId && !anonId) return;

  const storedChatId = getStoredChatId();
  if (storedChatId) {
    const { data, error } = await supabaseClient
      .from("chats")
      .select("id,messages,updated_at")
      .eq("id", storedChatId)
      .maybeSingle();
    if (!error && data?.messages) {
      transcript = data.messages;
      render();
      return;
    }
  }

  let query = supabaseClient.from("chats").select("id,messages,updated_at").order("updated_at", {
    ascending: false,
  });
  if (userId) {
    query = query.eq("user_id", userId);
  } else if (anonId) {
    query = query.eq("anon_id", anonId);
  }

  const { data, error } = await query.limit(1);
  if (error || !data?.length) return;
  const [latest] = data;
  if (latest?.messages) {
    setStoredChatId(latest.id);
    transcript = latest.messages;
    render();
  }
}

async function saveDialogToSupabase() {
  if (!supabaseClient) {
    setStatus("Supabase не настроен (нет ENV).", "error");
    return;
  }
  if (transcript.length === 0) {
    setStatus("Диалог пустой — нечего сохранять.", "error");
    return;
  }

  await persistChat();
}

sendBtn.addEventListener("click", onSend);
demoBtn.addEventListener("click", () => {
  inputEl.value = "Что думаете о будущем ИИ?";
  inputEl.focus();
});
saveBtn.addEventListener("click", saveSettings);
clearBtn.addEventListener("click", clearChat);
menuBtn.addEventListener("click", openDrawer);
openDrawerBtn.addEventListener("click", openDrawer);
closeDrawerBtn.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
newChatBtn.addEventListener("click", () => {
  inputEl.value = "";
  clearChat();
});
toggleViewBtn.addEventListener("click", () => {
  setChatMode(!isChatMode(), { scroll: true });
});
enterChatBtn.addEventListener("click", () => {
  setChatMode(true, { scroll: true });
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDrawer();
  }
});

loadSettings();
render();
updateAuthUI();
void initSupabaseClient();
setChatMode(localStorage.getItem(VIEW_MODE_KEY) === "chat", { scroll: false });
handleOAuthRedirect();

googleAuthBtn.addEventListener("click", startGoogleOAuth);
logoutBtn.addEventListener("click", signOut);
authBtn.addEventListener("click", () => {
  openDrawer();
});

emailAuthBtn.addEventListener("click", signInWithEmail);
supabaseLogoutBtn.addEventListener("click", supabaseSignOut);
saveDialogBtn.addEventListener("click", saveDialogToSupabase);


