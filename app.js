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
const statusEl = $("status");
const layoutEl = document.querySelector(".layout");
const homeBtn = $("homeBtn");
const menuBtn = $("menuBtn");
const openDrawerBtn = $("openDrawerBtn");
const newChatBtn = $("newChatBtn");
const drawerNewChatBtn = $("drawerNewChatBtn");
const dialogListEl = $("dialogList");
const drawer = $("drawer");
const drawerOverlay = $("drawerOverlay");
const closeDrawerBtn = $("closeDrawerBtn");

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

function saveDialogs() {
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
  saveDialogs();
  renderDialogList();
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
  saveDialogs();
  if (activate) {
    setActiveDialog(dialog.id);
  } else {
    renderDialogList();
  }
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
    btn.appendChild(title);
    btn.appendChild(meta);
    btn.addEventListener("click", () => {
      setActiveDialog(dialog.id);
      setMode("chat");
      closeDrawer();
    });
    dialogListEl.appendChild(btn);
  }
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
  persistActiveDialog();
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
  persistActiveDialog();
  setStatus("Готов.", "ok");
}

async function sendUserMessage(text) {
  transcript.push({ speaker: "user", content: text, ts: Date.now() });
  render();
  persistActiveDialog();
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
  createDialog({ activate: true });
  render();
  setMode("chat");
});
drawerNewChatBtn.addEventListener("click", () => {
  createDialog({ activate: true });
  setMode("chat");
  closeDrawer();
});
homeBtn.addEventListener("click", () => setMode("home"));

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
dialogs = loadDialogs();
ensureActiveDialog();
render();
renderDialogList();
setMode("home");



