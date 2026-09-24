import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Which surface the placeholder sits on.
 *
 * `dark`  the violet canvas, or the primary-900 reading box
 * `light` a white card or the canvas tint
 */
export type SkeletonTone = "dark" | "light";

const TONES: Record<SkeletonTone, string> = {
    dark: "skeleton-dark",
    light: "skeleton-light",
};

interface SkeletonProps {
    tone?: SkeletonTone;
    className?: string;
    style?: CSSProperties;
}

/**
 * One placeholder block. Size it with `className`.
 *
 * Shape it like the thing it stands in for; a skeleton that
 * does not match what replaces it just moves the layout jump
 * later instead of removing it.
 */
export function Skeleton({ tone = "dark", className, style }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            style={style}
            className={cn("skeleton", TONES[tone], className)}
        />
    );
}

/**
 * Ragged line lengths, so the block reads as prose rather than
 * as a stack of identical bars.
 */
const LINE_WIDTHS = ["100%", "94%", "97%", "88%", "92%"];

interface SkeletonTextProps {
    lines?: number;
    tone?: SkeletonTone;

    /** Announced to screen readers while the content loads. */
    label?: string;

    className?: string;
    lineClassName?: string;
}

export function SkeletonText({
    lines = 3,
    tone = "dark",
    label = "Đang tải…",
    className,
    lineClassName,
}: SkeletonTextProps) {
    return (
        <div
            role="status"
            aria-busy="true"
            className={cn("space-y-2.5", className)}
        >
            <span className="sr-only">{label}</span>

            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    tone={tone}
                    className={cn("h-3.5 rounded-full", lineClassName)}
                    style={{
                        // The last line always trails off.
                        width:
                            index === lines - 1
                                ? "62%"
                                : LINE_WIDTHS[index % LINE_WIDTHS.length],
                    }}
                />
            ))}
        </div>
    );
}
