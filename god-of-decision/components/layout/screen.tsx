import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { LumiPeek } from "@/components/mascot/lumi-peek";
import type { LumiMoment } from "@/lib/lumi-lines";
import { cn } from "@/lib/utils";

interface ScreenProps {
    children: ReactNode;

    title?: string;
    subtitle?: string;

    className?: string;

    /**
     * Lumi visits the screen from the right of the title, saying a
     * line for this moment. See components/mascot/lumi-peek.tsx.
     */
    lumi?: LumiMoment;
}

/**
 * Page shell.
 *
 * Reserves room for the floating bottom navigation
 * and the safe area.
 */
export function Screen({
    children,
    title,
    subtitle,
    className,
    lumi,
}: ScreenProps) {
    return (
        <main
            className={cn(
                /*
                 * `isolate` is load bearing. Without it a -z-10
                 * backdrop escapes to the root stacking context
                 * and paints *under* the body gradient, which is
                 * opaque, so it disappears entirely.
                 */
                "relative isolate",
                "mx-auto min-h-dvh w-full max-w-lg",
                /*
                 * No top padding: the app bar is flush against the
                 * viewport, the way it is in Instagram and Facebook.
                 * It supplies the space that `pt-14` used to.
                 */
                "px-5",
                "pb-[calc(env(safe-area-inset-bottom)+104px)]",
                className,
            )}
        >
            <AppHeader />

            {(title || subtitle) && (
                <header className="mb-7 flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                        {title && (
                            <h1 className="text-2xl font-extrabold tracking-tight text-white">
                                {title}
                            </h1>
                        )}

                        {subtitle && (
                            <p className="mt-1.5 text-sm leading-6 text-white/60">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {lumi && <LumiPeek moment={lumi} className="mt-0.5" />}
                </header>
            )}

            {children}
        </main>
    );
}
