"use client";

import { useEffect, useState } from "react";

/**
 * False during server render and during the first client render,
 * true afterwards.
 *
 * Anything read from localStorage must be gated on this. Zustand
 * rehydrates synchronously, so without it the first client render
 * would already show stored data while the server rendered none,
 * and React would report a hydration mismatch.
 */
export function useHydrated() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}
