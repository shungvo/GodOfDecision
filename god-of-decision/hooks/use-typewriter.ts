"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
    /** Milliseconds between reveals. */
    tickMs?: number;
    /** Characters revealed per tick. */
    charsPerTick?: number;
}

/**
 * Reveals `target` a few characters at a time.
 *
 * The server already streams the reading, but it arrives in
 * uneven bursts: one chunk may be a single letter and the next
 * a whole sentence. Draining it at a steady rate is what makes
 * it read as typing rather than as text popping in.
 *
 * Shrinking or replacing `target` resets the output, so a new
 * reading does not inherit the tail of the previous one.
 */
export function useTypewriter(
    target: string,
    { tickMs = 16, charsPerTick = 2 }: Options = {},
) {
    const [shown, setShown] = useState("");

    const targetRef = useRef(target);
    targetRef.current = target;

    useEffect(() => {
        const id = setInterval(() => {
            setShown((current) => {
                const latest = targetRef.current;

                // Diverged, so this is different text. Rewind to
                // whatever the two still have in common.
                if (!latest.startsWith(current)) {
                    return latest.slice(0, current.length);
                }

                if (current.length >= latest.length) return current;

                return latest.slice(0, current.length + charsPerTick);
            });
        }, tickMs);

        return () => clearInterval(id);
    }, [tickMs, charsPerTick]);

    return {
        text: shown,
        /** True while there is still buffered text to reveal. */
        typing: shown.length < target.length,
    };
}
