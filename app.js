import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_KEY = "dual-ai-chat-settings-v1";
const VIEW_MODE_KEY = "dual-ai-view-mode";
const CHAT_MODE_CLASS = "chat-mode";

const ANON_ID_KEY = "dual-ai-anon-id-v1";
const CURRENT_CHAT_ID_KEY = "dual-ai-current-chat-id-v1";

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

// Auth UI (Supabase)
const googleAuthBtn = $("googleAuthBtn");
const supabaseStatus = $("supabaseStatus");
const supabaseEmailEl = $("supabaseEmail");
const emailAuthBtn = $("emailAuthBtn");
const supabaseLogoutBtn = $("supabaseLogoutBtn");
const saveDialogBtn = $("saveDialogBtn");

// (оставляем, если они есть в HTML)
const authBtn = $("authBtn");
const authStatus = $("authStatus");
const authCard = $("authCard");
const logoutBtn = $("logoutBtn");

let supabaseClient = null;
let supabaseSession = null;

/** @type {{speaker: 'user'|'R'|'S', content: string, ts: number}[]} */
let transcript = [];

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

function setStatus(text, kind = "muted") {
  statusEl.textContent = text;
  statusEl.classList.remove("error", "ok");
  if (kind === "error") statusEl.classList.add("error");
  if (kind === "ok") statusEl.classList.add("ok");
}

function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function getOrCreateAnonId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

function getOrCreateChatId() {
  let id = localStorage.getItem(CURRENT_CHAT_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(CURRENT_CHAT_ID_KEY, id);
  }
  return id;
}

function resetChatId() {
  localStorage.removeItem(CURRENT_CHAT_ID_KEY);
}

function isChatMode() {
  return document.body.classList.contains(CHAT_MODE_CLASS);
}

function updateViewToggleLabel() {
  if (isChatMode()) toggleViewBtn.textContent = "Главное меню";
  else toggleViewBtn.textContent = "Перейти в чат";
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
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ model, turns, supabaseEmail }));
  setStatus("Настройки сохранены.", "ok");
}

function clearChat() {
  transcript = [];
  render();
  setStatus("Чат очищен.", "ok");
}

function toOpenRouterMessages() {
  return transcript.map((m) => {
    const prefix = m.speaker === "user" ? "Человек" : m.speaker === "R" ? "Bot R" : "Bot S";
    return { role: "user", content: `${prefix}: ${m.content}` };
  });
}

async function callOpenRouter({ model, persona, messages }) {
  const payload = { model, messages: [{ role: "system", content: persona.system }, ...messages] };

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
  if (!content || typeof content !== "string") throw new Error("OpenRouter: invalid response");
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
  const text = await callOpenRouter({ model, persona: PERSONAS[speaker], messages });
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

function updateSupabaseSaveState() {
  // Сохранять можно и гостем (anon_id), и авторизованным
  const isReady = Boolean(supabaseClient && transcript.length > 0);
  saveDialogBtn.disabled = !isReady;
}

function getSupabaseConfig() {
  const env = window.__ENV__ || {};
  return {
    url: window.SUPABASE_URL || env.SUPABASE_URL || "",
    anonKey: window.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "",
  };
}

async function handleSupabaseRedirect() {
  // Supabase email magic-link / OAuth возвращают ?code=...
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code || !supabaseClient) return;

  const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
  if (error) setStatus(`Supabase: ${error.message}`, "error");
  else setStatus("Supabase: вход подтверждён.", "ok");

  window.history.replaceState({}, document.title, getRedirectUri());
}

async function updateSupabaseUI() {
  if (!supabaseClient) {
    supabaseStatus.textContent = "Supabase не настроен (нет ENV)";
    supabaseLogoutBtn.hidden = true;
    emailAuthBtn.disabled = true;
    googleAuthBtn.disabled = true;
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
    googleAuthBtn.disabled = true;

    // После логина пробуем мигрировать гостевые чаты на аккаунт (через /api/migrate)
    await migrateAnonChats();
  } else {
    supabaseSession = null;
    supabaseStatus.textContent = "Нет активной сессии";
    supabaseLogoutBtn.hidden = true;
    emailAuthBtn.disabled = false;
    googleAuthBtn.disabled = false;
  }

  updateSupabaseSaveState();
}

async function initSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    supabaseClient = null;
    await updateSupabaseUI();
    return;
  }

  supabaseClient = createClient(url, anonKey);

  supabaseClient.auth.onAuthStateChange(async () => {
    await updateSupabaseUI();
  });

  await handleSupabaseRedirect();
  await updateSupabaseUI();
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

  setStatus("Письмо со ссылкой для входа отправлено.", "ok");
}

async function signInWithGoogleSupabase() {
  if (!supabaseClient) {
    setStatus("Supabase не настроен: нет ENV переменных.", "error");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getRedirectUri() },
  });

  if (error) setStatus(`Supabase: ${error.message}`, "error");
}

async function supabaseSignOut() {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setStatus(`Supabase: ${error.message}`, "error");
    return;
  }

  setStatus("Вы вышли из аккаунта.", "ok");
}

async function saveChatToSupabase() {
  if (!supabaseClient) {
    setStatus("Supabase не настроен (нет ENV).", "error");
    return;
  }
  if (transcript.length === 0) {
    setStatus("Диалог пустой — нечего сохранять.", "error");
    return;
  }

  const chatId = getOrCreateChatId();
  const anonId = getOrCreateAnonId();
  const userId = supabaseSession?.user?.id || null;

  // Пишем в таблицу chats как в README: id, user_id|null, anon_id|null, messages, updated_at
  const row = {
    id: chatId,
    user_id: userId,
    anon_id: userId ? null : anonId,
    messages: transcript,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseClient.from("chats").upsert(row);
  if (error) {
    setStatus(`Supabase: ${error.message}`, "error");
    return;
  }

  setStatus("Диалог сохранён в Supabase (chats).", "ok");
}

async function migrateAnonChats() {
  // Миграция гостевых чатов на user_id должна идти через serverless (service role),
  // иначе RLS не даст обновить строки с user_id=null.
  if (!supabaseSession?.access_token) return;

  const anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) return;

  try {
    const resp = await fetch("/api/migrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseSession.access_token}`
      },
      body: JSON.stringify({ anon_id: anonId }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      setStatus(`Миграция чатов: ${resp.status} ${text || resp.statusText}`, "error");
      return;
    }

    const data = await resp.json().catch(() => ({}));
    if (typeof data?.migrated === "number") {
      setStatus(`Миграция чатов завершена. Перенесено: ${data.migrated}`, "ok");
    }
  } catch (e) {
    setStatus(`Миграция чатов: ${String(e?.message || e)}`, "error");
  }
}


// Drawer
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

// UI events
sendBtn.addEventListener("click", onSend);
demoBtn.addEventListener("click", () => {
  inputEl.value = "Что думаете о будущем ИИ?";
  inputEl.focus();
});
saveBtn.addEventListener("click", saveSettings);

clearBtn.addEventListener("click", () => {
  resetChatId();
  clearChat();
});

menuBtn.addEventListener("click", openDrawer);
openDrawerBtn.addEventListener("click", openDrawer);
closeDrawerBtn.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

newChatBtn.addEventListener("click", () => {
  resetChatId();
  inputEl.value = "";
  clearChat();
});

toggleViewBtn.addEventListener("click", () => setChatMode(!isChatMode(), { scroll: true }));
enterChatBtn.addEventListener("click", () => setChatMode(true, { scroll: true }));

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});

// Optional legacy UI elements (если есть)
if (authBtn) authBtn.addEventListener("click", openDrawer);
if (authStatus) authStatus.textContent = "Авторизация через Supabase";
if (authCard) authCard.hidden = true;
if (logoutBtn) logoutBtn.hidden = true;

emailAuthBtn.addEventListener("click", signInWithEmail);
googleAuthBtn.addEventListener("click", signInWithGoogleSupabase);
supabaseLogoutBtn.addEventListener("click", supabaseSignOut);
saveDialogBtn.addEventListener("click", saveChatToSupabase);

// init
loadSettings();
render();
void initSupabaseClient();
setChatMode(localStorage.getItem(VIEW_MODE_KEY) === "chat", { scroll: false });

