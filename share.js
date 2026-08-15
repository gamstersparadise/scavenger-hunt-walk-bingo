/* ══════════════════════════════════════════════════════════════════
   Share card — renders the finished walk as a 1080×1920 story image.

   This is the *souvenir*, the opposite of the printable: it keeps the
   photos, the ticks and the write-in fields, and bakes them into one
   picture you can drop straight into a story. Nothing leaves the
   device — the canvas is built locally and handed to the share sheet
   (or a download) as a blob.
   ══════════════════════════════════════════════════════════════════ */

const WalkBingoShare = (() => {
  const W = 1080;
  const H = 1920; // 9:16 — the story frame
  const PAD = 54;

  const FONT = `-apple-system, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif`;
  const font = (weight, size) => `${weight} ${size}px ${FONT}`;

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

  /* Word-wrap to at most `maxLines`, ellipsising the last one. */
  function wrap(ctx, text, maxWidth, maxLines) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    let clipped = false;

    for (let i = 0; i < words.length; i++) {
      const next = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(next).width <= maxWidth || !line) {
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
    if (last >= 0 && (clipped || ctx.measureText(lines[last]).width > maxWidth)) {
      let text = lines[last];
      while (
        text.length > 1 &&
        ctx.measureText(text.trimEnd() + "…").width > maxWidth
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
    base.addColorStop(0, `hsl(${h} 80% 96%)`);
    base.addColorStop(0.55, `hsl(${h + 18} 72% 92%)`);
    base.addColorStop(1, `hsl(${h - 30} 70% 90%)`);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // the same mesh of colour the app floats its glass on
    const blobs = [
      [W * 0.12, H * 0.06, 760, `hsl(${h} 88% 76% / 0.55)`],
      [W * 0.95, H * 0.14, 720, `hsl(${h + 55} 90% 78% / 0.5)`],
      [W * 0.82, H * 0.66, 900, `hsl(${h - 45} 88% 78% / 0.45)`],
      [W * 0.06, H * 0.86, 820, `hsl(${h + 20} 92% 82% / 0.5)`],
    ];
    for (const [x, y, r, color] of blobs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawTile(ctx, x, y, size, tile, h) {
    const r = 34;

    // Lift the tile off the backdrop before we clip to it. An untouched
    // square keeps the app's glass look — the mesh shows through it.
    ctx.save();
    shadow(ctx, 34, 12, "rgba(30,32,48,0.22)");
    ctx.fillStyle =
      tile.photo || tile.found ? "#fff" : "rgba(255,255,255,0.45)";
    rr(ctx, x, y, size, size, r);
    ctx.fill();
    ctx.restore();

    ctx.save();
    rr(ctx, x, y, size, size, r);
    ctx.clip();

    const pad = 20;
    const textWidth = size - pad * 2;

    if (tile.photo) {
      drawCover(ctx, tile.photo, x, y, size, size);

      // scrim so the caption stays readable over any picture
      const scrim = ctx.createLinearGradient(0, y + size * 0.4, 0, y + size);
      scrim.addColorStop(0, "rgba(0,0,0,0)");
      scrim.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = scrim;
      ctx.fillRect(x, y + size * 0.4, size, size * 0.6);

      ctx.font = font(600, 25);
      const lines = wrap(ctx, tile.label, textWidth, 2);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      shadow(ctx, 10, 1, "rgba(0,0,0,0.55)");
      lines.forEach((line, i) => {
        ctx.fillText(
          line,
          x + size / 2,
          y + size - pad - (lines.length - 1 - i) * 31,
        );
      });
      noShadow(ctx);
    } else if (tile.found) {
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, `hsl(${h} 70% 55%)`);
      g.addColorStop(1, `hsl(${h} 55% 30%)`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, size, size);

      // specular sweep, as on the live board
      const sweep = ctx.createLinearGradient(x, y, x + size * 0.7, y + size);
      sweep.addColorStop(0, "rgba(255,255,255,0.35)");
      sweep.addColorStop(0.45, "rgba(255,255,255,0)");
      ctx.fillStyle = sweep;
      ctx.fillRect(x, y, size, size);

      ctx.font = font(600, 26);
      const lines = wrap(ctx, tile.label, textWidth, 3);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        ctx.fillText(
          line,
          x + size / 2,
          y + size / 2 + 8 + (i - (lines.length - 1) / 2) * 34,
        );
      });

      ctx.font = font(700, 24);
      ctx.globalAlpha = 0.8;
      ctx.fillText("✓", x + size - 26, y + 30);
      ctx.globalAlpha = 1;
    } else {
      ctx.font = font(500, 26);
      const lines = wrap(ctx, tile.label, textWidth, 3);
      ctx.fillStyle = "rgba(28,28,30,0.5)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        ctx.fillText(
          line,
          x + size / 2,
          y + size / 2 + (i - (lines.length - 1) / 2) * 34,
        );
      });
    }

    ctx.restore();

    // hairline, to echo the glass edge
    ctx.save();
    rr(ctx, x + 1, y + 1, size - 2, size - 2, r - 1);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPill(ctx, cx, y, text, h) {
    ctx.font = font(700, 26);
    const tw = ctx.measureText(text).width;
    const w = tw + 62;
    const ph = 62;
    ctx.save();
    shadow(ctx, 24, 8, "rgba(30,32,48,0.16)");
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    rr(ctx, cx - w / 2, y, w, ph, ph / 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = `hsl(${h} 55% 30%)`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, y + ph / 2 + 1);
    return y + ph;
  }

  function drawStat(ctx, x, y, w, label, value, h) {
    const sh = 132;
    ctx.save();
    shadow(ctx, 26, 10, "rgba(30,32,48,0.16)");
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    rr(ctx, x, y, w, sh, 30);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(600, 24);
    ctx.fillStyle = "rgba(60,60,67,0.6)";
    ctx.fillText(label.toUpperCase(), x + w / 2, y + 44);

    ctx.font = font(700, 44);
    ctx.fillStyle = `hsl(${h} 55% 26%)`;
    const lines = wrap(ctx, value, w - 40, 1);
    ctx.fillText(lines[0] || "", x + w / 2, y + 92);
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

    /* ── header ──────────────────────────────────────────────── */
    let y = drawPill(ctx, W / 2, 108, data.brand.toUpperCase(), h);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(700, 72);
    ctx.fillStyle = `hsl(${h} 58% 24%)`;
    const titleLines = wrap(ctx, data.title, W - PAD * 2, 1);
    ctx.fillText(titleLines[0], W / 2, y + 86);

    ctx.font = font(500, 30);
    ctx.fillStyle = "rgba(60,60,67,0.62)";
    ctx.fillText(data.date, W / 2, y + 150);

    /* ── the board ───────────────────────────────────────────── */
    const gap = 22;
    const size = Math.floor((W - PAD * 2 - gap * 2) / 3);
    const gridTop = y + 216;

    data.tiles.forEach((tile, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      drawTile(
        ctx,
        PAD + col * (size + gap),
        gridTop + row * (size + gap),
        size,
        tile,
        h,
      );
    });

    let cursor = gridTop + size * 3 + gap * 2 + 54;

    /* ── the badge: what you actually got ────────────────────── */
    cursor = drawPill(ctx, W / 2, cursor, data.scoreline, h) + 44;

    /* ── write-in fields, only the ones filled in ────────────── */
    const stats = data.stats.filter((s) => s.value);
    if (stats.length) {
      const gapS = 20;
      const w = (W - PAD * 2 - gapS * (stats.length - 1)) / stats.length;
      stats.forEach((s, i) => {
        drawStat(ctx, PAD + i * (w + gapS), cursor, w, s.label, s.value, h);
      });
      cursor += 132 + 34;
    }

    /* ── notes: one free-text field, wrapped over at most 3 lines ─ */
    if (data.notes && data.notes.trim()) {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = font(400, 30);

      const inset = 30; // room for the accent rule down the left
      const lines = [];
      for (const para of data.notes.split(/\n+/)) {
        if (lines.length >= 3) break;
        if (!para.trim()) continue;
        lines.push(...wrap(ctx, para, W - PAD * 2 - inset, 3 - lines.length));
      }

      if (lines.length) {
        const lh = 44;
        const blockH = lines.length * lh;
        ctx.fillStyle = `hsl(${h} 60% 50% / 0.55)`;
        rr(ctx, PAD, cursor - 2, 5, blockH, 3);
        ctx.fill();

        ctx.fillStyle = "rgba(28,28,30,0.8)";
        lines.forEach((line, i) => {
          ctx.fillText(line, PAD + inset, cursor + lh * i + lh / 2 - 2);
        });
      }
    }

    /* ── footer ──────────────────────────────────────────────── */
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = font(500, 26);
    ctx.fillStyle = "rgba(60,60,67,0.5)";
    ctx.fillText(data.footer, W / 2, H - 74);

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
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
