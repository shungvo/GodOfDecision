"use client";

import { motion } from "framer-motion";
import {
    ArrowDown,
    ArrowUp,
    Coins,
    Sparkles,
    Star,
    Swords,
    Wand2,
    Wine,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Screen } from "@/components/layout/screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api } from "@/lib/api";
import { cardSymbol } from "@/lib/tarot";
import { SUIT_LABEL, type Arcana, type Suit } from "@/types/tarot";
import type { TarotCardEntry } from "@/types/tarot";

type Filter = "all" | Arcana | Suit;

const FILTERS = [
    { value: "all" as Filter, label: "Tất cả", icon: Sparkles },
    { value: "major" as Filter, label: "Ẩn chính", icon: Star },
    { value: "wands" as Filter, label: SUIT_LABEL.wands.vi, icon: Wand2 },
    { value: "cups" as Filter, label: SUIT_LABEL.cups.vi, icon: Wine },
    { value: "swords" as Filter, label: SUIT_LABEL.swords.vi, icon: Swords },
    {
        value: "pentacles" as Filter,
        label: SUIT_LABEL.pentacles.vi,
        icon: Coins,
    },
];

function matches(card: TarotCardEntry, filter: Filter) {
    if (filter === "all") return true;
    if (filter === "major" || filter === "minor") {
        return card.arcana === filter;
    }

    return card.suit === filter;
}

function ExploreContent() {
    const searchParams = useSearchParams();
    const requestedSlug = searchParams.get("card");

    const [cards, setCards] = useState<TarotCardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState<Filter>("all");
    const [selected, setSelected] = useState<TarotCardEntry | null>(null);

    useEffect(() => {
        let cancelled = false;

        api.tarot
            .cards()
            .then(({ cards: list }) => {
                if (cancelled) return;

                setCards(list);
                setLoading(false);
            })
            .catch((cause) => {
                if (cancelled) return;

                setError(
                    cause instanceof ApiError
                        ? cause.message
                        : "Không mở được bộ bài.",
                );

                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    /** Open the card the home screen linked to. */
    useEffect(() => {
        if (!requestedSlug || cards.length === 0) return;

        const found = cards.find((card) => card.slug === requestedSlug);

        if (found) setSelected(found);
    }, [requestedSlug, cards]);

    const visible = useMemo(
        () => cards.filter((card) => matches(card, filter)),
        [cards, filter],
    );

    return (
        <Screen
            title="Bộ bài"
            subtitle="78 lá. Chạm để đọc ý nghĩa xuôi và ngược."
            lumi="explore_browse"
        >
            {/* ==========================================
          FILTERS
      =========================================== */}

            <div className="-mx-5 mb-6 overflow-x-auto px-5 pb-1">
                <div className="flex w-max gap-2">
                    {FILTERS.map((option) => {
                        const active = filter === option.value;

                        const FilterIcon = option.icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setFilter(option.value)}
                                className={`
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-4
                  py-2
                  text-xs
                  font-medium
                  transition
                  active:scale-95

                  ${
                      active
                          ? "border-white bg-white font-bold text-ink shadow-e1"
                          : "glass text-white hover:bg-white/20"
                  }
                `}
                            >
                                <FilterIcon
                                    className={`h-3.5 w-3.5 ${
                                        active
                                            ? "text-primary-600"
                                            : "text-white/70"
                                    }`}
                                    aria-hidden="true"
                                />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ==========================================
          STATES
      =========================================== */}

            {loading && (
                <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="aspect-[2/3] rounded-2xl"
                        />
                    ))}
                </div>
            )}

            {error && (
                <div className="rounded-3xl border border-magic-gold/40 bg-magic-gold/15 px-5 py-6 text-center">
                    <p className="text-sm leading-6 text-magic-gold">{error}</p>
                </div>
            )}

            {/* ==========================================
          GRID
      =========================================== */}

            {!loading && !error && (
                <>
                    <p className="mb-3 px-1 text-xs text-white/60">
                        {visible.length} lá
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        {visible.map((card, index) => (
                            <motion.button
                                key={card.slug}
                                type="button"
                                onClick={() => setSelected(card)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: Math.min(index * 0.012, 0.4),
                                    duration: 0.25,
                                }}
                                whileTap={{ scale: 0.96 }}
                                className="
                  flex
                  aspect-[2/3]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  surface bg-white
                  p-2
                  text-center
                  shadow-e1
                  transition
                  hover:shadow-e2
                "
                            >
                                <span
                                    className="text-2xl font-bold text-primary-700"
                                    aria-hidden="true"
                                >
                                    {cardSymbol(card)}
                                </span>

                                <span className="line-clamp-2 text-[10px] font-semibold leading-3.5 text-ink">
                                    {card.name_vn}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </>
            )}

            {/* ==========================================
          DETAIL
      =========================================== */}

            <BottomSheet
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
                title={selected?.name_vn}
                description={selected?.name_en}
                snapPoints={[0.5, 0.9]}
                initialSnap={1}
                showCloseButton
            >
                {selected && (
                    <div className="space-y-5 pb-8">
                        <div className="flex flex-wrap gap-2">
                            {selected.keywords_vn.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="rounded-full bg-secondary-100 px-3 py-1.5 text-xs font-medium text-primary-800"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>

                        <div className="rounded-3xl border border-ink/8 bg-canvas p-5">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-600">
                                <ArrowUp
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Xuôi
                            </p>

                            <p className="mt-2 text-sm leading-7 text-ink-soft">
                                {selected.upright_vn}
                            </p>
                        </div>

                        <div className="rounded-3xl border border-ink/8 bg-canvas p-5">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b45309]">
                                <ArrowDown
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Ngược
                            </p>

                            <p className="mt-2 text-sm leading-7 text-ink-soft">
                                {selected.reversed_vn}
                            </p>
                        </div>

                        <p className="text-center text-[11px] text-ink-soft/70">
                            {selected.arcana === "major"
                                ? "Ẩn chính"
                                : `Ẩn phụ · ${
                                      selected.suit
                                          ? SUIT_LABEL[selected.suit].vi
                                          : ""
                                  }`}
                        </p>
                    </div>
                )}
            </BottomSheet>
        </Screen>
    );
}

export default function ExplorePage() {
    return (
        <Suspense
            fallback={
                <Screen title="Bộ bài">
                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 9 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="aspect-[2/3] rounded-2xl"
                            />
                        ))}
                    </div>
                </Screen>
            }
        >
            <ExploreContent />
        </Suspense>
    );
}
