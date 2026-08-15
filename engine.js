// ── Card generation: filter tagged items, pick 9 ─────────────────────────────
const WalkBingoEngine = (() => {
  /** Items matching every required tag (AND). */
  function filterByTags(items, requiredTags) {
    if (!requiredTags.length) return items;
    return items.filter((item) =>
      requiredTags.every((tag) => item.tags.includes(tag)),
    );
  }

  /**
   * Build a pool large enough for a card. Relaxes tags from the end if needed.
   * Example: ["forest", "winter", "easy"] → try all, then drop "easy", etc.
   */
  function poolForTags(items, requiredTags, minSize = 9) {
    for (let n = requiredTags.length; n > 0; n--) {
      const pool = filterByTags(items, requiredTags.slice(0, n));
      if (pool.length >= minSize) return pool;
    }
    return items;
  }

  return { filterByTags, poolForTags };
})();
