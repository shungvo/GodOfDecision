/**
 * Fingerprint ridges, drawn as concentric arcs.
 *
 * Generated rather than hand plotted so the spacing stays even and the
 * count can change without redrawing anything by hand.
 *
 * Sampled into line segments rather than written as SVG `A` commands.
 * An arc command cannot span a full turn, and a ridge here is a little
 * under one: the endpoint wraps past the start, the large-arc and sweep
 * flags then describe a different curve entirely, and the set came out
 * as arcs fanning off to one side instead of rings.
 */
const RIDGE_COUNT = 7;

const CENTRE = 50;

/** Enough that the facets are under a pixel at the size this renders. */
const STEPS = 64;

/** Ramanujan's approximation. Close enough to pace a stroke by. */
function ellipsePerimeter(rx: number, ry: number) {
    return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
}

const RIDGES = Array.from({ length: RIDGE_COUNT }, (_, index) => {
    const rx = 5 + index * 6;
    const ry = 6.5 + index * 6.8;

    /** Half the opening at the bottom, widening as the ridges grow. */
    const gap = 0.42 + index * 0.055;

    /** Each ring leans a touch further than the last. */
    const tilt = -0.18 - index * 0.035;

    const start = Math.PI / 2 + gap + tilt;
    const sweep = Math.PI * 2 - gap * 2;

    const points = Array.from({ length: STEPS + 1 }, (_, step) => {
        const angle = start + (sweep * step) / STEPS;

        return `${(CENTRE + rx * Math.cos(angle)).toFixed(2)} ${(
            CENTRE +
            ry * Math.sin(angle)
        ).toFixed(2)}`;
    });

    return {
        d: `M ${points[0]} L ${points.slice(1).join(" L ")}`,

        /*
         * Its own dash length, not a shared constant.
         *
         * The innermost ridge is a seventh of the outermost. With one
         * length for all of them the short ridges would sit invisible
         * for most of their slot and then snap into place at the end,
         * because the dash only reaches the path once the offset drops
         * below that path's own length.
         *
         * Padded by 12% because the estimate must never come out
         * *under* the real length. Ramanujan approximates, and the path
         * is a sampled polyline rather than a true ellipse — at a dash
         * shorter than the path the pattern repeats, and the second
         * dash showed as a row of gold flecks along the tail of every
         * ridge while the print was meant to be dark. Over is free;
         * under is visible.
         */
        dash: ((ellipsePerimeter(rx, ry) * sweep) / (Math.PI * 2)) * 1.12,
    };
});

/**
 * Short ridge endings, the detail that reads as a real print rather
 * than a stack of rings.
 */
const DETAILS = ["M 50 30 l 0 -7", "M 62 62 l 5 4", "M 36 60 l -5 4"];

interface FingerprintProps {
    /**
     * How far the read has got, 0 to 1.
     *
     * Ridges light up in order, so this is not a bar filling: it is the
     * print being traced from the middle outwards.
     */
    progress: number;

    /**
     * Milliseconds the whole trace takes at progress 1.
     *
     * Each ridge gets an equal share as a CSS transition delay, which
     * keeps the timing declarative — no per frame JavaScript, so a busy
     * main thread cannot make the trace stutter.
     */
    duration: number;

    /** Time the trace takes to unwind when a press is abandoned. */
    release: number;

    className?: string;
}

export function Fingerprint({
    progress,
    duration,
    release,
    className,
}: FingerprintProps) {
    const lit = progress > 0;

    const step = duration / RIDGE_COUNT;

    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            strokeLinecap="round"
            aria-hidden="true"
        >
            {/* The print at rest: always there, just faint. */}
            <g className="stroke-white/25" strokeWidth="1.6">
                {RIDGES.map((ridge, index) => (
                    <path key={index} d={ridge.d} />
                ))}

                {DETAILS.map((detail) => (
                    <path key={detail} d={detail} />
                ))}
            </g>

            {/* The same print, traced in gold as the finger holds. */}
            <g
                className="stroke-magic-gold"
                strokeWidth="1.9"
                style={{ filter: "drop-shadow(0 0 3px rgb(251 191 36 / 0.5))" }}
            >
                {RIDGES.map((ridge, index) => (
                    <path
                        key={index}
                        d={ridge.d}
                        strokeDasharray={ridge.dash}
                        style={{
                            strokeDashoffset: lit ? 0 : ridge.dash,
                            transitionProperty: "stroke-dashoffset",
                            transitionTimingFunction: "linear",
                            transitionDuration: `${lit ? step : release}ms`,
                            transitionDelay: `${lit ? index * step : 0}ms`,
                        }}
                    />
                ))}
            </g>
        </svg>
    );
}
