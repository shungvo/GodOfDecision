"use client";

import { useEffect } from "react";

/**
 * Tiny delight on every press, the Duolingo / Finch way.
 *
 * Pressing any button, link or [data-tap] element:
 *   - pops a small ring of sparkles at the finger
 *   - gives a short haptic tick where the platform allows it
 *     (Android Chrome; iOS Safari ignores `vibrate`)
 *
 * One delegated listener, DOM nodes created and removed directly so
 * no React render happens on tap. Only transform and opacity animate.
 */

const COLORS = ["#FBBF24", "#FDE68A", "#D0BCFC", "#FFFFFF"];
const COUNT = 6;

export function TapSparkles() {
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const onDown = (event: PointerEvent) => {
            const target = (event.target as Element | null)?.closest(
                "button, a, [role='button'], [data-tap]",
            );

            if (!target || target.closest("[data-no-tap]")) return;
            if ((target as HTMLButtonElement).disabled) return;

            if ("vibrate" in navigator) {
                try {
                    navigator.vibrate(8);
                } catch {
                    /* not allowed before user activation on some builds */
                }
            }

            const host = document.createElement("div");
            host.className = "tap-burst";
            host.style.left = `${event.clientX}px`;
            host.style.top = `${event.clientY}px`;

            const turn = Math.random() * 360;

            for (let i = 0; i < COUNT; i++) {
                const dot = document.createElement("span");
                const angle = turn + (360 / COUNT) * i;
                const distance = 18 + Math.random() * 12;

                dot.style.setProperty("--a", `${angle}deg`);
                dot.style.setProperty("--d", `${distance}px`);
                dot.style.background = COLORS[i % COLORS.length];
                host.appendChild(dot);
            }

            document.body.appendChild(host);
            window.setTimeout(() => host.remove(), 650);
        };

        window.addEventListener("pointerdown", onDown, { passive: true });
        return () => window.removeEventListener("pointerdown", onDown);
    }, []);

    return null;
}
