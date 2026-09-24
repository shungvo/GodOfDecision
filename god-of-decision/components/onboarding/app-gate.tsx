"use client";

import { useEffect, useState } from "react";

import { useOnboardingStore } from "@/stores/onboarding.store";
import { Onboarding } from "./onboarding";
import { Splash } from "./splash";

/** How long the launch screen stays before handing over. */
const MIN_SPLASH_MS = 900;

/** Length of the fade out. */
const FADE_MS = 450;

type Phase = "splash" | "onboarding" | "leaving" | "gone";

/**
 * What the app shows before the app.
 *
 * Starts on the splash, which is in the server rendered HTML, so
 * there is never a frame where the app itself flashes into view
 * first. Then it either fades away or hands over to the intro,
 * depending on whether this device has seen it.
 *
 * The unmount is driven by a timer rather than by an exit
 * animation finishing. An animation that never completes would
 * leave this covering the whole app, and a stuck overlay is a
 * far worse failure than a fade that skips.
 */
export function AppGate() {
    const [phase, setPhase] = useState<Phase>("splash");

    const complete = useOnboardingStore((state) => state.complete);

    // Decide where to go once the splash has had its moment.
    useEffect(() => {
        if (phase !== "splash") return;

        const timer = setTimeout(() => {
            // Persisted state is rehydrated synchronously, so by
            // now this is the real answer.
            setPhase(
                useOnboardingStore.getState().onboarded
                    ? "leaving"
                    : "onboarding",
            );
        }, MIN_SPLASH_MS);

        return () => clearTimeout(timer);
    }, [phase]);

    // Leave, whatever the animation does.
    useEffect(() => {
        if (phase !== "leaving") return;

        const timer = setTimeout(() => setPhase("gone"), FADE_MS);

        return () => clearTimeout(timer);
    }, [phase]);

    if (phase === "gone") return null;

    const leaving = phase === "leaving";

    return (
        <div
            className={`
        canvas

        fixed
        inset-0
        z-[200]

        overflow-hidden

        transition-opacity
        ease-in-out

        ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}
      `}
            style={{ transitionDuration: `${FADE_MS}ms` }}
            aria-hidden={leaving}
        >
            {phase === "onboarding" ? (
                <Onboarding
                    onFinish={() => {
                        complete();
                        setPhase("leaving");
                    }}
                />
            ) : (
                <Splash />
            )}
        </div>
    );
}
