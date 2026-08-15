// ── Tagging rules (shared with scripts/build-tagged-items.mjs) ────────────────
const WalkBingoTagger = (() => {
  const SECTIONS = [
    { start: 0, end: 153, id: "concrete", difficulty: "easy" },
    { start: 153, end: 188, id: "favorite", difficulty: "medium" },
    { start: 188, end: 275, id: "playful", difficulty: "medium" },
    { start: 275, end: 299, id: "subjective", difficulty: "medium" },
    { start: 299, end: 329, id: "abstract", difficulty: "hard" },
    { start: 329, end: 335, id: "beach", difficulty: "easy" },
    { start: 335, end: 9999, id: "people", difficulty: "medium" },
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
    people:
      /\b(person|people|someone(?!'s)|somebody|stranger|friend|companion|couple|child|parent|crowd|queue|group|jogger|musician|worker|portrait|selfie|hands|laugh|conversation|dancing|walking a dog|street musician)\b/i,
    cozy:
      /\b(peaceful|quiet|hammock|porch|rocking|wind chime|wreath|cat sitting|book|cozy|slow down|first date|home|gnome|garden|read a|sunset|atmosphere|smoke|comfort|gentle|warm)\b/i,
  };

  const SECTION_THEMES = {
    favorite: ["main-character"],
    playful: ["main-character"],
    subjective: ["main-character", "hidden", "cozy", "photography"],
    abstract: ["main-character", "photography", "tiny-details"],
    beach: ["beach"],
    people: ["people", "city", "photography", "main-character"],
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

  return { tagItem };
})();
