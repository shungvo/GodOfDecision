"use client";

import {
    motion,
    useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { GREETING_HEIGHT, HomeGreeting } from "@/components/home/home-greeting";
import { LumiBubble } from "@/components/home/lumi-bubble";
import { RevealBurst } from "@/components/home/reveal-burst";
import { Lumi } from "@/components/mascot/lumi";
import { lumiLine } from "@/lib/lumi-lines";
import { cardNumeral } from "@/lib/tarot";
import { cn } from "@/lib/utils";
import type { TarotCardEntry } from "@/types/tarot";

/** How long the press has to be held before the card turns. */
const HOLD_MS = 900;

/** How quickly a released press unwinds. */
const RELEASE_MS = 220;

/** Clearance from each edge of the screen. */
const EDGE_GAP = 12;

/**
 * Height held aside under the card for the hint.
 *
 * Fixed, so the card does not shift when the hint goes away on the
 * turn. Two lines' worth, since the failure message wraps.
 */
const HINT_HEIGHT = 44;

/**
 * Everything above and below the card that it cannot have.
 *
 * app bar (56) + its margin (24) + air above the hint (16)
 * + the hint slot + the space Screen keeps for the tab bar (64)
 */
const CHROME = 56 + 24 + GREETING_HEIGHT + 16 + HINT_HEIGHT + 64;

/** When, into the 900ms flip, the stars burst: as the face comes round. */
const BURST_AT_MS = 380;

/**
 * As wide as the screen allows — but the height budget decides.
 *
 * A 2:3 card at nearly full phone width is around 550px tall, which
 * is most of a phone. So width cannot simply be `100vw - gap`: it has
 * to come from whatever height is left once the chrome has taken its
 * share, or the card runs off the bottom of the screen.
 *
 * On a 393x793 device the two terms land within a few pixels of each
 * other, so the card really does reach the edges. On a short viewport
 * — Safari with its toolbars — the height term wins and the card
 * quietly gets smaller instead of overflowing.
 */
const CARD_WIDTH = `min(
    calc(100vw - ${EDGE_GAP * 2}px),
    calc((100dvh - ${CHROME}px - env(safe-area-inset-bottom)) * 2 / 3)
)`;

interface DailyCardProps {
    card: TarotCardEntry | null;
    revealed: boolean;
    failed?: boolean;

    onReveal: () => void;

    /** Asked for by a tap once the card is face up. */
    onOpenMeaning: () => void;
}

/**
 * Today's card.
 *
 * Two gestures, and which one applies depends only on which way up the
 * card is:
 *
 *   face down  press and hold to turn it
 *   face up    tap to read what it means
 *
 * Turning it is a hold rather than a tap because it happens once a day
 * and cannot be undone. A tap is something you do to a button by
 * accident; holding is a small deliberate act, and the charge that
 * builds under the finger is the screen's only real animation. Reading
 * the meaning is reversible, so that one is just a tap.
 */
export function DailyCard({
    card,
    revealed,
    failed,
    onReveal,
    onOpenMeaning,
}: DailyCardProps) {
    const [holding, setHolding] = useState(false);

    const timer = useRef<number | null>(null);

    const reduced = useReducedMotion();

    /** Set on the turn this visit, so Lumi can react to it. */
    const [justRevealed, setJustRevealed] = useState(false);

    /** Non-null while the reveal celebration is on screen. */
    const [burst, setBurst] = useState<number | null>(null);
    const burstTimers = useRef<number[]>([]);

    useEffect(
        () => () =>
            burstTimers.current.forEach((id) => window.clearTimeout(id)),
        [],
    );

    function celebrate() {
        setJustRevealed(true);

        if (reduced) return;

        burstTimers.current.push(
            window.setTimeout(() => {
                setBurst(Date.now());

                if ("vibrate" in navigator) {
                    try {
                        navigator.vibrate([14, 40, 24]);
                    } catch {
                        /* unsupported */
                    }
                }
            }, BURST_AT_MS),
            window.setTimeout(() => setBurst(null), BURST_AT_MS + 1700),
        );
    }

    /**
     * Set when a hold completes, cleared by the click that follows it.
     *
     * Releasing the finger after a hold still fires a click, and by
     * then the card is face up — so the click handler would read that
     * as "tap a face up card" and open the sheet on the spot, on top of
     * the turn. The sheet is meant to arrive after the card has had a
     * chance to flip.
     */
    const swallowNextClick = useRef(false);

    /** There is a card to act on at all. */
    const live = Boolean(card);

    /** Holding would turn it over. Only true while it is face down. */
    const canTurn = live && !revealed;

    function clear() {
        if (timer.current === null) return;

        window.clearTimeout(timer.current);
        timer.current = null;
    }

    function start() {
        if (!canTurn) return;

        setHolding(true);

        timer.current = window.setTimeout(() => {
            timer.current = null;
            setHolding(false);
            swallowNextClick.current = true;
            onReveal();
            celebrate();
        }, HOLD_MS);
    }

    function cancel() {
        clear();
        setHolding(false);
    }

    useEffect(() => clear, []);

    const hint = failed
        ? "Không mở được sách, thử lại sau nhé"
        : !card
          ? "Đang mở sách…"
          : revealed
            ? "Chạm vào lá bài để xem ý nghĩa"
            : holding
              ? "Giữ thêm một chút…"
              : "Giữ để mở lá bài hôm nay";

    const lumiSays = failed
        ? lumiLine("error")
        : !card
          ? null
          : lumiLine(
                holding
                    ? "daily_holding"
                    : !revealed
                      ? "daily_idle"
                      : justRevealed
                        ? "daily_revealed"
                        : "daily_return",
                { seed: card.slug },
            );

    return (
        /*
         * Card and reserved area together form a block of constant
         * height, so centring the block pins the card. Nothing that
         * appears after the turn can move it, and the text still sits
         * right under the card instead of drifting away from it.
         */
        <div className="flex w-full flex-1 flex-col items-center justify-center">
            <HomeGreeting />

            {/* ==========================================
          CARD
      =========================================== */}

            <div className="relative">
                {/* Idle float. Paused while held, so the charge
                    reads as the card settling into the finger. */}
                <motion.div
                    animate={reduced || holding ? { y: 0 } : { y: [0, -7, 0] }}
                    transition={
                        reduced || holding
                            ? { duration: 0.3 }
                            : {
                                  duration: 4.2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                              }
                    }
                >
                    <div>
                        <button
                            type="button"
                            disabled={!live}
                            aria-label={
                                revealed && card
                                    ? `${card.name_vn} — chạm để xem ý nghĩa`
                                    : "Giữ để mở lá bài hôm nay"
                            }
                            onPointerDown={start}
                            onPointerUp={cancel}
                            onPointerLeave={cancel}
                            onPointerCancel={cancel}
                            /*
                             * Only the face up card answers a click. Face down it
                             * is the hold timer that turns the card, so a plain tap
                             * has to do nothing — otherwise the gesture the hint
                             * asks for would be beside the point.
                             */
                            onClick={() => {
                                if (swallowNextClick.current) {
                                    swallowNextClick.current = false;
                                    return;
                                }

                                if (revealed) onOpenMeaning();
                            }}
                            /* Hold is a pointer gesture, so the keyboard gets a
                   plain activation instead of being asked to hold a
                   key down. */
                            onKeyDown={(event) => {
                                if (
                                    event.key !== "Enter" &&
                                    event.key !== " "
                                ) {
                                    return;
                                }

                                // Stops the browser turning this into a click as
                                // well, which would run both branches.
                                event.preventDefault();

                                if (revealed) {
                                    onOpenMeaning();
                                    return;
                                }

                                if (canTurn) onReveal();
                            }}
                            className="
          relative
          select-none
          [-webkit-touch-callout:none]
          outline-none
          disabled:cursor-default
          focus-visible:ring-2
          focus-visible:ring-white/50
          focus-visible:ring-offset-4
          focus-visible:ring-offset-transparent

          /* Matches the corner the artwork rounds itself to:
             roughly 7% of the card's width. */
          rounded-[16px]
        "
                            style={{
                                touchAction: "manipulation",
                                width: CARD_WIDTH,
                            }}
                        >
                            {/* Idle breath. Decoration only: if this animation
                    never runs, the card is still fully visible. */}
                            {!revealed && (
                                <motion.span
                                    className="pointer-events-none absolute -inset-6 -z-10 rounded-[44px] bg-secondary-300/25 blur-2xl"
                                    animate={{ opacity: [0.45, 0.9, 0.45] }}
                                    transition={{
                                        duration: 3.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    aria-hidden="true"
                                />
                            )}

                            {/* Charge. Grows for exactly as long as the hold
                    needs, so the finger can see how far it has got. */}
                            <span
                                className="pointer-events-none absolute -inset-6 -z-10 rounded-[44px] bg-secondary-300/45 blur-2xl transition-opacity ease-out"
                                style={{
                                    opacity: holding ? 1 : 0,
                                    transitionDuration: `${
                                        holding ? HOLD_MS : RELEASE_MS
                                    }ms`,
                                }}
                                aria-hidden="true"
                            />

                            <span
                                className="pointer-events-none absolute -inset-[5px] rounded-[21px] border border-white/70 transition-opacity ease-out"
                                style={{
                                    opacity: holding ? 1 : 0,
                                    transitionDuration: `${
                                        holding ? HOLD_MS : RELEASE_MS
                                    }ms`,
                                }}
                                aria-hidden="true"
                            />

                            {/* Pressing in */}
                            <span
                                className="block transition-transform ease-out"
                                style={{
                                    transform: holding
                                        ? "scale(0.96)"
                                        : "scale(1)",
                                    transitionDuration: `${
                                        holding ? HOLD_MS : RELEASE_MS
                                    }ms`,
                                }}
                            >
                                <motion.span
                                    className="relative block aspect-[2/3] w-full"
                                    style={{ transformStyle: "preserve-3d" }}
                                    animate={{ rotateY: revealed ? 180 : 0 }}
                                    transition={{
                                        duration: 0.9,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <CardBackHero />
                                    <CardFaceHero card={card} />
                                </motion.span>

                            </span>
                        </button>
                    </div>
                </motion.div>

                {burst !== null && <RevealBurst seed={burst} />}

                <LumiBubble
                    message={lumiSays}
                    sticky={holding}
                    className="-right-1 bottom-[150px] z-10"
                />

                {/* Lumi keeps the card company from its lower corner.
                Pointer-transparent, so the hold gesture still lands
                on the card underneath. */}
                <Lumi className="absolute -bottom-3 -right-4 h-44 w-36" />
            </div>

            {/* ==========================================
          HINT

          Fixed height, so the card stays exactly where it
          is when the hint disappears on the turn.
      =========================================== */}

            <div className="w-full pt-4" style={{ height: HINT_HEIGHT }}>
                {!revealed && hint && (
                    <p
                        className={cn(
                            "mx-auto max-w-[240px] text-center text-[13px] font-semibold leading-5",
                            failed ? "text-white/45" : "text-white/70",
                        )}
                    >
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ==============================================================
   BACK
   ============================================================== */

function CardBackHero() {
    return (
        <span
            className="absolute inset-0 block"
            style={{ backfaceVisibility: "hidden" }}
        >
            {/*
             * Nothing is drawn around the artwork: no border, no
             * background, no clipping. It carries its own gold frame
             * and its own rounded corners in the alpha channel, so a
             * box on top of it could only ever be slightly wrong.
             * The glow behind the card does the separating instead.
             */}
            <Image
                src="/images/card.webp"
                alt=""
                fill
                sizes="(max-width: 480px) 100vw, 380px"
                priority
                draggable={false}
                className="object-contain"
            />
        </span>
    );
}

/* ==============================================================
   FACE
   ============================================================== */

function CardFaceHero({ card }: { card: TarotCardEntry | null }) {
    return (
        <span
            className="
        absolute
        inset-0
        block
        overflow-hidden

        /* Same corner as the artwork on the back, so the card does
           not change shape halfway through the turn. */
        rounded-[16px]

        border
        border-white/70

        surface bg-white

        shadow-e4
      "
            style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
            }}
        >
            <span className="pointer-events-none absolute left-1/2 top-[30%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-200/40 blur-3xl" />

            <span className="absolute inset-3 rounded-[8px] border border-primary-600/15" />

            {/*
             * Only what a card has printed on it: its number and its
             * name. The meaning is a sheet away — a card face is not
             * where a paragraph belongs, and keeping it off means the
             * face reads the same at any size.
             */}
            <span className="absolute inset-x-6 inset-y-8 flex flex-col items-center text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-600/70">
                    Lá bài hôm nay
                </span>

                {/* Medallion. A numeral rather than a suit emoji: the
                    emoji renders as a glossy 3D object on iOS, which
                    fights everything else on this card. */}
                <span className="my-auto flex h-[96px] w-[96px] items-center justify-center rounded-full border border-primary-600/25 bg-white/70">
                    <span className="text-[34px] font-extrabold tracking-tight text-primary-700">
                        {card ? cardNumeral(card) : "✦"}
                    </span>
                </span>

                <span className="block text-[24px] font-extrabold leading-8 text-ink">
                    {card?.name_vn ?? "—"}
                </span>
            </span>
        </span>
    );
}
