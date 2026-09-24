import { Screen } from "@/components/layout/screen";

/**
 * Shown the instant the Tarot tab is tapped.
 *
 * Next renders this as soon as the navigation starts, without waiting
 * for the route's payload or its JavaScript. The tab switches
 * immediately and this stands in until the real screen is ready —
 * which is the difference between a tab that feels slow and a tab
 * that feels instant, even when the work behind it is identical.
 *
 * It mirrors the real layout rather than showing a spinner: same
 * spread pill, same heading block, same three slots in the same
 * places. Nothing jumps when the page replaces it.
 */
export default function TarotLoading() {
    return (
        <Screen>
            {/* Spread pill */}
            <div className="mb-5 flex justify-center">
                <div className="h-[52px] w-[136px] rounded-full glass" />
            </div>

            {/* Heading block */}
            <div className="mb-5 flex flex-col items-center gap-2">
                <div className="skeleton h-5 w-40 rounded-full" />
                <div className="skeleton h-3.5 w-64 rounded-full" />
            </div>

            {/* Slots. The middle one rides higher, as it does for real. */}
            <div className="flex items-start justify-center gap-[9px] pt-6">
                {[0, 1, 2].map((slot) => (
                    <div
                        key={slot}
                        className={`
              h-[150px]
              w-[100px]

              rounded-xl

              border-2
              border-dashed
              border-white/15

              bg-white/[0.03]

              ${slot === 1 ? "-translate-y-2.5" : ""}
            `}
                    />
                ))}
            </div>
        </Screen>
    );
}
