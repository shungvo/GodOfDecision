"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The living sky behind every screen.
 *
 * References: Pokémon Sleep's night sky, Finch's time-of-day world,
 * Calm's slow ambient drift. The canvas used to be one flat violet
 * gradient, which read as "empty" rather than "calm".
 *
 * Layers, back to front:
 *
 *   mood      two soft colour pools whose hue follows the time of day
 *             and the current tab, cross-fading on change
 *   aurora    three large radial blobs drifting very slowly
 *   stars     deterministic field, twinkling at staggered rates,
 *             a few gold four-point sparkles among them
 *   shooting  one streak every 9–18s
 *   clouds    soft lilac clouds along the bottom, drifting
 *
 * Everything moves by transform/opacity only. Pointer or device tilt
 * shifts the layers by different amounts for a gentle parallax.
 *
 * Positioned `fixed` with z-index 0 and rendered first in <body>, so
 * every later positioned element (Screen's <main>, the tab bar) paints
 * above it while it still paints above the body gradient. A negative
 * z-index would land under the opaque body background.
 *
 * The top 72px fades the whole sky out so the status bar strip stays
 * exactly --canvas-top.
 */

type Phase = "dawn" | "day" | "dusk" | "night";

function phaseFor(hour: number): Phase {
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night";
}

/** Two pools per phase: [upper-left, lower-right]. All in the brand family. */
const PHASE_POOLS: Record<Phase, [string, string]> = {
    dawn: ["rgb(255 196 214 / 32%)", "rgb(251 191 36 / 18%)"],
    day: ["rgb(183 150 254 / 34%)", "rgb(251 191 36 / 16%)"],
    dusk: ["rgb(255 150 190 / 30%)", "rgb(251 160 90 / 20%)"],
    night: ["rgb(123 69 240 / 30%)", "rgb(80 120 255 / 18%)"],
};

/** Per tab tint for the third aurora blob, so each screen has its own air. */
const ROUTE_ACCENT: Record<string, string> = {
    "/": "rgb(251 191 36 / 22%)",
    "/tarot": "rgb(169 129 255 / 30%)",
    "/oracle": "rgb(255 160 210 / 24%)",
    "/profile": "rgb(120 200 255 / 20%)",
    "/history": "rgb(169 129 255 / 26%)",
    "/explore": "rgb(140 230 200 / 18%)",
};

/** Small deterministic PRNG so server and client agree on the star field. */
function mulberry32(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Star {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    sparkle: boolean;
}

function makeStars(count: number): Star[] {
    const rand = mulberry32(20261118);

    return Array.from({ length: count }, (_, i) => ({
        x: rand() * 100,
        // Denser toward the top, thinning as it nears the clouds.
        y: Math.pow(rand(), 1.4) * 78,
        size: rand() < 0.85 ? 1 + rand() * 1.5 : 2.5 + rand() * 1.5,
        delay: rand() * 6,
        duration: 2.5 + rand() * 4,
        sparkle: i % 11 === 0,
    }));
}

function Sparkle({ size }: { size: number }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#FDE68A">
            <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
        </svg>
    );
}

function Cloud({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 200 70"
            className={className}
            preserveAspectRatio="none"
            fill="currentColor"
        >
            <path d="M18 62c-10 0-17-7-17-15s7-15 16-15c2-12 13-20 25-18 6-9 16-14 27-12 11 2 19 9 22 19 4-2 9-3 13-2 10 1 17 8 18 17 2-1 5-1 7-1 9 1 16 8 15 17-1 6-6 10-12 10H18Z" />
            <path d="M118 66c-7 0-12-5-12-11s5-11 12-11c2-9 10-15 19-14 5-7 13-10 21-8 9 2 15 9 16 17 8 0 15 6 15 14 0 7-6 13-13 13h-58Z" />
        </svg>
    );
}

export function SkyBackdrop() {
    const pathname = usePathname();
    const root = useRef<HTMLDivElement>(null);

    // Time of day is unknown on the server; start at night (the
    // canvas' own mood) and settle after mount.
    const [phase, setPhase] = useState<Phase>("night");

    useEffect(() => {
        const update = () => setPhase(phaseFor(new Date().getHours()));
        update();
        const id = window.setInterval(update, 5 * 60 * 1000);
        return () => window.clearInterval(id);
    }, []);

    const stars = useMemo(() => makeStars(70), []);

    const routeKey =
        Object.keys(ROUTE_ACCENT)
            .filter((key) => key !== "/")
            .find((key) => pathname?.startsWith(key)) ?? "/";

    /* ---------------- parallax ---------------- */
    useEffect(() => {
        const node = root.current;
        if (!node) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        let frame = 0;
        let tx = 0;
        let ty = 0;
        let x = 0;
        let y = 0;

        const tick = () => {
            // Ease toward the target so motion is always soft.
            x += (tx - x) * 0.06;
            y += (ty - y) * 0.06;
            node.style.setProperty("--px", x.toFixed(3));
            node.style.setProperty("--py", y.toFixed(3));
            frame =
                Math.abs(tx - x) + Math.abs(ty - y) > 0.001
                    ? requestAnimationFrame(tick)
                    : 0;
        };

        const kick = () => {
            if (!frame) frame = requestAnimationFrame(tick);
        };

        const onPointer = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") return;
            tx = (event.clientX / window.innerWidth - 0.5) * 2;
            ty = (event.clientY / window.innerHeight - 0.5) * 2;
            kick();
        };

        // Works without a permission prompt on Android; iOS simply
        // never fires it, which is fine.
        const onTilt = (event: DeviceOrientationEvent) => {
            if (event.gamma == null || event.beta == null) return;
            tx = Math.max(-1, Math.min(1, event.gamma / 30));
            ty = Math.max(-1, Math.min(1, (event.beta - 45) / 30));
            kick();
        };

        window.addEventListener("pointermove", onPointer, { passive: true });
        window.addEventListener("deviceorientation", onTilt, {
            passive: true,
        });

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("pointermove", onPointer);
            window.removeEventListener("deviceorientation", onTilt);
        };
    }, []);

    /* ---------------- shooting star ---------------- */
    const [shot, setShot] = useState<{ id: number; x: number; y: number }>();

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        let timer = 0;
        const schedule = () => {
            timer = window.setTimeout(
                () => {
                    if (document.visibilityState === "visible") {
                        setShot({
                            id: Date.now(),
                            x: 30 + Math.random() * 60,
                            y: 6 + Math.random() * 30,
                        });
                    }
                    schedule();
                },
                9000 + Math.random() * 9000,
            );
        };

        schedule();
        return () => window.clearTimeout(timer);
    }, []);

    const [poolA, poolB] = PHASE_POOLS[phase];
    const accent = ROUTE_ACCENT[routeKey];
    const starOpacity = phase === "day" ? 0.55 : phase === "night" ? 1 : 0.8;

    return (
        <div
            ref={root}
            aria-hidden="true"
            className="sky pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
            {/* mood pools */}
            <div
                className="sky-layer absolute inset-0 transition-[background] duration-[2000ms]"
                style={{
                    background: `radial-gradient(70% 45% at 8% 22%, ${poolA}, transparent 70%), radial-gradient(75% 50% at 100% 78%, ${poolB}, transparent 70%)`,
                }}
            />

            {/* aurora */}
            <div className="sky-par-1 absolute inset-0">
                <div
                    className="sky-blob sky-blob-a"
                    style={{
                        background:
                            "radial-gradient(closest-side, rgb(183 150 254 / 30%), transparent)",
                    }}
                />
                <div
                    className="sky-blob sky-blob-b"
                    style={{
                        background:
                            "radial-gradient(closest-side, rgb(102 49 219 / 45%), transparent)",
                    }}
                />
                <div
                    className="sky-blob sky-blob-c transition-[background] duration-[1200ms]"
                    style={{
                        background: `radial-gradient(closest-side, ${accent}, transparent)`,
                    }}
                />
            </div>

            {/* stars */}
            <div
                className="sky-par-2 absolute inset-0 transition-opacity duration-[2000ms]"
                style={{ opacity: starOpacity }}
            >
                {stars.map((star, i) =>
                    star.sparkle ? (
                        <span
                            key={i}
                            className="sky-twinkle absolute"
                            style={{
                                left: `${star.x}%`,
                                top: `${star.y}%`,
                                animationDelay: `${star.delay}s`,
                                animationDuration: `${star.duration + 2}s`,
                            }}
                        >
                            <Sparkle size={8 + star.size * 2} />
                        </span>
                    ) : (
                        <span
                            key={i}
                            className="sky-twinkle absolute rounded-full bg-white"
                            style={{
                                left: `${star.x}%`,
                                top: `${star.y}%`,
                                width: star.size,
                                height: star.size,
                                boxShadow:
                                    star.size > 2
                                        ? "0 0 6px 1px rgb(255 255 255 / 55%)"
                                        : undefined,
                                animationDelay: `${star.delay}s`,
                                animationDuration: `${star.duration}s`,
                            }}
                        />
                    ),
                )}

                {shot && (
                    <span
                        key={shot.id}
                        className="sky-shoot absolute"
                        style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
                    />
                )}
            </div>

            {/* clouds */}
            <div className="sky-par-3 absolute inset-x-0 bottom-0 h-[34vh]">
                <Cloud className="sky-cloud sky-cloud-back absolute bottom-[9vh] h-20 w-[150%] text-secondary-200/[0.10]" />
                <Cloud className="sky-cloud sky-cloud-mid absolute bottom-[3vh] h-24 w-[170%] text-secondary-100/[0.12]" />
                <Cloud className="sky-cloud sky-cloud-front absolute -bottom-2 h-28 w-[190%] text-white/[0.10]" />
            </div>
        </div>
    );
}
