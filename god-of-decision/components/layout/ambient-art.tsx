import { cn } from "@/lib/utils";

interface AmbientArtProps {
    className?: string;
}

/**
 * Atmosphere behind a screen.
 *
 * The blur and the saturation are baked into avt_ambient.webp
 * rather than applied as CSS filters. They used to be
 * `blur-[7px] saturate-[1.15]` over a 760px element, which is a
 * per-pixel pass across most of the screen on the first paint of
 * every navigation to this route — and with `mix-blend-mode` on
 * the same element there is no cheap cached layer to fall back
 * on. Baked, the element paints as a plain image.
 *
 * The asset is 420px because it is then blurred past the point
 * where resolution matters: 25KB instead of 164KB.
 *
 * The oracle illustration, sunk far enough into the canvas that
 * it reads as light and colour rather than as a picture. Two
 * things keep it from competing with the content on top:
 *
 *   a mask that dissolves it downward, so it never reaches the
 *   part of the screen where cards and text live
 *
 *   a warm glow off to one side, which is what stops the screen
 *   being a single flat violet
 *
 * `fixed` so it stays put on the little the page scrolls, and
 * behind everything at -z-10.
 *
 * Requires the `isolate` on Screen's <main>. Without a stacking
 * context there, -z-10 lands under the opaque body gradient and
 * nothing shows at all.
 */
export function AmbientArt({ className }: AmbientArtProps) {
    const fade =
        "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.5) 62%, transparent 85%)";

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
                className,
            )}
        >
            {/* The illustration */}
            <div
                className="
          absolute
          left-1/2
          top-0

          h-[66vh]
          w-[min(148vw,760px)]
          -translate-x-1/2

          bg-[url(/images/avt_ambient.webp)]
          bg-contain
          bg-top
          bg-no-repeat

          opacity-[0.3]
        "
                /*
                 * `screen` is what makes this work. Blended normally
                 * the illustration's dark half is the same value as
                 * the canvas, so nothing reads. Screened, the dark
                 * half drops out entirely and only the glow, the
                 * sparkles and the flowers add light.
                 */
                style={{
                    maskImage: fade,
                    WebkitMaskImage: fade,
                    mixBlendMode: "screen",
                }}
            />

            {/* A second hue, so the canvas is not one colour */}
            <div className="absolute -left-16 top-[26%] h-72 w-72 rounded-full bg-magic-gold/[0.1] blur-[90px]" />

            <div className="absolute -right-20 top-[8%] h-64 w-64 rounded-full bg-secondary-300/15 blur-[80px]" />
        </div>
    );
}
