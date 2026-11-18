"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useNavStore } from "@/stores/nav.store";

import {
    HomeIcon,
    OrbGlyph,
    TarotIcon,
    type TabIconProps,
} from "./tab-icons";

interface TabItem {
    /** Accessible name. These links have no visible text. */
    label: string;
    href: string;
    icon: React.ComponentType<TabIconProps>;
}

/**
 * The tabs either side of the orb.
 *
 * Three destinations in all: Home and Tarot here, the oracle as the
 * orb in the middle. The profile left the row for the avatar in the
 * app bar — it is somewhere you check, not something you come to do,
 * and taking it out is what lets the orb sit dead centre with one tab
 * on each side.
 */
const TABS: TabItem[] = [
    { label: "Trang chủ", href: "/", icon: HomeIcon },
    { label: "Tarot", href: "/tarot", icon: TarotIcon },
];

/** The oracle, raised out of the dock as the app's main action. */
const ORB = { label: "Vị thần", href: "/oracle" };

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

    const orbActive = matches(shown, ORB.href);

    function go(href: string) {
        // Tapping the tab you are already on starts nothing, so it
        // must not raise the overlay.
        if (!matches(pathname, href)) start(href);
    }

    function tab(item: TabItem) {
        const Icon = item.icon;
        const isActive = matches(shown, item.href);

        return (
            <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => go(item.href)}
                className="
          group
          relative
          flex
          flex-1
          items-center
          justify-center
          outline-none
          [-webkit-tap-highlight-color:transparent]
          focus-visible:[&>span]:ring-2
          focus-visible:[&>span]:ring-white/60
        "
            >
                {/*
                 * The chosen tab grows. A small moon swells up behind
                 * it and the icon lights up and scales, all by
                 * transform and opacity so it lands on the tap even
                 * while the next route is still rendering.
                 */}
                <span
                    className="relative flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-150 group-active:scale-90"
                    aria-hidden="true"
                >
                    <span
                        className="tab-moon absolute inset-0 rounded-full transition-[opacity,transform] duration-300"
                        style={{
                            opacity: isActive ? 1 : 0,
                            transform: isActive ? "scale(1)" : "scale(0.4)",
                            transitionTimingFunction: SLIDE,
                        }}
                    />

                    <span
                        className="relative block h-6 w-6 transition-transform duration-300"
                        style={{
                            transform: isActive ? "scale(1.3)" : "scale(1)",
                            transitionTimingFunction: SLIDE,
                        }}
                    >
                        <Icon
                            className="absolute inset-0 text-secondary-100/80 transition-opacity duration-150"
                            style={{ opacity: isActive ? 0 : 1 }}
                        />
                        <Icon
                            active
                            className="absolute inset-0 transition-opacity duration-150"
                            style={{
                                opacity: isActive ? 1 : 0,
                                willChange: "opacity",
                            }}
                        />
                    </span>
                </span>
            </Link>
        );
    }

    return (
        <nav
            className="
        pointer-events-none
        fixed
        inset-x-0
        bottom-0
        z-50
        flex
        justify-center
        px-4
        pb-[calc(env(safe-area-inset-bottom)+16px)]
      "
            aria-label="Main navigation"
        >
            {/*
             * The dock: dark violet glass that takes on the sky's
             * colour, so the lit things in it — the moon behind the
             * chosen tab, the orb — carry all the emphasis.
             */}
            <div
                className="
          tab-dock
          pointer-events-auto
          relative
          flex
          h-[68px]
          w-full
          max-w-[300px]
          items-center
          rounded-full
          px-3
          backdrop-blur-2xl
          backdrop-saturate-150
        "
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />

                {tab(TABS[0])}

                {/* Room for the orb, which floats above the dock. */}
                <div className="relative flex w-[84px] shrink-0 justify-center self-stretch">
                    <Link
                        href={ORB.href}
                        aria-label={ORB.label}
                        aria-current={orbActive ? "page" : undefined}
                        onClick={() => go(ORB.href)}
                        className="
              group
              absolute
              -top-7
              outline-none
              [-webkit-tap-highlight-color:transparent]
            "
                    >
                        {/* A ring of glass cradling the orb, so it
                            reads as rising out of the dock rather than
                            pasted over it. */}
                        <span
                            aria-hidden="true"
                            className="tab-cradle absolute -inset-[7px] rounded-full"
                        />

                        <span
                            className="relative block transition-transform duration-150 group-active:scale-90"
                            aria-hidden="true"
                        >
                            <span
                                className="tab-orb relative flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white/70"
                                style={{
                                    transform: orbActive
                                        ? "scale(1.12)"
                                        : "scale(1)",
                                    transitionTimingFunction: SLIDE,
                                }}
                            >
                                {/* Halo that only shows while the oracle
                                    is the screen you are on. */}
                                <span
                                    className="tab-orb-halo absolute -inset-2 rounded-full transition-opacity duration-300"
                                    style={{ opacity: orbActive ? 1 : 0 }}
                                />

                                <OrbGlyph className="relative h-9 w-9 drop-shadow-[0_2px_6px_rgba(20,4,60,0.45)]" />
                            </span>
                        </span>
                    </Link>
                </div>

                {tab(TABS[1])}
            </div>
        </nav>
    );
}
