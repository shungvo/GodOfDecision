"use client";

import { Compass, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { OracleMark } from "@/components/brand/oracle-mark";
import { ProfileIcon } from "@/components/navigation/tab-icons";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

/** How far the page must scroll before the bar earns its backdrop. */
const LIFT_AT = 6;

/** Below this share of the allowance, the gauge starts warning. */
const LOW_AT = 0.15;

/**
 * 19292 → "19k", 9500 → "9,5k", 708 → "708".
 *
 * The header has room for four glyphs, not six. Precision belongs on
 * the profile screen, which prints the real number; here the fill is
 * what carries the proportion.
 */
function compact(value: number) {
    if (value < 1000) return String(value);

    if (value < 10000) {
        return `${(value / 1000).toFixed(1).replace(".", ",")}k`;
    }

    return `${Math.round(value / 1000)}k`;
}

/**
 * The app bar.
 *
 * Built on the shape Instagram and Facebook settled on: the brand on
 * the left as the way home, small round controls on the right. It is
 * flush against the top of the viewport rather than inset, which is
 * what makes it read as chrome instead of as page content.
 *
 * Three controls: the day's analysis allowance, the 78 card library,
 * and the profile — none of which has a bottom tab. The profile moved
 * up here when the oracle became the orb in the middle of the dock.
 *
 * The streak pill used to sit here too. Three controls plus the
 * lockup do not fit a 375pt bar: the tagline wrapped to a second
 * line inside a bar that is 56px tall, and the whole thing read as
 * broken. The allowance won the spot because it is the one number
 * here that changes what you can do next — the streak is the
 * headline of the profile card, which is where both of these lead.
 */
export function AppHeader() {
    /** True once the page has scrolled far enough to need a backdrop. */
    const [lifted, setLifted] = useState(false);

    const quota = useAuthStore((state) => state.quota);
    const user = useAuthStore((state) => state.user);
    const onProfile = usePathname().startsWith("/profile");
    const loadAuth = useAuthStore((state) => state.load);

    /*
     * `load`, not `refresh`: this bar mounts on every screen, and a
     * request per tab change to redraw a number that only moves when
     * an analysis runs would be noise. The stores that spend tokens
     * refresh it themselves the moment they do.
     */
    useEffect(() => {
        void loadAuth();
    }, [loadAuth]);

    useEffect(() => {
        function onScroll() {
            setLifted(window.scrollY > LIFT_AT);
        }

        // Run once: a restored scroll position skips the first event.
        onScroll();

        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="sticky top-0 z-30 -mx-5 mb-6">
            {/* ==========================================
          BACKDROP

          Only present once the page has moved. At rest the
          bar floats straight on the canvas, which is what
          keeps the top of the screen feeling open.

          -z-10 is safe here: the sticky wrapper carries a
          z-index, so it is its own stacking context and
          this cannot escape behind the body background.
      =========================================== */}

            <div
                className={cn(
                    "pointer-events-none absolute inset-0 -z-10",

                    "border-b border-white/10",

                    "backdrop-blur-xl backdrop-saturate-150",

                    "transition-opacity duration-200 ease-out",

                    lifted ? "opacity-100" : "opacity-0",
                )}
                style={{
                    // The canvas' own top colour, so the bar never
                    // looks like a different shade of purple.
                    backgroundColor:
                        "color-mix(in srgb, var(--canvas-top) 88%, transparent)",
                }}
                aria-hidden="true"
            />

            <div className="flex h-14 items-center gap-3 px-5">
                {/* ==========================================
            BRAND
        =========================================== */}

                <Link
                    href="/"
                    className="flex min-w-0 items-center gap-2.5 transition active:scale-[0.97]"
                >
                    <OracleMark className="h-9 w-9" />

                    {/* Stacked lockup rather than a single word: "GOD"
                        alone is three letters, which leaves the bar
                        looking as empty as no bar at all. */}
                    <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-[19px] font-extrabold leading-none tracking-[0.16em] text-white">
                            GOD
                        </span>

                        {/* Truncates rather than wraps. On a narrower
                            phone than this design targets, a clipped
                            tagline is a bar that still looks like a
                            bar; a wrapped one is 56px of chrome
                            holding three lines of text. */}
                        <span className="truncate text-[9px] font-semibold uppercase leading-none tracking-[0.18em] text-white/45">
                            Guidance Of Destiny
                        </span>
                    </span>
                </Link>

                {/* ==========================================
            CONTROLS
        =========================================== */}

                <div className="ml-auto flex shrink-0 items-center gap-2">
                    {/* ------------------------------------
                        THE DAY'S ENERGY

                        The chip is the bar: a gold fill
                        behind the number, draining left to
                        right as analyses are spent. A
                        separate track would need width the
                        header does not have, and this way
                        the gauge and its reading are one
                        object.

                        Guests get nothing — they have no
                        allowance to watch, and the login
                        door is offered where it matters,
                        inside the reading itself.
                    ------------------------------------- */}
                    {quota && (
                        <Link
                            href="/profile"
                            aria-label={`Còn ${quota.remaining.toLocaleString(
                                "vi-VN",
                            )} trên ${quota.limit.toLocaleString(
                                "vi-VN",
                            )} năng lượng phân tích hôm nay`}
                            className="
                relative
                inline-flex
                h-9
                items-center
                gap-1.5

                overflow-hidden
                rounded-full
                glass

                px-2.5

                transition
                active:scale-95
              "
                        >
                            <span
                                className={cn(
                                    "absolute inset-y-0 left-0",
                                    "transition-[width] duration-500 ease-out",
                                    quota.remaining / quota.limit < LOW_AT
                                        ? "bg-magic-gold/45"
                                        : "bg-magic-gold/25",
                                )}
                                style={{
                                    width: `${
                                        (quota.remaining / quota.limit) * 100
                                    }%`,
                                }}
                                aria-hidden="true"
                            />

                            <Zap
                                className="relative h-[14px] w-[14px] text-magic-gold"
                                aria-hidden="true"
                            />

                            <span className="relative text-[12px] font-bold tabular-nums text-white">
                                {compact(quota.remaining)}
                            </span>
                        </Link>
                    )}

                    <Link
                        href="/explore"
                        aria-label="Bộ bài 78 lá"
                        className="
              flex
              h-9
              w-9
              items-center
              justify-center

              rounded-full
              glass

              text-white

              transition
              active:scale-95
            "
                    >
                        <Compass
                            className="h-[18px] w-[18px]"
                            aria-hidden="true"
                        />
                    </Link>

                    {/* ------------------------------------
                        PROFILE

                        The signed in user's initial on a
                        violet coin; a guest gets the outline
                        figure. Ringed in gold while the
                        profile is the screen you are on.
                    ------------------------------------- */}
                    <Link
                        href="/profile"
                        aria-label="Hồ sơ"
                        aria-current={onProfile ? "page" : undefined}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full",
                            "text-white transition active:scale-95",
                            user
                                ? "bg-gradient-to-br from-secondary-300 to-primary-700 text-[15px] font-extrabold uppercase"
                                : "glass",
                            onProfile &&
                                "outline-2 outline-offset-2 outline-magic-gold",
                        )}
                    >
                        {user ? (
                            user.email.charAt(0)
                        ) : (
                            <ProfileIcon className="h-[19px] w-[19px]" />
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
}
