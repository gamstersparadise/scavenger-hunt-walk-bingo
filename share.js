/* ══════════════════════════════════════════════════════════════════
   Share card — renders the finished walk as a 1080×1920 story image.

   This is the *souvenir*, the opposite of the printable: it keeps the
   photos, the ticks and the write-in fields, and bakes them into one
   picture you can drop straight into a story. Nothing leaves the
   device — the canvas is built locally and handed to the share sheet
   (or a download) as a blob.

   Layout: one glass panel floating on the warm mesh. Eyebrow row,
   oversized title, the board, then the numbers and the note. Each
   tile carries its prompt on a small white chip that overhangs the
   picture, so a caption never fights the photo underneath it.
   ══════════════════════════════════════════════════════════════════ */

const WalkBingoShare = (() => {
  const W = 1080;
  const H = 1920; // 9:16 — the story frame

  const MARGIN = 44; // backdrop showing around the panel
  const PANEL_PAD = 56;
  const INNER_X = MARGIN + PANEL_PAD;
  const INNER_W = W - INNER_X * 2;

  const FONT = `-apple-system, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif`;
  const MONO = `ui-monospace, "SF Mono", SFMono-Regular, Menlo, "Roboto Mono", monospace`;
  const font = (weight, size) => `${weight} ${size}px ${FONT}`;
  const mono = (weight, size) => `${weight} ${size}px ${MONO}`;

  // Our palette, straight off the app's :root.
  const PAPER_HI = "#fffaf1";
  const INK_2 = "rgba(88,60,42,0.78)";
  const INK_3 = "rgba(90,62,44,0.52)";
  const accent = (h) => `hsl(${h} 72% 38%)`;
  const accentDeep = (h) => `hsl(${h} 64% 19%)`;

  /* ── little canvas helpers ─────────────────────────────────────── */

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      // older engines
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  function shadow(ctx, blur, y, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = y;
  }

  function noShadow(ctx) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  /* ── letter-spacing ────────────────────────────────────────────────
     The eyebrow and stat labels are tracked wide, the title tracked
     tight. ctx.letterSpacing is recent; where it is missing we place
     the glyphs by hand, so both paths measure the same way. */

  const NATIVE_TRACKING = (() => {
    try {
      const probe = document.createElement("canvas").getContext("2d");
      probe.letterSpacing = "3px";
      return probe.letterSpacing === "3px";
    } catch {
      return false;
    }
  })();

  function trackedWidth(ctx, text, ls) {
    if (!ls) return ctx.measureText(text).width;
    let w = 0;
    for (const ch of text) w += ctx.measureText(ch).width + ls;
    return w - ls;
  }

  /** Draw `text` with tracking, aligned left/center/right around `x`. */
  function fillTracked(ctx, text, x, y, ls, align = "left") {
    const prev = ctx.textAlign;
    if (!ls) {
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      ctx.textAlign = prev;
      return;
    }
    const w = trackedWidth(ctx, text, ls);
    const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    ctx.textAlign = "left";
    if (NATIVE_TRACKING) {
      ctx.letterSpacing = `${ls}px`;
      ctx.fillText(text, left, y);
      ctx.letterSpacing = "0px";
    } else {
      let cx = left;
      for (const ch of text) {
        ctx.fillText(ch, cx, y);
        cx += ctx.measureText(ch).width + ls;
      }
    }
    ctx.textAlign = prev;
  }

  /* Fill the box with the image, cropping the overflow — object-fit: cover. */
  function drawCover(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  /** Word-wrap to at most `maxLines`, ellipsising the last one. */
  function wrap(ctx, text, maxWidth, maxLines, ls = 0) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    let clipped = false;

    for (let i = 0; i < words.length; i++) {
      const next = line ? line + " " + words[i] : words[i];
      if (trackedWidth(ctx, next, ls) <= maxWidth || !line) {
        line = next;
        continue;
      }
      if (lines.length === maxLines - 1) {
        clipped = true; // no room left; the rest is dropped
        break;
      }
      lines.push(line);
      line = words[i];
    }
    if (line) lines.push(line);

    // Trim the last line until the "…" fits beside it.
    const last = lines.length - 1;
    if (last >= 0 && (clipped || trackedWidth(ctx, lines[last], ls) > maxWidth)) {
      let text = lines[last];
      while (
        text.length > 1 &&
        trackedWidth(ctx, text.trimEnd() + "…", ls) > maxWidth
      ) {
        text = text.slice(0, -1);
      }
      lines[last] = text.trimEnd() + "…";
    }
    return lines;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /* ── the picture itself ────────────────────────────────────────── */

  function paintBackdrop(ctx, h) {
    // base wash
    const base = ctx.createLinearGradient(0, 0, W * 0.4, H);
    base.addColorStop(0, "#fffaf0");
    base.addColorStop(0.55, `hsl(${h} 62% 93%)`);
    base.addColorStop(1, "#fdf1df");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // The same mesh of colour the app floats its glass on: two blobs on the
    // theme hue, gold and peach pinned so the souvenir is warm on every theme.
    const blobs = [
      [W * 0.1, H * 0.06, 780, h, 82, 78, 0.58],
      [W * 0.95, H * 0.14, 740, 38, 96, 78, 0.6],
      [W * 0.82, H * 0.66, 900, h + 30, 82, 80, 0.5],
      [W * 0.06, H * 0.86, 840, 14, 94, 82, 0.56],
    ];
    for (const [x, y, r, bh, s, l, a] of blobs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsl(${bh} ${s}% ${l}% / ${a})`);
      // Fade to the *same* colour at zero alpha. Canvas reads "transparent"
      // as transparent black and interpolates through it, which greys the
      // whole wash out.
      g.addColorStop(1, `hsl(${bh} ${s}% ${l}% / 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // A warm vignette, so the pale panel has an edge to sit against.
    const vig = ctx.createRadialGradient(
      W / 2,
      H * 0.46,
      H * 0.24,
      W / 2,
      H * 0.5,
      H * 0.8,
    );
    vig.addColorStop(0, "rgba(96,58,32,0)");
    vig.addColorStop(1, "rgba(96,58,32,0.22)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /** The prompt, set across the foot of its tile. Called inside the clip. */
  function drawLabel(ctx, x, y, size, label, dark) {
    const pad = 18;
    ctx.font = font(600, 25);
    const lines = wrap(ctx, label, size - pad * 2, 2);
    const lh = 31;

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    if (dark) {
      // White over a picture or the accent ramp — the shadow keeps it off
      // whatever is underneath.
      ctx.fillStyle = "#fff";
      shadow(ctx, 12, 2, "rgba(0,0,0,0.6)");
    } else {
      ctx.fillStyle = INK_2;
    }
    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        x + size / 2,
        y + size - pad - (lines.length - 1 - i) * lh,
      );
    });
    noShadow(ctx);
  }

  function drawTile(ctx, x, y, size, tile, index, h) {
    const r = 22;

    ctx.save();
    shadow(ctx, 30, 12, "rgba(96,58,32,0.22)");
    ctx.fillStyle = tile.photo || tile.found ? PAPER_HI : "rgba(253,244,230,0.72)";
    rr(ctx, x, y, size, size, r);
    ctx.fill();
    ctx.restore();

    ctx.save();
    rr(ctx, x, y, size, size, r);
    ctx.clip();

    if (tile.photo) {
      drawCover(ctx, tile.photo, x, y, size, size);

      // scrim, so the caption stays readable over any picture
      const scrim = ctx.createLinearGradient(0, y + size * 0.42, 0, y + size);
      scrim.addColorStop(0, "rgba(0,0,0,0)");
      scrim.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = scrim;
      ctx.fillRect(x, y + size * 0.42, size, size * 0.58);

      drawLabel(ctx, x, y, size, tile.label, true);
    } else if (tile.found) {
      // Ticked, but no picture: the accent ramp, as on the live board.
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, `hsl(${h} 88% 52%)`);
      g.addColorStop(1, `hsl(${h} 64% 19%)`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, size, size);

      const sweep = ctx.createLinearGradient(x, y, x + size * 0.7, y + size);
      sweep.addColorStop(0, "rgba(255,252,245,0.38)");
      sweep.addColorStop(0.45, "rgba(255,252,245,0)");
      ctx.fillStyle = sweep;
      ctx.fillRect(x, y, size, size);

      ctx.font = font(600, 68);
      ctx.fillStyle = "rgba(255,250,241,0.92)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✓", x + size / 2, y + size * 0.36);

      drawLabel(ctx, x, y, size, tile.label, true);
    } else {
      // Missed: the number, the way the empty slots read on the board.
      ctx.font = mono(500, 30);
      ctx.fillStyle = "rgba(90,62,44,0.4)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), x + size / 2, y + size * 0.34);

      drawLabel(ctx, x, y, size, tile.label, false);
    }

    ctx.restore();

    // hairline, to echo the glass edge
    ctx.save();
    rr(ctx, x + 1, y + 1, size - 2, size - 2, r - 1);
    ctx.strokeStyle = "rgba(255,252,246,0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  /* ── the subtitle: where, then what kind of walk ───────────────────
     A map pin, drawn rather than typed — the emoji version lands in
     whatever colour the platform feels like, which fights a card built
     entirely out of one hue. */

  function drawPin(ctx, x, y, r, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = "round";

    // The head: an arc across the top, closed by two lines down to the tip.
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.86, Math.PI * 0.14);
    ctx.lineTo(x, y + r * 2.15);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * One line under the title: the place set in the title's ink, then the
   * flavour text in the body ink. Either half may be absent.
   */
  function drawSubtitle(ctx, x, y, maxW, place, tail, h) {
    const size = 30;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    if (!place) {
      ctx.font = font(500, size);
      ctx.fillStyle = INK_2;
      ctx.fillText(wrap(ctx, tail, maxW, 1)[0] || "", x, y);
      return;
    }

    const r = 8.5;
    const pinW = r * 2 + 14;
    drawPin(ctx, x + r + 1, y - 3, r, accent(h));

    const left = x + pinW;

    ctx.font = font(700, size);
    const text = wrap(ctx, place, maxW - pinW, 1)[0] || "";
    ctx.fillStyle = accentDeep(h);
    ctx.fillText(text, left, y);

    // The flavour follows only if it fits whole. Half a word behind an
    // ellipsis says nothing, and the place is the part worth keeping.
    if (!tail) return;
    const tailX = left + ctx.measureText(text).width;
    const sep = " · ";

    ctx.font = font(500, size);
    if (ctx.measureText(sep + tail).width > x + maxW - tailX) return;

    ctx.fillStyle = INK_3;
    ctx.fillText(sep, tailX, y);
    ctx.fillStyle = INK_2;
    ctx.fillText(tail, tailX + ctx.measureText(sep).width, y);
  }

  /* The display line: set as large as the measure allows, upper case and
     tracked in, so it reads as a masthead rather than a sentence. */
  const TITLE_TRACK = -0.03;

  function layOutTitle(ctx, raw, maxW) {
    const text = String(raw).toLocaleUpperCase();
    let size = 132;
    for (; size > 64; size -= 2) {
      ctx.font = font(800, size);
      if (trackedWidth(ctx, text, size * TITLE_TRACK) <= maxW) break;
    }
    ctx.font = font(800, size);
    let lines = [text];
    if (trackedWidth(ctx, text, size * TITLE_TRACK) > maxW) {
      // Too long for one line even at the floor — break it and step down.
      size = 76;
      ctx.font = font(800, size);
      lines = wrap(ctx, text, maxW, 2, size * TITLE_TRACK);
    }
    return { size, lines, ls: size * TITLE_TRACK };
  }

  /**
   * Paint the whole card.
   * @param {object} data see buildShareData() in app.js
   * @returns {Promise<HTMLCanvasElement>}
   */
  async function renderCard(data) {
    const h = data.hue;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    paintBackdrop(ctx, h);

    /* ── measure, so the panel can be sized to its contents ──────── */
    const gap = 20;
    const tile = Math.floor((INNER_W - gap * 2) / 3);
    const gridH = tile * 3 + gap * 2;

    const title = layOutTitle(ctx, data.title, INNER_W);
    const titleH = title.lines.length * title.size * 0.96;

    ctx.font = font(400, 30);
    const noteLines = [];
    for (const para of (data.notes || "").split(/\n+/)) {
      if (noteLines.length >= 3) break;
      if (!para.trim()) continue;
      noteLines.push(...wrap(ctx, para, INNER_W, 3 - noteLines.length));
    }

    const statsH = 118;
    const notesH = noteLines.length ? 66 + noteLines.length * 44 : 0;
    const panelH =
      PANEL_PAD * 2 + 34 + 44 + titleH + 22 + 36 + 52 + gridH + 62 + statsH + notesH;
    const panelY = Math.max(MARGIN + 20, (H - panelH) / 2);

    /* ── the panel ───────────────────────────────────────────────── */
    ctx.save();
    shadow(ctx, 70, 26, "rgba(96,58,32,0.3)");
    ctx.fillStyle = "rgba(255,251,244,0.86)";
    rr(ctx, MARGIN, panelY, W - MARGIN * 2, panelH, 46);
    ctx.fill();
    ctx.restore();

    ctx.save();
    rr(ctx, MARGIN + 1, panelY + 1, W - MARGIN * 2 - 2, panelH - 2, 45);
    ctx.strokeStyle = "rgba(255,252,246,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    let cursor = panelY + PANEL_PAD;

    /* ── eyebrow: mark + brand on the left, the day on the right ─── */
    ctx.textBaseline = "middle";
    const eyeY = cursor + 17;

    ctx.font = font(400, 26);
    ctx.textAlign = "left";
    ctx.fillText(data.mark, INNER_X, eyeY + 1);

    ctx.font = mono(600, 23);
    ctx.fillStyle = INK_2;
    fillTracked(ctx, data.brand.toUpperCase(), INNER_X + 44, eyeY, 4.6);

    ctx.fillStyle = INK_3;
    fillTracked(
      ctx,
      data.dateShort.toUpperCase(),
      INNER_X + INNER_W,
      eyeY,
      4.6,
      "right",
    );
    cursor += 34 + 44;

    /* ── title ───────────────────────────────────────────────────── */
    ctx.font = font(800, title.size);
    ctx.fillStyle = accentDeep(h);
    ctx.textBaseline = "alphabetic";
    title.lines.forEach((line, i) => {
      fillTracked(
        ctx,
        line,
        INNER_X,
        cursor + title.size * 0.76 + i * title.size * 0.96,
        title.ls,
      );
    });
    cursor += titleH + 22;

    /* ── subtitle ────────────────────────────────────────────────── */
    drawSubtitle(
      ctx,
      INNER_X,
      cursor + 18,
      INNER_W,
      data.place,
      // With a place in front, the long form crowds the line — the short
      // one (just the kind of walk) sits beside it instead.
      data.place ? data.subtitleShort : data.subtitle,
      h,
    );
    cursor += 36 + 52;

    /* ── the board ───────────────────────────────────────────────── */
    data.tiles.forEach((t, i) => {
      drawTile(
        ctx,
        INNER_X + (i % 3) * (tile + gap),
        cursor + Math.floor(i / 3) * (tile + gap),
        tile,
        t,
        i,
        h,
      );
    });
    cursor += gridH + 62;

    /* ── the numbers: one headline, the rest ranged right ────────── */
    const stats = data.stats.filter((s) => s.value);
    if (stats.length) {
      const [lead, ...rest] = stats;

      ctx.textBaseline = "alphabetic";
      ctx.font = mono(600, 22);
      ctx.fillStyle = INK_3;
      fillTracked(ctx, lead.label.toUpperCase(), INNER_X, cursor + 22, 4.2);

      ctx.font = font(800, 82);
      ctx.fillStyle = lead.accent ? accent(h) : accentDeep(h);
      fillTracked(ctx, lead.value, INNER_X, cursor + 108, -1.6);

      // Right to left, so the last stat pins to the panel's right edge.
      let right = INNER_X + INNER_W;
      for (let i = rest.length - 1; i >= 0; i--) {
        const s = rest[i];
        ctx.font = font(700, 46);
        const vw = trackedWidth(ctx, s.value, -0.6);
        ctx.fillStyle = s.accent ? accent(h) : accentDeep(h);
        fillTracked(ctx, s.value, right, cursor + 108, -0.6, "right");

        ctx.font = mono(600, 22);
        ctx.fillStyle = INK_3;
        const lw = trackedWidth(ctx, s.label.toUpperCase(), 4.2);
        fillTracked(ctx, s.label.toUpperCase(), right, cursor + 56, 4.2, "right");

        right -= Math.max(vw, lw) + 74;
      }
      cursor += statsH;
    }

    /* ── notes: one free-text field, under a hairline ────────────── */
    if (noteLines.length) {
      ctx.fillStyle = "rgba(90,62,44,0.2)";
      ctx.fillRect(INNER_X, cursor + 20, INNER_W, 1.5);

      ctx.font = font(400, 30);
      ctx.fillStyle = INK_2;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      noteLines.forEach((line, i) => {
        ctx.fillText(line, INNER_X, cursor + 66 + i * 44 + 22);
      });
    }

    noShadow(ctx);
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  /**
   * Render, then hand the image to the OS share sheet if there is one,
   * falling back to a plain download.
   */
  async function shareCard(data) {
    const canvas = await renderCard(data);
    const blob = await canvasToBlob(canvas);
    if (!blob) return;

    const file = new File([blob], data.filename, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: data.title });
        return;
      } catch (err) {
        // user dismissed the sheet — nothing left to do
        if (err && err.name === "AbortError") return;
        // anything else (share unsupported for files in practice): fall through
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { renderCard, shareCard, loadImage };
})();
