"use client";

import { ArrowUp, LogIn, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DailyCard } from "@/components/home/daily-card";
import { Screen } from "@/components/layout/screen";
import { StoryShareButton } from "@/components/share/story-share-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTypewriter } from "@/hooks/use-typewriter";
import { api } from "@/lib/api";
import { cardSymbol, dailyIndex, dayKey } from "@/lib/tarot";
import { useDailyStore } from "@/stores/daily.store";
import { SUIT_LABEL, type TarotCardEntry } from "@/types/tarot";

/**
 * How long after the turn the sheet lets itself in.
 *
 * The flip runs for 900ms. Arriving at 700 catches it on the way down,
 * so the two movements read as one gesture rather than a queue.
 */
const SHEET_DELAY_MS = 700;

/**
 * Home.
 *
 * One card, once a day. Everything else the app can do lives a tab
 * away, so this screen does not repeat it.
 *
 * The meaning is a sheet rather than text under the card, because the
 * card is nearly the size of the screen and there is no room left
 * below it. Tapping the card brings the sheet back.
 */
export default function HomePage() {
    const [cards, setCards] = useState<TarotCardEntry[]>([]);
    const [failed, setFailed] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    const hydrated = useHydrated();

    const revealedOn = useDailyStore((state) => state.revealedOn);
    const reveal = useDailyStore((state) => state.reveal);

    const reading = useDailyStore((state) => state.reading);
    const readStatus = useDailyStore((state) => state.readStatus);
    const readError = useDailyStore((state) => state.readError);
    const readErrorStatus = useDailyStore((state) => state.readErrorStatus);
    const readMeaning = useDailyStore((state) => state.readMeaning);

    useEffect(() => {
        let cancelled = false;

        api.tarot
            .cards()
            .then((result) => {
                if (!cancelled) setCards(result.cards);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const card = cards.length > 0 ? cards[dailyIndex(cards.length)] : null;

    // Gated on hydration: the server has no way to know whether this
    // reader has already turned today's card.
    const revealed = hydrated && revealedOn === dayKey();

    /**
     * The reading is asked for when the sheet opens, not when the card
     * is turned.
     *
     * It costs a model call, so it waits until someone is actually
     * looking at it. The store keeps the result for the rest of the
     * day, so opening the sheet again does not spend another one.
     */
    useEffect(() => {
        if (!sheetOpen || !card) return;

        void readMeaning(dayKey(), card.slug);
    }, [sheetOpen, card, readMeaning]);

    const { text: typedReading, typing } = useTypewriter(reading ?? "");

    /**
     * Opened by the turn, not by the card being face up.
     *
     * Driven from the handler rather than from an effect watching
     * `revealed`, because that value also goes true on every later
     * visit once hydration catches up — which would reopen the sheet
     * every time the app is launched.
     */
    const sheetTimer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (sheetTimer.current !== null) {
                window.clearTimeout(sheetTimer.current);
            }
        };
    }, []);

    function handleReveal() {
        reveal(dayKey());

        sheetTimer.current = window.setTimeout(() => {
            sheetTimer.current = null;
            setSheetOpen(true);
        }, SHEET_DELAY_MS);
    }

    return (
        <Screen className="flex flex-col">
            <DailyCard
                card={card}
                revealed={revealed}
                failed={failed}
                onReveal={handleReveal}
                onOpenMeaning={() => setSheetOpen(true)}
            />

            {/* ==============================================
          MEANING
      =============================================== */}

            <BottomSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title={card?.name_vn}
                description={card?.name_en}
                snapPoints={[0.55, 0.92]}
                initialSnap={1}
                showCloseButton
            >
                {card && (
                    <div className="space-y-5 pb-8">
                        <div className="flex flex-wrap gap-2">
                            {card.keywords_vn.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="rounded-full bg-secondary-100 px-3 py-1.5 text-xs font-medium text-primary-800"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>

                        {/* ----------------------------------
                            THE READING

                            Placeholder shaped like what
                            replaces it, so the first words
                            land without shifting anything.
                        ----------------------------------- */}

                        {readStatus === "reading" && !typedReading && (
                            <div>
                                <Skeleton
                                    tone="light"
                                    className="h-6 w-[62%] rounded-lg"
                                />

                                <SkeletonText
                                    lines={10}
                                    tone="light"
                                    className="mt-4"
                                    lineClassName="h-4"
                                    label="Vị thần đang đọc lá bài"
                                />
                            </div>
                        )}

                        {typedReading && (
                            <div>
                                <h3 className="text-[20px] font-bold text-ink">
                                    Thông điệp cho hôm nay
                                </h3>

                                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
                                    {typedReading}

                                    {(typing || readStatus === "reading") && (
                                        <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary-600" />
                                    )}
                                </p>
                            </div>
                        )}

                        {readStatus === "error" && (
                            <div className="rounded-3xl border border-magic-gold/40 bg-magic-gold/10 p-5">
                                <p className="text-sm leading-6 text-[#8a5a00]">
                                    {readError}
                                </p>

                                {/* A 401 is a door, not a fault —
                                    retrying it changes nothing. */}
                                {readErrorStatus === 401 ? (
                                    <Link
                                        href="/login?next=/"
                                        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-magic-gold px-4 py-2.5 text-sm font-bold text-[#3d2600] transition active:scale-95"
                                    >
                                        <LogIn
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Đăng nhập
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void readMeaning(
                                                dayKey(),
                                                card.slug,
                                            )
                                        }
                                        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-magic-gold px-4 py-2.5 text-sm font-bold text-[#3d2600] transition active:scale-95"
                                    >
                                        <RefreshCw
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Thử lại
                                    </button>
                                )}
                            </div>
                        )}

                        {/*
                         * Directly under what it shares.
                         *
                         * `body` is keyed on "not streaming" rather
                         * than on "done": readStatus is not persisted,
                         * so a reading cached from earlier today comes
                         * back with it at "idle", and a `=== "done"`
                         * test left the picture wordless on every
                         * launch after the first.
                         */}
                        <StoryShareButton
                            card={{
                                kind: "tarot",
                                name: card.name_vn,
                                nameEn: card.name_en,
                                symbol: cardSymbol(card),
                                keywords: card.keywords_vn,
                                body: readStatus === "reading" ? null : reading,
                                eyebrow: "Thông điệp hôm nay",
                            }}
                        />

                        {/*
                         * The book meaning, kept below the reading.
                         *
                         * Short, instant, and there even when the model
                         * is not — which is the point of keeping it.
                         *
                         * Upright only: the daily card is always drawn
                         * upright, so printing the reversed meaning
                         * would offer a reading that was never dealt.
                         */}
                        <div className="rounded-3xl border border-ink/8 bg-canvas p-5">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-600">
                                <ArrowUp
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                                Nghĩa xuôi
                            </p>

                            <p className="mt-2 text-sm leading-7 text-ink-soft">
                                {card.upright_vn}
                            </p>
                        </div>

                        <p className="text-center text-[11px] text-ink-soft/70">
                            {card.arcana === "major"
                                ? "Ẩn chính"
                                : `Ẩn phụ · ${
                                      card.suit ? SUIT_LABEL[card.suit].vi : ""
                                  }`}
                        </p>
                    </div>
                )}
            </BottomSheet>
        </Screen>
    );
}
