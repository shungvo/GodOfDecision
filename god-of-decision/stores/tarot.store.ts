import { create } from "zustand";

import { ApiError, api } from "@/lib/api";
import type { CardRef, DrawnCard, Lang, Spread, Topic } from "@/types/tarot";
import { useAuthStore } from "./auth.store";
import { useHistoryStore } from "./history.store";

type DrawStatus = "idle" | "drawing" | "ready" | "error";
type ReadStatus = "idle" | "reading" | "done" | "error";

interface TarotState {
    spread: Spread;
    lang: Lang;

    /** Bumped on every fresh draw so the deck remounts. */
    drawId: number;

    drawStatus: DrawStatus;
    cards: DrawnCard[];
    drawError: string | null;

    /**
     * Which fan positions the user has picked, in order, and
     * which slots have finished turning over.
     *
     * These live here rather than inside the deck component so
     * that leaving the screen and coming back does not wipe a
     * draw the user already made.
     */
    picks: number[];
    flipped: number[];

    /** True once the user has picked and flipped every slot. */
    completed: boolean;

    topic: Topic | null;
    readStatus: ReadStatus;
    interpretation: string | null;
    readError: string | null;

    /**
     * The HTTP status behind `readError`, when there is one. 401
     * means "log in first" and gets a door rather than a retry.
     */
    readErrorStatus: number | null;

    setSpread: (spread: Spread) => void;
    draw: () => Promise<void>;
    pick: (fanIndex: number) => void;

    chooseTopic: (topic: Topic) => Promise<void>;
    /** Back to the topic grid, same cards. */
    clearTopic: () => void;

    reset: () => void;
}

const FALLBACK_ERROR = "Vị thần đang im lặng. Hãy thử lại sau.";

/**
 * Gap between a card reaching its slot and turning over.
 * Matches the landing spring in TarotDeck.
 */
const FLIP_DELAY = 420;

function message(error: unknown) {
    return error instanceof ApiError ? error.message : FALLBACK_ERROR;
}

/** Only slugs travel back to the server. */
function toRefs(cards: DrawnCard[]): CardRef[] {
    return cards.map((card) => ({
        slug: card.slug,
        orientation: card.orientation,
        position: card.position,
    }));
}

export const useTarotStore = create<TarotState>((set, get) => ({
    spread: "three",
    lang: "vi",

    drawId: 0,

    drawStatus: "idle",
    cards: [],
    drawError: null,

    picks: [],
    flipped: [],
    completed: false,

    topic: null,
    readStatus: "idle",
    interpretation: null,
    readError: null,
    readErrorStatus: null,

    setSpread(spread) {
        if (get().spread === spread) return;

        set({ spread });

        void get().draw();
    },

    async draw() {
        if (get().drawStatus === "drawing") return;

        set({
            drawStatus: "drawing",
            drawError: null,
            cards: [],
            picks: [],
            flipped: [],
            completed: false,
            topic: null,
            readStatus: "idle",
            interpretation: null,
            readError: null,
            readErrorStatus: null,
        });

        try {
            const result = await api.tarot.draw(get().spread);

            set((state) => ({
                drawStatus: "ready",
                cards: result.cards,
                drawId: state.drawId + 1,
            }));
        } catch (error) {
            set({ drawStatus: "error", drawError: message(error) });
        }
    },

    pick(fanIndex) {
        const { picks, cards } = get();

        if (picks.includes(fanIndex) || picks.length >= cards.length) {
            return;
        }

        const slot = picks.length;

        set({ picks: [...picks, fanIndex] });

        // Let the card land before it turns over.
        setTimeout(() => {
            set((state) => ({
                flipped: state.flipped.includes(slot)
                    ? state.flipped
                    : [...state.flipped, slot],
            }));

            if (slot === get().cards.length - 1) {
                set({ completed: true });
            }
        }, FLIP_DELAY);
    },

    async chooseTopic(topic) {
        const { cards, lang, spread, readStatus, completed } = get();

        // Nothing on the table means nothing to read.
        if (!completed || cards.length === 0 || readStatus === "reading") {
            return;
        }

        set({
            topic,
            readStatus: "reading",
            // Empty rather than null: the reading is about to be
            // appended to chunk by chunk.
            interpretation: "",
            readError: null,
            readErrorStatus: null,
        });

        try {
            const full = await api.tarot.interpretStream(
                { cards: toRefs(cards), topic, lang },
                (delta) => {
                    // Guard against a stale stream writing over a reading
                    // the user has since replaced or cancelled.
                    if (get().topic !== topic) return;

                    set((state) => ({
                        interpretation: (state.interpretation ?? "") + delta,
                    }));
                },
            );

            if (get().topic !== topic) return;

            set({ readStatus: "done", interpretation: full });

            useHistoryStore.getState().add({
                pillar: "tarot",
                topic,
                spread,
                lang,
                cards,
                interpretation: full,
            });
        } catch (error) {
            if (get().topic !== topic) return;

            set({
                readStatus: "error",
                readError: message(error),
                readErrorStatus:
                    error instanceof ApiError ? (error.status ?? null) : null,
            });
        } finally {
            /*
             * The number in the header just moved. Refreshed here
             * rather than on every header mount, because this is the
             * only thing that spends the allowance — and in `finally`
             * because a stream that failed part way through may still
             * have been charged for what it did produce.
             */
            void useAuthStore.getState().refresh();
        }
    },

    clearTopic() {
        set({
            topic: null,
            readStatus: "idle",
            interpretation: null,
            readError: null,
            readErrorStatus: null,
        });
    },

    reset() {
        void get().draw();
    },
}));
