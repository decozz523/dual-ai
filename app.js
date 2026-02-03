const STORAGE_KEY = "dual-ai-chat-settings-v1";
const AUTH_KEY = "dual-ai-chat-auth-v1";

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
const googleClientIdEl = $("googleClientId");

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
  if (!auth) {
    authStatus.textContent = "Аккаунт не привязан";
    authBtn.textContent = "Войти";
    googleAuthBtn.textContent = "Войти через Google";
    authCard.hidden = true;
    logoutBtn.hidden = true;
    return;
  }

  authStatus.textContent = "Аккаунт привязан";
  authBtn.textContent = "Профиль";
  googleAuthBtn.textContent = "Обновить привязку Google";
  authCard.hidden = false;
  authAvatar.src = auth.picture || getAvatarPlaceholder(auth.name || "G");
  authAvatar.alt = auth.name || "Google avatar";
  authName.textContent = auth.name || "Google User";
  authEmail.textContent = auth.email || "Google account";
  authMeta.textContent = formatAuthDate(auth.linkedAt);
  authBirthday.textContent = formatBirthday(auth.birthday);
  logoutBtn.hidden = false;
}

async function startGoogleOAuth() {
  const clientId = googleClientIdEl.value.trim();
  if (!clientId) {
    setStatus("Укажи Google Client ID в настройках.", "error");
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
    const clientId = googleClientIdEl.value.trim();
    if (!clientId) {
      throw new Error("Укажи Google Client ID в настройках.");
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
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.model === "string") modelEl.value = s.model;
    if (typeof s.turns === "number") turnsEl.value = String(s.turns);
    if (typeof s.googleClientId === "string") googleClientIdEl.value = s.googleClientId;
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = Number(turnsEl.value || 0);
  const googleClientId = googleClientIdEl.value.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ model, turns, googleClientId }));
  setStatus("Настройки сохранены.", "ok");
}

function clearChat() {
  transcript = [];
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
  setStatus("Готов.", "ok");
}

async function sendUserMessage(text) {
  transcript.push({ speaker: "user", content: text, ts: Date.now() });
  render();
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
setChatMode(localStorage.getItem(VIEW_MODE_KEY) === "chat", { scroll: false });
handleOAuthRedirect();

googleAuthBtn.addEventListener("click", startGoogleOAuth);
logoutBtn.addEventListener("click", signOut);
authBtn.addEventListener("click", () => {
  openDrawer();
});


