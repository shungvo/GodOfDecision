"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TarotCardData {
    id: string;
    name: string;
    image: string;
    description?: string;

    /**
     * Spread position label.
     *
     * Example:
     * "Quá khứ"
     */
    position?: string;

    /**
     * Drawn orientation.
     *
     * A reversed card is shown upside down.
     */
    orientation?: "upright" | "reversed";

    /**
     * Shown on the fallback face when the
     * artwork is missing.
     */
    symbol?: string;
}

/**
 * Parent controlled placement.
 *
 * When present the card stops deriving its own
 * position from `offset` and stops being draggable.
 * Coordinates are relative to the centre of the
 * positioned ancestor.
 */
export interface CardTransform {
    x: number;
    y: number;
    rotate?: number;
    scale?: number;
    zIndex?: number;
}

interface TarotCardProps {
    card: TarotCardData;
    offset: number;
    isSelected: boolean;
    isRevealed: boolean;

    onClick: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;

    transform?: CardTransform;
    size?: "sm" | "md";
}

/**
 * Card sizes, all at a true 2:3.
 *
 * The ratio is not cosmetic: the card back artwork is 392x588, and
 * anything narrower means either squashing it or cropping into the
 * gold rule, which sits only 5% in from the edge.
 */
const SIZES = {
    sm: "h-[150px] w-[100px]",
    md: "h-[250px] w-[167px] sm:h-[310px] sm:w-[207px]",
};

export function TarotCard({
    card,
    offset,
    isSelected,
    isRevealed,
    onClick,
    onSwipeLeft,
    onSwipeRight,
    transform,
    size = "md",
}: TarotCardProps) {
    const distance = Math.abs(offset);

    const [artworkFailed, setArtworkFailed] = useState(false);

    const hasArtwork = Boolean(card.image) && !artworkFailed;

    const isReversed = card.orientation === "reversed";

    const isControlled = transform !== undefined;

    const isSmall = size === "sm";

    /**
     * Card visual state
     *
     * Center:
     *   scale = 1
     *   rotate = 0
     *
     * Left / right:
     *   smaller
     *   rotated
     *   slightly lower
     */
    const autoScale = isSelected ? 1 : Math.max(0.72, 1 - distance * 0.08);

    const autoOpacity = Math.max(0.4, 1 - distance * 0.12);

    const placement = isControlled
        ? {
              x: `calc(-50% + ${transform.x}px)`,
              y: `calc(-50% + ${transform.y}px)`,
              rotate: transform.rotate ?? 0,
              scale: transform.scale ?? 1,
              opacity: 1,
          }
        : {
              x: `calc(-50% + ${offset * 82}px)`,
              y: `calc(-50% + ${Math.abs(offset) * 14}px)`,
              rotate: offset * 9,
              scale: autoScale,
              opacity: autoOpacity,
          };

    return (
        <motion.div
            className="absolute left-1/2 top-1/2 cursor-pointer"
            style={{
                zIndex: isControlled ? (transform.zIndex ?? 10) : 50 - distance,
                perspective: 1200,
            }}
            animate={placement}
            transition={{
                type: "spring",
                stiffness: isControlled ? 220 : 280,
                damping: isControlled ? 26 : 28,
                mass: 0.8,
            }}
            drag={isControlled ? false : "x"}
            dragConstraints={{
                left: 0,
                right: 0,
            }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
                const threshold = 60;

                if (info.offset.x < -threshold) {
                    onSwipeLeft?.();
                    return;
                }

                if (info.offset.x > threshold) {
                    onSwipeRight?.();
                }
            }}
            onClick={onClick}
            whileHover={{
                scale: isControlled
                    ? (transform.scale ?? 1) + 0.03
                    : isSelected
                      ? 1.03
                      : autoScale + 0.04,
            }}
            whileTap={{
                scale: isControlled
                    ? (transform.scale ?? 1) - 0.03
                    : isSelected
                      ? 0.97
                      : autoScale - 0.03,
            }}
        >
            <motion.div
                className={cn("relative", SIZES[size])}
                animate={{
                    y: !isControlled && isSelected ? -8 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 22,
                }}
            >
                {/* ========================================
            Selected card glow
        ======================================== */}

                {isSelected && (
                    <>
                        <motion.div
                            className="
                pointer-events-none
                absolute
                -inset-5
                -z-10
                rounded-[32px]
                bg-secondary-300/40
                blur-2xl
              "
                            initial={{
                                opacity: 0,
                                scale: 0.8,
                            }}
                            animate={{
                                opacity: [0.35, 0.65, 0.35],
                                scale: [0.9, 1.05, 0.9],
                            }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        <motion.div
                            className="
                pointer-events-none
                absolute
                -inset-2
                -z-10
                rounded-[26px]
                border
                border-white/40
              "
                            animate={{
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </>
                )}

                {/* ========================================
            3D card
        ======================================== */}

                <motion.div
                    className="relative h-full w-full"
                    style={{
                        transformStyle: "preserve-3d",
                    }}
                    animate={{
                        rotateY: isRevealed ? 180 : 0,
                    }}
                    transition={{
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    {/* ======================================
              CARD BACK
          ======================================= */}

                    <CardBack />

                    {/* ======================================
              CARD FRONT
          ======================================= */}

                    <div
                        className={cn(
                            "absolute inset-0 overflow-hidden",
                            isSmall ? "rounded-xl" : "rounded-2xl",
                            "border border-white/60",
                            "bg-white",
                        )}
                        style={{
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden",
                        }}
                    >
                        {/* Artwork, or a woven fallback face
                            while the deck has no images yet. */}

                        {hasArtwork ? (
                            <Image
                                src={card.image}
                                alt={card.name}
                                fill
                                sizes="
                  (max-width: 640px) 155px,
                  190px
                "
                                className={cn(
                                    "object-cover",
                                    isReversed && "rotate-180",
                                )}
                                draggable={false}
                                onError={() => setArtworkFailed(true)}
                            />
                        ) : (
                            <CardFace
                                symbol={card.symbol}
                                reversed={isReversed}
                                small={isSmall}
                            />
                        )}

                        {/* Name plate */}

                        <div
                            className={cn(
                                "absolute inset-x-0 bottom-0",
                                "bg-white/95 backdrop-blur-sm",
                                isSmall ? "p-1.5" : "p-3",
                            )}
                        >
                            {card.position && (
                                <p
                                    className={cn(
                                        "text-center font-semibold uppercase tracking-[0.14em] text-primary-600",
                                        isSmall ? "text-[7px]" : "text-[10px]",
                                    )}
                                >
                                    {card.position}
                                </p>
                            )}

                            <p
                                className={cn(
                                    "text-center font-bold leading-tight text-ink",
                                    isSmall
                                        ? "text-[9px]"
                                        : "text-sm sm:text-base",
                                )}
                            >
                                {card.name}
                            </p>

                            {isReversed && (
                                <p
                                    className={cn(
                                        "text-center font-semibold text-[#b45309]",
                                        isSmall ? "text-[7px]" : "text-[10px]",
                                    )}
                                >
                                    ↔ Ngược
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

/**
 * Tarot card back.
 *
 * The whole back is one piece of artwork. Nothing is drawn around it:
 * it carries its own gold frame and its own rounded corners in the
 * alpha channel, so a border or a background could only ever sit
 * slightly wrong on top of it.
 *
 * A CSS background rather than next/image because the deck paints
 * seventeen of these at a fixed 100px and none of them need
 * responsive sizing — the file is already WebP.
 */
export function CardBack() {
    return (
        <div
            className="
        absolute
        inset-0
        bg-[url(/images/card.webp)]
        bg-contain
        bg-center
        bg-no-repeat
      "
            style={{
                backfaceVisibility: "hidden",
            }}
        />
    );
}

/**
 * Fallback card face.
 *
 * Used until real artwork exists in
 * /public/images/tarot.
 */
function CardFace({
    symbol,
    reversed,
    small,
}: {
    symbol?: string;
    reversed?: boolean;
    small?: boolean;
}) {
    return (
        <div
            className="
        absolute
        inset-0
        overflow-hidden
        bg-gradient-to-b
        from-canvas
        to-white
      "
        >
            {/* Soft glow */}

            <div
                className="
          absolute
          left-1/2
          top-1/3
          h-32
          w-32
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-secondary-200/50
          blur-2xl
        "
            />

            {/* Inner frame */}

            <div
                className="
          absolute
          inset-2
          rounded-lg
          border
          border-primary-600/15
        "
            />

            {/* Symbol */}

            <div
                className={cn(
                    "absolute inset-0 flex items-center justify-center pb-6",
                    reversed && "rotate-180",
                )}
            >
                <span
                    className={cn(
                        "select-none font-bold text-primary-700",
                        small ? "text-2xl" : "text-5xl sm:text-6xl",
                    )}
                    aria-hidden="true"
                >
                    {symbol || "✦"}
                </span>
            </div>
        </div>
    );
}
