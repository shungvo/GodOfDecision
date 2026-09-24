import type { DrawnCard, Lang, Spread, Topic } from "./tarot";
import type { OracleAnswer } from "./oracle";

export type Pillar = "tarot" | "decision";

interface BaseEntry {
    /** Local id. Not related to any backend id. */
    id: string;
    pillar: Pillar;
    /** ISO string. */
    date: string;
}

/**
 * Tarot readings have no question. The user picks a
 * life aspect after the cards are on the table.
 */
export interface TarotHistoryEntry extends BaseEntry {
    pillar: "tarot";
    topic: Topic;
    spread: Spread;
    lang: Lang;
    cards: DrawnCard[];
    interpretation: string | null;
}

export interface DecisionHistoryEntry extends BaseEntry {
    pillar: "decision";
    /** Null for draws made without a question. */
    question: string | null;
    answer: OracleAnswer;
    /**
     * Null until the reader asks for the longer read — the draw itself
     * does not generate one.
     */
    interpretation: string | null;
}

export type HistoryEntry = TarotHistoryEntry | DecisionHistoryEntry;
