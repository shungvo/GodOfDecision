"use client";

import { motion } from "framer-motion";
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ChevronLeft,
    LogIn,
    RefreshCw,
    ScrollText,
    X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Screen } from "@/components/layout/screen";
import {
    SingleSpreadIcon,
    ThreeSpreadIcon,
} from "@/components/tarot/spread-icons";
import { StoryShareButton } from "@/components/share/story-share-button";
import { DrawnCardsStrip } from "@/components/tarot/drawn-cards-strip";
import { OracleAvatar } from "@/components/tarot/oracle-avatar";
import { TarotDeck } from "@/components/tarot/tarot-deck";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { IconButton } from "@/components/ui/icon-button";
import { useTypewriter } from "@/hooks/use-typewriter";
import { cardSymbol, toDeckCard } from "@/lib/tarot";
import type { StoryCard } from "@/lib/story-card";
import { TOPICS, TOPIC_BY_ID } from "@/lib/topics";
import { useTarotStore } from "@/stores/tarot.store";
import { POSITION_LABEL, type Spread, type Topic } from "@/types/tarot";

const SPREADS = [
    { value: "three" as Spread, label: "Ba lá", icon: ThreeSpreadIcon },
    { value: "single" as Spread, label: "Một lá", icon: SingleSpreadIcon },
];

export default function TarotPage() {
    const spread = useTarotStore((state) => state.spread);
    const lang = useTarotStore((state) => state.lang);
    const drawId = useTarotStore((state) => state.drawId);
    const drawStatus = useTarotStore((state) => state.drawStatus);
    const cards = useTarotStore((state) => state.cards);
    const drawError = useTarotStore((state) => state.drawError);
    const picks = useTarotStore((state) => state.picks);
    const flipped = useTarotStore((state) => state.flipped);
    const completed = useTarotStore((state) => state.completed);
    const topic = useTarotStore((state) => state.topic);
    const readStatus = useTarotStore((state) => state.readStatus);
    const interpretation = useTarotStore((state) => state.interpretation);
    const readError = useTarotStore((state) => state.readError);
    const readErrorStatus = useTarotStore((state) => state.readErrorStatus);

    const setSpread = useTarotStore((state) => state.setSpread);
    const draw = useTarotStore((state) => state.draw);
    const pick = useTarotStore((state) => state.pick);
    const chooseTopic = useTarotStore((state) => state.chooseTopic);
    const clearTopic = useTarotStore((state) => state.clearTopic);
    const reset = useTarotStore((state) => state.reset);

    const [sheetOpen, setSheetOpen] = useState(false);

    /**
     * Highlighted in the grid but not sent yet. Reading costs
     * an AI call, so it waits for an explicit confirm.
     */
    const [pendingTopic, setPendingTopic] = useState<Topic | null>(null);

    /** Deal a spread as soon as the screen is opened. */
    useEffect(() => {
        if (useTarotStore.getState().drawStatus === "idle") {
            void draw();
        }
    }, [draw]);

    const deckCards = useMemo(
        () => cards.map((card) => toDeckCard(card, lang)),
        [cards, lang],
    );

    /**
     * The sheet lets itself in when the last card lands, and
     * only then.
     *
     * Seeded with the current value so returning to a finished
     * draw does not reopen it; the user already dealt with it.
     */
    const wasCompleted = useRef(completed);

    useEffect(() => {
        const justFinished = completed && !wasCompleted.current;

        wasCompleted.current = completed;

        if (!justFinished) return;

        const timer = setTimeout(() => setSheetOpen(true), 600);

        return () => clearTimeout(timer);
    }, [completed]);

    const { text: typedReading, typing } = useTypewriter(interpretation ?? "");

    const isDrawing = drawStatus === "drawing";

    function redraw() {
        setSheetOpen(false);
        setPendingTopic(null);
        reset();
    }
    const activeTopic = topic ? TOPIC_BY_ID[topic] : null;

    /**
     * The spread, as a story picture.
     *
     * A three card draw has no single card to headline, so the life
     * aspect takes that place and the card names become the pills —
     * which is what the reading is actually about. A one card draw
     * headlines the card itself, because there it is the subject.
     */
    const storyCard: StoryCard | null =
        completed && cards.length > 0
            ? cards.length === 1
                ? {
                      kind: "tarot",
                      name: cards[0].name.vi,
                      nameEn: cards[0].name.en,
                      symbol: cardSymbol(cards[0]),
                      keywords: cards[0].keywords.vi,
                      body: readStatus === "reading" ? null : interpretation,
                      eyebrow: activeTopic?.label ?? "Lá của bạn",
                  }
                : {
                      kind: "tarot",
                      name: activeTopic?.label ?? "Ba lá của bạn",
                      nameEn: "",
                      symbol: "✦",
                      keywords: cards.map((entry) => entry.name.vi),
                      body: readStatus === "reading" ? null : interpretation,
                      eyebrow: "Trải ba lá",
                  }
            : null;

    /*
     * No page title on Screen here. The app bar already names the app
     * and the active tab already says Tarot, so a third heading above
     * "Chọn ba lá bài" only pushed the deck down the screen.
     */
    return (
        <Screen>
            {/* ==============================================
          SPREAD TABS
      =============================================== */}

            <div className="mb-5 flex justify-center">
                <div
                    role="tablist"
                    aria-label="Kiểu trải bài"
                    className="inline-flex gap-1 rounded-full glass p-1"
                >
                    {SPREADS.map((option) => {
                        const active = spread === option.value;
                        const OptionIcon = option.icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                aria-label={option.label}
                                title={option.label}
                                onClick={() => setSpread(option.value)}
                                disabled={isDrawing}
                                className="
                    relative
                    inline-flex
                    h-11
                    w-16
                    items-center
                    justify-center

                    rounded-full

                    transition
                    disabled:opacity-60
                  "
                            >
                                {active && (
                                    <motion.span
                                        layoutId="spread-tab"
                                        className="absolute inset-0 rounded-full surface bg-white shadow-e2"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 32,
                                        }}
                                    />
                                )}

                                <OptionIcon
                                    className={`relative z-10 transition-colors ${
                                        active
                                            ? "text-primary-600"
                                            : "text-white/65"
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ==============================================
          WHAT THIS SCREEN WANTS FROM YOU
      =============================================== */}

            <div className="mb-5 text-center">
                <h2 className="text-[17px] font-extrabold tracking-tight text-white">
                    {completed
                        ? spread === "three"
                            ? "Ba lá của bạn"
                            : "Lá của bạn"
                        : spread === "three"
                          ? "Chọn ba lá bài"
                          : "Chọn một lá bài"}
                </h2>

                <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-5 text-white/55">
                    Đừng cân nhắc lâu, hãy chọn theo cảm giác đầu tiên
                </p>
            </div>

            {/* ==============================================
          TABLE
      =============================================== */}

            {drawStatus === "error" ? (
                <div className="rounded-3xl border border-magic-gold/40 bg-magic-gold/15 px-5 py-6 text-center">
                    <p className="text-sm leading-6 text-magic-gold">
                        {drawError}
                    </p>

                    <button
                        type="button"
                        onClick={() => void draw()}
                        className="mt-4 inline-flex items-center gap-2 rounded-[18px] bg-magic-gold px-5 py-3 text-sm font-bold text-[#3d2600] transition active:scale-95"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Thử lại
                    </button>
                </div>
            ) : isDrawing || cards.length === 0 ? (
                <div className="flex h-[430px] flex-col items-center justify-center gap-4">
                    <RefreshCw
                        className="h-6 w-6 animate-spin text-white/50"
                        aria-hidden="true"
                    />

                    <p className="text-sm text-white/50">Đang xáo bài…</p>
                </div>
            ) : (
                <TarotDeck
                    key={drawId}
                    cards={deckCards}
                    fanSize={17}
                    picks={picks}
                    flipped={flipped}
                    onPick={pick}
                    action={completed ? undefined : <></>}
                    actions={
                        <>
                            <IconButton
                                icon={ScrollText}
                                label="Chọn khía cạnh để luận bài"
                                tone="gold"
                                className="h-8 w-8 text-black/80 bg-white"
                                onClick={() => {
                                    if (completed) setSheetOpen(true);
                                }}
                            />

                            <IconButton
                                icon={RefreshCw}
                                label="Rút lại bộ bài khác"
                                onClick={redraw}
                                disabled={isDrawing}
                                className="h-8 w-8"
                                spinning={isDrawing}
                            />
                        </>
                    }
                />
            )}

            {/* ==============================================
          SHEET

          One sheet, two states. Picking a topic swaps the
          body rather than stacking another sheet on top.
      =============================================== */}

            <BottomSheet
                open={sheetOpen && completed}
                onOpenChange={setSheetOpen}
                title={
                    activeTopic
                        ? activeTopic.label
                        : "Bạn muốn xem khía cạnh nào?"
                }
                description={
                    activeTopic ? (
                        <button
                            type="button"
                            onClick={clearTopic}
                            /* The header doubles as the drag handle,
                               so this must not start a drag. */
                            onPointerDown={(event) => event.stopPropagation()}
                            className="
                mt-0.5
                inline-flex
                items-center
                gap-1

                rounded-full
                bg-secondary-100/70

                py-1.5
                px-0
                text-xs
                font-bold
                text-primary-700

                transition
                bg-transparent
                active:scale-95
              "
                        >
                            <ChevronLeft
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            Đổi khía cạnh
                        </button>
                    ) : (
                        "Chọn khía cạnh cuộc sống bạn muốn soi"
                    )
                }
                snapPoints={[0.92]}
                initialSnap={1}
                footer={
                    !activeTopic ? (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                aria-label="Đóng"
                                onClick={() => setSheetOpen(false)}
                                className="
                inline-flex
                h-[52px]
                w-[52px]
                shrink-0
                items-center
                justify-center

                rounded-[20px]
                border
                border-ink/10
                bg-canvas

                text-ink-soft

                transition
                hover:bg-secondary-100/40
                active:scale-95
              "
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>

                            <button
                                type="button"
                                disabled={!pendingTopic}
                                onClick={() => {
                                    if (pendingTopic) {
                                        void chooseTopic(pendingTopic);
                                    }
                                }}
                                className="
                inline-flex
                h-[52px]
                flex-1
                items-center
                justify-center
                gap-2.5

                rounded-[20px]
                bg-magic-gold
                px-6

                text-[15px]
                font-bold
                text-[#3d2600]

                shadow-e3

                transition
                hover:brightness-105
                active:scale-[0.98]

                disabled:cursor-not-allowed
                disabled:bg-ink/10
                disabled:text-ink-soft
                disabled:shadow-none
                disabled:active:scale-100
              "
                            >
                                Luận bài
                                <ArrowRight
                                    className="h-[18px] w-[18px]"
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setSheetOpen(false)}
                            className="
                inline-flex
                h-[52px]
                w-full
                items-center
                justify-center

                rounded-[20px]
                border
                border-ink/10
                bg-canvas

                text-[15px]
                font-bold
                text-ink

                transition
                hover:bg-secondary-100/40
                active:scale-[0.98]
              "
                        >
                            Xong
                        </button>
                    )
                }
                art={<OracleAvatar />}
            >
                {/* Above the swap, so the spread stays put while
                    the body changes underneath it. */}
                <div className="mb-5">
                    <DrawnCardsStrip cards={cards} lang={lang} />
                </div>

                {/*
                 * Deliberately not an AnimatePresence swap. Gating
                 * the reading behind the grid's exit animation means
                 * one stalled animation hides the whole result.
                 */}

                {/* ---------------- TOPIC GRID ---------------- */}

                {!activeTopic && (
                    <motion.div
                        key="topics"
                        className="pb-8"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        <div className="flex flex-row flex-wrap gap-3">
                            {TOPICS.map((option) => {
                                const TopicIcon = option.icon;
                                const chosen = pendingTopic === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        aria-pressed={chosen}
                                        onClick={() =>
                                            setPendingTopic(option.id)
                                        }
                                        className={`
                        flex
                        
                        flex-row
                        items-center
                        gap-3

                        rounded-3xl
                        border

                        px-2
                        py-1.5
                        text-left

                        transition
                        active:scale-[0.99]

                        ${
                            chosen
                                ? "border-primary-600 bg-secondary-100/60 ring-2 ring-primary-600/25"
                                : "border-ink/8 bg-canvas hover:border-primary-600/30 hover:bg-secondary-100/30"
                        }
                      `}
                                    >
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition ${
                                                chosen
                                                    ? "bg-primary-600"
                                                    : "bg-secondary-100"
                                            }`}
                                        >
                                            <TopicIcon
                                                className={`h-5 w-5 ${
                                                    chosen
                                                        ? "text-white"
                                                        : "text-primary-700"
                                                }`}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <span className="block text-[15px] font-bold text-ink">
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ---------------- READING ---------------- */}

                {activeTopic && (
                    <motion.div
                        key="reading"
                        className="space-y-5 pb-8"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        {/* AI reading */}

                        {/*
                                Same box the reading lands in, so the
                                first words replace the placeholder
                                without shifting anything.
                             */}
                        {readStatus === "reading" && !typedReading && (
                            <div className="rounded-3xl">
                                {/* One bar for the heading, then
                                            the body. Same shapes, same
                                            tone as what replaces them. */}
                                <Skeleton
                                    tone="light"
                                    className="h-7 w-[68%] rounded-lg"
                                />

                                <SkeletonText
                                    lines={9}
                                    tone="light"
                                    className="mt-4"
                                    lineClassName="h-4"
                                    label="Vị thần đang đọc bài"
                                />
                            </div>
                        )}

                        {typedReading && (
                            <div className="rounded-3xl">
                                <h3 className="text-[24px] font-bold text-ink">
                                    Thông điệp dành cho bạn
                                </h3>
                                <p className="whitespace-pre-wrap text-[15px] leading-7 text-black/80">
                                    {typedReading}

                                    {(typing || readStatus === "reading") && (
                                        <motion.span
                                            className="ml-0.5 inline-block h-[15px] w-[3px] translate-y-[2px] rounded-full bg-magic-gold"
                                            animate={{
                                                opacity: [1, 0.15, 1],
                                            }}
                                            transition={{
                                                duration: 0.9,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            aria-hidden="true"
                                        />
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Directly under what it shares. */}
                        {typedReading && <StoryShareButton card={storyCard} />}

                        {readStatus !== "reading" &&
                            !interpretation &&
                            readError && (
                                <div className="rounded-3xl border border-magic-gold/40 bg-magic-gold/10 p-5">
                                    {readErrorStatus === 401 ? (
                                        /* Not a fault — the reading is
                                           behind the door. Say so and
                                           hold it open. */
                                        <>
                                            <p className="text-sm leading-6 text-[#92400e]">
                                                {readError} Ý nghĩa từng lá ở
                                                dưới vẫn miễn phí.
                                            </p>

                                            <Link
                                                href="/login?next=/tarot"
                                                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-magic-gold px-4 py-2.5 text-sm font-bold text-[#3d2600] transition active:scale-95"
                                            >
                                                <LogIn
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                Đăng nhập
                                            </Link>
                                        </>
                                    ) : (
                                        <p className="text-sm leading-6 text-[#92400e]">
                                            Vị thần đang im lặng, nên chưa có
                                            lời luận cho khía cạnh này. Ý nghĩa
                                            từng lá ở dưới vẫn còn nguyên.
                                        </p>
                                    )}
                                </div>
                            )}

                        {/* Cards */}

                        <div className="space-y-3">
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className="rounded-3xl border border-ink/8 bg-canvas p-4"
                                >
                                    <div className="flex items-baseline justify-between gap-3">
                                        <h4 className="text-[15px] font-bold text-ink">
                                            {lang === "en"
                                                ? card.name.en
                                                : card.name.vi}
                                        </h4>

                                        {card.position && (
                                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-600">
                                                {
                                                    POSITION_LABEL[
                                                        card.position
                                                    ][lang]
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#b45309]">
                                        {card.orientation === "reversed" ? (
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
                                        <span className="text-ink-soft">
                                            {" · "}
                                            {(lang === "en"
                                                ? card.keywords.en
                                                : card.keywords.vi
                                            ).join(" · ")}
                                        </span>
                                    </p>

                                    <p className="mt-2.5 text-sm leading-6 text-ink-soft">
                                        {lang === "en"
                                            ? card.meaning.en
                                            : card.meaning.vi}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </BottomSheet>
        </Screen>
    );
}
