import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "./auth.store";

type ReadStatus = "idle" | "reading" | "done" | "error";

interface DailyState {
    /**
     * The calendar day whose card has already been turned over, as
     * YYYY-MM-DD. Null before the very first reveal.
     */
    revealedOn: string | null;

    /**
     * Every day (YYYY-MM-DD) a card was turned, newest last, capped.
     * Feeds the ritual streak on Home.
     */
    revealDays: string[];

    /**
     * The day the cached reading belongs to.
     *
     * Kept beside the reading rather than trusting `revealedOn`,
     * because the two can legitimately disagree: the card is turned
     * before the reading is asked for.
     */
    readingFor: string | null;
    reading: string | null;

    readStatus: ReadStatus;
    readError: string | null;

    /**
     * The HTTP status behind `readError`, when there is one. The
     * sheet needs to tell "log in first" (401) apart from "try
     * again", because retrying the first is a locked door.
     */
    readErrorStatus: number | null;

    reveal: (day: string) => void;
    readMeaning: (day: string, slug: string) => Promise<void>;
}

const FALLBACK_ERROR = "Vị thần đang im lặng. Hãy thử lại sau.";

function message(error: unknown) {
    return error instanceof ApiError ? error.message : FALLBACK_ERROR;
}

/**
 * Whether today's card is still face down, and what it means.
 *
 * Both are persisted, for the same reason but at different scales.
 * Home unmounts every time the reader visits another tab, and asking
 * them to press and hold again on the way back would turn a small
 * ritual into a toll booth. The reading matters more: it costs a model
 * call, and a card that says something different every time the sheet
 * opens is not a message of the day at all.
 */
export const useDailyStore = create<DailyState>()(
    persist(
        (set, get) => ({
            revealedOn: null,
            revealDays: [],

            readingFor: null,
            reading: null,

            readStatus: "idle",
            readError: null,
            readErrorStatus: null,

            reveal(day) {
                const days = get().revealDays.filter((d) => d !== day);

                set({
                    revealedOn: day,
                    revealDays: [...days, day].slice(-60),
                });
            },

            async readMeaning(day, slug) {
                const { readStatus, readingFor, reading } = get();

                // Already arriving.
                if (readStatus === "reading") return;

                // Already have today's. A failed attempt leaves the
                // reading null, so this still allows a retry.
                if (readingFor === day && reading) return;

                set({
                    readingFor: day,
                    // Empty rather than null: it is about to be
                    // appended to, chunk by chunk.
                    reading: "",
                    readStatus: "reading",
                    readError: null,
                    readErrorStatus: null,
                });

                try {
                    const full = await api.tarot.interpretStream(
                        {
                            cards: [
                                {
                                    slug,
                                    // The daily card is always upright,
                                    // and it belongs to no spread, so
                                    // it holds no position.
                                    orientation: "upright",
                                    position: null,
                                },
                            ],
                            topic: "general",
                            lang: "vi",
                            depth: "deep",
                        },
                        (delta) => {
                            // A stream from yesterday, or from a card
                            // since replaced, must not write here.
                            if (get().readingFor !== day) return;

                            set((state) => ({
                                reading: (state.reading ?? "") + delta,
                            }));
                        },
                    );

                    if (get().readingFor !== day) return;

                    set({ readStatus: "done", reading: full });
                } catch (error) {
                    if (get().readingFor !== day) return;

                    set({
                        readStatus: "error",
                        readError: message(error),
                        readErrorStatus:
                            error instanceof ApiError
                                ? (error.status ?? null)
                                : null,
                        // Cleared so the guard above lets a retry past.
                        reading: null,
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
        }),
        {
            name: "god-of-decision:daily",
            version: 1,

            /*
             * Status and error belong to one attempt rather than to
             * the day, so they start fresh on every load.
             *
             * Only a finished reading is written. Persisting whatever
             * happens to be in `reading` would catch a reload
             * mid-stream and store half a sentence — and since
             * `readStatus` starts at "idle" again, the guard in
             * `readMeaning` would see a reading for today and never
             * fetch the rest. A truncated message, permanently.
             */
            partialize: (state) => {
                const settled = state.readStatus === "done";

                return {
                    revealedOn: state.revealedOn,
                    revealDays: state.revealDays,
                    readingFor: settled ? state.readingFor : null,
                    reading: settled ? state.reading : null,
                };
            },
        },
    ),
);

// Reading `revealedOn` during render requires `useHydrated()`.
// See hooks/use-hydrated.ts.
