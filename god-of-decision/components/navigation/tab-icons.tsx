/**
 * The tab bar's own icon set.
 *
 * Drawn for this app rather than taken from lucide: each one carries a
 * small magical accent (a star, a sparkle) so the row reads as part of
 * the same storybook as the mascot, not as a generic settings screen.
 *
 * Every icon has two looks:
 * - idle: a soft outline in `currentColor`, accent included;
 * - active: duotone — a violet body and a gold accent — so the chosen
 *   tab looks *lit up* rather than merely darker.
 *
 * The bar stacks both and cross fades opacity, so nothing here animates.
 */

export interface TabIconProps {
    active?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

/** A four pointed sparkle centred on (cx, cy). */
function sparkle(cx: number, cy: number, r: number) {
    return `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
}

const BODY = "#7b45f0";
const BODY_SOFT = "#d0bcfc";
const EDGE = "#34117e";
const GOLD = "#fbbf24";

function Svg({
    className,
    style,
    children,
}: {
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function HomeIcon({ active, className, style }: TabIconProps) {
    return (
        <Svg className={className} style={style}>
            <path
                d="M3.8 10.6 12 3.8l8.2 6.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8z"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY : "none"}
            />
            <path
                d={sparkle(12, 14.6, 3.4)}
                stroke={active ? "none" : "currentColor"}
                strokeWidth={1.4}
                fill={active ? GOLD : "none"}
            />
        </Svg>
    );
}

export function TarotIcon({ active, className, style }: TabIconProps) {
    return (
        <Svg className={className} style={style}>
            <rect
                x="3.6"
                y="4.6"
                width="9.6"
                height="14.4"
                rx="2"
                transform="rotate(-13 8.4 11.8)"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY_SOFT : "none"}
            />
            <rect
                x="10"
                y="4.4"
                width="9.6"
                height="14.4"
                rx="2"
                transform="rotate(9 14.8 11.6)"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY : "none"}
            />
            <path
                d={sparkle(14.8, 11.6, 3)}
                stroke={active ? "none" : "currentColor"}
                strokeWidth={1.3}
                fill={active ? GOLD : "none"}
            />
        </Svg>
    );
}

export function OracleIcon({ active, className, style }: TabIconProps) {
    return (
        <Svg className={className} style={style}>
            <circle
                cx="12"
                cy="10.6"
                r="7"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY : "none"}
            />
            <path
                d="M7.4 17.4 6.2 20.4h11.6l-1.2-3"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY_SOFT : "none"}
            />
            <path
                d={sparkle(12, 10.4, 3.4)}
                stroke={active ? "none" : "currentColor"}
                strokeWidth={1.3}
                fill={active ? GOLD : "none"}
            />
            {active && (
                <circle cx="15.6" cy="7.4" r="0.9" fill="#fff" opacity="0.85" />
            )}
        </Svg>
    );
}

export function ProfileIcon({ active, className, style }: TabIconProps) {
    return (
        <Svg className={className} style={style}>
            <circle
                cx="11"
                cy="8.6"
                r="3.8"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY : "none"}
            />
            <path
                d="M4 20.2c.8-3.8 3.6-5.8 7-5.8s6.2 2 7 5.8z"
                stroke={active ? EDGE : "currentColor"}
                fill={active ? BODY : "none"}
            />
            <path
                d={sparkle(18.6, 5, 2.6)}
                stroke={active ? "none" : "currentColor"}
                strokeWidth={1.2}
                fill={active ? GOLD : "none"}
            />
        </Svg>
    );
}

/**
 * The orb's own mark: a crystal ball in white line with a gold star
 * caught inside. Drawn for a violet sphere, so it has no idle look.
 */
export function OrbGlyph({ className, style }: TabIconProps) {
    return (
        <Svg className={className} style={style}>
            <circle cx="12" cy="10.4" r="6.8" stroke="#fff" strokeWidth={1.6} />
            <path
                d="M7.6 17.2 6.6 20h10.8l-1-2.8"
                stroke="#fff"
                strokeWidth={1.6}
            />
            <path d={sparkle(12, 10.4, 3.6)} fill={GOLD} />
            <circle cx="15.2" cy="7.2" r="1" fill="#fff" opacity="0.9" />
        </Svg>
    );
}
