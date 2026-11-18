import { cn } from "@/lib/utils";

interface OracleMarkProps {
    /** Size and any extra styling. Defaults to 32px. */
    className?: string;
}

/**
 * Lumi's face, cropped into a circle. See docs/MASCOT.md.
 *
 * lumi-face.webp is already framed on the head and hat, so it simply
 * covers the circle at any diameter.
 */
export function OracleMark({ className }: OracleMarkProps) {
    return (
        <span
            className={cn(
                "block h-8 w-8 shrink-0",

                "overflow-hidden rounded-full",

                "bg-secondary-100",

                "bg-[url(/images/mascot/lumi-face.webp)]",
                "bg-cover",
                "bg-center",
                "bg-no-repeat",

                "ring-2 ring-white/60",

                className,
            )}
            aria-hidden="true"
        />
    );
}
