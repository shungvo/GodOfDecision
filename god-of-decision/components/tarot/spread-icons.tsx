/**
 * Spread icons.
 *
 * Drawn rather than borrowed, so the glyph is the same
 * shape as what the user is about to see on the table:
 * one upright card, or three fanned out.
 *
 * Proportions follow a real card, taller than it is wide.
 */

interface SpreadIconProps {
    className?: string;
}

export function SingleSpreadIcon({ className }: SpreadIconProps) {
    return (
        <svg
            viewBox="0 0 24 20"
            width="24"
            height="20"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="7.5"
                y="1"
                width="9"
                height="18"
                rx="2.2"
                fill="currentColor"
            />
        </svg>
    );
}

export function ThreeSpreadIcon({ className }: SpreadIconProps) {
    return (
        <svg
            viewBox="0 0 24 20"
            width="24"
            height="20"
            className={className}
            aria-hidden="true"
        >
            <g fill="currentColor">
                {/* Outer pair, tilted so the three read as a fan. */}
                <rect
                    x="0.5"
                    y="3"
                    width="6.5"
                    height="14.5"
                    rx="1.7"
                    transform="rotate(-12 3.75 10.25)"
                    opacity="0.7"
                />

                <rect
                    x="17"
                    y="3"
                    width="6.5"
                    height="14.5"
                    rx="1.7"
                    transform="rotate(12 20.25 10.25)"
                    opacity="0.7"
                />

                <rect x="8.5" y="1" width="7" height="18" rx="1.9" />
            </g>
        </svg>
    );
}
