"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { lumiLine, type LumiMoment } from "@/lib/lumi-lines";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types/tarot";

/** Wait before the first line, so it lands after the screen settles. */
const ENTER_DELAY_MS = 600;

/** How long a line stays up on its own. */
const SHOW_MS = 4800;

interface LumiPeekProps {
    moment: LumiMoment;
    seed?: string | number;
    lang?: Lang;

    /** sm for a screen header, lg for a centred hero (login). */
    size?: "sm" | "lg";

    /**
     * Which way the bubble opens.
     *
     *   below-left   under Lumi, growing toward the screen's centre;
     *                for a Lumi at the right end of a header
     *   above        over Lumi, centred; for a centred hero
     */
    bubble?: "below-left" | "above";

    className?: string;
}

/**
 * Lumi, visiting a screen.
 *
 * A small floating face that says one line when the screen opens and
 * whenever the moment changes, then goes quiet. Tapping Lumi gets a
 * hop and the next line — the Finch "poke the pet" habit.
 *
 * The bubble is absolutely positioned, so Lumi costs a screen no
 * layout space beyond the face itself.
 */
export function LumiPeek({
    moment,
    seed,
    lang = "vi",
    size = "sm",
    bubble = "below-left",
    className,
}: LumiPeekProps) {
    const reduced = useReducedMotion();

    /** Taps since mount; steps through the moment's variants. */
    const [pokes, setPokes] = useState(0);
    const [open, setOpen] = useState(false);
    const hideTimer = useRef<number | null>(null);

    function showFor(ms: number) {
        setOpen(true);

        if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setOpen(false), ms);
    }

    // Speak on arrival, and again whenever the situation changes.
    useEffect(() => {
        const id = window.setTimeout(() => showFor(SHOW_MS), ENTER_DELAY_MS);

        return () => window.clearTimeout(id);
    }, [moment]);

    useEffect(
        () => () => {
            if (hideTimer.current !== null) {
                window.clearTimeout(hideTimer.current);
            }
        },
        [],
    );

    const line = lumiLine(moment, { lang, seed, offset: pokes });

    const box = size === "lg" ? "h-16 w-16" : "h-11 w-11";

    return (
        <div className={cn("relative shrink-0", box, className)}>
            {/* Halo */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1.5 rounded-full bg-secondary-200/35 blur-md"
            />

            <motion.button
                key={pokes}
                type="button"
                aria-label="Lumi, chạm để nghe Lumi nói"
                onClick={() => {
                    setPokes((count) => count + 1);
                    showFor(SHOW_MS);
                }}
                // A hop on every poke; a quiet float otherwise.
                initial={pokes > 0 && !reduced ? { y: 0, scale: 1 } : false}
                animate={
                    reduced
                        ? {}
                        : pokes > 0
                          ? {
                                y: [0, -10, 0, -3, 0],
                                rotate: [0, -10, 8, 0],
                                scale: [1, 1.1, 0.95, 1],
                            }
                          : { y: [0, -4, 0], rotate: [-3, 3, -3] }
                }
                transition={
                    pokes > 0
                        ? { duration: 0.7, ease: "easeOut" }
                        : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                }
                className="relative block h-full w-full rounded-full bg-secondary-100 bg-[url(/images/mascot/lumi-face.webp)] bg-cover bg-center ring-2 ring-white/80 shadow-e2 outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            />

            <div
                aria-live="polite"
                className={cn(
                    "pointer-events-none absolute z-20",
                    bubble === "below-left"
                        ? "right-0 top-full mt-2.5"
                        : "bottom-full left-1/2 mb-3 -translate-x-1/2",
                )}
            >
                <AnimatePresence mode="wait">
                    {open && (
                        <motion.p
                            key={line}
                            initial={{
                                opacity: 0,
                                scale: 0.6,
                                y: bubble === "above" ? 8 : -8,
                            }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 24,
                            }}
                            style={{
                                transformOrigin:
                                    bubble === "below-left"
                                        ? "90% 0%"
                                        : "50% 100%",
                            }}
                            className={cn(
                                "relative w-max max-w-[220px] rounded-[18px] bg-white px-3.5 py-2 text-left text-[13px] font-semibold leading-5 text-primary-800 shadow-e3",
                                bubble === "below-left"
                                    ? "rounded-tr-[6px]"
                                    : "",
                            )}
                        >
                            {line}

                            {bubble === "above" && (
                                <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" />
                            )}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
