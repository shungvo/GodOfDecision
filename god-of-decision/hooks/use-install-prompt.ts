"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * How, or whether, this browser can be asked to install the app.
 *
 *   prompt  the browser handed over an install event we can fire
 *   manual  installing is possible but only the reader can do it
 *   none    already installed, or nowhere to install to
 */
export type InstallMode = "prompt" | "manual" | "none";

interface Platform {
    standalone: boolean;
    ios: boolean;
}

/** Already running from the home screen or the dock. */
function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS predates display-mode and still reports it this way.
        (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true
    );
}

/**
 * iOS or iPadOS, whichever browser is wrapped around WebKit.
 *
 * iPadOS reports itself as a Mac, so the user agent alone says the
 * wrong thing; a touch count separates a real Mac from an iPad
 * pretending to be one.
 */
function isIOS() {
    const ua = window.navigator.userAgent;

    return (
        /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes("Macintosh") && window.navigator.maxTouchPoints > 1)
    );
}

/**
 * Read through `useSyncExternalStore` rather than measured into state
 * from an effect.
 *
 * The values only exist on the client, so a server render and a first
 * client render disagree by nature. This is the API for exactly that:
 * the server snapshot is null, React notices the client's differs
 * during hydration, and re-renders — with no mismatch warning and no
 * state update inside an effect.
 *
 * The snapshot has to be referentially stable or the store would
 * re-render forever, so it is built once and thrown away only when
 * something that feeds it changes.
 */
let cached: Platform | null = null;

function snapshot(): Platform {
    if (!cached) {
        cached = { standalone: isStandalone(), ios: isIOS() };
    }

    return cached;
}

function subscribe(onChange: () => void) {
    const media = window.matchMedia("(display-mode: standalone)");

    const invalidate = () => {
        cached = null;
        onChange();
    };

    media.addEventListener("change", invalidate);
    window.addEventListener("appinstalled", invalidate);

    return () => {
        media.removeEventListener("change", invalidate);
        window.removeEventListener("appinstalled", invalidate);
    };
}

/**
 * Whether the app can offer to install itself, and how.
 *
 * `beforeinstallprompt` is a Chromium API. Safari has never fired it
 * and Apple has never proposed an alternative, so on iPhone — the one
 * platform where being on the home screen matters most — a hook built
 * only on that event reports "cannot install" and the app stays
 * silent. Which is exactly backwards.
 *
 * So iOS gets `manual`: installing is possible, the app just cannot
 * start it. Telling the reader where the button is beats hiding.
 */
export function useInstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
        null,
    );

    const platform = useSyncExternalStore(subscribe, snapshot, () => null);

    useEffect(() => {
        function handleBeforeInstallPrompt(event: Event) {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
        }

        function handleInstalled() {
            setDeferred(null);
        }

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt,
        );

        window.addEventListener("appinstalled", handleInstalled);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt,
            );

            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferred) return false;

        await deferred.prompt();

        const { outcome } = await deferred.userChoice;

        setDeferred(null);

        return outcome === "accepted";
    }, [deferred]);

    let mode: InstallMode = "none";

    if (platform && !platform.standalone) {
        if (deferred) {
            mode = "prompt";
        } else if (platform.ios) {
            mode = "manual";
        }
    }

    return { mode, promptInstall };
}
