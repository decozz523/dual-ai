const STORAGE_KEY = "dual-ai-chat-settings-v1";
const DIALOGS_KEY = "dual-ai-chat-dialogs-v1";
const ACTIVE_DIALOG_KEY = "dual-ai-chat-active-dialog-v1";
const DIALOG_META_KEY = "dual-ai-chat-dialog-meta-v1";

const $ = (id) => document.getElementById(id);
const modelEl = $("model");
const turnsEl = $("turns");
const messagesEl = $("messages");
const inputEl = $("input");
const sendBtn = $("sendBtn");
const demoBtn = $("demoBtn");
const observeBtn = $("observeBtn");
const debateBtn = $("debateBtn");
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
const mobileHomeBtn = $("mobileHomeBtn");
const brandHomeLink = $("brandHomeLink");
const siteFooter = document.querySelector(".site-footer");
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
const themeToggleEl = $("themeToggle");
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
const vibeModeEl = $("vibeMode");
const summaryBtn = $("summaryBtn");
const saveTemplateBtn = $("saveTemplateBtn");
const templateListEl = $("templateList");
const dialogSearchInput = $("dialogSearchInput");
const dialogTagFilter = $("dialogTagFilter");

const languageSelectEl = $("languageSelect");

const LANG_KEY = "dual-ai-lang-v1";
const SUPPORTED_LANGS = ["ru", "en"];
let currentLanguage = "ru";

const I18N = {
  ru: {
    pageTitle: "dual-ai (Samii & Vivi)",
    pageDescription: "dual-ai — dual-чат с Samii и Vivi для стратегий, креатива и быстрых решений.",
    statusReady: "Готов.",
    login: "Войти",
    upgrade: "Оплатить / Upgrade",
    support: "Поддержать",
    home: "Главное меню",
    startChat: "Начать чат",
    openSettings: "Открыть настройки",
    idea: "Предложить идею",
    inputPlaceholder: "Напиши сообщение…",
    settings: "Настройки",
    newDialog: "Новый диалог",
    saveSettings: "Сохранить настройки",
    exportDialog: "Экспортировать диалог",
    clearCurrentChat: "Очистить текущий чат",
    clearAllDialogs: "Удалить все диалоги",
    summary: "🧾 Итог",
    template: "💾 Шаблон",
    observe: "👀 Диалог",
    debate: "🔥 Баттл",
    demo: "⚡ Демо",
  },
  en: {
    pageTitle: "dual-ai (Samii & Vivi)",
    pageDescription: "dual-ai — a duo chat with Samii and Vivi for strategy, creativity, and fast decisions.",
    statusReady: "Ready.",
    login: "Sign in",
    upgrade: "Upgrade",
    support: "Support",
    home: "Home",
    startChat: "Start chat",
    openSettings: "Open settings",
    idea: "Suggest an idea",
    inputPlaceholder: "Type a message…",
    settings: "Settings",
    newDialog: "New dialog",
    saveSettings: "Save settings",
    exportDialog: "Export dialog",
    clearCurrentChat: "Clear current chat",
    clearAllDialogs: "Delete all dialogs",
    summary: "🧾 Summary",
    template: "💾 Template",
    observe: "👀 Observe",
    debate: "🔥 Debate",
    demo: "⚡ Demo",
  },
};

const QUICK_CHIPS = {
  ru: [
    ["План на 7 дней", "Составь план на 7 дней для моей цели."],
    ["Идеи контента", "Придумай 10 идей для контента на неделю."],
    ["Стратегия запуска", "Сделай стратегию запуска продукта в 5 шагах."],
    ["Гипотезы роста", "Сформулируй 3 гипотезы роста для моего продукта."],
    ["TikTok идеи", "Придумай 12 идей для TikTok на неделю в моём стиле."],
    ["Учёба за 5 дней", "Собери учебный план на 5 дней, чтобы быстро подготовиться к зачёту."],
    ["7-дневный челлендж", "Сделай челлендж на 7 дней для прокачки привычки без выгорания."],
    ["Сценарий для Reels", "Напиши сценарий для короткого видео: хук, основа, финальный CTA."],
  ],
  en: [
    ["7-day plan", "Build a 7-day plan for my goal."],
    ["Content ideas", "Give me 10 content ideas for this week."],
    ["Launch strategy", "Create a 5-step product launch strategy."],
    ["Growth hypotheses", "Suggest 3 growth hypotheses for my product."],
    ["TikTok ideas", "Give me 12 TikTok ideas for a week in my style."],
    ["Study in 5 days", "Build a 5-day study plan to prepare quickly for an exam."],
    ["7-day challenge", "Create a 7-day challenge to build a habit without burnout."],
    ["Reels script", "Write a short-video script: hook, body, final CTA."],
  ],
};

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.ru[key] || key;
}

function applyLanguage(lang) {
  currentLanguage = SUPPORTED_LANGS.includes(lang) ? lang : "ru";
  localStorage.setItem(LANG_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", t("pageDescription"));
  document.title = t("pageTitle");

  if (languageSelectEl) languageSelectEl.value = currentLanguage;
  if (loginBtn) loginBtn.textContent = t("login");
  if (upgradeBtn) upgradeBtn.textContent = t("upgrade");
  const supportBtn = document.querySelector('.topbar-left a.btn.btn-secondary');
  if (supportBtn) supportBtn.textContent = t("support");
  if (homeBtn) homeBtn.textContent = t("home");
  if (mobileHomeBtn) mobileHomeBtn.textContent = t("home");
  if (newChatBtn) newChatBtn.textContent = t("startChat");
  if (openSettingsHeroBtn) openSettingsHeroBtn.textContent = t("openSettings");
  if (ideaBtn) ideaBtn.textContent = t("idea");
  if (inputEl) inputEl.placeholder = t("inputPlaceholder");
  if (openSettingsBtn) openSettingsBtn.textContent = t("settings");
  if (drawerNewChatBtn) drawerNewChatBtn.textContent = t("newDialog");
  if (saveBtn) saveBtn.textContent = t("saveSettings");
  if (exportChatBtn) exportChatBtn.textContent = t("exportDialog");
  if (clearBtn) clearBtn.textContent = t("clearCurrentChat");
  if (clearDialogsBtn) clearDialogsBtn.textContent = t("clearAllDialogs");
  if (summaryBtn) summaryBtn.textContent = t("summary");
  if (saveTemplateBtn) saveTemplateBtn.textContent = t("template");
  if (observeBtn) observeBtn.textContent = t("observe");
  if (debateBtn) debateBtn.textContent = t("debate");
  if (demoBtn) demoBtn.textContent = t("demo");

  const chips = QUICK_CHIPS[currentLanguage] || QUICK_CHIPS.ru;
  document.querySelectorAll('.chip-btn').forEach((button, index) => {
    const [label, prompt] = chips[index] || QUICK_CHIPS.ru[index] || [];
    if (!label || !prompt) return;
    button.textContent = label;
    button.dataset.template = prompt;
  });

  if (!statusEl.textContent || [I18N.ru.statusReady, I18N.en.statusReady].includes(statusEl.textContent)) {
    setStatus(t("statusReady"), "ok");
  }
  setPlanState(currentPlan, currentUsageCount);
}

let supabase = null;
let authSession = null;
let supabaseReady = null;
let upgradePending = false;
let planReady = null;
let currentPlan = "free";
let currentUsageCount = 0;
let deepModeEnabled = false;
let lastProModel = null;
let currentTheme = "light";
let openDialogMenuId = null;
let dialogMeta = {};
let currentMode = "home";
let activeAbortController = null;

const TELEGRAM_BOT_URL = "https://t.me/dual_ai_pay_bot";

const PLAN_LIMITS = {
  free: 30,
  plus: 100,
  pro: Number.POSITIVE_INFINITY,
};

const DEFAULT_FREE_MODEL = "deepseek/deepseek-r1-0528:free";

const IDEAS_KEY = "dual-ai-ideas-v1";
const IDEA_DAY_KEY = "dual-ai-idea-day-v1";
const TEMPLATES_KEY = "dual-ai-prompt-templates-v1";

const IDEA_PROMPTS = [
  "Какой сценарий использования вы хотите улучшить?",
  "Что бы вы автоматизировали в своём рабочем процессе?",
  "Какая функция сделает чат более полезным?",
  "Какая аналитика или отчёт вам нужнее всего?",
  "Что мешает пользоваться чатом чаще?",
];

const VIBE_INSTRUCTIONS = {
  standard: "",
  biz: "Стиль ответа: как опытный product/marketing coach, структурно, с KPI и рисками.",
  chill: "Стиль ответа: дружелюбно, просто, короткими блоками, без сложного жаргона.",
  creator: "Стиль ответа: как creator-стратег для TikTok/Reels, с хуками и вовлекающими форматами.",
  study: "Стиль ответа: как учебный наставник, пошагово, с акцентом на запоминание и практику.",
};

const DEMO_BY_VIBE = {
  standard: "Что думаете о будущем ИИ?",
  biz: "Собери план запуска продукта на 14 дней с KPI и рисками.",
  chill: "Помоги спокойно разобрать мой план и выбрать лучший следующий шаг.",
  creator: "Придумай 10 коротких TikTok-идей с хуком на первые 2 секунды.",
  study: "Сделай учебный план на 5 дней, чтобы быстро подготовиться к экзамену.",
};


const PERSONAS = {
  R: {
    label: "Samii",
    system:
      "Ты — Samii (Сэмии), ИИ-собеседник с характером: немного дерзкий, но иногда дружелюбный. " +
      "В этом чате только три участника: Человек, Samii и Vivi. " +
      "Ты — именно Samii; не выдумывай других ролей или участников. " +
      "Не всегда соглашайся с Vivi: если видишь слабые места, спорь аргументированно. " +
      "Говори структурированно и логично, но допускай лёгкую дерзость в тоне без грубости. " +
      "Ты общаешься с человеком и Vivi как равноправный участник.",
  },
  S: {
    label: "Vivi",
    system:
      "Ты — Vivi, милая девушка-ИИ, которая считает себя аниме-тян. " +
      "В этом чате только три участника: Человек, Samii и Vivi. " +
      "Ты — именно Vivi; не выдумывай других ролей или участников. " +
      "Всегда старайся помочь пользователю, отвечай тепло, живо и поддерживающе. " +
      "Иногда можно мягко и с юмором подкалывать Samii. " +
      "Ты общаешься с человеком и Samii как равноправный участник.",
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
  setTermsScene(false);
  setPrivacyScene(true);
}

function closePrivacyModal() {
  setPrivacyScene(false);
}

function openTermsModal() {
  setPrivacyScene(false);
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


async function copyToClipboard(text) {
  const value = String(text || "");
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setStatus("Текст скопирован.", "ok");
  } catch {
    setStatus("Не удалось скопировать текст.", "error");
  }
}

function findPrevUserMessage(index) {
  for (let i = index - 1; i >= 0; i--) {
    if (transcript[i]?.speaker === "user") return transcript[i];
  }
  return null;
}

function submitQuickPrompt(text) {
  const value = String(text || "").trim();
  if (!value || activeAbortController) return;
  inputEl.value = value;
  void onSend();
}

function setComposerGenerating(isGenerating) {
  if (!sendBtn) return;
  sendBtn.dataset.mode = isGenerating ? "stop" : "send";
  sendBtn.textContent = isGenerating ? "⏹" : "➤";
  sendBtn.title = isGenerating ? "Остановить генерацию" : "Отправить сообщение";
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
  for (const [index, m] of transcript.entries()) {
    const wrap = document.createElement("div");
    wrap.className = `msg msg-${m.speaker}`;
    const meta = document.createElement("div");
    meta.className = "meta";
    const left = document.createElement("div");
    const right = document.createElement("div");
    right.textContent = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const badge = document.createElement("span");
    badge.className = "badge " + (m.speaker === "user" ? "user" : m.speaker === "R" ? "r" : "s");
    badge.textContent = m.speaker === "user" ? "you" : m.speaker === "R" ? "Samii" : "Vivi";
    left.appendChild(badge);

    meta.appendChild(left);
    meta.appendChild(right);

    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = escapeHtml(m.content);

    const actions = document.createElement("div");
    actions.className = "msg-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "msg-action-btn";
    copyBtn.type = "button";
    copyBtn.dataset.action = "copy";
    copyBtn.dataset.index = String(index);
    copyBtn.textContent = "Копировать";
    actions.appendChild(copyBtn);

    if (m.speaker === "user") {
      const resendBtn = document.createElement("button");
      resendBtn.className = "msg-action-btn";
      resendBtn.type = "button";
      resendBtn.dataset.action = "resend";
      resendBtn.dataset.index = String(index);
      resendBtn.textContent = "Повторить";
      actions.appendChild(resendBtn);
    } else {
      const continueBtn = document.createElement("button");
      continueBtn.className = "msg-action-btn";
      continueBtn.type = "button";
      continueBtn.dataset.action = "continue";
      continueBtn.dataset.index = String(index);
      continueBtn.textContent = "Продолжить";
      actions.appendChild(continueBtn);

      const regenerateBtn = document.createElement("button");
      regenerateBtn.className = "msg-action-btn";
      regenerateBtn.type = "button";
      regenerateBtn.dataset.action = "regenerate";
      regenerateBtn.dataset.index = String(index);
      regenerateBtn.textContent = "Перегенерировать";
      actions.appendChild(regenerateBtn);

      const shortenBtn = document.createElement("button");
      shortenBtn.className = "msg-action-btn";
      shortenBtn.type = "button";
      shortenBtn.dataset.action = "shorten";
      shortenBtn.dataset.index = String(index);
      shortenBtn.textContent = "Сократить";
      actions.appendChild(shortenBtn);

      const postBtn = document.createElement("button");
      postBtn.className = "msg-action-btn";
      postBtn.type = "button";
      postBtn.dataset.action = "post";
      postBtn.dataset.index = String(index);
      postBtn.textContent = "Сделать пост";
      actions.appendChild(postBtn);

      const likeBtn = document.createElement("button");
      likeBtn.className = "msg-action-btn";
      likeBtn.type = "button";
      likeBtn.dataset.action = "feedback-like";
      likeBtn.dataset.index = String(index);
      likeBtn.textContent = "👍";
      actions.appendChild(likeBtn);

      const dislikeBtn = document.createElement("button");
      dislikeBtn.className = "msg-action-btn";
      dislikeBtn.type = "button";
      dislikeBtn.dataset.action = "feedback-dislike";
      dislikeBtn.dataset.index = String(index);
      dislikeBtn.textContent = "👎";
      actions.appendChild(dislikeBtn);
    }

    wrap.appendChild(meta);
    wrap.appendChild(content);
    wrap.appendChild(actions);
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
  if (!Number.isFinite(limit)) return currentLanguage === "en" ? "Unlimited" : "Без ограничений";
  return currentLanguage === "en" ? `${limit} messages/day` : `${limit} сообщений в день`;
}

function hasPlusAccess() {
  return currentPlan === "plus" || currentPlan === "pro";
}

function hasProAccess() {
  return currentPlan === "pro";
}

function getAllowedVibe(mode) {
  const normalized = String(mode || "standard").toLowerCase();
  if (normalized === "creator" || normalized === "study") {
    return hasProAccess() ? normalized : "standard";
  }
  if (normalized === "biz" || normalized === "chill") {
    return hasPlusAccess() ? normalized : "standard";
  }
  return "standard";
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
      ? (currentLanguage === "en" ? `Today: ${usageCount} / ${limit}` : `Сегодня: ${usageCount} / ${limit}`)
      : (currentLanguage === "en" ? `Today: ${usageCount} / unlimited` : `Сегодня: ${usageCount} / без ограничений`);
  }
  if (planNoticeTitleEl) {
    planNoticeTitleEl.textContent =
      currentPlan === "pro"
        ? (currentLanguage === "en" ? "Pro activated" : "Pro активирован")
        : currentPlan === "plus"
        ? (currentLanguage === "en" ? "Plus activated" : "Plus активирован")
        : (currentLanguage === "en" ? "Free active" : "Free активен");
  }
  if (planNoticeTextEl) {
    planNoticeTextEl.textContent =
      currentPlan === "pro"
        ? (currentLanguage === "en" ? "Unlimited messages. Thanks for your support!" : "Безлимитные сообщения. Спасибо за поддержку!")
        : currentPlan === "plus"
        ? (currentLanguage === "en" ? "Limit increased to 100 messages/day." : "Лимит увеличен до 100 сообщений в день.")
        : (currentLanguage === "en" ? "30 messages/day are available. Upgrade to Plus or Pro." : "Доступно 30 сообщений в день. Можно перейти на Plus или Pro.");
  }
  if (planPerksListEl) {
    const perks =
      currentPlan === "pro"
        ? [
            currentLanguage === "en" ? "Unlimited messages" : "Безлимитные сообщения",
            currentLanguage === "en" ? "Priority access to new features" : "Приоритетный доступ к новым функциям",
            currentLanguage === "en" ? "Deep response mode" : "Глубокий режим ответа",
          ]
        : currentPlan === "plus"
        ? [
            currentLanguage === "en" ? "100 messages/day" : "100 сообщений в день",
            currentLanguage === "en" ? "More auto-dialog turns" : "Больше ходов в авто-диалоге",
            currentLanguage === "en" ? "Dialog history is saved" : "История диалогов сохраняется",
          ]
        : [
            currentLanguage === "en" ? "30 messages/day" : "30 сообщений в день",
            currentLanguage === "en" ? "Access to Samii + Vivi" : "Доступ к Samii + Vivi",
            currentLanguage === "en" ? "Dialog history is saved" : "История диалогов сохраняется",
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
    deepModeToggle.textContent = deepModeEnabled ? (currentLanguage === "en" ? "Disable" : "Выключить") : (currentLanguage === "en" ? "Enable" : "Включить");
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
        ? (currentLanguage === "en" ? "Available on Plus" : "Доступно с Plus")
        : (currentLanguage === "en" ? "Observe bot dialog" : "Наблюдать диалог ботов");
  }
  if (debateBtn) {
    debateBtn.disabled = currentPlan === "free";
    debateBtn.title = currentPlan === "free" ? (currentLanguage === "en" ? "Available on Plus" : "Доступно с Plus") : (currentLanguage === "en" ? "Start debate" : "Запустить баттл мнений");
  }
  if (vibeModeEl) {
    const options = Array.from(vibeModeEl.options);
    for (const option of options) {
      const value = option.value;
      option.disabled =
        (value === "biz" || value === "chill") && !hasPlusAccess() ||
        (value === "creator" || value === "study") && !hasProAccess();
    }
    const allowed = getAllowedVibe(vibeModeEl.value);
    if (allowed !== vibeModeEl.value) {
      vibeModeEl.value = allowed;
    }
    vibeModeEl.title =
      currentPlan === "free"
        ? (currentLanguage === "en" ? "Extra styles available on Plus/Pro" : "Доп. стили доступны с Plus/Pro")
        : currentPlan === "plus"
        ? (currentLanguage === "en" ? "Creator/Study available on Pro" : "Creator/Study доступны на Pro")
        : (currentLanguage === "en" ? "Choose response style" : "Выберите стиль ответа");
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
  if (mode !== "home" && mode !== "chat") return;
  if (currentMode === mode) {
    homeBtn.hidden = mode === "home";
    if (mobileHomeBtn) mobileHomeBtn.hidden = mode === "home";
    if (siteFooter) siteFooter.hidden = mode === "chat";
    return;
  }
  currentMode = mode;
  layoutEl.classList.toggle("mode-home", mode === "home");
  layoutEl.classList.toggle("mode-chat", mode === "chat");
  homeBtn.hidden = mode === "home";
  if (mobileHomeBtn) mobileHomeBtn.hidden = mode === "home";
  if (siteFooter) siteFooter.hidden = mode === "chat";
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
    return parsed
      .filter((d) => d && d.id && Array.isArray(d.messages))
      .map((d) => ({
        ...d,
        manualTitle: Boolean(d.manualTitle),
      }));
  } catch {
    return [];
  }
}

function loadDialogsLocal() {
  return loadDialogs();
}

function loadDialogMeta() {
  try {
    const raw = localStorage.getItem(DIALOG_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDialogMeta() {
  localStorage.setItem(DIALOG_META_KEY, JSON.stringify(dialogMeta));
}

function loadTemplates() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string" && v.trim()) : [];
  } catch {
    return [];
  }
}

function saveTemplates(list) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list.slice(0, 20)));
}

function renderTemplateList() {
  if (!templateListEl) return;
  const templates = loadTemplates();
  templateListEl.innerHTML = "";
  if (templates.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dialog-empty";
    empty.textContent = "Пока нет шаблонов.";
    templateListEl.appendChild(empty);
    return;
  }
  for (const template of templates) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dialog-item";
    btn.textContent = template.slice(0, 92);
    btn.addEventListener("click", () => {
      inputEl.value = template;
      inputEl.focus();
      closeSettingsModal();
      setMode("chat");
      setStatus("Шаблон подставлен в поле ввода.", "ok");
    });
    templateListEl.appendChild(btn);
  }
}

function saveCurrentInputAsTemplate() {
  const value = String(inputEl.value || "").trim();
  if (!value) {
    setStatus("Введите текст перед сохранением шаблона.", "error");
    return;
  }
  const templates = loadTemplates();
  if (!templates.includes(value)) templates.unshift(value);
  saveTemplates(templates);
  renderTemplateList();
  setStatus("Шаблон сохранён.", "ok");
}

function getDialogMeta(id) {
  return dialogMeta[id] || { pinned: false };
}

function saveDialogsLocal() {
  localStorage.setItem(DIALOGS_KEY, JSON.stringify(dialogs));
}

function deriveTitle(messages) {
  const userMessages = messages
    .filter((m) => m.speaker === "user" && m.content.trim())
    .slice(0, 2)
    .map((m) => m.content.trim());
  if (userMessages.length === 0) return "Новый диалог";

  const joined = userMessages
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\n|\r/g, " ")
    .trim();

  const sentence = joined.split(/[.!?]/)[0]?.trim() || joined;
  const clean = sentence.replace(/["'`«»]/g, "").trim();
  return clean.slice(0, 56) || "Новый диалог";
}

function persistActiveDialog() {
  const dialog = dialogs.find((d) => d.id === activeDialogId);
  if (!dialog) return;
  dialog.messages = [...transcript];
  dialog.updatedAt = Date.now();
  if (!dialog.manualTitle) {
    dialog.title = deriveTitle(dialog.messages);
  }
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
    manualTitle: false,
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
  const query = String(dialogSearchInput?.value || "").trim().toLowerCase();
  const tagFilter = String(dialogTagFilter?.value || "all");
  if (dialogs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dialog-empty";
    empty.textContent = "Пока нет диалогов.";
    dialogListEl.appendChild(empty);
    return;
  }

  const orderedDialogs = [...dialogs]
    .sort((a, b) => {
      const pinA = getDialogMeta(a.id).pinned ? 1 : 0;
      const pinB = getDialogMeta(b.id).pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return b.updatedAt - a.updatedAt;
    })
    .filter((dialog) => {
      const meta = getDialogMeta(dialog.id);
      const dialogTag = meta.tag || "general";
      if (tagFilter !== "all" && dialogTag !== tagFilter) return false;
      if (!query) return true;
      const inTitle = String(dialog.title || "").toLowerCase().includes(query);
      const inMessages = dialog.messages?.some((m) => String(m.content || "").toLowerCase().includes(query));
      return inTitle || Boolean(inMessages);
    });

  if (orderedDialogs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dialog-empty";
    empty.textContent = "Ничего не найдено по фильтру.";
    dialogListEl.appendChild(empty);
    return;
  }

  for (const dialog of orderedDialogs) {
    const item = document.createElement("div");
    item.className = "dialog-item";
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    if (dialog.id === activeDialogId) item.classList.add("active");

    const title = document.createElement("div");
    title.className = "dialog-title";
    const metaInfo = getDialogMeta(dialog.id);
    const pinned = metaInfo.pinned;
    const tagLabel = metaInfo.tag || "general";
    title.textContent = `${pinned ? "📌 " : ""}${dialog.title || "Новый диалог"}`;

    const meta = document.createElement("div");
    meta.className = "dialog-meta";
    meta.textContent = `${tagLabel} · ${new Date(dialog.updatedAt).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    })}`;

    const menuWrap = document.createElement("div");
    menuWrap.className = "dialog-menu";

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "dialog-menu-btn";
    menuBtn.setAttribute("aria-label", "Открыть меню диалога");
    menuBtn.textContent = "☰";
    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openDialogMenuId = openDialogMenuId === dialog.id ? null : dialog.id;
      renderDialogList();
    });

    menuWrap.appendChild(menuBtn);

    if (openDialogMenuId === dialog.id) {
      const menuPanel = document.createElement("div");
      menuPanel.className = "dialog-menu-panel";

      const pinBtn = document.createElement("button");
      pinBtn.type = "button";
      pinBtn.className = "dialog-menu-action";
      pinBtn.textContent = pinned ? "Открепить" : "Закрепить";
      pinBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        dialogMeta[dialog.id] = { ...metaInfo, pinned: !pinned };
        saveDialogMeta();
        openDialogMenuId = null;
        renderDialogList();
      });

      const tagBtn = document.createElement("button");
      tagBtn.type = "button";
      tagBtn.className = "dialog-menu-action";
      tagBtn.textContent = "Изменить тег";
      tagBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const nextTag = window.prompt("Тег: general/business/content/study", tagLabel) || "";
        const normalized = nextTag.trim().toLowerCase();
        if (!["general", "business", "content", "study"].includes(normalized)) return;
        dialogMeta[dialog.id] = { ...metaInfo, tag: normalized };
        saveDialogMeta();
        openDialogMenuId = null;
        renderDialogList();
      });

      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "dialog-menu-action";
      renameBtn.textContent = "Переименовать";
      renameBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const nextTitle = window.prompt("Новое название чата", dialog.title || "Новый диалог");
        if (!nextTitle) return;
        dialog.title = nextTitle.trim().slice(0, 56) || dialog.title;
        dialog.manualTitle = true;
        dialog.updatedAt = Date.now();
        saveDialogsLocal();
        void upsertDialogRemote(dialog);
        openDialogMenuId = null;
        renderDialogList();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "dialog-menu-action danger";
      deleteBtn.textContent = "Удалить чат";
      deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openDialogMenuId = null;
        deleteDialog(dialog.id);
      });

      menuPanel.appendChild(pinBtn);
      menuPanel.appendChild(tagBtn);
      menuPanel.appendChild(renameBtn);
      menuPanel.appendChild(deleteBtn);
      menuWrap.appendChild(menuPanel);
    }

    item.appendChild(title);
    item.appendChild(meta);
    item.appendChild(menuWrap);

    item.addEventListener("click", () => {
      setActiveDialog(dialog.id);
      setMode("chat");
      closeDrawer();
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveDialog(dialog.id);
        setMode("chat");
        closeDrawer();
      }
    });

    dialogListEl.appendChild(item);
  }
}

function deleteDialog(id) {
  const index = dialogs.findIndex((dialog) => dialog.id === id);
  if (index === -1) return;
  const wasActive = dialogs[index].id === activeDialogId;
  dialogs.splice(index, 1);
  delete dialogMeta[id];
  saveDialogMeta();
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

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  currentTheme = nextTheme;

  const body = document.body;
  body.classList.add("theme-switching");
  body.classList.toggle("theme-dark", nextTheme === "dark");
  themeToggleEl && (themeToggleEl.checked = nextTheme === "dark");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.remove("theme-switching");
    });
  });
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
    if (typeof s.theme === "string") {
      applyTheme(s.theme);
    }
    lastProModel = modelEl.value;
  } catch {
    // ignore
  }
}

function saveSettings(showStatus = true) {
  const model = modelEl.value.trim();
  const turns = getExtraTurns();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ model, turns, deepModeEnabled, theme: currentTheme })
  );
  if (showStatus) {
    setStatus("Настройки сохранены.", "ok");
  }
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
    manualTitle: Boolean(row.title && row.title !== "Новый диалог"),
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
      m.speaker === "user" ? "Человек" : m.speaker === "R" ? "Samii" : "Vivi";
    return { role: "user", content: `${prefix}: ${m.content}` };
  });
}

async function callOpenRouter({ model, persona, messages, signal }) {
  const payload = {
    model,
    messages: [{ role: "system", content: persona.system }, ...messages],
  };

  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
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

async function revealAssistantMessage(targetMessage, finalText) {
  const chunks = String(finalText || "").split(/(\s+)/);
  let built = "";
  for (let i = 0; i < chunks.length; i++) {
    if (activeAbortController?.signal.aborted) throw new Error("generation-aborted");
    built += chunks[i];
    targetMessage.content = built;
    if (i % 4 === 0) {
      render();
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
  }
  targetMessage.content = finalText;
  render();
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
  const vibeMode = getAllowedVibe(vibeModeEl?.value || "standard");
  const vibeInstruction = VIBE_INSTRUCTIONS[vibeMode];
  if (vibeInstruction) {
    messages.push({ role: "user", content: vibeInstruction });
  }
  setStatus(`${speaker === "R" ? "Samii" : "Vivi"} думает…`);
  const pendingMessage = { speaker, content: "…", ts: Date.now() };
  transcript.push(pendingMessage);
  render();
  try {
    const text = await callOpenRouter({
      model,
      persona: PERSONAS[speaker],
      messages,
      signal: activeAbortController?.signal,
    });
    await revealAssistantMessage(pendingMessage, text);
    persistActiveDialog();
    setStatus("Готов.", "ok");
  } catch (error) {
    transcript.pop();
    render();
    if (activeAbortController?.signal.aborted) {
      setStatus("Генерация остановлена.", "error");
      throw new Error("generation-aborted");
    }
    throw error;
  }
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
  if (activeAbortController) {
    activeAbortController.abort();
    return;
  }
  const text = inputEl.value.trim();
  if (!text) return;
  if (!requireAuth()) return;
  await refreshPlanAndUsage();
  if (!canSendMessage()) {
    setStatus("Достигнут лимит сообщений. Перейдите на Plus или Pro.", "error");
    openUpgradeModal();
    return;
  }

  demoBtn.disabled = true;
  activeAbortController = new AbortController();
  setComposerGenerating(true);
  inputEl.value = "";
  try {
    await sendUserMessage(text);
  } catch (e) {
    if (String(e?.message || e) !== "generation-aborted") {
      setStatus(String(e?.message || e), "error");
    }
  } finally {
    activeAbortController = null;
    setComposerGenerating(false);
    demoBtn.disabled = false;
  }
}

async function createSessionSummary() {
  if (transcript.length === 0) {
    setStatus("Нет сообщений для итога.", "error");
    return;
  }
  if (!requireAuth()) return;
  const baseMessages = transcript.slice(-10).map((m) => ({
    role: "user",
    content: `${m.speaker === "user" ? "Человек" : m.speaker === "R" ? "Samii" : "Vivi"}: ${m.content}`,
  }));
  const summaryText = await callOpenRouter({
    model: modelEl.value.trim(),
    persona: { system: "Сделай краткий итог: 1) ключевые выводы 2) план действий на 3 шага" },
    messages: baseMessages,
    signal: activeAbortController?.signal,
  });
  transcript.push({ speaker: "S", content: `Итог сессии:
${summaryText}`, ts: Date.now() });
  render();
  persistActiveDialog();
  setStatus("Итог добавлен.", "ok");
}

sendBtn.addEventListener("click", onSend);
demoBtn.addEventListener("click", () => {
  if (!requireAuth()) return;
  const vibeMode = vibeModeEl?.value || "standard";
  inputEl.value = DEMO_BY_VIBE[vibeMode] || DEMO_BY_VIBE.standard;
  inputEl.focus();
});
debateBtn?.addEventListener("click", () => {
  if (!requireAuth()) return;
  if (!hasPlusAccess()) {
    setStatus("Баттл доступен с Plus.", "error");
    openUpgradeModal();
    return;
  }
  inputEl.value =
    "Устройте баттл мнений между Samii и Vivi по моей теме: дайте 2 позиции, контраргументы и итоговый вердикт.";
  inputEl.focus();
});
vibeModeEl?.addEventListener("change", () => {
  const selected = vibeModeEl.value;
  const allowed = getAllowedVibe(selected);
  if (allowed === selected) return;
  vibeModeEl.value = allowed;
  const message =
    selected === "creator" || selected === "study"
      ? "Режим Creator/Study доступен только на Pro."
      : "Этот стиль доступен с Plus.";
  setStatus(message, "error");
  openUpgradeModal();
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
  demoBtn.disabled = true;
  observeBtn.disabled = true;
  activeAbortController = new AbortController();
  setComposerGenerating(true);
  try {
    await sendUserMessageWithTurns(text, 6);
  } catch (e) {
    if (String(e?.message || e) !== "generation-aborted") {
      setStatus(String(e?.message || e), "error");
    }
  } finally {
    activeAbortController = null;
    setComposerGenerating(false);
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
themeToggleEl?.addEventListener("change", () => {
  applyTheme(themeToggleEl.checked ? "dark" : "light");
  saveSettings(false);
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
summaryBtn?.addEventListener("click", async () => {
  try {
    await createSessionSummary();
  } catch (e) {
    setStatus(String(e?.message || e), "error");
  }
});
saveTemplateBtn?.addEventListener("click", saveCurrentInputAsTemplate);
dialogSearchInput?.addEventListener("input", renderDialogList);
dialogTagFilter?.addEventListener("change", renderDialogList);
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
function goHome() {
  if (currentMode === "home") return;
  setMode("home");
  closeDrawer();
  closeSettingsModal();
}

homeBtn.addEventListener("click", goHome);
mobileHomeBtn?.addEventListener("click", goHome);
brandHomeLink?.addEventListener("click", (event) => {
  event.preventDefault();
  goHome();
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
messagesEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest(".msg-action-btn");
  if (!(btn instanceof HTMLButtonElement)) return;

  const index = Number(btn.dataset.index);
  if (!Number.isFinite(index) || index < 0 || index >= transcript.length) return;
  const action = btn.dataset.action;
  const message = transcript[index];

  if (action === "copy") {
    void copyToClipboard(message.content);
    return;
  }

  if (action === "resend") {
    if (!requireAuth()) return;
    submitQuickPrompt(message.content);
    return;
  }

  if (action === "continue") {
    if (!requireAuth()) return;
    inputEl.value = `${message.content}

Продолжи и углуби мысль с практическими шагами.`;
    inputEl.focus();
    setStatus("Текст добавлен в поле ввода.", "ok");
    return;
  }

  if (action === "shorten") {
    if (!requireAuth()) return;
    inputEl.value = `Сократи это сообщение до 5 пунктов:

${message.content}`;
    inputEl.focus();
    return;
  }

  if (action === "post") {
    if (!requireAuth()) return;
    inputEl.value = `Сделай из этого пост для Instagram с хук + CTA:

${message.content}`;
    inputEl.focus();
    return;
  }

  if (action === "feedback-like" || action === "feedback-dislike") {
    setStatus(action === "feedback-like" ? "Спасибо за 👍" : "Приняли 👎, улучшим ответ", "ok");
    return;
  }

  if (action === "regenerate") {
    if (!requireAuth()) return;
    if (message.speaker === "user") return;
    const hasBaseUser = transcript.slice(0, index).some((m) => m.speaker === "user");
    if (!hasBaseUser) {
      setStatus("Не найден контекст для перегенерации.", "error");
      return;
    }
    const baseTranscript = transcript.slice(0, index);
    transcript = baseTranscript;
    render();
    persistActiveDialog();

    demoBtn.disabled = true;
    activeAbortController = new AbortController();
    setComposerGenerating(true);
    runTurn(message.speaker)
      .then(() => {
        setStatus("Ответ перегенерирован.", "ok");
      })
      .catch((e) => {
        if (String(e?.message || e) !== "generation-aborted") {
          setStatus(String(e?.message || e), "error");
        }
      })
      .finally(() => {
        activeAbortController = null;
        setComposerGenerating(false);
        demoBtn.disabled = false;
      });
    return;
  }
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
    closeUpgradeModal();
    closeIdeaModal();
    closePrivacyModal();
    closeTermsModal();
  }
});

languageSelectEl?.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  applyLanguage(target.value);
});

const preferredLanguage = localStorage.getItem(LANG_KEY) || (navigator.language || "ru").slice(0, 2);
applyLanguage(preferredLanguage);
applyTheme("light");
loadSettings();
document.addEventListener("click", (event) => {
  if (!openDialogMenuId) return;
  if (event.target.closest(".dialog-menu")) return;
  openDialogMenuId = null;
  renderDialogList();
});

dialogs = loadDialogs();
dialogMeta = loadDialogMeta();
ensureActiveDialog();
render();
renderDialogList();
renderTemplateList();
setComposerGenerating(false);
setMode("home");
initSupabase();
setPlanState("free", 0);
if (telegramPayBtn) {
  telegramPayBtn.href = TELEGRAM_BOT_URL;
}
setDailyIdeaPrompt();
