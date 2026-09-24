"use client";

import { motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    TarotCard,
    type CardTransform,
    type TarotCardData,
} from "./tarot-card";

interface TarotDeckProps {
    /**
     * The cards that were drawn, in slot order.
     *
     * The user picks positions in the fan. The Nth pick
     * always lands on the Nth drawn card, so the deck
     * never has to know the whole 78 card deck.
     */
    cards: TarotCardData[];

    /**
     * Number of face down cards in the fan.
     */
    fanSize?: number;

    /**
     * Fan positions already picked, in order, and the slots
     * that have finished turning over.
     *
     * Owned by the caller. Local state here would be lost the
     * moment the user navigates away from the screen.
     */
    picks: number[];
    flipped: number[];

    onPick: (fanIndex: number) => void;

    /**
     * Sits on the progress row while the draw is unfinished.
     */
    action?: ReactNode;

    /**
     * Takes over the gap between the slots and the fan once
     * every card has been picked, replacing the hint that
     * was pointing down at the deck.
     */
    actions?: ReactNode;
}

/**
 * Geometry, in pixels, relative to the centre
 * of the stage.
 */
/**
 * Sized so the whole draw fits a 812pt phone without
 * scrolling, once the header, tabs, progress row and the
 * space reserved for the bottom bar are accounted for.
 *
 * Three bands, each separated by roughly 24pt of air:
 *
 *   slots        top
 *   hint or the actions that replace it
 *   fan          bottom, running off both edges
 */
const STAGE_HEIGHT = 470;

const SLOT_Y = -148;
const FAN_Y = 106;

/**
 * Distance between slot centres.
 *
 * 109 rather than 104 since the cards went to a true 2:3 and grew
 * from 95 to 100 wide. The 9px of air between slots is the same as
 * before; only the card changed.
 */
const SLOT_GAP = 109;

/**
 * Outward tilt of the flanking slots in a three card spread.
 *
 * Kept at 6 degrees on purpose. A 100x150 card tilted that far
 * grows to about 115px wide against a 109px gap, so the corners
 * come close without the slots reading as overlapping. Push it
 * much further and they do.
 */
const SLOT_TILT = 6;

/**
 * How far the centre slot rides above its neighbours.
 *
 * Together with the tilt this turns a flat row into a
 * shallow arch. Only the middle moves; the outer slots
 * stay on the base line.
 */
const SLOT_LIFT = 10;
/**
 * The fan is deliberately wider than a phone.
 *
 * Outer cards run past both edges and get clipped by the
 * viewport, so the deck reads as far bigger than the screen
 * rather than a tidy row that happens to fit.
 */
const FAN_SPREAD = 230;
const FAN_ARC = 30;
const FAN_TILT = 22;

export function TarotDeck({
    cards,
    fanSize = 17,
    picks,
    flipped,
    onPick,
    action,
    actions,
}: TarotDeckProps) {
    const slotCount = cards.length;

    const done = picks.length === slotCount;

    /**
     * The unpicked backs wait a tick before they mount.
     *
     * Seventeen cards, each a rotated 3D layer carrying its own
     * artwork, are the most expensive thing to paint on this screen,
     * and a browser shows nothing at all until the whole frame is
     * painted. Rendering them in the same commit as a navigation is
     * what makes the Tarot tab feel like it hangs before it switches.
     *
     * Deliberately not deferred: the slots, the hint, and any cards
     * already picked. Those are cheap, and they are what makes the
     * screen recognisable the instant it arrives.
     *
     * A timer rather than requestAnimationFrame, which does not fire
     * in a backgrounded tab — a fan that never appears would be far
     * worse than one that appears a frame late.
     */
    const [fanReady, setFanReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setFanReady(true), 0);

        return () => clearTimeout(timer);
    }, []);

    /** Centre x of slot i. */
    const slotX = useCallback(
        (index: number) => (index - (slotCount - 1) / 2) * SLOT_GAP,
        [slotCount],
    );

    /** Centre y of slot i. The middle one sits highest. */
    const slotY = useCallback(
        (index: number) => {
            if (slotCount < 3) return SLOT_Y;

            const peak = (slotCount - 1) / 2;
            const distance = Math.abs(index - peak);

            return SLOT_Y - (peak - distance) * SLOT_LIFT;
        },
        [slotCount],
    );

    /**
     * Slots fan outwards from the middle.
     * A single card spread stays upright.
     */
    const slotRotate = useCallback(
        (index: number) => {
            if (slotCount < 2) return 0;

            return (index - (slotCount - 1) / 2) * SLOT_TILT;
        },
        [slotCount],
    );

    /** Fan placement for a card that has not been picked. */
    const fanTransform = useCallback(
        (index: number): CardTransform => {
            const t = fanSize === 1 ? 0 : (index / (fanSize - 1)) * 2 - 1;

            return {
                x: t * FAN_SPREAD,
                y: FAN_Y + t * t * FAN_ARC,
                rotate: t * FAN_TILT,
                scale: 1,
                zIndex: 10 + index,
            };
        },
        [fanSize],
    );

    const fanIndexes = useMemo(
        () => Array.from({ length: fanSize }, (_, i) => i),
        [fanSize],
    );

    return (
        <div className="w-full">
            {/* ==========================================
          STAGE
      =========================================== */}

            <div
                className="relative mx-auto w-full select-none"
                style={{ height: STAGE_HEIGHT }}
            >
                {/* ------------------------------------
            Empty slot outlines
        ------------------------------------- */}

                {Array.from({ length: slotCount }).map((_, index) => {
                    const filled = index < picks.length;

                    return (
                        <div
                            key={`slot-${index}`}
                            className="absolute left-1/2 top-1/2"
                            style={{
                                transform: `translate(calc(-50% + ${slotX(
                                    index,
                                )}px), calc(-50% + ${slotY(
                                    index,
                                )}px)) rotate(${slotRotate(index)}deg)`,
                                zIndex: 1,
                            }}
                        >
                            <div
                                className={`
                    flex
                    h-[150px]
                    w-[100px]
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    rounded-xl
                    border-2
                    border-dashed
                    transition-colors
                    duration-300

                    ${
                        filled
                            ? "border-transparent"
                            : "border-white/25 bg-white/[0.04]"
                    }
                  `}
                            >
                                {!filled && (
                                    <>
                                        <Sparkle
                                            className="h-5 w-5 text-white/30"
                                            aria-hidden="true"
                                        />

                                        {cards[index]?.position && (
                                            <span className="px-1 text-center text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">
                                                {cards[index].position}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* ------------------------------------
            Fan divider
        ------------------------------------- */}

                {!done && (
                    <motion.div
                        className="
              pointer-events-none
              absolute
              inset-x-0

              flex
              flex-col
              items-center
              gap-1.5
            "
                        /* No transform here. Framer owns it below. */
                        style={{ top: "calc(50% - 35px)" }}
                        animate={{
                            y: [0, 7, 0],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        {/* Points down at the fan. */}
                        <svg
                            width="15"
                            height="11"
                            viewBox="0 0 15 11"
                            className="text-magic-gold drop-shadow-[0_2px_4px_rgba(26,10,74,0.5)]"
                            aria-hidden="true"
                        >
                            <path d="M7.5 11 L0 0 H15 Z" fill="currentColor" />
                        </svg>
                    </motion.div>
                )}

                {/* ------------------------------------
            Actions, once the draw is complete

            Same spot the hint just vacated, so the eye
            is already there.
        ------------------------------------- */}

                {done && actions && (
                    <motion.div
                        className="
              absolute
              inset-x-0
              z-50

              flex
              items-center
              justify-center
              gap-3
            "
                        style={{ top: "calc(50% - 45px)" }}
                        initial={{ opacity: 0, scale: 0.85, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 26,
                        }}
                    >
                        {actions}
                    </motion.div>
                )}

                {/* ------------------------------------
            Cards
        ------------------------------------- */}

                {fanIndexes.map((fanIndex) => {
                    const slot = picks.indexOf(fanIndex);
                    const isPicked = slot !== -1;

                    // Picked cards always render. The fan follows.
                    if (!isPicked && !fanReady) return null;

                    /**
                     * A picked card takes on the identity of the
                     * drawn card for its slot. An unpicked one is
                     * an anonymous back.
                     */
                    const card: TarotCardData = isPicked
                        ? cards[slot]
                        : {
                              id: `back-${fanIndex}`,
                              name: "",
                              image: "",
                          };

                    const transform: CardTransform = isPicked
                        ? {
                              x: slotX(slot),
                              y: slotY(slot),
                              rotate: slotRotate(slot),
                              scale: 1,
                              zIndex: 40 + slot,
                          }
                        : fanTransform(fanIndex);

                    return (
                        <TarotCard
                            key={fanIndex}
                            card={card}
                            offset={0}
                            size="sm"
                            transform={transform}
                            isSelected={false}
                            isRevealed={isPicked && flipped.includes(slot)}
                            onClick={() => onPick(fanIndex)}
                        />
                    );
                })}
            </div>

            {/* ==========================================
          PROGRESS
      =========================================== */}
        </div>
    );
}
