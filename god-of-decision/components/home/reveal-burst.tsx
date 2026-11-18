"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#FBBF24", "#FDE68A", "#D0BCFC", "#A981FF", "#FFFFFF"];
const COUNT = 30;

const STAR_PATH =
    "M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z";

function seeded(seed: number) {
    let s = (seed % 2147483646) + 1;

    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

/**
 * A celebration of stars from the centre of the card, played once
 * when today's card turns. Duolingo's lesson-complete moment, in the
 * app's own palette and shape.
 *
 * Mount it to play, unmount to clean up. Decoration only.
 */
export function RevealBurst({ seed }: { seed: number }) {
    const particles = useMemo(() => {
        // Seeded per burst so re-renders mid-flight do not reshuffle.
        const rand = seeded(seed);

        return Array.from({ length: COUNT }, (_, i) => {
            const angle = (Math.PI * 2 * i) / COUNT + rand() * 0.4;
            const distance = 110 + rand() * 120;

            return {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance * 0.9,
                // Falls a little after it flies out.
                fall: 60 + rand() * 80,
                spin: (rand() - 0.5) * 540,
                size: 8 + rand() * 12,
                star: i % 3 !== 0,
                color: COLORS[i % COLORS.length],
                delay: rand() * 0.08,
            };
        });
    }, [seed]);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0"
        >
            {particles.map((p, i) => (
                <motion.span
                    key={i}
                    className="absolute"
                    style={{
                        left: -p.size / 2,
                        top: -p.size / 2,
                        width: p.size,
                        height: p.size,
                    }}
                    initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
                    animate={{
                        x: [0, p.x, p.x * 1.08],
                        y: [0, p.y, p.y + p.fall],
                        scale: [0.2, 1, 0.6],
                        opacity: [1, 1, 0],
                        rotate: p.spin,
                    }}
                    transition={{
                        duration: 1.4,
                        delay: p.delay,
                        times: [0, 0.4, 1],
                        ease: [0.2, 0.8, 0.3, 1],
                    }}
                >
                    {p.star ? (
                        <svg
                            viewBox="0 0 24 24"
                            width="100%"
                            height="100%"
                            fill={p.color}
                        >
                            <path d={STAR_PATH} />
                        </svg>
                    ) : (
                        <span
                            className="block h-1/2 w-1/2 rounded-full"
                            style={{ background: p.color, margin: "25%" }}
                        />
                    )}
                </motion.span>
            ))}
        </div>
    );
}
