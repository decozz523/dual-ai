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
const observeBtn = $("observeBtn");
const saveBtn = $("saveBtn");
const exportChatBtn = $("exportChatBtn");
const clearBtn = $("clearBtn");
const clearDialogsBtn = $("clearDialogsBtn");
const statusEl = $("status");
const loginBtn = $("loginBtn");
const upgradeBtn = $("upgradeBtn");
const heroUpgradeBtn = $("heroUpgradeBtn");
const quickStartButtons = document.querySelectorAll("[data-template]");
const ideaBtn = $("ideaBtn");
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
const settingsBody = $("settingsBody");
const settingsScrollHint = $("settingsScrollHint");
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
const planPillEl = $("planPill");
const planTitleEl = $("planTitle");
const planSubtitleEl = $("planSubtitle");
const planBadgeEl = $("planBadge");
const planUsageEl = $("planUsage");
const planNoticeEl = $("planNotice");
const planNoticeTitleEl = $("planNoticeTitle");
const planNoticeTextEl = $("planNoticeText");
const planPerksListEl = $("planPerksList");
const planCardEl = $("planCard");
const deepModeToggle = $("deepModeToggle");
const modelHintEl = $("modelHint");
const activationCodeInputEl = $("activationCodeInput");
const activateCodeBtn = $("activateCodeBtn");
const openUpgradeBtn = $("openUpgradeBtn");
const upgradeOverlay = $("upgradeOverlay");
const upgradeModal = $("upgradeModal");
const upgradeCloseBtn = $("upgradeCloseBtn");
const ideaOverlay = $("ideaOverlay");
const ideaModal = $("ideaModal");
const ideaCloseBtn = $("ideaCloseBtn");
const ideaCancelBtn = $("ideaCancelBtn");
const ideaListEl = $("ideaList");
const ideaInputEl = $("ideaInput");
const ideaSubmitBtn = $("ideaSubmitBtn");
const ideaPromptEl = $("ideaPrompt");
const telegramPayBtn = $("telegramPayBtn");
const upgradeCodeInput = $("upgradeCodeInput");
const upgradeActivateBtn = $("upgradeActivateBtn");
const openPrivacyBtn = $("openPrivacyBtn");
const openTermsBtn = $("openTermsBtn");
const privacyOverlay = $("privacyOverlay");
const privacyModal = $("privacyModal");
const privacyCloseBtn = $("privacyCloseBtn");
const termsOverlay = $("termsOverlay");
const termsModal = $("termsModal");
const termsCloseBtn = $("termsCloseBtn");

let supabase = null;
let authSession = null;
let supabaseReady = null;
let upgradePending = false;
let planReady = null;
let currentPlan = "free";
let currentUsageCount = 0;
let deepModeEnabled = false;
let lastProModel = null;

const TELEGRAM_BOT_URL = "https://t.me/dual_ai_pay_bot";

const PLAN_LIMITS = {
  free: 30,
  plus: 100,
  pro: Number.POSITIVE_INFINITY,
};

const DEFAULT_FREE_MODEL = "deepseek/deepseek-r1-0528:free";

const IDEAS_KEY = "dual-ai-ideas-v1";
const IDEA_DAY_KEY = "dual-ai-idea-day-v1";

const IDEA_PROMPTS = [
  "Какой сценарий использования вы хотите улучшить?",
  "Что бы вы автоматизировали в своём рабочем процессе?",
  "Какая функция сделает чат более полезным?",
  "Какая аналитика или отчёт вам нужнее всего?",
  "Что мешает пользоваться чатом чаще?",
];


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
  planReady = null;
  const email = session?.user?.email;
  loginBtn.hidden = !!email;
  settingsAccountEmailEl.textContent = email || "Гость (не выполнен вход)";
  if (email) {
    setAuthScene(false);
  }
  if (email) {
    void syncDialogsFromSupabase();
    void refreshPlanAndUsage({ force: true });
    if (upgradePending) {
      upgradePending = false;
      openUpgradeModal();
    }
  } else {
    dialogs = loadDialogsLocal();
    ensureActiveDialog();
    render();
    renderDialogList();
    setPlanState("free", 0);
  }
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

function setPrivacyScene(isOpen) {
  document.body.classList.toggle("privacy-open", isOpen);
}

function setTermsScene(isOpen) {
  document.body.classList.toggle("terms-open", isOpen);
}

function setUpgradeScene(isOpen) {
  document.body.classList.toggle("upgrade-open", isOpen);
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
  queueMicrotask(updateSettingsScrollHint);
}

function closeSettingsModal() {
  setSettingsScene(false);
}

function openUpgradeModal() {
  setUpgradeScene(true);
}

function closeUpgradeModal() {
  setUpgradeScene(false);
}

function openPrivacyModal() {
  setPrivacyScene(true);
}

function closePrivacyModal() {
  setPrivacyScene(false);
}

function openTermsModal() {
  setTermsScene(true);
}

function closeTermsModal() {
  setTermsScene(false);
}

function openIdeaModal() {
  document.body.classList.toggle("idea-open", true);
  renderIdeas();
}

function closeIdeaModal() {
  document.body.classList.toggle("idea-open", false);
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function loadIdeas() {
  try {
    const raw = localStorage.getItem(IDEAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i) => i && i.text && i.ts);
  } catch {
    return [];
  }
}

function saveIdeas(ideas) {
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
}

function setDailyIdeaPrompt() {
  if (!ideaPromptEl) return;
  const today = getTodayKey();
  const stored = localStorage.getItem(IDEA_DAY_KEY);
  if (stored === today) return;
  const index = Math.abs(
    Array.from(today).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % IDEA_PROMPTS.length;
  ideaPromptEl.textContent = IDEA_PROMPTS[index];
  localStorage.setItem(IDEA_DAY_KEY, today);
}

function renderIdeas() {
  if (!ideaListEl) return;
  const ideas = loadIdeas().slice(-5).reverse();
  ideaListEl.innerHTML = "";
  if (ideas.length === 0) {
    const empty = document.createElement("div");
    empty.className = "idea-empty";
    empty.textContent = "Пока нет идей. Начните первым.";
    ideaListEl.appendChild(empty);
    return;
  }
  for (const idea of ideas) {
    const item = document.createElement("div");
    item.className = "idea-item";
    const meta = document.createElement("div");
    meta.className = "idea-meta";
    meta.textContent = new Date(idea.ts).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
    const body = document.createElement("div");
    body.className = "idea-text";
    body.innerHTML = escapeHtml(idea.text);
    item.appendChild(meta);
    item.appendChild(body);
    ideaListEl.appendChild(item);
  }
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

function getPlanLabel(plan) {
  const normalized = String(plan || "free").toLowerCase();
  if (normalized === "pro") return "Pro";
  if (normalized === "plus") return "Plus";
  return "Free";
}

function getPlanLimit(plan) {
  const normalized = String(plan || "free").toLowerCase();
  return PLAN_LIMITS[normalized] ?? PLAN_LIMITS.free;
}

function getPlanSubtitle(plan) {
  const limit = getPlanLimit(plan);
  if (!Number.isFinite(limit)) return "Без ограничений";
  return `${limit} сообщений в день`;
}

function setPlanState(plan, usageCount = 0) {
  currentPlan = String(plan || "free").toLowerCase();
  currentUsageCount = usageCount;
  const label = getPlanLabel(currentPlan);
  const subtitle = getPlanSubtitle(currentPlan);
  if (planPillEl) planPillEl.textContent = label;
  if (planTitleEl) planTitleEl.textContent = label;
  if (planSubtitleEl) planSubtitleEl.textContent = subtitle;
  if (planBadgeEl) planBadgeEl.textContent = label;
  if (planPillEl) {
    planPillEl.dataset.plan = currentPlan;
  }
  if (planNoticeEl) {
    planNoticeEl.dataset.plan = currentPlan;
  }
  if (planCardEl) {
    planCardEl.dataset.plan = currentPlan;
  }
  const limit = getPlanLimit(currentPlan);
  if (planUsageEl) {
    planUsageEl.textContent = Number.isFinite(limit)
      ? `Сегодня: ${usageCount} / ${limit}`
      : `Сегодня: ${usageCount} / без ограничений`;
  }
  if (planNoticeTitleEl) {
    planNoticeTitleEl.textContent =
      currentPlan === "pro"
        ? "Pro активирован"
        : currentPlan === "plus"
        ? "Plus активирован"
        : "Free активен";
  }
  if (planNoticeTextEl) {
    planNoticeTextEl.textContent =
      currentPlan === "pro"
        ? "Безлимитные сообщения. Спасибо за поддержку!"
        : currentPlan === "plus"
        ? "Лимит увеличен до 100 сообщений в день."
        : "Доступно 30 сообщений в день. Можно перейти на Plus или Pro.";
  }
  if (planPerksListEl) {
    const perks =
      currentPlan === "pro"
        ? [
            "Безлимитные сообщения",
            "Приоритетный доступ к новым функциям",
            "Глубокий режим ответа",
          ]
        : currentPlan === "plus"
        ? [
            "100 сообщений в день",
            "Больше ходов в авто-диалоге",
            "История диалогов сохраняется",
          ]
        : [
            "30 сообщений в день",
            "Доступ к Bot R + Bot S",
            "История диалогов сохраняется",
          ];
    planPerksListEl.innerHTML = "";
    for (const perk of perks) {
      const li = document.createElement("li");
      li.textContent = perk;
      planPerksListEl.appendChild(li);
    }
  }
  const hideUpgrade = currentPlan === "pro";
  if (upgradeBtn) upgradeBtn.hidden = hideUpgrade;
  if (heroUpgradeBtn) heroUpgradeBtn.hidden = hideUpgrade;
  if (openUpgradeBtn) openUpgradeBtn.hidden = hideUpgrade;
  if (deepModeToggle) {
    deepModeToggle.disabled = currentPlan !== "pro";
    deepModeToggle.textContent = deepModeEnabled ? "Выключить" : "Включить";
    deepModeToggle.title =
      currentPlan === "pro"
        ? "Включить или выключить глубокий режим"
        : "Доступно только для тарифа Pro";
  }
  if (modelEl) {
    const canChooseModel = currentPlan === "pro";
    modelEl.disabled = !canChooseModel;
    if (!canChooseModel) {
      if (!lastProModel) {
        lastProModel = modelEl.value;
      }
      const hasDefault = Array.from(modelEl.options).some(
        (option) => option.value === DEFAULT_FREE_MODEL
      );
      if (hasDefault) modelEl.value = DEFAULT_FREE_MODEL;
    } else if (lastProModel) {
      modelEl.value = lastProModel;
      lastProModel = null;
    }
  }
  if (modelHintEl) {
    modelHintEl.hidden = currentPlan === "pro";
  }
  if (observeBtn) {
    observeBtn.disabled = currentPlan === "free";
    observeBtn.title =
      currentPlan === "free"
        ? "Доступно с Plus"
        : "Наблюдать диалог ботов";
  }
}

function updateSettingsScrollHint() {
  if (!settingsBody || !settingsScrollHint) return;
  const canScroll = settingsBody.scrollHeight > settingsBody.clientHeight + 4;
  const atBottom =
    Math.ceil(settingsBody.scrollTop + settingsBody.clientHeight) >=
    settingsBody.scrollHeight - 2;
  settingsScrollHint.hidden = !canScroll || atBottom;
}

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function ensureUserPlan() {
  if (!supabase || !authSession?.user?.id) {
    setPlanState("free", 0);
    return "free";
  }
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", authSession.user.id)
    .maybeSingle();
  if (error) {
    setStatus(`Supabase plans: ${error.message}`, "error");
    setPlanState("free", currentUsageCount);
    return "free";
  }
  if (!data?.plan) {
    const { error: insertError } = await supabase.from("user_plans").insert({
      user_id: authSession.user.id,
      plan: "free",
      updated_at: new Date().toISOString(),
    });
    if (insertError) {
      setStatus(`Supabase plans: ${insertError.message}`, "error");
    }
    return "free";
  }
  return data.plan;
}

async function fetchUsageCount() {
  if (!supabase || !authSession?.user?.id) return 0;
  const today = getTodayKey();
  const { data, error } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", authSession.user.id)
    .eq("day", today)
    .maybeSingle();
  if (error) {
    setStatus(`Supabase usage: ${error.message}`, "error");
    return currentUsageCount;
  }
  return data?.count ?? 0;
}

async function incrementUsageCount() {
  if (!supabase || !authSession?.user?.id) return;
  const today = getTodayKey();
  const { data, error } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", authSession.user.id)
    .eq("day", today)
    .maybeSingle();
  if (error) {
    setStatus(`Supabase usage: ${error.message}`, "error");
    return;
  }
  if (!data) {
    const { error: insertError } = await supabase.from("daily_usage").insert({
      user_id: authSession.user.id,
      day: today,
      count: 1,
    });
    if (insertError) {
      setStatus(`Supabase usage: ${insertError.message}`, "error");
      return;
    }
    currentUsageCount = 1;
    setPlanState(currentPlan, currentUsageCount);
    return;
  }
  const nextCount = Number(data.count || 0) + 1;
  const { error: updateError } = await supabase
    .from("daily_usage")
    .update({ count: nextCount })
    .eq("user_id", authSession.user.id)
    .eq("day", today);
  if (updateError) {
    setStatus(`Supabase usage: ${updateError.message}`, "error");
    return;
  }
  currentUsageCount = nextCount;
  setPlanState(currentPlan, currentUsageCount);
}

async function refreshPlanAndUsage({ force = false } = {}) {
  if (force) planReady = null;
  if (planReady) return planReady;
  planReady = (async () => {
    const plan = await ensureUserPlan();
    const usage = await fetchUsageCount();
    setPlanState(plan, usage);
    return true;
  })();
  return planReady;
}

function canSendMessage() {
  const limit = getPlanLimit(currentPlan);
  if (!Number.isFinite(limit)) return true;
  return currentUsageCount < limit;
}

function normalizeActivationCode(code) {
  return String(code || "").trim().toLowerCase();
}

function isActivationCodeValid(code) {
  return /^dual-[a-z0-9]{7}$/i.test(code);
}

async function applyActivationCode(rawCode) {
  if (!supabase || !authSession?.user?.id) {
    setStatus("Сначала войдите в аккаунт.", "error");
    openAuthModal();
    return;
  }
  const code = normalizeActivationCode(rawCode);
  if (!isActivationCodeValid(code)) {
    setStatus("Код должен быть в формате dual-xxxxxxx.", "error");
    return;
  }
  const { data, error } = await supabase.rpc("redeem_activation_code", {
    code_input: code,
  });
  if (error) {
    setStatus(`Supabase codes: ${error.message}`, "error");
    return;
  }
  const nextPlan = String(data?.plan || "").toLowerCase();
  if (!nextPlan) {
    setStatus("Код не найден или уже использован.", "error");
    return;
  }
  activationCodeInputEl.value = "";
  if (upgradeCodeInput) upgradeCodeInput.value = "";
  setPlanState(nextPlan, currentUsageCount);
  await refreshPlanAndUsage({ force: true });
  setStatus("Подписка активирована.", "ok");
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
    if (typeof s.deepModeEnabled === "boolean") {
      deepModeEnabled = s.deepModeEnabled;
    }
    lastProModel = modelEl.value;
  } catch {
    // ignore
  }
}

function saveSettings() {
  const model = modelEl.value.trim();
  const turns = getExtraTurns();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ model, turns, deepModeEnabled })
  );
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
  if (deepModeEnabled && currentPlan === "pro") {
    messages.push({
      role: "user",
      content: "Пожалуйста, дай более глубокий, развернутый ответ с пояснениями.",
    });
  }
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
  await incrementUsageCount();
  await runTurn("R");
  await runTurn("S");

  // Авто-диалог: R<->S. Последний говорил S, значит следующий R.
  for (let i = 0; i < extraTurns; i++) {
    await runTurn(i % 2 === 0 ? "R" : "S");
  }
}

async function sendUserMessageWithTurns(text, extraTurnsOverride) {
  transcript.push({ speaker: "user", content: text, ts: Date.now() });
  render();
  persistActiveDialog();
  await incrementUsageCount();
  await runTurn("R");
  await runTurn("S");

  for (let i = 0; i < extraTurnsOverride; i++) {
    await runTurn(i % 2 === 0 ? "R" : "S");
  }
}

function getExtraTurns() {
  const parsed = Number(turnsEl.value || 0);
  if (!Number.isFinite(parsed)) return 0;
  const maxTurns = currentPlan === "plus" || currentPlan === "pro" ? 20 : 10;
  return Math.max(0, Math.min(maxTurns, parsed));
}

async function onSend() {
  const text = inputEl.value.trim();
  if (!text) return;
  if (!requireAuth()) return;
  await refreshPlanAndUsage();
  if (!canSendMessage()) {
    setStatus("Достигнут лимит сообщений. Перейдите на Plus или Pro.", "error");
    openUpgradeModal();
    return;
  }

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
observeBtn?.addEventListener("click", async () => {
  if (!requireAuth()) return;
  await refreshPlanAndUsage();
  if (currentPlan === "free") {
    setStatus("Функция доступна с Plus.", "error");
    openUpgradeModal();
    return;
  }
  const hasUserMessage = transcript.some((m) => m.speaker === "user");
  const text = hasUserMessage ? "Продолжите обсуждение." : "Привет";
  sendBtn.disabled = true;
  demoBtn.disabled = true;
  observeBtn.disabled = true;
  try {
    await sendUserMessageWithTurns(text, 6);
  } catch (e) {
    setStatus(String(e?.message || e), "error");
  } finally {
    sendBtn.disabled = false;
    demoBtn.disabled = false;
    observeBtn.disabled = false;
  }
});
deepModeToggle?.addEventListener("click", () => {
  if (currentPlan !== "pro") {
    setStatus("Глубокий режим доступен только для Pro.", "error");
    return;
  }
  deepModeEnabled = !deepModeEnabled;
  setPlanState(currentPlan, currentUsageCount);
  saveSettings();
});
exportChatBtn?.addEventListener("click", () => {
  if (transcript.length === 0) {
    setStatus("Нет сообщений для экспорта.", "error");
    return;
  }
  const data = {
    title: dialogs.find((d) => d.id === activeDialogId)?.title || "Диалог",
    exportedAt: new Date().toISOString(),
    messages: transcript,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dual-ai-chat.json";
  link.click();
  URL.revokeObjectURL(url);
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
});
openSettingsHeroBtn?.addEventListener("click", () => {
  openSettingsModal();
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
upgradeBtn.addEventListener("click", () => {
  if (!authSession) {
    upgradePending = true;
    openAuthModal();
    return;
  }
  openUpgradeModal();
});
heroUpgradeBtn?.addEventListener("click", () => {
  if (!authSession) {
    upgradePending = true;
    openAuthModal();
    return;
  }
  openUpgradeModal();
});
quickStartButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const template = btn.getAttribute("data-template");
    if (!template) return;
    inputEl.value = template;
    setMode("chat");
    inputEl.focus();
  });
});
ideaBtn?.addEventListener("click", () => {
  openIdeaModal();
});
openUpgradeBtn?.addEventListener("click", () => {
  if (!authSession) {
    upgradePending = true;
    openAuthModal();
    return;
  }
  openUpgradeModal();
});
upgradeCloseBtn?.addEventListener("click", closeUpgradeModal);
upgradeOverlay?.addEventListener("click", closeUpgradeModal);
ideaCloseBtn?.addEventListener("click", closeIdeaModal);
ideaOverlay?.addEventListener("click", closeIdeaModal);
ideaCancelBtn?.addEventListener("click", closeIdeaModal);
openPrivacyBtn?.addEventListener("click", openPrivacyModal);
openTermsBtn?.addEventListener("click", openTermsModal);
privacyCloseBtn?.addEventListener("click", closePrivacyModal);
privacyOverlay?.addEventListener("click", closePrivacyModal);
termsCloseBtn?.addEventListener("click", closeTermsModal);
termsOverlay?.addEventListener("click", closeTermsModal);
ideaSubmitBtn?.addEventListener("click", () => {
  const text = ideaInputEl?.value.trim();
  if (!text) {
    setStatus("Введите идею перед отправкой.", "error");
    return;
  }
  const ideas = loadIdeas();
  ideas.push({ text, ts: Date.now() });
  saveIdeas(ideas);
  if (ideaInputEl) ideaInputEl.value = "";
  renderIdeas();
  setStatus("Идея сохранена. Спасибо!", "ok");
});
activateCodeBtn?.addEventListener("click", () => {
  void applyActivationCode(activationCodeInputEl.value);
});
upgradeActivateBtn?.addEventListener("click", () => {
  void applyActivationCode(upgradeCodeInput.value);
});
settingsLogoutBtn.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  closeSettingsModal();
  closeUpgradeModal();
});
settingsCloseBtn.addEventListener("click", closeSettingsModal);
settingsOverlay.addEventListener("click", closeSettingsModal);
settingsBody?.addEventListener("scroll", updateSettingsScrollHint);
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
    closeUpgradeModal();
    closeIdeaModal();
    closePrivacyModal();
    closeTermsModal();
  }
});

loadSettings();
dialogs = loadDialogs();
ensureActiveDialog();
render();
renderDialogList();
setMode("home");
initSupabase();
setPlanState("free", 0);
if (telegramPayBtn) {
  telegramPayBtn.href = TELEGRAM_BOT_URL;
}
setDailyIdeaPrompt();
