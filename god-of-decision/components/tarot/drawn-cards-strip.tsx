"use client";

import { cardSymbol } from "@/lib/tarot";
import { cn } from "@/lib/utils";
import { POSITION_LABEL, type DrawnCard, type Lang } from "@/types/tarot";

interface DrawnCardsStripProps {
    cards: DrawnCard[];
    lang: Lang;
}

/**
 * The spread, full width.
 *
 * Stays pinned above the sheet body through both picking a life
 * aspect and reading the result, so the cards never leave sight
 * while the user is deciding what to ask of them.
 *
 * Deliberately a quiet band. The only artwork in this sheet is
 * the oracle in the header; two illustrations competing on one
 * screen cancel each other out.
 */
export function DrawnCardsStrip({ cards, lang }: DrawnCardsStripProps) {
    if (cards.length === 0) return null;

    return (
        <div className="-mx-5 border-b border-ink/8">
            <div className="grid grid-cols-3 gap-3 px-4 py-5">
                {cards.map((card) => {
                    const reversed = card.orientation === "reversed";

                    return (
                        <div
                            key={card.id}
                            className={cn(
                                "flex flex-col items-center gap-1.5",
                                // A lone card takes the middle column
                                // rather than stretching across three.
                                cards.length === 1 && "col-start-2",
                            )}
                        >
                            <div
                                className="
                  relative
                  aspect-[2/3]
                  w-full

                  overflow-hidden
                  rounded-xl

                  border
                  border-white/25

                  bg-gradient-to-b
                  from-primary-700
                  to-primary-900

                  shadow-e2
                "
                            >
                                <div
                                    className="absolute inset-1.5 rounded-lg border border-white/15"
                                    aria-hidden="true"
                                />

                                <div
                                    className={cn(
                                        "absolute inset-0 flex items-center justify-center",
                                        "text-2xl font-bold text-white",
                                        reversed && "rotate-180",
                                    )}
                                    aria-hidden="true"
                                >
                                    {cardSymbol(card)}
                                </div>
                            </div>

                            {card.position && (
                                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-primary-600">
                                    {POSITION_LABEL[card.position][lang]}
                                </span>
                            )}

                            <span className="text-center text-[12px] font-bold leading-4 text-ink">
                                {lang === "en" ? card.name.en : card.name.vi}
                            </span>

                            {reversed && (
                                <span className="text-[9px] font-semibold text-[#b45309]">
                                    ↔ Ngược
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
