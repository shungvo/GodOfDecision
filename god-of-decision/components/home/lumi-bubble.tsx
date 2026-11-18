"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface LumiBubbleProps {
    message: string | null;

    /** Keep it up instead of letting it fade after a few seconds. */
    sticky?: boolean;

    className?: string;
}

const SHOW_MS = 5000;

/**
 * A speech bubble from Lumi, the way Finch's bird talks to you.
 *
 * Pops in with a spring whenever the message changes and drifts away
 * on its own after a few seconds, so it reacts rather than nags.
 */
export function LumiBubble({ message, sticky, className }: LumiBubbleProps) {
    // The message last hidden by the timer; a new one shows again.
    const [dismissed, setDismissed] = useState<string | null>(null);

    useEffect(() => {
        if (!message || sticky) return;

        const id = window.setTimeout(() => setDismissed(message), SHOW_MS);
        return () => window.clearTimeout(id);
    }, [message, sticky]);

    const visible = message && (sticky || dismissed !== message);

    return (
        <div
            aria-live="polite"
            className={cn("pointer-events-none absolute", className)}
        >
            <AnimatePresence mode="wait">
                {visible && (
                    <motion.div
                        key={message}
                        initial={{ opacity: 0, scale: 0.6, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 6 }}
                        transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 22,
                        }}
                        style={{ transformOrigin: "85% 100%" }}
                        className="relative max-w-[190px] rounded-[18px] bg-white px-3.5 py-2 text-[13px] font-semibold leading-5 text-primary-800 shadow-e3"
                    >
                        {message}
                        {/* tail, pointing down toward Lumi */}
                        <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 rounded-[3px] bg-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
