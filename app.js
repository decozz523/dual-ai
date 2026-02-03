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
const googleClientIdEl = $("googleClientId");
const supabaseUrlEl = $("supabaseUrl");
const supabaseAnonKeyEl = $("supabaseAnonKey");
const googleSignInEl = $("googleSignIn");

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

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

let googleScriptPromise = null;
let googleInitializedClientId = null;
const VIEW_MODE_KEY = "dual-ai-view-mode";
const CHAT_MODE_CLASS = "chat-mode";
const CONVERSATION_KEY = "dual-ai-conversation-id";

function loadGoogleScript() {
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

function updateAuthUI() {
  const authRaw = localStorage.getItem(AUTH_KEY);
  if (!authRaw) {
    authStatus.textContent = "Не выполнен вход";
    authBtn.textContent = "Войти";
    logoutBtn.hidden = true;
    return;
  }
  const auth = JSON.parse(authRaw);
  authStatus.textContent = auth?.name
    ? `Вход выполнен: ${auth.name}`
    : auth?.email
      ? `Вход выполнен: ${auth.email}`
      : "Вход выполнен";
  authBtn.textContent = "Выйти";
  logoutBtn.hidden = false;
}

async function signInWithGoogle() {
  const clientId = googleClientIdEl.value.trim();
  if (!clientId) {
    setStatus("Укажи Google Client ID в настройках.", "error");
    return;
  }

  await loadGoogleScript();
  if (!window.google?.accounts?.id) {
    setStatus("Google Identity Services недоступен.", "error");
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      const payload = parseJwt(response.credential);
      const profile = {
        token: response.credential,
        name: payload?.name || payload?.email || "Google User",
        email: payload?.email || "",
        sub: payload?.sub || "",
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
      updateAuthUI();
      setStatus("Авторизация выполнена.", "ok");
    },
  });
  window.google.accounts.id.prompt();
}

async function initGoogleButton() {
  const clientId = googleClientIdEl.value.trim();
  if (!clientId || !googleSignInEl) return;

  await loadGoogleScript();
  if (!window.google?.accounts?.id) {
    setStatus("Google Identity Services недоступен.", "error");
    return;
  }

  if (googleInitializedClientId !== clientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        const payload = parseJwt(response.credential);
        const profile = {
          token: response.credential,
          name: payload?.name || payload?.email || "Google User",
          email: payload?.email || "",
          sub: payload?.sub || "",
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
        updateAuthUI();
        setStatus("Авторизация выполнена.", "ok");
      },
    });
    googleInitializedClientId = clientId;
  }

  googleSignInEl.innerHTML = "";
  window.google.accounts.id.renderButton(googleSignInEl, {
    theme: "outline",
    size: "large",
    width: 320,
  });
}

function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(CONVERSATION_KEY);
  updateAuthUI();
  setStatus("Вы вышли из аккаунта.", "ok");
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
    if (typeof s.supabaseUrl === "string") supabaseUrlEl.value = s.supabaseUrl;
    if (typeof s.supabaseAnonKey === "string") supabaseAnonKeyEl.value = s.supabaseAnonKey;
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = Number(turnsEl.value || 0);
  const googleClientId = googleClientIdEl.value.trim();
  const supabaseUrl = supabaseUrlEl.value.trim();
  const supabaseAnonKey = supabaseAnonKeyEl.value.trim();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ model, turns, googleClientId, supabaseUrl, supabaseAnonKey })
  );
  setStatus("Настройки сохранены.", "ok");
  initGoogleButton();
}

function clearChat() {
  transcript = [];
  render();
  setStatus("Чат очищен.", "ok");
}

function getSupabaseConfig() {
  const supabaseUrl = supabaseUrlEl.value.trim();
  const supabaseAnonKey = supabaseAnonKeyEl.value.trim();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return { supabaseUrl, supabaseAnonKey };
}

function getAuthProfile() {
  const authRaw = localStorage.getItem(AUTH_KEY);
  if (!authRaw) return null;
  try {
    return JSON.parse(authRaw);
  } catch {
    return null;
  }
}

async function supabaseRequest(path, options = {}) {
  const config = getSupabaseConfig();
  if (!config) return null;
  const headers = {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...options.headers,
  };
  const resp = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Supabase ${resp.status}: ${text || resp.statusText}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

async function ensureConversationId(title) {
  const profile = getAuthProfile();
  if (!profile?.sub) return null;
  const existing = localStorage.getItem(CONVERSATION_KEY);
  if (existing) return existing;

  const payload = [
    {
      user_sub: profile.sub,
      title,
      created_at: new Date().toISOString(),
    },
  ];
  const data = await supabaseRequest("/rest/v1/conversations?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const id = data?.[0]?.id;
  if (id) {
    localStorage.setItem(CONVERSATION_KEY, id);
  }
  return id || null;
}

async function saveMessageToSupabase(message) {
  const profile = getAuthProfile();
  if (!profile?.sub) return;
  const config = getSupabaseConfig();
  if (!config) return;

  const conversationId =
    (await ensureConversationId(message.content.slice(0, 80))) ||
    localStorage.getItem(CONVERSATION_KEY);
  if (!conversationId) return;

  const payload = [
    {
      conversation_id: conversationId,
      user_sub: profile.sub,
      speaker: message.speaker,
      content: message.content,
      ts: new Date(message.ts).toISOString(),
    },
  ];
  await supabaseRequest("/rest/v1/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  const message = { speaker, content: text, ts: Date.now() };
  transcript.push(message);
  render();
  setStatus("Готов.", "ok");
  saveMessageToSupabase(message).catch((e) => {
    setStatus(String(e?.message || e), "error");
  });
}

async function sendUserMessage(text) {
  const message = { speaker: "user", content: text, ts: Date.now() };
  transcript.push(message);
  render();
  saveMessageToSupabase(message).catch((e) => {
    setStatus(String(e?.message || e), "error");
  });
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
  localStorage.removeItem(CONVERSATION_KEY);
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
initGoogleButton();

googleAuthBtn.addEventListener("click", initGoogleButton);
logoutBtn.addEventListener("click", signOut);
authBtn.addEventListener("click", () => {
  if (localStorage.getItem(AUTH_KEY)) {
    signOut();
  } else {
    openDrawer();
  }
});


