"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Moods from docs/MASCOT.md → Expressions, for the moments a result
 * sheet goes through.
 *
 *   idle       waiting for the reader to choose something
 *   thinking   the AI reading is on its way
 *   reveal     the answer is here
 *   surprised  something went wrong
 */
export type MascotMood = "idle" | "thinking" | "reveal" | "surprised";

/** Maps a store's read status onto a mood. */
export function moodFor(
    readStatus: "idle" | "reading" | "done" | "error" | string,
): MascotMood {
    if (readStatus === "reading") return "thinking";
    if (readStatus === "error") return "surprised";
    return "reveal";
}

interface SheetMascotProps {
    mood: MascotMood;
    className?: string;
}

const STAR_PATH =
    "M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z";

/**
 * Lumi, keeping the reader company in the corner of a result sheet.
 *
 * Until the per-expression renders exist (MASCOT.md → Deliverables),
 * the mood is carried by motion and the bubble rather than the face:
 *
 *   thinking   leans and bobs, dots bounce, hat-star halo pulses
 *   reveal     a happy hop, a sparkle in the bubble, stars pop out
 *   surprised  a small startled jolt, "!" in the bubble
 *   idle       gentle float, quiet bubble
 *
 * Built for BottomSheet's `art` slot. Decoration only.
 */
export function SheetMascot({ mood, className }: SheetMascotProps) {
    const reduced = useReducedMotion();

    const body = reduced
        ? {}
        : mood === "thinking"
          ? {
                y: [0, -3, 0],
                rotate: [-4, 4, -4],
                transition: {
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                },
            }
          : mood === "reveal"
            ? {
                  y: [0, -10, 0, -4, 0],
                  rotate: [0, -6, 4, 0],
                  scale: [1, 1.08, 0.97, 1],
                  transition: { duration: 0.8, ease: "easeOut" as const },
              }
            : mood === "surprised"
              ? {
                    x: [0, -4, 4, -2, 0],
                    rotate: [0, -8, 0],
                    transition: { duration: 0.5 },
                }
              : {
                    y: [0, -4, 0],
                    rotate: [-2, 2, -2],
                    transition: {
                        duration: 3.4,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                    },
                };

    return (
        <div
            aria-hidden="true"
            className={cn("relative h-[68px] w-[68px] shrink-0", className)}
        >
            {/* Halo. Glows gold while thinking, like the hat star. */}
            <motion.div
                className={cn(
                    "absolute -inset-1.5 rounded-full blur-md transition-colors duration-500",
                    mood === "thinking"
                        ? "bg-magic-gold/45"
                        : mood === "surprised"
                          ? "bg-secondary-200/50"
                          : "bg-secondary-100/70",
                )}
                animate={
                    !reduced && mood === "thinking"
                        ? { opacity: [0.5, 1, 0.5], scale: [0.95, 1.08, 0.95] }
                        : { opacity: 1, scale: 1 }
                }
                transition={
                    mood === "thinking"
                        ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.4 }
                }
            />

            {/* Lumi. Keyed on mood so a one-shot reaction replays
                every time the mood changes. */}
            <motion.div
                key={mood}
                animate={body}
                className="relative h-full w-full overflow-hidden rounded-full bg-secondary-100 bg-[url(/images/mascot/lumi-face.webp)] bg-cover bg-center bg-no-repeat ring-2 ring-white shadow-e2"
            />

            {/* Stars popping out on reveal */}
            <AnimatePresence>
                {mood === "reveal" && !reduced && (
                    <motion.div
                        key="pop"
                        className="pointer-events-none absolute inset-0"
                        exit={{ opacity: 0 }}
                    >
                        {[
                            { x: -30, y: -18, s: 11, d: 0 },
                            { x: 30, y: -24, s: 9, d: 0.05 },
                            { x: 36, y: 14, s: 7, d: 0.1 },
                            { x: -34, y: 20, s: 8, d: 0.08 },
                        ].map((p, i) => (
                            <motion.svg
                                key={i}
                                viewBox="0 0 24 24"
                                width={p.s}
                                height={p.s}
                                fill={i % 2 ? "#A981FF" : "#FBBF24"}
                                className="absolute left-1/2 top-1/2"
                                initial={{
                                    x: -p.s / 2,
                                    y: -p.s / 2,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                animate={{
                                    x: p.x - p.s / 2,
                                    y: p.y - p.s / 2,
                                    scale: [0, 1.3, 0],
                                    opacity: [0, 1, 0],
                                    rotate: 90,
                                }}
                                transition={{
                                    duration: 1.1,
                                    delay: 0.15 + p.d,
                                    ease: "easeOut",
                                }}
                            >
                                <path d={STAR_PATH} />
                            </motion.svg>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Speech bubble */}
            <div className="absolute -left-3 -top-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mood}
                        initial={{ scale: 0.4, opacity: 0, y: 6 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 480,
                            damping: 20,
                        }}
                        style={{ transformOrigin: "20% 100%" }}
                        className={cn(
                            "flex h-7 min-w-9 items-center justify-center gap-[3px] rounded-xl rounded-bl-[4px] px-2 shadow-e2",
                            mood === "reveal"
                                ? "bg-magic-gold"
                                : mood === "surprised"
                                  ? "bg-secondary-100"
                                  : "bg-primary-600",
                        )}
                    >
                        <BubbleContent mood={mood} reduced={Boolean(reduced)} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function BubbleContent({
    mood,
    reduced,
}: {
    mood: MascotMood;
    reduced: boolean;
}) {
    if (mood === "reveal") {
        return (
            <motion.svg
                viewBox="0 0 24 24"
                width={14}
                height={14}
                fill="#3d2600"
                animate={
                    reduced ? {} : { rotate: [0, 180], scale: [0.6, 1.1, 1] }
                }
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <path d={STAR_PATH} />
            </motion.svg>
        );
    }

    if (mood === "surprised") {
        return (
            <span className="text-[14px] font-extrabold leading-none text-primary-700">
                !
            </span>
        );
    }

    // Thinking bounces the dots in a wave; idle just shows them.
    return (
        <>
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="h-[4px] w-[4px] rounded-full bg-white"
                    animate={
                        mood === "thinking" && !reduced
                            ? { y: [0, -3, 0], opacity: [0.5, 1, 0.5] }
                            : { y: 0, opacity: 1 }
                    }
                    transition={
                        mood === "thinking"
                            ? {
                                  duration: 0.8,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                  ease: "easeInOut",
                              }
                            : { duration: 0.2 }
                    }
                />
            ))}
        </>
    );
}
