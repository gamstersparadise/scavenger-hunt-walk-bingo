const { THEMES, DEFAULT_THEME, itemsForTheme, getTheme } = WalkBingoThemes;

const LANG = {
  en: {
    title: "Walk Bingo",
    sub: "a scavenger hunt for your walk",
    rulesHead: "How to play",
    rulesBody:
      "Find the items on your walk and tap a square to snap or pick a photo of it — no photo handy? Just dismiss the picker and the square ticks anyway. Tap a done square to clear it. Complete a full row or column — then you're free to head home. 🏡",
    rulesPrint:
      "Tick a square each time you spot one of these on your walk. Complete a full row or column — then you're free to head home. 🏡",
    winP: "🌿 Bingo! You can head home.",
    winSmall:
      "Fill in your steps below, then tap Share for a picture of your walk.",
    labelName: "Name",
    labelSteps: "Steps taken",
    notes: "Notes",
    btnNew: "New card",
    btnPrint: "Printable",
    btnExport: "Share",
    btnExportBusy: "Making…",
    statSteps: "Steps",
    statFound: "Found",
    walkOf: (name) => `${name}'s walk`,
    themeHead: "Theme",
    themeHint: "What kind of walk is this?",
    opinionLabel: "Imaginative prompts",
    opinionHint: "Off means only real, findable things",
    btnDone: "Done",
    addPhoto: "Add a photo",
    clearCell: "Clear this square",
    locale: "en-GB",
  },
  ru: {
    title: "Прогулочное Бинго",
    sub: "игра-поиск для прогулки",
    rulesHead: "Как играть",
    rulesBody:
      "Найди предметы на прогулке и нажми на клетку, чтобы сфотографировать находку или выбрать фото. Нет фото — просто закрой окно выбора, клетка отметится сама. Нажми на отмеченную клетку, чтобы очистить её. Заполни целый ряд или столбец — и можно возвращаться домой. 🏡",
    rulesPrint:
      "Отмечай клетку каждый раз, когда находишь что-то из списка. Заполни целый ряд или столбец — и можно возвращаться домой. 🏡",
    winP: "🌿 Бинго! Можно идти домой.",
    winSmall:
      "Запиши шаги ниже и нажми «Поделиться» — получится картинка о прогулке.",
    labelName: "Имя",
    labelSteps: "Шагов пройдено",
    notes: "Заметки",
    btnNew: "Новая карточка",
    btnPrint: "Распечатать",
    btnExport: "Поделиться",
    btnExportBusy: "Готовим…",
    statSteps: "Шагов",
    statFound: "Найдено",
    walkOf: (name) => `Прогулка: ${name}`,
    themeHead: "Тема",
    themeHint: "Какое настроение у этой прогулки?",
    opinionLabel: "Задания на воображение",
    opinionHint: "Выключено — только реальные находки",
    btnDone: "Готово",
    addPhoto: "Добавить фото",
    clearCell: "Очистить клетку",
    locale: "ru-RU",
  },
};

let lang = "en";
let theme = DEFAULT_THEME;
let opinionItems = false; // vibe-based prompts are opt-in
let found = new Array(9).fill(false);
let currentItems = [];
// Snapshots live here as data URLs and nowhere else — no upload, no storage.
let photos = new Array(9).fill(null);

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
    btn.onclick = () => {
      setTheme(entry.id);
      sheet.close(); // show the new board straight away
    };
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
  document.getElementById("t-rules-print").textContent = t.rulesPrint;
  document.getElementById("t-win-p").textContent = t.winP;
  document.getElementById("t-win-small").textContent = t.winSmall;
  document.getElementById("t-label-name").textContent = t.labelName;
  document.getElementById("t-label-steps").textContent = t.labelSteps;
  document.getElementById("t-notes").textContent = t.notes;
  document.getElementById("t-btn-new").textContent = t.btnNew;
  document.getElementById("t-btn-print").textContent = t.btnPrint;
  document.getElementById("t-btn-export").textContent = t.btnExport;
  document.getElementById("t-btn-done").textContent = t.btnDone;
  document.getElementById("t-theme-head").textContent = t.themeHead;
  document.getElementById("t-theme-hint").textContent = t.themeHint;
  document.getElementById("t-opinion-label").textContent = t.opinionLabel;
  document.getElementById("t-opinion-hint").textContent = t.opinionHint;
  document.title = t.title + " 🌿";

  const active = getTheme(theme);
  document.documentElement.style.setProperty("--h", active.hue ?? 128);
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

/* ── Sheet: theme picker + how to play ─────────────────────────── */
const sheet = document.getElementById("sheet");

function openSheet(sectionId) {
  sheet.showModal();
  const section = sectionId && document.getElementById(sectionId);
  if (section) section.scrollIntoView({ block: "start", behavior: "instant" });
}

document
  .getElementById("themeChip")
  .addEventListener("click", () => openSheet("sec-theme"));
document
  .getElementById("infoBtn")
  .addEventListener("click", () => openSheet("sec-rules"));
document
  .getElementById("t-btn-done")
  .addEventListener("click", () => sheet.close());

// tap the dimmed backdrop to dismiss
sheet.addEventListener("click", (e) => {
  if (e.target === sheet) sheet.close();
});

document.getElementById("scrollHint").addEventListener("click", () => {
  document.getElementById("below").scrollIntoView({ behavior: "smooth" });
});

/* ── Photos: read, shrink and keep in memory only ───────────────── */
const MAX_EDGE = 720; // plenty for a 1/3-of-a-board tile
const photoInput = document.getElementById("photoInput");
let photoTarget = null; // index awaiting a file
let photoHandled = false; // a file actually came back

async function loadBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // older engines: let an <img> decode it instead
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function fileToDataUrl(file) {
  const src = await loadBitmap(file);
  const w = src.width || src.naturalWidth;
  const h = src.height || src.naturalHeight;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(src, 0, 0, canvas.width, canvas.height);
  if (src.close) src.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];
  const i = photoTarget;
  photoInput.value = ""; // so picking the same file twice still fires
  photoTarget = null;
  if (!file || i === null) return;
  photoHandled = true;

  found[i] = true; // a photo is proof you found it
  try {
    photos[i] = await fileToDataUrl(file);
  } catch {
    /* unreadable file — the tick stands on its own */
  }
  render();
});

/* Browsers give no dependable "picker cancelled" signal, so when focus comes
   back with no file in hand we read the tap as a plain tick. */
function onPickerClosed() {
  setTimeout(() => {
    if (photoHandled || photoTarget === null) return;
    const i = photoTarget;
    photoTarget = null;
    found[i] = true;
    render();
  }, 500);
}

function pickPhoto(i) {
  photoTarget = i;
  photoHandled = false;
  window.addEventListener("focus", onPickerClosed, { once: true });
  photoInput.click();
}

function render() {
  const grid = document.getElementById("grid");
  const banner = document.getElementById("winBanner");
  const win = checkWin();
  const t = LANG[lang];

  grid.innerHTML = "";
  currentItems.forEach((item, i) => {
    const cell = document.createElement("div");
    cell.className =
      "cell" +
      (found[i] ? " found" : "") +
      (photos[i] ? " has-photo" : "") +
      (win && win.includes(i) ? " winner" : "");

    if (photos[i]) {
      const img = document.createElement("img");
      img.className = "cell-photo";
      img.src = photos[i];
      img.alt = item;
      cell.appendChild(img);
    }

    const label = document.createElement("span");
    label.className = "cell-label";
    label.textContent = item;
    cell.appendChild(label);

    cell.title = found[i] ? t.clearCell : t.addPhoto;

    // Tapping an open tile asks for a picture; tapping a done one clears it.
    cell.onclick = () => {
      if (found[i]) {
        found[i] = false;
        photos[i] = null;
        render();
      } else {
        pickPhoto(i);
      }
    };
    grid.appendChild(cell);
  });

  // The banner sits right under the grid, so no scrolling is needed.
  banner.classList.toggle("show", Boolean(win));

  // A won card is worth sharing — and "New card" stops being the main move.
  document.getElementById("t-btn-export").hidden = !win;
  document.getElementById("t-btn-new").classList.toggle("primary", !win);
}

function newCard() {
  const pool = itemsForTheme(theme, POOL, { opinionItems });
  currentItems = shuffle(pool)
    .slice(0, 9)
    .map((item) => item[lang]);
  found = new Array(9).fill(false);
  photos = new Array(9).fill(null);
  document
    .querySelectorAll(".field-line, .note-line")
    .forEach((el) => (el.value = ""));
  render();
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});

const opinionToggle = document.getElementById("opinionToggle");
opinionToggle.checked = opinionItems;
opinionToggle.addEventListener("change", () => {
  opinionItems = opinionToggle.checked;
  newCard();
});

document.getElementById("t-btn-new").addEventListener("click", newCard);

/* ── Printable: the plain paper card, blank and fillable ───────────
   The print stylesheet drops the photos and the ticks on its own, so
   this is simply the browser's print dialog. */
document.getElementById("t-btn-print").addEventListener("click", () =>
  window.print(),
);

/* ── Share: the finished walk baked into one story-sized picture ─── */
async function buildShareData() {
  const t = LANG[lang];
  const active = getTheme(theme);
  const name = document.getElementById("f-name").value.trim();
  const steps = document.getElementById("f-steps").value.trim();

  // Photos are data URLs already, so decoding them is instant and offline.
  const images = await Promise.all(
    photos.map((src) => (src ? WalkBingoShare.loadImage(src) : null)),
  );

  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const tally = found.filter(Boolean).length;

  // Group the steps the way the locale does — 8412 reads better as 8,412.
  const stepCount = Number(steps.replace(/\s/g, ""));
  const stepsValue =
    steps && Number.isFinite(stepCount)
      ? stepCount.toLocaleString(t.locale)
      : steps;

  // The headline number is the walk itself when it was counted, the score
  // otherwise; whatever is left ranges right beside it.
  const stats = steps
    ? [
        { label: t.statSteps, value: stepsValue },
        { label: t.statFound, value: `${tally}/9`, accent: true },
      ]
    : [{ label: t.statFound, value: `${tally}/9`, accent: true }];

  return {
    hue: active.hue ?? 128,
    mark: active.emoji,
    brand: t.title,
    title: name ? t.walkOf(name) : active.name[lang],
    subtitle: name
      ? `${active.name[lang]} · ${active.tagline[lang]}`
      : active.tagline[lang],
    dateShort: now.toLocaleDateString(t.locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
    tiles: currentItems.map((label, i) => ({
      label,
      found: found[i],
      photo: images[i],
    })),
    stats,
    notes: document.getElementById("f-notes").value.trim(),
    filename: `walk-bingo-${iso}.png`,
  };
}

const exportBtn = document.getElementById("t-btn-export");
exportBtn.addEventListener("click", async () => {
  const t = LANG[lang];
  exportBtn.disabled = true;
  exportBtn.textContent = t.btnExportBusy;
  try {
    await WalkBingoShare.shareCard(await buildShareData());
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = t.btnExport;
  }
});

applyLang();
newCard();
