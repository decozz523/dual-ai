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
const logoutBtn = $("logoutBtn");
const authStatus = $("authStatus");
const authCard = $("authCard");
const authAvatar = $("authAvatar");
const authName = $("authName");
const authEmail = $("authEmail");
const authMeta = $("authMeta");
const authEmailInput = $("authEmailInput");
const magicLinkBtn = $("magicLinkBtn");
const supabaseUrlEl = $("supabaseUrl");
const supabaseAnonKeyEl = $("supabaseAnonKey");

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
const ANON_ID_KEY = "dual-ai-anon-id-v1";
const CHAT_TABLE = "chats";

let supabaseClient = null;
let currentUser = null;
let currentChatId = null;
let anonId = null;
let authSubscription = null;
let warnedMissingSupabase = false;

function formatAuthDate(ts) {
  if (!ts) return "Сессия активна";
  return `Сессия с ${new Date(ts).toLocaleDateString("ru-RU")}`;
}

function getSupabaseConfig() {
  const url = supabaseUrlEl.value.trim();
  const anonKey = supabaseAnonKeyEl.value.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function ensureAnonId() {
  const stored = localStorage.getItem(ANON_ID_KEY);
  if (stored) {
    anonId = stored;
    return stored;
  }
  const newId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(ANON_ID_KEY, newId);
  anonId = newId;
  return newId;
}

function initSupabase() {
  const config = getSupabaseConfig();
  if (!config || !window.supabase) return null;
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  return supabaseClient;
}

function isSupabaseReady() {
  return Boolean(supabaseClient);
}

async function setupSupabase() {
  if (!initSupabase()) return;
  ensureAnonId();
  await refreshAuthState();
  if (authSubscription) {
    authSubscription.unsubscribe();
    authSubscription = null;
  }
  const { data } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      const authProfile = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.name || currentUser.email || "User",
        avatarUrl: currentUser.user_metadata?.avatar_url || "",
        signedInAt: Date.now(),
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authProfile));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    updateAuthUI();
    if (currentUser) {
      await migrateAnonChatsToUser();
    }
    await loadLatestChat();
  });
  authSubscription = data?.subscription || null;
  await loadLatestChat();
}

function updateAuthUI() {
  const auth = getStoredAuth();
  if (!auth) {
    authStatus.textContent = "Гость (сессия без аккаунта)";
    authBtn.textContent = "Войти";
    authCard.hidden = true;
    logoutBtn.hidden = true;
    return;
  }

  authStatus.textContent = "Аккаунт подключён";
  authBtn.textContent = "Профиль";
  authCard.hidden = false;
  authAvatar.src = auth.avatarUrl || getAvatarPlaceholder(auth.name || "U");
  authAvatar.alt = auth.name || "User avatar";
  authName.textContent = auth.name || "User";
  authEmail.textContent = auth.email || "Account";
  authMeta.textContent = formatAuthDate(auth.signedInAt);
  logoutBtn.hidden = false;
}

async function sendMagicLink() {
  if (!supabaseClient) {
    setStatus("Укажи Supabase URL и anon key в настройках.", "error");
    return;
  }
  const email = authEmailInput.value.trim();
  if (!email) {
    setStatus("Укажи email для входа.", "error");
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) {
    setStatus(`Ошибка отправки ссылки: ${error.message}`, "error");
    return;
  }
  setStatus("Ссылка для входа отправлена на почту.", "ok");
}

async function signOut() {
  if (!supabaseClient) {
    localStorage.removeItem(AUTH_KEY);
    updateAuthUI();
    return;
  }
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setStatus(`Ошибка выхода: ${error.message}`, "error");
    return;
  }
  localStorage.removeItem(AUTH_KEY);
  currentUser = null;
  updateAuthUI();
  setStatus("Вы вышли из аккаунта.", "ok");
}

async function refreshAuthState() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(`Supabase auth: ${error.message}`, "error");
    return;
  }
  currentUser = data?.session?.user || null;
  if (currentUser) {
    const authProfile = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.user_metadata?.name || currentUser.email || "User",
      avatarUrl: currentUser.user_metadata?.avatar_url || "",
      signedInAt: Date.now(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authProfile));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
  updateAuthUI();
}

async function migrateAnonChatsToUser() {
  if (!supabaseClient || !currentUser || !anonId) return;
  const { error } = await supabaseClient
    .from(CHAT_TABLE)
    .update({ user_id: currentUser.id, anon_id: null })
    .eq("anon_id", anonId)
    .is("user_id", null);
  if (error) {
    setStatus(`Не удалось привязать диалоги: ${error.message}`, "error");
    return;
  }
  setStatus("Диалоги привязаны к аккаунту.", "ok");
}

function getChatFilter() {
  if (currentUser) {
    return { user_id: currentUser.id, anon_id: null };
  }
  return { anon_id: anonId, user_id: null };
}

async function loadLatestChat() {
  if (!supabaseClient) return;
  const filter = getChatFilter();
  const { data, error } = await supabaseClient
    .from(CHAT_TABLE)
    .select("id, messages, updated_at")
    .match(filter)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    setStatus(`Не удалось загрузить чат: ${error.message}`, "error");
    return;
  }
  if (data?.id) {
    currentChatId = data.id;
    transcript = Array.isArray(data.messages) ? data.messages : [];
    render();
  }
}

async function persistChat() {
  if (!isSupabaseReady()) {
    if (!warnedMissingSupabase) {
      setStatus("Для сохранения в облаке укажи Supabase URL и anon key.", "error");
      warnedMissingSupabase = true;
    }
    return;
  }
  const payload = {
    messages: transcript,
    updated_at: new Date().toISOString(),
    ...getChatFilter(),
  };
  let query = supabaseClient.from(CHAT_TABLE);
  if (currentChatId) {
    const { error } = await query.update(payload).eq("id", currentChatId);
    if (error) {
      setStatus(`Не удалось сохранить чат: ${error.message}`, "error");
    }
    return;
  }
  const { data, error } = await query.insert(payload).select("id").single();
  if (error) {
    setStatus(`Не удалось создать чат: ${error.message}`, "error");
    return;
  }
  currentChatId = data.id;
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
    if (typeof s.supabaseUrl === "string") supabaseUrlEl.value = s.supabaseUrl;
    if (typeof s.supabaseAnonKey === "string") supabaseAnonKeyEl.value = s.supabaseAnonKey;
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = Number(turnsEl.value || 0);
  const supabaseUrl = supabaseUrlEl.value.trim();
  const supabaseAnonKey = supabaseAnonKeyEl.value.trim();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ model, turns, supabaseUrl, supabaseAnonKey })
  );
  setStatus("Настройки сохранены.", "ok");
  setupSupabase();
}

function clearChat() {
  transcript = [];
  currentChatId = null;
  render();
  setStatus("Чат очищен.", "ok");
  if (isSupabaseReady()) {
    persistChat();
  }
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
  await persistChat();
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
ensureAnonId();
setupSupabase();

magicLinkBtn.addEventListener("click", sendMagicLink);
logoutBtn.addEventListener("click", signOut);
authBtn.addEventListener("click", () => {
  openDrawer();
});


