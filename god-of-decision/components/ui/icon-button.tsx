"use client";

import type { ElementType } from "react";

import { cn } from "@/lib/utils";

type Tone = "glass" | "gold";
type Size = "md" | "lg";

interface IconButtonProps {
    icon: ElementType;

    /**
     * Not rendered, but required.
     *
     * A bare icon has no accessible name of its own, so this
     * becomes the screen reader label and the desktop tooltip.
     * What the icon *means* has to come from where it sits.
     */
    label: string;

    onClick: () => void;

    /**
     * `gold` is the action the screen wants you to take.
     * Never put two of them side by side.
     */
    tone?: Tone;
    size?: Size;

    disabled?: boolean;
    spinning?: boolean;

    className?: string;
}

const TONES: Record<Tone, string> = {
    glass: "glass text-white hover:bg-white/20",
    gold: "bg-magic-gold text-[#3d2600] shadow-e3 hover:brightness-105",
};

const SIZES: Record<Size, { box: string; icon: string }> = {
    md: { box: "h-11 w-11", icon: "h-4 w-4" },
    lg: { box: "h-[52px] w-[52px]", icon: "h-5 w-5" },
};

/**
 * A single action, placed next to the thing it acts on.
 */
export function IconButton({
    icon: Icon,
    label,
    onClick,
    tone = "glass",
    size = "md",
    disabled = false,
    spinning = false,
    className,
}: IconButtonProps) {
    const preset = SIZES[size];

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={cn(
                `
          inline-flex
          shrink-0
          items-center
          justify-center

          rounded-full

          transition
          active:scale-95

          disabled:opacity-40
          disabled:active:scale-100
        `,
                preset.box,
                TONES[tone],
                className,
            )}
        >
            <Icon
                className={cn(preset.icon, spinning && "animate-spin")}
                aria-hidden="true"
            />
        </button>
    );
}
