import type { TarotCardData } from "@/components/tarot/tarot-card";
import {
    POSITION_LABEL,
    type DrawnCard,
    type Lang,
    type Suit,
    type TarotCardEntry,
} from "@/types/tarot";

const SUIT_GLYPH: Record<Suit, string> = {
    wands: "🪄",
    cups: "🍷",
    swords: "⚔️",
    pentacles: "🪙",
};

const ROMAN = [
    "0",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
    "XV",
    "XVI",
    "XVII",
    "XVIII",
    "XIX",
    "XX",
    "XXI",
];

/**
 * The card's number, as a tarot deck prints it.
 *
 * Roman for both arcana — minors run I to XIV, with the court cards
 * as XI to XIV. Unlike `cardSymbol` this never returns an emoji, so
 * it can be set large without a glossy 3D glyph landing in the middle
 * of an otherwise typographic card.
 */
export function cardNumeral(card: { number: number }) {
    return ROMAN[card.number] ?? "✦";
}

/**
 * Glyph for the fallback card face.
 *
 * Major arcana show their roman numeral.
 * Minor arcana show their suit.
 */
export function cardSymbol(card: {
    arcana: string;
    suit: Suit | null;
    number: number;
}) {
    if (card.arcana === "major") {
        return ROMAN[card.number] ?? "✦";
    }

    return card.suit ? SUIT_GLYPH[card.suit] : "✦";
}

/** Map a drawn card onto the deck component's shape. */
export function toDeckCard(card: DrawnCard, lang: Lang): TarotCardData {
    return {
        id: card.id,
        name: lang === "en" ? card.name.en : card.name.vi,
        image: card.image,
        description: lang === "en" ? card.meaning.en : card.meaning.vi,
        position: card.position
            ? POSITION_LABEL[card.position][lang]
            : undefined,
        orientation: card.orientation,
        symbol: cardSymbol(card),
    };
}

/** Card name in the chosen language. */
export function entryName(entry: TarotCardEntry, lang: Lang) {
    return lang === "en" ? entry.name_en : entry.name_vn;
}

export function entryKeywords(entry: TarotCardEntry, lang: Lang) {
    return lang === "en" ? entry.keywords_en : entry.keywords_vn;
}

export function entryMeaning(
    entry: TarotCardEntry,
    lang: Lang,
    orientation: "upright" | "reversed" = "upright",
) {
    if (orientation === "reversed") {
        return lang === "en" ? entry.reversed_en : entry.reversed_vn;
    }

    return lang === "en" ? entry.upright_en : entry.upright_vn;
}

/**
 * Deterministic card of the day.
 *
 * Same date always maps to the same index, so the
 * daily card does not change on re-render.
 */
/**
 * The local calendar day, as YYYY-MM-DD.
 *
 * Used to remember that today's card has already been turned over.
 * Local rather than UTC on purpose: the day should turn when it turns
 * for the reader, not at some hour in the middle of their evening.
 */
export function dayKey(date = new Date()) {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
}

export function dailyIndex(total: number, date = new Date()) {
    if (total <= 0) return 0;

    const key =
        date.getFullYear() * 10000 +
        (date.getMonth() + 1) * 100 +
        date.getDate();

    return key % total;
}
