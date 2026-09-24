export type Arcana = "major" | "minor";

export type Suit = "wands" | "cups" | "swords" | "pentacles";

export type Orientation = "upright" | "reversed";

export type Spread = "single" | "three";

export type Position = "past" | "present" | "future";

export type Lang = "vi" | "en";

/**
 * How much room a reading gets.
 *
 * `brief` is three to five sentences, which is what a spread wants.
 * `deep` is a few paragraphs, for a single card the reader has opened
 * a sheet to sit with. Mirrors DEPTHS in the backend's tarot service.
 */
export type ReadingDepth = "brief" | "deep";

export interface Bilingual {
    vi: string;
    en: string;
}

export interface BilingualList {
    vi: string[];
    en: string[];
}

/**
 * Raw Tarot.json entry.
 *
 * Returned by:
 * GET /api/tarot/cards
 * GET /api/tarot/cards/:slug
 */
export interface TarotCardEntry {
    id: number;
    slug: string;
    arcana: Arcana;
    suit: Suit | null;
    number: number;
    name_vn: string;
    name_en: string;
    image: string;
    keywords_vn: string[];
    keywords_en: string[];
    upright_vn: string;
    upright_en: string;
    reversed_vn: string;
    reversed_en: string;
}

export interface TarotCardList {
    total: number;
    cards: TarotCardEntry[];
}

/**
 * A card as drawn.
 *
 * `meaning` is already resolved by `orientation`.
 */
export interface DrawnCard {
    id: string;
    slug: string;
    position: Position | null;
    orientation: Orientation;
    arcana: Arcana;
    suit: Suit | null;
    number: number;
    name: Bilingual;
    image: string;
    keywords: BilingualList;
    meaning: Bilingual;
}

export type Topic =
    | "general"
    | "love"
    | "relationships"
    | "career"
    | "money"
    | "health"
    | "growth"
    | "study";

/**
 * Returned by POST /api/tarot/draw
 *
 * Cards only. The user picks a life aspect afterwards.
 */
export interface TarotDraw {
    spread: Spread;
    cards: DrawnCard[];
}

/**
 * The minimum a card needs to be named back to the server.
 * Everything else is looked up from Tarot.json server side.
 */
export interface CardRef {
    slug: string;
    orientation: Orientation;
    position: Position | null;
}

/**
 * Returned by POST /api/tarot/interpret
 *
 * `interpretation` is null when the AI was unavailable.
 * The draw itself is still valid.
 */
export interface TarotInterpretation {
    topic: Topic;
    lang: Lang;
    cards: DrawnCard[];
    interpretation: string | null;
    interpretationError: string | null;
}

export const SPREAD_SIZE: Record<Spread, number> = {
    single: 1,
    three: 3,
};

export const POSITION_LABEL: Record<Position, Bilingual> = {
    past: { vi: "Quá khứ", en: "Past" },
    present: { vi: "Hiện tại", en: "Present" },
    future: { vi: "Hướng đi", en: "Direction" },
};

export const SUIT_LABEL: Record<Suit, Bilingual> = {
    wands: { vi: "Gậy", en: "Wands" },
    cups: { vi: "Cốc", en: "Cups" },
    swords: { vi: "Kiếm", en: "Swords" },
    pentacles: { vi: "Tiền", en: "Pentacles" },
};
