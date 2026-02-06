const STORAGE_KEY = "dual-ai-chat-settings-v1";
const DIALOGS_KEY = "dual-ai-chat-dialogs-v1";
const ACTIVE_DIALOG_KEY = "dual-ai-chat-active-dialog-v1";

const $ = (id) => document.getElementById(id);
const modelEl = $("model");
const turnsEl = $("turns");
const messagesEl = $("messages");
const inputEl = $("input");
const sendBtn = $("sendBtn");
const demoBtn = $("demoBtn");
const saveBtn = $("saveBtn");
const clearBtn = $("clearBtn");
const clearDialogsBtn = $("clearDialogsBtn");
const statusEl = $("status");
const loginBtn = $("loginBtn");
const layoutEl = document.querySelector(".layout");
const homeBtn = $("homeBtn");
const menuBtn = $("menuBtn");
const openSettingsBtn = $("openSettingsBtn");
const openSettingsHeroBtn = $("openSettingsHeroBtn");
const newChatBtn = $("newChatBtn");
const drawerNewChatBtn = $("drawerNewChatBtn");
const dialogListEl = $("dialogList");
const drawer = $("drawer");
const drawerOverlay = $("drawerOverlay");
const closeDrawerBtn = $("closeDrawerBtn");
const settingsOverlay = $("settingsOverlay");
const settingsModal = $("settingsModal");
const settingsCloseBtn = $("settingsCloseBtn");
const settingsLogoutBtn = $("settingsLogoutBtn");
const settingsAccountEmailEl = $("settingsAccountEmail");
const authOverlay = $("authOverlay");
const authModal = $("authModal");
const authCloseBtn = $("authCloseBtn");
const authEmailEl = $("authEmail");
const authPasswordEl = $("authPassword");
const authMessageEl = $("authMessage");
const authSignInBtn = $("authSignInBtn");
const authSignUpBtn = $("authSignUpBtn");
const authResendBtn = $("authResendBtn");
const planNameEl = $("planName");
const planUsageEl = $("planUsage");
const planRemainingEl = $("planRemaining");
const upgradeBtn = $("upgradeBtn");
const redeemCodeInput = $("redeemCodeInput");
const redeemCodeBtn = $("redeemCodeBtn");
const billingNoticeEl = $("billingNotice");

let supabase = null;
let authSession = null;
let supabaseReady = null;

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
/** @type {{id: string, title: string, messages: typeof transcript, createdAt: number, updatedAt: number}[]} */
let dialogs = [];
let activeDialogId = null;

function setStatus(text, kind = "muted") {
  statusEl.textContent = text;
  statusEl.classList.remove("error", "ok");
  if (kind === "error") statusEl.classList.add("error");
  if (kind === "ok") statusEl.classList.add("ok");
}

function setBillingNotice(text, kind = "muted") {
  billingNoticeEl.textContent = text;
  billingNoticeEl.classList.remove("error", "ok");
  if (kind === "error") billingNoticeEl.classList.add("error");
  if (kind === "ok") billingNoticeEl.classList.add("ok");
}

function setAuthMessage(text, kind = "muted") {
  authMessageEl.textContent = text;
  authMessageEl.classList.remove("error", "ok");
  if (kind === "error") authMessageEl.classList.add("error");
  if (kind === "ok") authMessageEl.classList.add("ok");
}

function openAuthModal() {
  if (!supabase) {
    setStatus("Supabase не настроен или ещё инициализируется.", "error");
    return;
  }
  setAuthScene(true);
  authEmailEl.focus();
}

function closeAuthModal() {
  setAuthScene(false);
  setAuthMessage("");
}

function updateAuthUI(session) {
  authSession = session;
  const email = session?.user?.email;
  loginBtn.hidden = !!email;
  settingsAccountEmailEl.textContent = email || "Гость (не выполнен вход)";
  if (email) {
    setAuthScene(false);
  }
  if (email) {
    void syncDialogsFromSupabase();
  } else {
    dialogs = loadDialogsLocal();
    ensureActiveDialog();
    render();
    renderDialogList();
  }
  void refreshBilling();
}

function requireAuth() {
  if (authSession) return true;
  if (!supabase) {
    setStatus("Supabase не настроен или ещё инициализируется.", "error");
    return false;
  }
  setStatus("Нужен вход в аккаунт.", "error");
  openAuthModal();
  return false;
}

function setAuthScene(isOpen) {
  document.body.classList.toggle("auth-open", isOpen);
}

function setSettingsScene(isOpen) {
  document.body.classList.toggle("settings-open", isOpen);
}

function getAccessToken() {
  return authSession?.access_token || "";
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...options, headers });
}

async function initSupabase() {
  if (supabaseReady) return supabaseReady;
  supabaseReady = (async () => {
    try {
      const resp = await fetch("/api/supabase-config", { method: "GET" });
      if (!resp.ok) throw new Error(`Supabase config ${resp.status}`);
      const data = await resp.json();
      if (!data?.url || !data?.anonKey) {
        throw new Error("Supabase config missing");
      }
      const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"
      );
      supabase = createClient(data.url, data.anonKey);
      const { data: sessionData } = await supabase.auth.getSession();
      updateAuthUI(sessionData?.session || null);
      supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session);
      });
      return true;
    } catch (e) {
      setStatus("Supabase ключи не настроены.", "error");
      loginBtn.disabled = true;
      return false;
    }
  })();
  return supabaseReady;
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

function openSettingsModal() {
  setSettingsScene(true);
}

function closeSettingsModal() {
  setSettingsScene(false);
}

function renderBilling(data) {
  if (!data) {
    planNameEl.textContent = "Free";
    planUsageEl.textContent = "0 / 0";
    planRemainingEl.textContent = "0";
    return;
  }
  planNameEl.textContent = data.planTitle || data.planId || "Free";
  planUsageEl.textContent = `${data.used} / ${data.limit}`;
  planRemainingEl.textContent = String(data.remaining);
}

async function refreshBilling() {
  if (!authSession) {
    renderBilling({ planTitle: "Free", used: 0, limit: 0, remaining: 0 });
    return;
  }
  try {
    const resp = await apiFetch("/api/billing-status");
    if (!resp.ok) throw new Error(`billing ${resp.status}`);
    const data = await resp.json();
    renderBilling(data);
    setBillingNotice("");
  } catch (e) {
    renderBilling({ planTitle: "Free", used: 0, limit: 0, remaining: 0 });
    setBillingNotice("Не удалось загрузить тариф.", "error");
  }
}

async function redeemCode() {
  const code = redeemCodeInput.value.trim();
  if (!code) {
    setBillingNotice("Введите код активации.", "error");
    return;
  }
  if (!authSession) {
    openAuthModal();
    return;
  }
  redeemCodeBtn.disabled = true;
  try {
    const resp = await apiFetch("/api/billing-redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data?.error || "Не удалось активировать код");
    }
    redeemCodeInput.value = "";
    setBillingNotice("Код активирован.", "ok");
    await refreshBilling();
  } catch (e) {
    setBillingNotice(String(e?.message || e), "error");
  } finally {
    redeemCodeBtn.disabled = false;
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

function setMode(mode) {
  layoutEl.classList.toggle("mode-home", mode === "home");
  layoutEl.classList.toggle("mode-chat", mode === "chat");
  homeBtn.hidden = mode === "home";
}

function makeDialogId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `dialog-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadDialogs() {
  try {
    const raw = localStorage.getItem(DIALOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d) => d && d.id && Array.isArray(d.messages));
  } catch {
    return [];
  }
}

function loadDialogsLocal() {
  return loadDialogs();
}

function saveDialogsLocal() {
  localStorage.setItem(DIALOGS_KEY, JSON.stringify(dialogs));
}

function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.speaker === "user" && m.content.trim());
  if (!firstUser) return "Новый диалог";
  return firstUser.content.trim().slice(0, 48);
}

function persistActiveDialog() {
  const dialog = dialogs.find((d) => d.id === activeDialogId);
  if (!dialog) return;
  dialog.messages = [...transcript];
  dialog.updatedAt = Date.now();
  dialog.title = deriveTitle(dialog.messages);
  saveDialogsLocal();
  renderDialogList();
  void upsertDialogRemote(dialog);
}

function setActiveDialog(id) {
  const dialog = dialogs.find((d) => d.id === id);
  if (!dialog) return;
  activeDialogId = id;
  localStorage.setItem(ACTIVE_DIALOG_KEY, id);
  transcript = [...dialog.messages];
  render();
  renderDialogList();
}

function createDialog({ activate = true } = {}) {
  const now = Date.now();
  const dialog = {
    id: makeDialogId(),
    title: "Новый диалог",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  dialogs.unshift(dialog);
  saveDialogsLocal();
  if (activate) {
    setActiveDialog(dialog.id);
  } else {
    renderDialogList();
  }
  void upsertDialogRemote(dialog);
  return dialog;
}

function ensureActiveDialog() {
  if (activeDialogId && dialogs.some((d) => d.id === activeDialogId)) return;
  const storedId = localStorage.getItem(ACTIVE_DIALOG_KEY);
  if (storedId && dialogs.some((d) => d.id === storedId)) {
    activeDialogId = storedId;
    setActiveDialog(storedId);
    return;
  }
  createDialog({ activate: true });
}

function renderDialogList() {
  dialogListEl.innerHTML = "";
  if (dialogs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dialog-empty";
    empty.textContent = "Пока нет диалогов.";
    dialogListEl.appendChild(empty);
    return;
  }
  for (const dialog of dialogs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dialog-item";
    if (dialog.id === activeDialogId) btn.classList.add("active");
    const title = document.createElement("div");
    title.className = "dialog-title";
    title.textContent = dialog.title || "Новый диалог";
    const meta = document.createElement("div");
    meta.className = "dialog-meta";
    meta.textContent = new Date(dialog.updatedAt).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "dialog-remove";
    removeBtn.setAttribute("aria-label", "Удалить диалог");
    removeBtn.textContent = "🗑️";
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteDialog(dialog.id);
    });
    btn.appendChild(title);
    btn.appendChild(meta);
    btn.appendChild(removeBtn);
    btn.addEventListener("click", () => {
      setActiveDialog(dialog.id);
      setMode("chat");
      closeDrawer();
    });
    dialogListEl.appendChild(btn);
  }
}

function deleteDialog(id) {
  const index = dialogs.findIndex((dialog) => dialog.id === id);
  if (index === -1) return;
  const wasActive = dialogs[index].id === activeDialogId;
  dialogs.splice(index, 1);
  saveDialogsLocal();
  void deleteDialogRemote(id);
  if (wasActive) {
    if (dialogs.length > 0) {
      setActiveDialog(dialogs[0].id);
    } else {
      createDialog({ activate: true });
    }
  } else {
    renderDialogList();
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.model === "string") {
      const exists = Array.from(modelEl.options).some((option) => option.value === s.model);
      modelEl.value = exists ? s.model : modelEl.options[0]?.value || "";
    }
    if (typeof s.turns === "number") turnsEl.value = String(s.turns);
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = getExtraTurns();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ model, turns }));
  setStatus("Настройки сохранены.", "ok");
}

function clearChat() {
  transcript = [];
  persistActiveDialog();
  render();
  setStatus("Чат очищен.", "ok");
}

async function clearAllDialogs() {
  dialogs = [];
  transcript = [];
  localStorage.removeItem(DIALOGS_KEY);
  localStorage.removeItem(ACTIVE_DIALOG_KEY);
  if (supabase && authSession?.user?.id) {
    const { error } = await supabase
      .from("dialogs")
      .delete()
      .eq("user_id", authSession.user.id);
    if (error) {
      setStatus(`Supabase dialogs: ${error.message}`, "error");
      return;
    }
  }
  createDialog({ activate: true });
  render();
  renderDialogList();
  setStatus("Все диалоги удалены.", "ok");
}

async function syncDialogsFromSupabase() {
  if (!supabase || !authSession?.user?.id) return;
  const { data, error } = await supabase
    .from("dialogs")
    .select("id,title,messages,created_at,updated_at")
    .eq("user_id", authSession.user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    setStatus(`Supabase dialogs: ${error.message}`, "error");
    return;
  }
  dialogs = (data || []).map((row) => ({
    id: row.id,
    title: row.title || "Новый диалог",
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
    updatedAt: row.updated_at ? Date.parse(row.updated_at) : Date.now(),
  }));
  if (dialogs.length === 0) {
    createDialog({ activate: true });
  } else {
    activeDialogId = dialogs[0].id;
    setActiveDialog(activeDialogId);
  }
  renderDialogList();
}

async function upsertDialogRemote(dialog) {
  if (!supabase || !authSession?.user?.id) return;
  const payload = {
    id: dialog.id,
    user_id: authSession.user.id,
    title: dialog.title,
    messages: dialog.messages,
    created_at: new Date(dialog.createdAt).toISOString(),
    updated_at: new Date(dialog.updatedAt).toISOString(),
  };
  const { error } = await supabase.from("dialogs").upsert(payload);
  if (error) {
    setStatus(`Supabase dialogs: ${error.message}`, "error");
  }
}

async function deleteDialogRemote(id) {
  if (!supabase || !authSession?.user?.id) return;
  const { error } = await supabase
    .from("dialogs")
    .delete()
    .eq("id", id)
    .eq("user_id", authSession.user.id);
  if (error) {
    setStatus(`Supabase dialogs: ${error.message}`, "error");
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

  const resp = await apiFetch("/api/chat", {
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
  persistActiveDialog();
  setStatus("Готов.", "ok");
}

async function sendUserMessage(text) {
  const extraTurns = getExtraTurns();
  transcript.push({ speaker: "user", content: text, ts: Date.now() });
  render();
  persistActiveDialog();
  await runTurn("R");
  await runTurn("S");

  // Авто-диалог: R<->S. Последний говорил S, значит следующий R.
  for (let i = 0; i < extraTurns; i++) {
    await runTurn(i % 2 === 0 ? "R" : "S");
  }
}

function getExtraTurns() {
  const parsed = Number(turnsEl.value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(10, parsed));
}

async function onSend() {
  const text = inputEl.value.trim();
  if (!text) return;
  if (!requireAuth()) return;

  sendBtn.disabled = true;
  demoBtn.disabled = true;
  inputEl.value = "";
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
  if (!requireAuth()) return;
  inputEl.value = "Что думаете о будущем ИИ?";
  inputEl.focus();
});
saveBtn.addEventListener("click", saveSettings);
clearBtn.addEventListener("click", clearChat);
clearDialogsBtn.addEventListener("click", () => {
  void clearAllDialogs();
});
menuBtn.addEventListener("click", openDrawer);
openSettingsBtn.addEventListener("click", () => {
  closeDrawer();
  openSettingsModal();
  void refreshBilling();
});
openSettingsHeroBtn?.addEventListener("click", () => {
  openSettingsModal();
  void refreshBilling();
});
closeDrawerBtn.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
newChatBtn.addEventListener("click", () => {
  if (!requireAuth()) return;
  inputEl.value = "";
  createDialog({ activate: true });
  render();
  setMode("chat");
});
drawerNewChatBtn.addEventListener("click", () => {
  if (!requireAuth()) return;
  createDialog({ activate: true });
  setMode("chat");
  closeDrawer();
});
homeBtn.addEventListener("click", () => {
  setMode("home");
  closeDrawer();
  closeSettingsModal();
});
loginBtn.addEventListener("click", () => {
  if (!supabase) {
    initSupabase().then(() => openAuthModal());
    return;
  }
  if (authSession) {
    setAuthScene(false);
    return;
  }
  openAuthModal();
});
settingsLogoutBtn.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  closeSettingsModal();
});
settingsCloseBtn.addEventListener("click", closeSettingsModal);
settingsOverlay.addEventListener("click", closeSettingsModal);
redeemCodeBtn.addEventListener("click", redeemCode);
upgradeBtn.addEventListener("click", () => {
  if (!authSession) {
    openAuthModal();
    return;
  }
  window.open("https://t.me/your_bot", "_blank");
});
authCloseBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  closeAuthModal();
});
authOverlay?.addEventListener("click", closeAuthModal);
authModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest("[data-close-auth]")) {
    event.preventDefault();
    closeAuthModal();
  }
});
authSignInBtn.addEventListener("click", async () => {
  if (!supabase) return;
  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;
  if (!email || !password) {
    setAuthMessage("Введите email и пароль.", "error");
    return;
  }
  authSignInBtn.disabled = true;
  authSignUpBtn.disabled = true;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setAuthMessage("Успешный вход.", "ok");
    closeAuthModal();
  } catch (e) {
    setAuthMessage(String(e?.message || e), "error");
  } finally {
    authSignInBtn.disabled = false;
    authSignUpBtn.disabled = false;
  }
});
authSignUpBtn.addEventListener("click", async () => {
  if (!supabase) return;
  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;
  if (!email || !password) {
    setAuthMessage("Введите email и пароль.", "error");
    return;
  }
  authSignInBtn.disabled = true;
  authSignUpBtn.disabled = true;
  authResendBtn.disabled = true;
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    setAuthMessage("Аккаунт создан. Проверьте почту для подтверждения.", "ok");
  } catch (e) {
    setAuthMessage(String(e?.message || e), "error");
  } finally {
    authSignInBtn.disabled = false;
    authSignUpBtn.disabled = false;
    authResendBtn.disabled = false;
  }
});

authResendBtn.addEventListener("click", async () => {
  if (!supabase) return;
  const email = authEmailEl.value.trim();
  if (!email) {
    setAuthMessage("Введите email для повторной отправки.", "error");
    return;
  }
  authResendBtn.disabled = true;
  try {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
    setAuthMessage("Письмо отправлено повторно.", "ok");
  } catch (e) {
    setAuthMessage(String(e?.message || e), "error");
  } finally {
    authResendBtn.disabled = false;
  }
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
    closeAuthModal();
    closeSettingsModal();
  }
});

loadSettings();
dialogs = loadDialogs();
ensureActiveDialog();
render();
renderDialogList();
setMode("home");
initSupabase();
