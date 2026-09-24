import { create } from "zustand";

import { ApiError, api } from "@/lib/api";
import type { OracleDraw } from "@/types/oracle";
import { useAuthStore } from "./auth.store";
import { useHistoryStore } from "./history.store";

type Status = "idle" | "asking" | "ready" | "error";
type ReadStatus = "idle" | "reading" | "done" | "error";

interface OracleState {
    status: Status;
    draw: OracleDraw | null;
    error: string | null;

    /**
     * Journal id of the draw on screen, and the identity of that draw.
     *
     * Used to tell one draw from the next. The answer's own id cannot
     * do that job: the book has 400 pages, so two presses in a row
     * landing on the same one is uncommon rather than impossible, and a
     * late stream would then be written into a draw it did not belong
     * to.
     */
    entryId: string | null;

    /**
     * The longer read. Null until the reader asks for it, then built
     * up chunk by chunk.
     */
    interpretation: string | null;
    readStatus: ReadStatus;
    readError: string | null;

    /**
     * The HTTP status behind `readError`, when there is one. 401
     * means "log in first" and gets a door rather than a retry.
     */
    readErrorStatus: number | null;

    ask: () => Promise<void>;
    interpret: () => Promise<void>;
    reset: () => void;
}

/**
 * Minimum time the answer takes to arrive.
 *
 * The screen already asked for five seconds of held finger, and the
 * draw itself is a lookup — it lands long before the finger lifts.
 * This only covers the case where it somehow has not: the reveal never
 * arrives at an empty disc.
 */
const MIN_THINKING_MS = 400;

const FALLBACK_ERROR = "Vị thần đang im lặng. Hãy thử lại sau.";

function message(error: unknown) {
    return error instanceof ApiError ? error.message : FALLBACK_ERROR;
}

/**
 * The oracle, in two acts.
 *
 * `ask` opens the book. `interpret` reads it aloud, and only when
 * asked — that is where the model call is, so most presses never spend
 * one. They are kept apart rather than merged behind a single "reading"
 * because they also fail apart: the answer can sit on screen perfectly
 * well while the interpretation is still arriving, or has just failed.
 *
 * Not persisted. An answer belongs to the moment it was drawn in, and
 * the journal already keeps the ones worth keeping.
 */
export const useOracleStore = create<OracleState>((set, get) => ({
    status: "idle",
    draw: null,
    error: null,

    entryId: null,

    interpretation: null,
    readStatus: "idle",
    readError: null,
    readErrorStatus: null,

    /**
     * Draw from the book.
     *
     * No question. The screen has no field to type one into: the book
     * of the god of decision answers what it answers, and the reader
     * brings their own question to it — the same shape the Tarot screen
     * settled on.
     */
    async ask() {
        if (get().status === "asking") return;

        set({
            status: "asking",
            error: null,
            draw: null,
            entryId: null,
            interpretation: null,
            readStatus: "idle",
            readError: null,
            readErrorStatus: null,
        });

        const startedAt = Date.now();

        try {
            const draw = await api.decision.draw();

            const elapsed = Date.now() - startedAt;

            if (elapsed < MIN_THINKING_MS) {
                await new Promise((resolve) =>
                    setTimeout(resolve, MIN_THINKING_MS - elapsed),
                );
            }

            /*
             * Filed now, with no interpretation.
             *
             * The draw happened whether or not anyone asks for the
             * longer read, and the id it comes back with is what lets
             * that read be written into this same entry later instead
             * of a second one.
             */
            const entry = useHistoryStore.getState().add({
                pillar: "decision",
                question: draw.question,
                answer: draw.answer,
                interpretation: null,
            });

            set({ status: "ready", draw, entryId: entry.id });
        } catch (error) {
            set({ status: "error", error: message(error) });
        }
    },

    /**
     * Ask what the answer means.
     *
     * Idempotent on purpose: the button that calls this is the same
     * button that reopens the sheet, so pressing it again must not
     * spend a second model call or rewind the typewriter.
     */
    async interpret() {
        const { draw, entryId, readStatus, interpretation } = get();

        if (!draw || !entryId) return;

        // Already arriving, or already here. A failed attempt leaves
        // the interpretation null, so a retry still gets through.
        if (readStatus === "reading") return;
        if (readStatus === "done" && interpretation) return;

        set({
            // Empty rather than null: it is about to be appended to.
            interpretation: "",
            readStatus: "reading",
            readError: null,
            readErrorStatus: null,
        });

        /** True while this call still owns what is on screen. */
        const current = () => get().entryId === entryId;

        try {
            const full = await api.decision.interpretStream(
                { answerId: draw.answer.id, question: draw.question },
                (delta) => {
                    // A stream for a draw since replaced must not write
                    // over the one that replaced it.
                    if (!current()) return;

                    set((state) => ({
                        interpretation: (state.interpretation ?? "") + delta,
                    }));
                },
            );

            if (!current()) return;

            set({ readStatus: "done", interpretation: full });

            useHistoryStore
                .getState()
                .update(entryId, { interpretation: full });
        } catch (error) {
            if (!current()) return;

            set({
                readStatus: "error",
                readError: message(error),
                readErrorStatus:
                    error instanceof ApiError ? (error.status ?? null) : null,
                // Cleared so the guard above lets a retry past.
                interpretation: null,
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

    reset() {
        set({
            status: "idle",
            draw: null,
            error: null,
            entryId: null,
            interpretation: null,
            readStatus: "idle",
            readError: null,
            readErrorStatus: null,
        });
    },
}));
