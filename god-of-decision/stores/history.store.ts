import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
    DecisionHistoryEntry,
    HistoryEntry,
    TarotHistoryEntry,
} from "@/types/history";

type NewEntry =
    | Omit<TarotHistoryEntry, "id" | "date">
    | Omit<DecisionHistoryEntry, "id" | "date">;

interface HistoryState {
    entries: HistoryEntry[];

    add: (entry: NewEntry) => HistoryEntry;

    /**
     * Fill in part of an entry that was written before it existed.
     *
     * An entry is filed the moment something is drawn, but the reading
     * around it can arrive minutes later or never — the reader has to
     * ask for it. Without this the journal would keep the version of
     * the entry that had no reading in it.
     */
    update: (id: string, patch: Partial<HistoryEntry>) => void;

    remove: (id: string) => void;
    clear: () => void;
}

const MAX_ENTRIES = 200;

function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set, get) => ({
            entries: [],

            add(entry) {
                const full = {
                    ...entry,
                    id: createId(),
                    date: new Date().toISOString(),
                } as HistoryEntry;

                set({
                    entries: [full, ...get().entries].slice(0, MAX_ENTRIES),
                });

                return full;
            },

            update(id, patch) {
                set({
                    entries: get().entries.map((entry) =>
                        entry.id === id
                            ? ({ ...entry, ...patch } as HistoryEntry)
                            : entry,
                    ),
                });
            },

            remove(id) {
                set({
                    entries: get().entries.filter((entry) => entry.id !== id),
                });
            },

            clear() {
                set({ entries: [] });
            },
        }),
        {
            name: "god-of-decision:history",
            version: 2,
            partialize: (state) => ({ entries: state.entries }),

            /**
             * v1 tarot entries carried a free text question.
             * The flow no longer asks one, so they are filed
             * under the general aspect.
             */
            migrate: (persisted, version) => {
                const state = persisted as {
                    entries?: Record<string, unknown>[];
                };

                if (version >= 2 || !state?.entries) return persisted;

                return {
                    entries: state.entries.map((entry) =>
                        entry.pillar === "tarot" && entry.topic === undefined
                            ? { ...entry, topic: "general" }
                            : entry,
                    ),
                };
            },
        },
    ),
);

// Reading `entries` during render requires `useHydrated()`.
// See hooks/use-hydrated.ts.
