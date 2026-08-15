#!/usr/bin/env node
/**
 * One-off builder: reads legacy en/ru arrays from items.js and writes tagged ITEMS.
 * Run: node scripts/build-tagged-items.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "items.js"), "utf8");

function extractArray(lang) {
  const pattern =
    lang === "en"
      ? /en: \[(.*?)\n  \],\n  ru:/s
      : /ru: \[(.*?)\n  \],\n\};/s;
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not parse ${lang} array`);
  return [...match[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
  );
}

const en = extractArray("en");
const ru = extractArray("ru");
if (en.length !== ru.length) {
  throw new Error(`Count mismatch: ${en.length} en vs ${ru.length} ru`);
}

const SECTIONS = [
  { start: 0, end: 153, id: "concrete", difficulty: "easy" },
  { start: 153, end: 189, id: "favorite", difficulty: "medium" },
  { start: 189, end: 277, id: "playful", difficulty: "medium" },
  { start: 277, end: 301, id: "subjective", difficulty: "medium" },
  { start: 301, end: 333, id: "abstract", difficulty: "hard" },
  { start: 333, end: en.length, id: "beach", difficulty: "easy" },
];

const THEME_PATTERNS = {
  forest:
    /\b(tree|moss|mushroom|pine|log|stump|leaf|clover|dandelion|berry|branch|ivy|creek|pond|lily|flower|garden|weed|scarecrow|birdhouse|compost|hammock|swing|root|trunk|fern|woodland|driftwood)\b/i,
  city: /\b(taxi|hydrant|telephone|street|traffic|cone|crane|dumpster|escape|vending|license|sidewalk|pavement|lamp|graffiti|mural|cart|mailbox|vehicle|car|tesla|volvo|motorcycle|sticker|sign|construction|satellite|thermostat|wire|supermarket|exclamation|urban)\b/i,
  beach:
    /\b(water|puddle|reflection|creek|pond|lily|fountain|bridge|footbridge|heron|wet|rain|beach|coast|shore|shell|seagull|drift|dock|pier|boat|wave|sand|tide|harbor|marina|sail|buoy|pebble|seashell|mooring|coastal|dinghy)\b/i,
  wildlife:
    /\b(crow|horse|heron|cat|dog|butterfly|bumblebee|squirrel|snail|beetle|caterpillar|dragonfly|moth|wasp|anthill|spider|millipede|earthworm|feather|mushroom|flower|tree|berry|nest|web|bird|insect|slug|animal|plant|wild|scarecrow|birdhouse)\b/i,
  architecture:
    /\b(building|door|window|chimney|roof|fence|wall|tower|church|statue|staircase|tunnel|bridge|balcony|porch|cobblestone|brick|slate|clock|gate|barn|tile|grate|driveway|path|spire|eave|fire escape|pier|dock)\b/i,
  "tiny-details":
    /\b(tiny|small|button|coin|cap|earring|key|ticket|sticker|note|chalk|handprint|crack|pattern|palindrome|single|less than|millipede|slug|trail|holes|seed|ant|speck|miniature|oddly small|very tiny|pebble|seashell)\b/i,
  photography:
    /\b(reflection|shadow|photograph|sunset|album|movie scene|worthy|dramatic|steals|view|cloud|puddle|scenic|picture|frame|silhouette)\b/i,
  history:
    /\b(older|ancient|history|story|church|weather vane|cobblestone|rusty|vintage|wrong time|photograph|padlock|past|time|rings visible|abandoned|torn|decorative|never moves|20 years|some players|worn|decades|mooring)\b/i,
  hidden:
    /\b(hidden|secret|tucked|crack|behind|unusual|never noticed|forgotten|mysterious|nowhere|unexpected|accident|nobody|curious|shortcut|revisit|never choose|raises more questions|explore)\b/i,
  "color-hunt":
    /\b(red|yellow|green|blue|pink|purple|orange|white|black|brown|gray|grey|gold|silver|bright|colorful|striped|polka|color theme)\b/i,
  "main-character":
    /\b(favorite|tourist|first date|movie|album|personality|adventure|dramatic|would bring|would choose|would never|deserves|feel|magical|character|imagine|return|smile|photographed|whimsical|playful)\b/i,
  cozy:
    /\b(peaceful|quiet|hammock|porch|rocking|wind chime|wreath|cat sitting|book|cozy|slow down|first date|home|gnome|garden|read a|sunset|atmosphere|smoke|comfort|gentle|warm)\b/i,
};

const SECTION_THEMES = {
  favorite: ["main-character"],
  playful: ["main-character"],
  subjective: ["main-character", "hidden", "cozy", "photography"],
  abstract: ["main-character", "photography", "tiny-details"],
  beach: ["beach"],
};

const SEASON_PATTERNS = {
  spring:
    /\b(flower|blossom|dandelion|nest|butterfly|bumblebee|clover|garden|bird|wreath|green)\b/i,
  summer:
    /\b(beach|hammock|boat|pier|dock|sun|seagull|coastal|dinghy|buoy|seashell|flag flying|bench facing water)\b/i,
  autumn:
    /\b(mushroom|pumpkin|leaf|fallen|log|stump|acorn|pine cone|berry|orange|crow|rain barrel|driftwood)\b/i,
  winter:
    /\b(smoke|chimney|wreath|wet cement|rain|puddle|bare|working hard|snow|frost|ice)\b/i,
};

const NATURE_PATTERN =
  /\b(tree|moss|mushroom|flower|bird|insect|animal|leaf|nest|feather|web|snail|beetle|pond|creek|log|stump|berry|garden|wild|nature|heron|crow|squirrel|driftwood|seagull|pebble|shell)\b/i;

function sectionForIndex(index) {
  for (const section of SECTIONS) {
    if (index >= section.start && index < section.end) return section;
  }
  return SECTIONS[0];
}

function tagItem(text, index) {
  const tags = new Set();
  const section = sectionForIndex(index);

  for (const [themeId, pattern] of Object.entries(THEME_PATTERNS)) {
    if (pattern.test(text)) tags.add(themeId);
  }
  for (const themeId of SECTION_THEMES[section.id] || []) {
    tags.add(themeId);
  }
  for (const [season, pattern] of Object.entries(SEASON_PATTERNS)) {
    if (pattern.test(text)) tags.add(season);
  }
  if (NATURE_PATTERN.test(text)) tags.add("nature");

  tags.add(section.difficulty);

  if (tags.size <= 1) tags.add("main-character");

  return [...tags].sort();
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const items = en.map((e, i) => ({
  text: { en: e, ru: ru[i] },
  tags: tagItem(e, i),
}));

const lines = [
  "// ── Tagged item pool ──────────────────────────────────────────────────────────",
  "// Each item carries tags; cards = filter(all active tags) → pick 9.",
  "const ITEMS = [",
];

for (const item of items) {
  const tagStr = item.tags.map((t) => `"${t}"`).join(", ");
  lines.push(
    `  { text: { en: "${esc(item.text.en)}", ru: "${esc(item.text.ru)}" }, tags: [${tagStr}] },`,
  );
}

lines.push("];", "");

fs.writeFileSync(path.join(root, "items.js"), lines.join("\n"));
console.log(`Wrote ${items.length} tagged items to items.js`);
