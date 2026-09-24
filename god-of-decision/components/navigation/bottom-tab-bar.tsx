"use client";

import { House, Layers, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useNavStore } from "@/stores/nav.store";

interface TabItem {
    /** Accessible name. These links have no visible text. */
    label: string;
    href: string;
    icon: React.ElementType;
}

/**
 * The tabs.
 *
 * Four things you come to the app to *do*, and nothing else. The
 * journal used to sit here as a fifth, but it is somewhere you go to
 * look back rather than somewhere you act — it lives on the profile
 * now, one tap from Hồ sơ, beside the counts drawn from it.
 *
 * Everything here is sized off this array, so removing an entry
 * rebalances the row and the sliding indicator on its own.
 */
const TABS: TabItem[] = [
    { label: "Trang chủ", href: "/", icon: House },
    { label: "Tarot", href: "/tarot", icon: Layers },
    { label: "Vị thần", href: "/oracle", icon: Sparkles },
    { label: "Hồ sơ", href: "/profile", icon: User },
];

/** Springy, but as a curve a compositor can run on its own. */
const SLIDE = "cubic-bezier(0.34, 1.4, 0.64, 1)";

/**
 * Routes the bar stays out of.
 *
 * /login is a doorway, not a destination: it carries its own back
 * arrow, and a tab row under a half typed form would offer five ways
 * to abandon it and none to finish it.
 *
 * Unlike /explore — which has no tab of its own but still shows the
 * bar — these screens hide it outright.
 */
const NO_TAB_BAR = ["/login"];

function matches(pathname: string, href: string) {
    return (
        pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    );
}

export function BottomTabBar() {
    const pathname = usePathname();

    /**
     * The tab the user just asked for, before the route arrives.
     *
     * `usePathname` only changes once the navigation has committed. On
     * a heavy route that is a beat later, and until then the indicator
     * sits on the old tab — so a tap that did register reads as an app
     * that has frozen.
     *
     * Shared with NavOverlay, which covers the outgoing screen for the
     * same stretch of time.
     */
    const pending = useNavStore((state) => state.pending);
    const start = useNavStore((state) => state.start);
    const settle = useNavStore((state) => state.settle);

    /**
     * The route arrived, so hand the indicator back to the URL.
     *
     * Keyed on the pathname rather than cleared by a timer: whatever
     * the navigation ends up doing — arriving, being replaced by
     * another tap, or being abandoned — the URL is the truth, and this
     * fires the moment it changes.
     */
    useEffect(() => {
        settle();
    }, [pathname, settle]);

    // After the hooks, never before: bailing out earlier would make
    // the effect above conditional, and the indicator would then be
    // stuck on whatever tab was pending when /login was opened.
    if (NO_TAB_BAR.includes(pathname)) return null;

    /** What the bar shows: the intent while pending, else the URL. */
    const shown = pending ?? pathname;

    const activeIndex = TABS.findIndex((tab) => matches(shown, tab.href));

    return (
        <nav
            className="
        fixed
        inset-x-0
        bottom-0
        z-50

        flex
        justify-center

        px-4

        pb-[calc(env(safe-area-inset-bottom)+10px)]
        pt-3

        pointer-events-none
      "
            aria-label="Main navigation"
        >
            <div
                className="
          pointer-events-auto

          relative
          flex
          w-full
          max-w-md
          items-center

          rounded-[28px]

          border
          border-white/70

          bg-white/85

          px-2
          py-1

          shadow-e3

          backdrop-blur-2xl
          backdrop-saturate-150

          supports-[backdrop-filter]:bg-white/75
        "
            >
                {/* ========================================
            Glass highlight
        ======================================== */}

                <div
                    className="
            pointer-events-none
            absolute
            inset-x-6
            top-0
            h-px

            bg-gradient-to-r
            from-transparent
            via-white/40
            to-transparent
          "
                />

                {/* ========================================
            INDICATOR

            One element that slides, rather than a pill
            per tab handed between them by a shared layout
            animation.

            That is the whole point: a shared layout
            animation measures and repositions on every
            frame from JavaScript, so it stalls the moment
            the main thread is busy — which is exactly when
            a tab is being tapped and a new route is
            rendering. A transform transition is handed to
            the compositor and keeps running regardless of
            what the main thread is doing.

            Width is one fifth of the row, and it moves by
            whole multiples of its own width, so the maths
            stays right at any screen size.
        ======================================== */}

                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-1.5 left-2 transition-[transform,opacity] ease-out"
                    style={{
                        width: `calc((100% - 1rem) / ${TABS.length})`,
                        transform: `translateX(calc(${Math.max(
                            activeIndex,
                            0,
                        )} * 100%))`,
                        transitionDuration: "320ms",
                        transitionTimingFunction: SLIDE,
                        opacity: activeIndex < 0 ? 0 : 1,
                    }}
                >
                    <span
                        className="
              absolute
              inset-x-[3px]
              inset-y-0

              rounded-[20px]
              bg-primary-600

              shadow-[0_4px_14px_rgba(123,69,240,0.45)]
            "
                    />
                </span>

                {/* ========================================
            Tabs
        ======================================== */}

                {TABS.map((tab) => {
                    const Icon = tab.icon;

                    const isActive = matches(shown, tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            aria-label={tab.label}
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => {
                                // Tapping the tab you are already on
                                // starts nothing, so it must not raise
                                // the overlay.
                                if (!matches(pathname, tab.href)) {
                                    start(tab.href);
                                }
                            }}
                            className="
                relative
                z-10

                flex
                min-w-0
                flex-1
                items-center
                justify-center

                rounded-[22px]

                px-2
                py-4

                outline-none

                focus-visible:ring-2
                focus-visible:ring-white/40
              "
                        >
                            {/*
                             * Two icons stacked, cross faded.
                             *
                             * Not one icon whose colour changes: `color`
                             * is not a compositor property, so changing
                             * it needs the element repainted on the main
                             * thread — which is queued behind the render
                             * of the route being navigated to. The
                             * result was an icon that stayed grey until
                             * the new page appeared, while the pill
                             * underneath had already slid across.
                             *
                             * Both are rasterised up front and only
                             * opacity moves, so the swap is handed to
                             * the compositor and lands on the tap.
                             *
                             * Outline in both states, too. These are
                             * line icons: filling one floods its
                             * enclosed shapes, and the house, the book
                             * and the stack all collapse into a blob.
                             */}
                            <span
                                className="relative block transition-transform duration-200 ease-out"
                                style={{
                                    transform: isActive
                                        ? "translateY(-1px) scale(1.05)"
                                        : "none",
                                }}
                                aria-hidden="true"
                            >
                                <Icon
                                    size={21}
                                    strokeWidth={1.8}
                                    className="text-ink-soft"
                                />

                                <Icon
                                    size={21}
                                    strokeWidth={2.1}
                                    className="absolute inset-0 text-white transition-opacity duration-150 ease-out"
                                    style={{
                                        opacity: isActive ? 1 : 0,
                                        willChange: "opacity",
                                    }}
                                />
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
