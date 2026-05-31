const { THEMES, DEFAULT_THEME, itemsForTheme, getTheme } = WalkBingoThemes;

const LANG = {
  en: {
    title: "Walk Bingo",
    sub: "a scavenger hunt for your walk",
    rulesHead: "How to play",
    rulesBody:
      "Find the items on your walk and tap (or tick) them off. Complete a full row or column — then you're free to head home. 🏡",
    winP: "🌿 Bingo! You can head home.",
    winSmall: "Fill in your steps below and keep as a souvenir.",
    labelName: "Name",
    labelSteps: "Steps taken",
    notes: "Notes",
    btnNew: "New card",
    btnPrint: "Print",
    themeHead: "Theme",
    themeHint: "What kind of walk is this?",
    locale: "en-GB",
  },
  ru: {
    title: "Прогулочное Бинго",
    sub: "игра-поиск для прогулки",
    rulesHead: "Как играть",
    rulesBody:
      "Найди предметы на прогулке и отмечай их. Заполни целый ряд или столбец — и можно возвращаться домой. 🏡",
    winP: "🌿 Бинго! Можно идти домой.",
    winSmall: "Запиши количество шагов ниже и сохрани на память.",
    labelName: "Имя",
    labelSteps: "Шагов пройдено",
    notes: "Заметки",
    btnNew: "Новая карточка",
    btnPrint: "Печать",
    themeHead: "Тема",
    themeHint: "Какое настроение у этой прогулки?",
    locale: "ru-RU",
  },
};

let lang = "en";
let theme = DEFAULT_THEME;
let found = new Array(9).fill(false);
let currentItems = [];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkWin() {
  for (let r = 0; r < 3; r++) {
    if ([0, 1, 2].every((c) => found[r * 3 + c])) {
      return [r * 3, r * 3 + 1, r * 3 + 2];
    }
  }
  for (let c = 0; c < 3; c++) {
    if ([0, 1, 2].every((r) => found[r * 3 + c])) {
      return [c, c + 3, c + 6];
    }
  }
  return null;
}

function renderThemePicker() {
  const grid = document.getElementById("themeGrid");
  const active = getTheme(theme);
  grid.innerHTML = "";

  for (const entry of THEMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-btn" + (entry.id === theme ? " active" : "");
    btn.title = entry.tagline[lang];
    btn.innerHTML = `<span class="theme-emoji">${entry.emoji}</span><span class="theme-name">${entry.name[lang]}</span>`;
    btn.onclick = () => setTheme(entry.id);
    grid.appendChild(btn);
  }

  document.getElementById("themeTagline").textContent = active.tagline[lang];
}

function applyLang() {
  const t = LANG[lang];
  document.documentElement.lang = lang;
  document.getElementById("t-title").textContent = t.title;
  document.getElementById("t-sub").textContent = t.sub;
  document.getElementById("t-rules-head").textContent = t.rulesHead;
  document.getElementById("t-rules-body").innerHTML = t.rulesBody;
  document.getElementById("t-win-p").textContent = t.winP;
  document.getElementById("t-win-small").textContent = t.winSmall;
  document.getElementById("t-label-name").textContent = t.labelName;
  document.getElementById("t-label-steps").textContent = t.labelSteps;
  document.getElementById("t-notes").textContent = t.notes;
  document.getElementById("t-btn-new").textContent = t.btnNew;
  document.getElementById("t-btn-print").textContent = t.btnPrint;
  document.getElementById("t-theme-head").textContent = t.themeHead;
  document.getElementById("t-theme-hint").textContent = t.themeHint;
  document.title = t.title + " 🌿";

  const active = getTheme(theme);
  document.getElementById("themeBadge").textContent =
    `${active.emoji} ${active.name[lang]}`;

  document.getElementById("dateline").textContent = new Date().toLocaleDateString(
    t.locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });

  renderThemePicker();
}

function setLang(l) {
  lang = l;
  applyLang();
  newCard();
}

function setTheme(id) {
  theme = id;
  applyLang();
  newCard();
}

function render() {
  const grid = document.getElementById("grid");
  const banner = document.getElementById("winBanner");
  const win = checkWin();

  grid.innerHTML = "";
  currentItems.forEach((item, i) => {
    const cell = document.createElement("div");
    cell.className =
      "cell" +
      (found[i] ? " found" : "") +
      (win && win.includes(i) ? " winner" : "");
    cell.textContent = item;
    cell.onclick = () => {
      found[i] = !found[i];
      render();
    };
    grid.appendChild(cell);
  });

  if (win) banner.classList.add("show");
  else banner.classList.remove("show");
}

function newCard() {
  const pool = itemsForTheme(theme, POOL);
  currentItems = shuffle(pool)
    .slice(0, 9)
    .map((item) => item[lang]);
  found = new Array(9).fill(false);
  document
    .querySelectorAll(".field-line, .note-line")
    .forEach((el) => (el.value = ""));
  render();
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});

document.getElementById("t-btn-new").addEventListener("click", newCard);
document.getElementById("t-btn-print").addEventListener("click", () =>
  window.print(),
);

applyLang();
newCard();
