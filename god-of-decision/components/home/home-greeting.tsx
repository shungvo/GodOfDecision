"use client";

import { motion } from "framer-motion";
import { Moon, Sparkles, Sun, Sunrise, Sunset } from "lucide-react";

import { useHydrated } from "@/hooks/use-hydrated";
import { computeStreak } from "@/lib/streak";
import { useDailyStore } from "@/stores/daily.store";

/** Height the greeting row takes, margin included. DailyCard budgets for it. */
export const GREETING_HEIGHT = 40;

function greetingFor(hour: number) {
    if (hour >= 5 && hour < 11)
        return { text: "Chào buổi sáng", Icon: Sunrise };
    if (hour >= 11 && hour < 13) return { text: "Chào buổi trưa", Icon: Sun };
    if (hour >= 13 && hour < 18) return { text: "Chào buổi chiều", Icon: Sun };
    if (hour >= 18 && hour < 22) return { text: "Chào buổi tối", Icon: Sunset };
    return { text: "Khuya rồi đó", Icon: Moon };
}

/**
 * The Finch-style hello at the top of Home.
 *
 * Time of day on the left, the daily ritual streak on the right. The
 * streak lives here rather than in the app bar, which has no room
 * for it at 375pt (see app-header.tsx).
 *
 * Client only: the server knows neither the reader's clock nor their
 * streak, so the row keeps its height and fills in after hydration.
 */
export function HomeGreeting() {
    const hydrated = useHydrated();
    const revealDays = useDailyStore((state) => state.revealDays);
    const revealedOn = useDailyStore((state) => state.revealedOn);

    if (!hydrated) {
        return <div style={{ height: GREETING_HEIGHT }} aria-hidden="true" />;
    }

    const { text, Icon } = greetingFor(new Date().getHours());

    // Readers from before revealDays existed still have revealedOn.
    const days = revealDays.length
        ? revealDays
        : revealedOn
          ? [revealedOn]
          : [];
    const streak = computeStreak(days.map((day) => `${day}T12:00:00`));

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="flex w-full items-center justify-between"
            style={{ height: GREETING_HEIGHT, paddingBottom: 8 }}
        >
            <p className="flex items-center gap-2 text-[17px] font-bold text-white">
                <Icon
                    className="h-[18px] w-[18px] text-magic-gold"
                    aria-hidden="true"
                />
                {text}
            </p>

            {streak > 0 && (
                <span
                    className="glass inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-white"
                    aria-label={`Chuỗi ${streak} ngày liên tiếp mở bài`}
                >
                    <motion.span
                        animate={{
                            rotate: [0, 14, -8, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            repeatDelay: 2,
                        }}
                        className="inline-flex"
                    >
                        <Sparkles
                            className="h-3.5 w-3.5 text-magic-gold"
                            aria-hidden="true"
                        />
                    </motion.span>
                    {streak} ngày
                </span>
            )}
        </motion.div>
    );
}
