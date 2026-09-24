import { cn } from "@/lib/utils";

interface OracleMarkProps {
    /** Size and any extra styling. Defaults to 32px. */
    className?: string;
}

/**
 * The oracle's face, cropped into a circle.
 *
 * The background sizing is the whole trick: the source artwork is a
 * full portrait, so it is blown up to 190% and pulled up to 14% to
 * land the face inside the circle at any diameter.
 */
export function OracleMark({ className }: OracleMarkProps) {
    return (
        <span
            className={cn(
                "block h-8 w-8 shrink-0",

                "overflow-hidden rounded-full",

                "bg-secondary-100",

                "bg-[url(/images/avt_img.webp)]",
                "bg-[length:190%]",
                "bg-[position:50%_14%]",
                "bg-no-repeat",

                "ring-2 ring-white/60",

                className,
            )}
            aria-hidden="true"
        />
    );
}
