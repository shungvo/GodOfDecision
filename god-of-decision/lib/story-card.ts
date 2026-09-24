/**
 * The shareable picture.
 *
 * A reading is text on a purple screen, which is not a thing anyone
 * posts. This draws it as a 9:16 card that looks like the app it came
 * from, so what lands in a story is recognisably GOD rather than a
 * screenshot of a bottom sheet.
 *
 * Canvas rather than any of the html-to-image libraries. Those work by
 * inlining the DOM into an SVG `foreignObject`, and WebKit refuses to
 * rasterise one that references a cross-origin font — which is every
 * font next/font serves. Drawing it by hand is more code and no
 * surprises.
 */

/** What Instagram serves stories at. Anything smaller gets upscaled. */
const W = 1080;
const H = 1920;

/** Side margin. Generous: story UI eats the edges. */
const PAD = 96;

/*
 * Instagram's own chrome sits over a posted story: the poster's avatar
 * and name across the top, the reply bar across the bottom. Anything
 * drawn inside these bands is partly covered for every viewer, so the
 * brand starts below the first and the footer stops above the second.
 */
const SAFE_TOP = 210;
const SAFE_BOTTOM = 165;

const GOLD = "#fbbf24";
const INK = "#ffffff";

export type StoryCard =
    | {
          kind: "tarot";
          /** Vietnamese name — the headline. */
          name: string;
          nameEn: string;
          /** Roman numeral or suit glyph, as the app's card face shows. */
          symbol: string;
          keywords: string[];
          /** The reading. Trimmed to fit; null when there is none. */
          body: string | null;
          /** Small line above the card, e.g. "Thông điệp hôm nay". */
          eyebrow: string;
      }
    | {
          kind: "oracle";
          answer: string;
          /** Book reference, printed small. */
          answerId: string;
          body: string | null;
      };

/* ==============================================================
   PRIMITIVES
   ============================================================== */

/**
 * The font the app is actually using.
 *
 * next/font mangles the family name per build (`__Geist_e5bf1a`), so it
 * cannot be hard coded. Reading it off the body is how the canvas ends
 * up in the same typeface as the screen the reading was on.
 */
function fontFamily() {
    if (typeof document === "undefined") return "sans-serif";

    return (
        getComputedStyle(document.body).fontFamily || "system-ui, sans-serif"
    );
}

const font = (weight: number, size: number) =>
    `${weight} ${size}px ${fontFamily()}`;

function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        // Same-origin assets, so this only matters if the app is ever
        // served from a CDN — without it the canvas would taint and
        // toBlob would throw instead of returning a picture.
        image.crossOrigin = "anonymous";

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Cannot load ${src}`));
        image.src = src;
    });
}

/**
 * Draw text with tracking.
 *
 * `ctx.letterSpacing` only landed in Safari 17.4 and the brand lockup
 * is unrecognisable without it, so the glyphs are placed one at a
 * time. Only used on short strings.
 */
function trackedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    tracking: number,
) {
    const width =
        [...text].reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
        tracking * (text.length - 1);

    let cursor = ctx.textAlign === "center" ? x - width / 2 : x;

    const align = ctx.textAlign;
    ctx.textAlign = "left";

    for (const ch of text) {
        ctx.fillText(ch, cursor, y);
        cursor += ctx.measureText(ch).width + tracking;
    }

    ctx.textAlign = align;

    return width;
}

/** Break `text` into lines that fit `maxWidth`, at most `maxLines`. */
function wrap(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number,
) {
    const lines: string[] = [];

    /*
     * Set only when words are actually abandoned — never merely
     * because the last allowed line got filled.
     *
     * Deriving it from `lines.length === maxLines` instead put an
     * ellipsis on every text that happened to end exactly on its last
     * line: a two line card name came out as "Hoàng Hậu Tiền…", which
     * reads as a truncated name rather than a complete one.
     */
    let truncated = false;

    const push = (line: string) => {
        if (lines.length >= maxLines) {
            truncated = true;
            return false;
        }

        lines.push(line);

        return true;
    };

    // Paragraph breaks are meaningful in these readings, so they are
    // kept rather than collapsed into one run of prose.
    const paragraphs = text.split(/\n\s*\n/);

    for (let p = 0; p < paragraphs.length && !truncated; p += 1) {
        let line = "";

        for (const word of paragraphs[p].trim().split(/\s+/)) {
            const candidate = line ? `${line} ${word}` : word;

            if (ctx.measureText(candidate).width <= maxWidth) {
                line = candidate;
                continue;
            }

            if (line && !push(line)) break;

            line = word;
        }

        if (!truncated && line) push(line);
    }

    if (truncated && lines.length > 0) {
        // Ellipsis rather than a hard stop: a sentence that simply
        // ends mid-word reads as a rendering bug.
        let last = lines[lines.length - 1];

        while (
            last.length > 1 &&
            ctx.measureText(`${last}…`).width > maxWidth
        ) {
            last = last.slice(0, -1);
        }

        lines[lines.length - 1] = `${last.trimEnd()}…`;
    }

    return lines;
}

/* ==============================================================
   THE SCENE
   ============================================================== */

function paintBackground(ctx: CanvasRenderingContext2D) {
    // The app's own canvas gradient, in the same order and colours.
    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, "#3d1596");
    base.addColorStop(0.45, "#34117e");
    base.addColorStop(1, "#2b0d68");

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // The glow the app hangs off the top of every screen.
    const glow = ctx.createRadialGradient(W / 2, -120, 0, W / 2, -120, 1250);
    glow.addColorStop(0, "#5223c9");
    glow.addColorStop(0.6, "rgba(82, 35, 201, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // A colder pool at the bottom, so the tall frame does not read as
    // one flat wash of purple.
    const foot = ctx.createLinearGradient(0, H - 620, 0, H);
    foot.addColorStop(0, "rgba(20, 6, 56, 0)");
    foot.addColorStop(1, "rgba(20, 6, 56, 0.55)");

    ctx.fillStyle = foot;
    ctx.fillRect(0, H - 620, W, 620);

    /*
     * Stars, from a fixed table rather than Math.random: the same
     * reading should produce the same picture every time it is
     * shared, or two posts of one card look like two different cards.
     */
    const STARS: [number, number, number, number][] = [
        [130, 300, 3, 0.5],
        [280, 210, 2, 0.35],
        [420, 360, 2.5, 0.28],
        [700, 250, 3, 0.45],
        [880, 340, 2, 0.3],
        [960, 200, 2.5, 0.4],
        [180, 700, 2, 0.22],
        [930, 760, 2.5, 0.26],
        [120, 1180, 2.5, 0.3],
        [980, 1260, 2, 0.24],
        [320, 1600, 2.5, 0.3],
        [760, 1680, 3, 0.34],
        [520, 1780, 2, 0.22],
    ];

    for (const [x, y, r, alpha] of STARS) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }
}

/**
 * The oracle's face, cropped to a circle.
 *
 * Same 190% / 50% 14% crop as components/brand/oracle-mark.tsx, so
 * the avatar is framed identically to every other place it appears.
 */
function paintMark(
    ctx: CanvasRenderingContext2D,
    art: HTMLImageElement,
    cx: number,
    cy: number,
    d: number,
) {
    const w = d * 1.9;
    const h = w * (art.naturalHeight / art.naturalWidth);

    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
        art,
        cx - d / 2 - (w - d) * 0.5,
        cy - d / 2 - (h - d) * 0.14,
        w,
        h,
    );

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 4;
    ctx.stroke();
}

/** Brand lockup, centred, returning the y it finished at. */
function paintBrand(
    ctx: CanvasRenderingContext2D,
    art: HTMLImageElement,
    top: number,
) {
    const d = 104;

    paintMark(ctx, art, W / 2, top + d / 2, d);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = INK;
    ctx.font = font(800, 52);
    trackedText(ctx, "GOD", W / 2, top + d + 66, 9);

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = font(600, 22);
    trackedText(ctx, "GUIDANCE OF DESTINY", W / 2, top + d + 108, 5);

    return top + d + 108;
}

function paintFooter(ctx: CanvasRenderingContext2D, note: string) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
    ctx.font = font(600, 26);
    trackedText(ctx, note, W / 2, H - SAFE_BOTTOM, 3);
}

/** Rounded pills for the keywords. */
function paintKeywords(
    ctx: CanvasRenderingContext2D,
    keywords: string[],
    centreY: number,
) {
    if (keywords.length === 0) return;

    ctx.font = font(600, 30);

    const padX = 28;
    const gap = 16;
    const height = 62;

    const widths = keywords.map(
        (word) => ctx.measureText(word).width + padX * 2,
    );

    // Only as many as fit on one line — a wrapped row of pills would
    // push the reading off the bottom of the frame.
    const kept: number[] = [];
    let total = 0;

    for (let i = 0; i < keywords.length; i += 1) {
        const next = total + widths[i] + (kept.length ? gap : 0);

        if (next > W - PAD * 2) break;

        total = next;
        kept.push(i);
    }

    let x = (W - total) / 2;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (const i of kept) {
        ctx.beginPath();
        ctx.roundRect(x, centreY - height / 2, widths[i], height, height / 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillText(keywords[i], x + padX, centreY + 1);

        x += widths[i] + gap;
    }

    ctx.textBaseline = "alphabetic";
}

/** The prose, centred, capped at `maxLines`. Returns the y it ended at. */
function paintBody(
    ctx: CanvasRenderingContext2D,
    body: string,
    top: number,
    maxLines: number,
) {
    const size = 36;
    const leading = 56;

    ctx.font = font(400, size);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";

    const lines = wrap(ctx, body, W - PAD * 2, maxLines);

    lines.forEach((line, index) => {
        ctx.fillText(line, W / 2, top + index * leading);
    });

    return top + Math.max(0, lines.length - 1) * leading;
}

/* ==============================================================
   THE TWO VARIANTS
   ============================================================== */

function paintTarot(
    ctx: CanvasRenderingContext2D,
    card: Extract<StoryCard, { kind: "tarot" }>,
) {
    const cardW = 560;
    const cardH = 800;
    const x = (W - cardW) / 2;

    /*
     * Sharing the card before asking for a reading is allowed, and then
     * the prose that would have filled the lower third is simply not
     * there. Holding the card at the same height would leave a third of
     * the frame empty and read as a picture that failed to finish
     * loading, so with nothing below it the card takes the middle.
     */
    const y = card.body ? 500 : 688;

    // Glow behind the card, so it sits on the background rather than
    // being pasted onto it.
    ctx.save();
    ctx.shadowColor = "rgba(251, 191, 36, 0.3)";
    ctx.shadowBlur = 90;

    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 40);

    const face = ctx.createLinearGradient(x, y, x, y + cardH);
    face.addColorStop(0, "#3a1592");
    face.addColorStop(1, "#25095e");

    ctx.fillStyle = face;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 40);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner hairline, the way the deck artwork is framed.
    ctx.beginPath();
    ctx.roundRect(x + 22, y + 22, cardW - 44, cardH - 44, 24);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyebrow
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = font(600, 24);
    trackedText(ctx, card.eyebrow.toUpperCase(), W / 2, y + 96, 5);

    // The medallion, carrying the numeral — the app's card face.
    const mx = W / 2;
    const my = y + 290;
    const mr = 96;

    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(251, 191, 36, 0.12)";
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = GOLD;
    /*
     * 62, not 72. Minor arcana carry an emoji suit glyph, which canvas
     * paints in full colour at whatever size it is given — at 72 the
     * coin or goblet filled the ring edge to edge and read as a smudge
     * rather than an emblem.
     */
    ctx.font = font(700, 62);
    ctx.textBaseline = "middle";
    ctx.fillText(card.symbol, mx, my + 4);
    ctx.textBaseline = "alphabetic";

    // Name. Two sizes, because a long Vietnamese name at 76px runs
    // past the card edge.
    ctx.fillStyle = INK;

    const big = 76;
    ctx.font = font(800, big);

    const nameLines = wrap(ctx, card.name, cardW - 100, 2);
    const nameSize = nameLines.length > 1 ? 62 : big;

    ctx.font = font(800, nameSize);

    const relaid = wrap(ctx, card.name, cardW - 100, 2);

    relaid.forEach((line, index) => {
        ctx.fillText(line, W / 2, y + 480 + index * (nameSize + 12));
    });

    const nameBottom = y + 480 + (relaid.length - 1) * (nameSize + 12);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = font(500, 30);
    ctx.fillText(card.nameEn, W / 2, nameBottom + 54);

    paintKeywords(ctx, card.keywords, y + cardH - 110);

    if (card.body) paintBody(ctx, card.body, y + cardH + 120, 5);
}

function paintOracle(
    ctx: CanvasRenderingContext2D,
    card: Extract<StoryCard, { kind: "oracle" }>,
) {
    const cx = W / 2;
    const r = 380;

    // Centred when there is no analysis under it — see paintTarot.
    const cy = card.body ? 880 : 1010;

    // The rings the disc throws at the reveal.
    for (const [radius, alpha] of [
        [r + 60, 0.16],
        [r + 130, 0.08],
    ] as const) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // The glass disc.
    ctx.save();
    ctx.shadowColor = "rgba(251, 191, 36, 0.35)";
    ctx.shadowBlur = 110;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);

    const glass = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    glass.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    glass.addColorStop(1, "rgba(255, 255, 255, 0.07)");

    ctx.fillStyle = glass;
    ctx.fill();
    ctx.restore();

    // The gold rim, complete — on screen it is a progress ring that
    // has just finished, and this is that moment.
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.stroke();

    // The answer, inside the circle, at whatever size fits.
    ctx.textAlign = "center";
    ctx.fillStyle = INK;

    let size = 68;
    let lines: string[] = [];

    // Four lines is what the disc holds before the text starts
    // crowding the rim.
    for (const candidate of [68, 60, 52, 46]) {
        size = candidate;
        ctx.font = font(800, size);
        lines = wrap(ctx, card.answer, r * 1.5, 4);

        if (lines.length <= 3) break;
    }

    const leading = size + 16;
    const start = cy - ((lines.length - 1) * leading) / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line, cx, start + index * leading + size / 3);
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = font(600, 24);
    trackedText(ctx, "VỊ THẦN QUYẾT ĐỊNH", cx, cy + r + 96, 5);

    if (card.body) paintBody(ctx, card.body, cy + r + 190, 4);
}

/* ==============================================================
   ENTRY POINT
   ============================================================== */

/**
 * Draw the card and hand back a file ready for the share sheet.
 *
 * PNG, not JPEG: the frame is flat colour and text, which JPEG
 * stipples along every letter edge, and Instagram re-encodes whatever
 * it is given anyway.
 */
export async function renderStoryCard(card: StoryCard): Promise<File> {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas unavailable");

    /*
     * Wait for the webfont before measuring anything.
     *
     * Text is laid out here by measuring it, so a fallback face that
     * is still swapping would produce line breaks computed for one
     * font and glyphs drawn in another.
     */
    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load(font(800, 76)),
                document.fonts.load(font(400, 36)),
            ]);
        } catch {
            // Measured against the fallback instead. Still legible.
        }

        await document.fonts.ready;
    }

    const art = await loadImage("/images/avt_img.webp");

    paintBackground(ctx);
    paintBrand(ctx, art, SAFE_TOP);

    if (card.kind === "tarot") {
        paintTarot(ctx, card);
        paintFooter(ctx, "GODOFDECISION");
    } else {
        paintOracle(ctx, card);
        paintFooter(ctx, `GODOFDECISION · ${card.answerId}`);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
    );

    if (!blob) throw new Error("Cannot encode the picture");

    return new File([blob], "god-of-decision.png", { type: "image/png" });
}
