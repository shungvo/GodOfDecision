"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Layers, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Screen } from "@/components/layout/screen";
import { LumiSays } from "@/components/mascot/lumi-says";
import { SheetMascot } from "@/components/mascot/sheet-mascot";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useHydrated } from "@/hooks/use-hydrated";
import { topicLabel } from "@/lib/topics";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistoryStore } from "@/stores/history.store";
import { POSITION_LABEL } from "@/types/tarot";
import type { HistoryEntry } from "@/types/history";

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Tarot readings have no question, they have a life aspect. Decision
 * draws no longer ask for one either, so when there is none the answer
 * itself is the headline — it is what the entry is about.
 */
function headline(entry: HistoryEntry) {
    if (entry.pillar === "tarot") return topicLabel(entry.topic);

    return entry.question ?? entry.answer.vi;
}

function summarize(entry: HistoryEntry) {
    if (entry.pillar === "decision") {
        return entry.answer.vi;
    }

    return entry.cards.map((card) => card.name.vi).join(" · ");
}

export default function HistoryPage() {
    const hydrated = useHydrated();
    const entries = useHistoryStore((state) => state.entries);
    const remove = useHistoryStore((state) => state.remove);

    const [selected, setSelected] = useState<HistoryEntry | null>(null);

    return (
        <Screen
            title="Nhật ký"
            subtitle="Những câu hỏi bạn đã mang tới đây."
            lumi={hydrated && entries.length > 0 ? "history_list" : undefined}
        >
            {!hydrated && (
                <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                        <Skeleton key={index} className="h-24 rounded-3xl" />
                    ))}
                </div>
            )}

            {hydrated && entries.length === 0 && (
                <div className="rounded-3xl surface bg-white px-6 py-12 text-center shadow-e2">
                    <LumiSays
                        moment="history_empty"
                        from="avatar"
                        className="justify-center text-left"
                    />

                    <div className="mt-6 flex justify-center gap-3">
                        <Link
                            href="/tarot"
                            className="inline-flex items-center gap-2 rounded-[18px] bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700 active:scale-95"
                        >
                            <Layers className="h-4 w-4" aria-hidden="true" />
                            Rút bài
                        </Link>

                        <Link
                            href="/oracle"
                            className="inline-flex items-center gap-2 rounded-[18px] border border-ink/10 bg-canvas px-5 py-3 text-sm font-medium text-ink transition hover:bg-secondary-100/40 active:scale-95"
                        >
                            <Sparkles
                                className="h-4 w-4 text-primary-600"
                                aria-hidden="true"
                            />
                            Hỏi vị thần
                        </Link>
                    </div>
                </div>
            )}

            {hydrated && entries.length > 0 && (
                <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                        {entries.map((entry) => {
                            const isTarot = entry.pillar === "tarot";
                            const Icon = isTarot ? Layers : Sparkles;

                            return (
                                <motion.li
                                    key={entry.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                        opacity: 0,
                                        x: -30,
                                        transition: { duration: 0.2 },
                                    }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <div
                                        className="
                      flex
                      items-start
                      gap-3
                      rounded-3xl
                      surface bg-white
                      p-4
                      shadow-e1
                    "
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelected(entry)}
                                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                        >
                                            <span
                                                className="
                          mt-0.5
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-secondary-100
                        "
                                            >
                                                <Icon
                                                    className="h-4 w-4 text-primary-700"
                                                    aria-hidden="true"
                                                />
                                            </span>

                                            <span className="min-w-0">
                                                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-600">
                                                    {formatDate(entry.date)}
                                                </span>

                                                <span className="mt-1 block truncate text-[15px] font-bold text-ink">
                                                    {headline(entry)}
                                                </span>

                                                <span className="mt-1 block truncate text-xs text-ink-soft">
                                                    {summarize(entry)}
                                                </span>
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => remove(entry.id)}
                                            aria-label="Xoá mục này"
                                            className="
                        shrink-0
                        rounded-xl
                        p-2
                        text-ink-soft/50
                        transition
                        hover:bg-ink/5
                        hover:text-[#b45309]
                        active:scale-95
                      "
                                        >
                                            <Trash2
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}

            {/* ==============================================
          DETAIL
      =============================================== */}

            <BottomSheet
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
                title={selected ? headline(selected) : undefined}
                description={selected ? formatDate(selected.date) : undefined}
                art={<SheetMascot mood="idle" />}
                snapPoints={[0.5, 0.92]}
                initialSnap={1}
                showCloseButton
            >
                {selected && (
                    <div className="space-y-5 pb-8">
                        <LumiSays moment="history_view" seed={selected.date} />

                        {selected.pillar === "decision" ? (
                            <>
                                <div className="rounded-3xl bg-primary-900 px-5 py-8 text-center">
                                    <span
                                        className="text-2xl"
                                        aria-hidden="true"
                                    >
                                        {selected.answer.emoji}
                                    </span>

                                    <p className="mt-3 text-lg font-extrabold leading-7 text-white">
                                        {selected.answer.vi}
                                    </p>
                                </div>

                                {/* Absent when the reader was happy with
                                    the answer and never asked why. */}
                                {selected.interpretation && (
                                    <div className="rounded-3xl bg-canvas p-5">
                                        <p className="whitespace-pre-wrap text-sm leading-7 text-ink-soft">
                                            {selected.interpretation}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {selected.cards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="rounded-3xl border border-ink/8 bg-canvas p-4"
                                        >
                                            <div className="flex items-baseline justify-between gap-3">
                                                <h4 className="text-[15px] font-bold text-ink">
                                                    {card.name.vi}
                                                </h4>

                                                {card.position && (
                                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-600">
                                                        {
                                                            POSITION_LABEL[
                                                                card.position
                                                            ].vi
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#b45309]">
                                                {card.orientation ===
                                                "reversed" ? (
                                                    <ArrowDown
                                                        className="h-3 w-3"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <ArrowUp
                                                        className="h-3 w-3"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {card.orientation === "reversed"
                                                    ? "Ngược"
                                                    : "Xuôi"}
                                            </p>

                                            <p className="mt-2 text-sm leading-6 text-ink-soft">
                                                {card.meaning.vi}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {selected.interpretation && (
                                    <div className="rounded-3xl bg-primary-900 p-5">
                                        <p className="text-sm leading-7 text-white">
                                            {selected.interpretation}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </BottomSheet>
        </Screen>
    );
}
