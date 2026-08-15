// ── Layer 1: Theme (the player's intention) ───────────────────────────────────
const WalkBingoThemes = (() => {
const THEMES = [
  {
    id: "forest",
    hue: 142,
    emoji: "🌲",
    name: { en: "Forest", ru: "Лес" },
    tagline: { en: "Nature observation", ru: "Наблюдение за природой" },
  },
  {
    id: "city",
    hue: 225,
    emoji: "🏙️",
    name: { en: "City", ru: "Город" },
    tagline: { en: "Urban exploration", ru: "Городские открытия" },
  },
  {
    id: "beach",
    hue: 195,
    emoji: "🏖️",
    name: { en: "Beach", ru: "Пляж" },
    tagline: { en: "Coastal discoveries", ru: "Прибрежные находки" },
  },
  {
    id: "wildlife",
    hue: 32,
    emoji: "🦋",
    name: { en: "Wildlife", ru: "Дикая природа" },
    tagline: { en: "Animals & plants", ru: "Животные и растения" },
  },
  {
    id: "architecture",
    hue: 255,
    emoji: "🏛️",
    name: { en: "Architecture", ru: "Архитектура" },
    tagline: { en: "Buildings & design", ru: "Здания и дизайн" },
  },
  {
    id: "tiny-details",
    hue: 275,
    emoji: "🔍",
    name: { en: "Tiny Details", ru: "Мелочи" },
    tagline: { en: "Close observation", ru: "Внимательный взгляд" },
  },
  {
    id: "photography",
    hue: 210,
    emoji: "📷",
    name: { en: "Photography Challenge", ru: "Фото-челлендж" },
    tagline: {
      en: "Photo-worthy finds",
      ru: "Кадры, которыми хочется поделиться",
    },
  },
  {
    id: "history",
    hue: 28,
    emoji: "⏳",
    name: { en: "History & Time", ru: "История и время" },
    tagline: { en: "Storytelling & age", ru: "Истории и следы времени" },
  },
  {
    id: "hidden",
    hue: 268,
    emoji: "🗝️",
    name: { en: "Hidden Places", ru: "Скрытые места" },
    tagline: { en: "Exploration", ru: "Исследование" },
  },
  {
    id: "color-hunt",
    hue: 330,
    emoji: "🎨",
    name: { en: "Color Hunt", ru: "Охота за цветом" },
    tagline: { en: "Visual scanning", ru: "Поиск по цвету" },
  },
  {
    id: "main-character",
    hue: 45,
    emoji: "✨",
    name: { en: "Main Character", ru: "Главный герой" },
    tagline: { en: "Romanticized wandering", ru: "Романтичная прогулка" },
  },
  {
    id: "cozy",
    hue: 18,
    emoji: "☕",
    name: { en: "Cozy", ru: "Уют" },
    tagline: { en: "Comfort & atmosphere", ru: "Комфорт и атмосфера" },
  },
];

const DEFAULT_THEME = "forest";

// Index ranges of the commented blocks in items.js — keep in sync when editing the pool.
const SECTIONS = [
  { start: 0, end: 153, id: "concrete" },
  { start: 153, end: 188, id: "favorite" },
  { start: 188, end: 275, id: "playful" },
  { start: 275, end: 299, id: "subjective" },
  { start: 299, end: 329, id: "abstract" },
  { start: 329, end: Infinity, id: "beach" },
];

/* ── Objectivity ──────────────────────────────────────────────────────────────
   Some prompts ask for a judgement call ("a place that feels magical") rather
   than a thing you can point at. Whole sections are opinion by construction;
   inside the playful section it comes down to wording, so we look for the
   vocabulary of opinion: looks/feels/seems, would, your, and vibe adjectives. */
const OPINION_SECTIONS = new Set(["favorite", "subjective", "abstract"]);

const OPINION_PATTERN =
  /\b(your|looks?|feels?|seems?|resembles|represents|symboli\w+|would|deserves|worthy|worth|questionable|unexpected|unusual|strange|mysterious|surprises|surprising|perfectly|imperfect|oddly|definitely|clearly|excellent|character|personality|inconvenient|dramatic|unnecessary|recognizable|impression|magical|peaceful|hidden|nobody|accidentally|obvious)\b|\b(too many|almost no|better days|best life|working hard|on duty|steals the scene|stands out|blends in|losing the argument|raises more questions|by accident|some players|never notice\w*|makes you)\b/i;

const PATTERNS = {
  forest:
    /\b(tree|moss|mushroom|pine|log|stump|leaf|clover|dandelion|berry|branch|ivy|creek|pond|lily|flower|garden|weed|scarecrow|birdhouse|compost|hammock|swing|root|trunk|fern|canopy|woodland)\b/i,
  city: /\b(taxi|hydrant|telephone|street|traffic|cone|crane|dumpster|escape|vending|license|sidewalk|pavement|lamp|graffiti|mural|cart|mailbox|vehicle|car|tesla|volvo|motorcycle|sticker|sign|construction|satellite|thermostat|wire|supermarket|exclamation|urban)\b/i,
  beach:
    /\b(water|puddle|reflection|creek|pond|lily|fountain|bridge|footbridge|heron|wet|rain|beach|coast|shore|shell|seagull|drift|dock|pier|boat|wave|sand|tide|harbor|marina|sail|buoy|pebble|seashell|mooring|coastal|dinghy)\b/i,
  wildlife:
    /\b(crow|horse|heron|cat|dog|butterfly|bumblebee|squirrel|snail|beetle|caterpillar|dragonfly|moth|wasp|anthill|spider|millipede|earthworm|feather|mushroom|flower|tree|berry|nest|web|bird|insect|slug|animal|plant|wild|gnome on duty)\b/i,
  architecture:
    /\b(building|door|window|chimney|roof|fence|wall|tower|church|statue|staircase|tunnel|bridge|balcony|porch|cobblestone|brick|slate|clock|gate|barn|tile|grate|driveway|path|belfry|facade|spire|eave|fire escape)\b/i,
  "tiny-details":
    /\b(tiny|small|button|coin|cap|earring|key|ticket|sticker|note|chalk|handprint|crack|pattern|palindrome|single|less than|millipede|slug|trail|holes|seed|ant|speck|miniature|oddly small|very tiny)\b/i,
  photography:
    /\b(reflection|shadow|photograph|sunset|album|movie scene|worthy|dramatic|steals|view|cloud|puddle|scenic|picture|frame|silhouette|mural|street art|statue|fountain|balcony|flamingo|chalk drawing|painted|spider web|butterfly|nest|flower|church tower|graffiti|flag flying|ivy)\b/i,
  history:
    /\b(older|ancient|history|story|church|weather vane|cobblestone|rusty|vintage|wrong time|photograph|padlock|past|time|rings visible|abandoned|torn|decorative|never moves|20 years|some players|worn|decades)\b/i,
  hidden:
    /\b(hidden|secret|tucked|crack|behind|unusual|never noticed|forgotten|mysterious|nowhere|unexpected|accident|nobody|curious|shortcut|revisit|never choose|raises more questions|explore|tunnel|alley|padlock|key without|slightly open|fire escape|under an eave|courtyard|dead end|anthill|hole in it|caught in)\b/i,
  "color-hunt":
    /\b(red|yellow|green|blue|pink|purple|orange|white|black|brown|gray|grey|gold|silver|bright|colorful|striped|polka|color theme)\b/i,
  "main-character":
    /\b(favorite|tourist|first date|movie|album|personality|adventure|dramatic|would bring|would choose|would never|deserves|feel|magical|character|imagine|return|smile|photographed|whimsical|playful)\b/i,
  cozy:
    /\b(peaceful|quiet|hammock|porch|rocking|wind chime|wreath|cat sitting|book|cozy|slow down|first date|home|gnome|garden|read a|sunset|atmosphere|smoke|comfort|gentle|warm|bench|picnic|swing|birdhouse|bird bath|blanket|candle|lantern|bakery|caf[eé]|coffee|flower pot|house plant|balcony with flowers|chimney|curtain|black cat|tiny dog|ceramic pot)\b/i,
};

const SECTION_THEMES = {
  favorite: ["main-character"],
  playful: ["main-character"],
  subjective: ["main-character", "hidden", "cozy", "photography"],
  abstract: ["main-character", "photography", "tiny-details"],
};

function sectionForIndex(index) {
  for (const section of SECTIONS) {
    if (index >= section.start && index < section.end) return section.id;
  }
  return "concrete";
}

function themesForItem(en, index) {
  const themes = new Set();
  const section = sectionForIndex(index);

  for (const [themeId, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(en)) themes.add(themeId);
  }

  for (const themeId of SECTION_THEMES[section] || []) {
    themes.add(themeId);
  }

  if (themes.size === 0) themes.add("main-character");

  return themes;
}

/** True for prompts that ask for an opinion rather than a thing you can point at. */
function isOpinionItem(en, index) {
  return (
    OPINION_SECTIONS.has(sectionForIndex(index)) || OPINION_PATTERN.test(en)
  );
}

/**
 * Return pool entries that fit the chosen walk theme (falls back if pool is small).
 * With opinionItems off, the fallback stays inside the concrete set — never
 * hand back an opinion prompt to someone who switched them off.
 */
function itemsForTheme(themeId, pool, { opinionItems = true } = {}) {
  const allowed = pool
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => opinionItems || !isOpinionItem(item.en, index));

  const matched = allowed.filter(({ item, index }) =>
    themesForItem(item.en, index).has(themeId),
  );

  return (matched.length >= 9 ? matched : allowed).map(({ item }) => item);
}

function getTheme(themeId) {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}

return { THEMES, DEFAULT_THEME, itemsForTheme, isOpinionItem, getTheme };
})();
