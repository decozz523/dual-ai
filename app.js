import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const STORAGE_KEY = "dual-ai-chat-settings-v1";
const CHAT_ID_KEY = "dual-ai-chat-id-v1";
const ANON_ID_KEY = "dual-ai-anon-id-v1";

const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";

const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = supabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

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
const newChatBtn = $("newChatBtn");
const openDrawerBtn = $("openDrawerBtn");
const menuBtn = $("menuBtn");
const closeDrawerBtn = $("closeDrawerBtn");
const drawerOverlay = $("drawerOverlay");
const drawer = $("drawer");
const authBtn = $("authBtn");

const supabaseStatusEl = $("supabaseStatus");
const supabaseEmailEl = $("supabaseEmail");
const emailAuthBtn = $("emailAuthBtn");
const supabaseLogoutBtn = $("supabaseLogoutBtn");
const saveDialogBtn = $("saveDialogBtn");
const supabaseCard = $("supabaseCard");
const supabaseUserName = $("supabaseUserName");
const supabaseUserEmail = $("supabaseUserEmail");
const supabaseUserMeta = $("supabaseUserMeta");

const PERSONAS = {
  R: {
    label: "Bot R",
    system:
      "Ты — Bot R, рациональный, аналитический ИИ-собеседник. " +
      "Говоришь структурированно и логично, уточняешь вводные и допущения. " +
      "Без лишней эмоциональности. " +
      "Ты общаешься с человеком и Bot S как равноправный участник.",
  },
  S: {
    label: "Bot S",
    system:
      "Ты — Bot S, эмоциональный и творческий ИИ-собеседник. " +
      "Говоришь живо, образно и поддерживающе. " +
      "Можно немного метафор. " +
      "Ты общаешься с человеком и Bot R как равноправный участник.",
  },
};

/** @type {{speaker: 'user'|'R'|'S', content: string, ts: number}[]} */
let transcript = [];
/** @type {import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').User | null} */
let currentUser = null;

function setStatus(text, kind = "muted") {
  statusEl.textContent = text;
  statusEl.classList.remove("error", "ok");
  if (kind === "error") statusEl.classList.add("error");
  if (kind === "ok") statusEl.classList.add("ok");
}

function setSupabaseStatus(text, kind = "muted") {
  supabaseStatusEl.textContent = text;
  supabaseStatusEl.classList.remove("error", "ok");
  if (kind === "error") supabaseStatusEl.classList.add("error");
  if (kind === "ok") supabaseStatusEl.classList.add("ok");
}

function ensureAnonId() {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

function getChatId() {
  let chatId = localStorage.getItem(CHAT_ID_KEY);
  if (!chatId) {
    chatId = crypto.randomUUID();
    localStorage.setItem(CHAT_ID_KEY, chatId);
  }
  return chatId;
}

function resetChatId() {
  const chatId = crypto.randomUUID();
  localStorage.setItem(CHAT_ID_KEY, chatId);
  return chatId;
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function render() {
  messagesEl.innerHTML = "";
  for (const m of transcript) {
    const wrap = document.createElement("div");
    wrap.className = "msg";
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
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = Number(turnsEl.value || 0);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ model, turns }));
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
    headers: {
      "Content-Type": "application/json",
    },
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

async function saveChat({ silent = false } = {}) {
  if (!supabase) return;
  const chatId = getChatId();
  const payload = {
    id: chatId,
    messages: transcript,
    updated_at: new Date().toISOString(),
    user_id: currentUser?.id ?? null,
    anon_id: currentUser ? null : ensureAnonId(),
  };

  const { error } = await supabase
    .from("chats")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    if (!silent) {
      setStatus(`Ошибка сохранения: ${error.message}`, "error");
    }
    return;
  }

  if (!silent) {
    setStatus("Диалог сохранён.", "ok");
  }
}

async function loadLatestChat() {
  if (!supabase) return;
  const query = supabase
    .from("chats")
    .select("id,messages,updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (currentUser) {
    query.eq("user_id", currentUser.id);
  } else {
    query.eq("anon_id", ensureAnonId());
  }

  const { data, error } = await query;
  if (error) {
    setStatus(`Ошибка загрузки: ${error.message}`, "error");
    return;
  }

  if (data?.length) {
    localStorage.setItem(CHAT_ID_KEY, data[0].id);
    transcript = Array.isArray(data[0].messages) ? data[0].messages : [];
    render();
    setStatus("Диалог загружен.", "ok");
  }
}

async function migrateAnonChats(userId) {
  if (!supabase) return;
  const anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) return;
  const { error } = await supabase
    .from("chats")
    .update({ user_id: userId, anon_id: null })
    .eq("anon_id", anonId);
  if (error) {
    console.warn("Anon migration failed", error.message);
  }
}

function updateSupabaseUI(user) {
  if (!supabaseConfigured) {
    setSupabaseStatus("Supabase не настроен", "error");
    emailAuthBtn.disabled = true;
    saveDialogBtn.disabled = true;
    supabaseCard.hidden = true;
    supabaseLogoutBtn.hidden = true;
    return;
  }

  if (user) {
    setSupabaseStatus("Вход выполнен", "ok");
    supabaseUserName.textContent = "Сессия активна";
    supabaseUserEmail.textContent = user.email || "";
    supabaseUserMeta.textContent = "Magic Link подтверждён";
    supabaseCard.hidden = false;
    supabaseLogoutBtn.hidden = false;
    emailAuthBtn.disabled = true;
    saveDialogBtn.disabled = false;
  } else {
    setSupabaseStatus("Гостевой режим", "muted");
    supabaseCard.hidden = true;
    supabaseLogoutBtn.hidden = true;
    emailAuthBtn.disabled = false;
    saveDialogBtn.disabled = false;
  }
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
  await saveChat({ silent: true });
}

async function sendUserMessage(text) {
  transcript.push({ speaker: "user", content: text, ts: Date.now() });
  render();
  await saveChat({ silent: true });
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

  sendBtn.disabled = true;
  demoBtn.disabled = true;
  try {
    await sendUserMessage(text);
    inputEl.value = "";
  } catch (e) {
    setStatus(String(e?.message || e), "error");
  } finally {
    sendBtn.disabled = false;
    demoBtn.disabled = false;
  }
}

function openDrawer() {
  drawer.classList.add("open");
  drawerOverlay.hidden = false;
}

function closeDrawer() {
  drawer.classList.remove("open");
  drawerOverlay.hidden = true;
}

async function handleEmailLogin() {
  if (!supabase) return;
  const email = supabaseEmailEl.value.trim();
  if (!email) {
    setSupabaseStatus("Укажи email для входа.", "error");
    return;
  }
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    setSupabaseStatus(`Ошибка входа: ${error.message}`, "error");
    return;
  }
  setSupabaseStatus("Проверь почту и перейди по ссылке.", "ok");
}

async function handleLogout() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    setSupabaseStatus(`Ошибка выхода: ${error.message}`, "error");
    return;
  }
  setSupabaseStatus("Вы вышли из аккаунта.", "ok");
}

sendBtn.addEventListener("click", onSend);
demoBtn.addEventListener("click", () => {
  inputEl.value = "Что думаете о будущем ИИ?";
  inputEl.focus();
});
saveBtn.addEventListener("click", saveSettings);
clearBtn.addEventListener("click", clearChat);
newChatBtn?.addEventListener("click", () => {
  resetChatId();
  clearChat();
});
openDrawerBtn?.addEventListener("click", openDrawer);
menuBtn?.addEventListener("click", openDrawer);
authBtn?.addEventListener("click", openDrawer);
closeDrawerBtn?.addEventListener("click", closeDrawer);
drawerOverlay?.addEventListener("click", closeDrawer);
emailAuthBtn?.addEventListener("click", handleEmailLogin);
supabaseLogoutBtn?.addEventListener("click", handleLogout);
saveDialogBtn?.addEventListener("click", () => saveChat());

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    onSend();
  }
});

loadSettings();
render();
ensureAnonId();
updateSupabaseUI(null);

if (supabase) {
  const { data } = await supabase.auth.getUser();
  currentUser = data?.user ?? null;
  updateSupabaseUI(currentUser);
  if (currentUser) {
    await migrateAnonChats(currentUser.id);
  }
  await loadLatestChat();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    updateSupabaseUI(currentUser);
    if (currentUser) {
      await migrateAnonChats(currentUser.id);
    }
    await loadLatestChat();
  });
} else {
  setSupabaseStatus("Supabase не настроен", "error");
}
