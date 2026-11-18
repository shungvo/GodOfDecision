"use client";

import { AnimatePresence, motion } from "framer-motion";

import { lumiLine, type LumiMoment } from "@/lib/lumi-lines";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types/tarot";

interface LumiSaysProps {
    /** What is happening. The line is picked from lib/lumi-lines.ts. */
    moment: LumiMoment;

    /** Ask for a different variant; see `lumiLine`. */
    seed?: string | number;

    lang?: Lang;

    /**
     * Where Lumi is relative to the bubble.
     *
     *   up-right   Lumi sits above and to the right: a sheet's
     *              header mascot (the default)
     *   avatar     draws a small Lumi face to the left, for places
     *              with no mascot of their own: empty states, toasts
     */
    from?: "up-right" | "avatar";

    /** Light bubble on a white surface, or frosted on the canvas. */
    tone?: "light" | "dark";

    className?: string;
}

/**
 * One of Lumi's lines, as a speech bubble.
 *
 * Changes of moment cross-fade with a small spring, so Lumi seems to
 * react to what just happened rather than the text being swapped.
 */
export function LumiSays({
    moment,
    seed,
    lang = "vi",
    from = "up-right",
    tone = "light",
    className,
}: LumiSaysProps) {
    const line = lumiLine(moment, { lang, seed });

    return (
        <div
            className={cn(
                "flex items-end gap-2",
                from === "up-right" && "justify-end",
                className,
            )}
            aria-live="polite"
        >
            {from === "avatar" && (
                <span
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 rounded-full bg-secondary-100 bg-[url(/images/mascot/lumi-face.webp)] bg-cover bg-center ring-2 ring-white shadow-e1"
                />
            )}

            <AnimatePresence mode="wait" initial={false}>
                <motion.p
                    key={line}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    style={{
                        transformOrigin:
                            from === "up-right" ? "90% 0%" : "0% 100%",
                    }}
                    className={cn(
                        "relative max-w-[82%] rounded-[18px] px-3.5 py-2 text-[13px] font-semibold leading-5",
                        from === "up-right"
                            ? "rounded-tr-[6px]"
                            : "rounded-bl-[6px]",
                        tone === "light"
                            ? "bg-secondary-100/70 text-primary-800"
                            : "glass text-white",
                    )}
                >
                    {line}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
