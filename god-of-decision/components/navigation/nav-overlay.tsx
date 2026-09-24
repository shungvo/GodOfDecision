"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useNavStore } from "@/stores/nav.store";

/**
 * How long a navigation may take before this shows at all.
 *
 * Fast tabs arrive well inside this, so they never flash a loading
 * state. Only a tab that actually makes you wait gets one.
 */
const APPEAR_AFTER_MS = 120;

/**
 * Covers the outgoing screen while a navigation is in flight.
 *
 * React keeps the current page on screen until the next one has
 * finished rendering. That is the right default — it avoids flashing
 * a blank frame — but on a heavy route it means tapping a tab leaves
 * the old screen sitting there, which reads as the tap not landing.
 *
 * `loading.tsx` does not help here. A Suspense fallback appears when
 * something *suspends*, and a render that is merely slow never
 * suspends; React just takes its time and keeps the old tree visible.
 *
 * So this element is always mounted and only its opacity changes.
 * Opacity on an already-rasterised layer is handed to the compositor,
 * which means it appears even while the main thread is busy rendering
 * the route — the one moment it needs to.
 */
export function NavOverlay() {
    const pathname = usePathname();

    const pending = useNavStore((state) => state.pending);
    const settle = useNavStore((state) => state.settle);

    // The route arrived. Whatever it was, the URL is the truth.
    useEffect(() => {
        settle();
    }, [pathname, settle]);

    const shown = pending !== null;

    return (
        <div
            aria-hidden={!shown}
            /*
             * Starts below the app bar, which is the same on every
             * screen — covering it too would make the brand blink on
             * every tab change. Under the tab bar's z-50, so the tabs
             * stay live and tappable.
             */
            className="
        canvas

        fixed
        inset-x-0
        bottom-0
        top-14
        z-40

        transition-opacity
        duration-200
        ease-out
      "
            style={{
                opacity: shown ? 1 : 0,
                /*
                 * Swallows taps while a navigation is in flight. The
                 * outgoing screen is still mounted underneath, and
                 * letting it take a second tap means acting on a
                 * screen the user has already left. The tab bar sits
                 * above this, so switching tabs again still works.
                 */
                pointerEvents: shown ? "auto" : "none",
                // Only on the way in, so it disappears immediately.
                transitionDelay: shown ? `${APPEAR_AFTER_MS}ms` : "0ms",
                // Keeps it on its own layer so the fade never waits
                // for the main thread.
                willChange: "opacity",
            }}
        >
            <div className="flex h-full items-center justify-center gap-1.5 pb-24">
                {[0, 1, 2].map((dot) => (
                    <span
                        key={dot}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60"
                        style={{ animationDelay: `${dot * 150}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}
