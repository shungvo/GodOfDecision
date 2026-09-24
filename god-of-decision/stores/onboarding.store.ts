import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
    /** True once the intro has been seen through to the end. */
    onboarded: boolean;

    complete: () => void;
    /** Lets the profile screen offer the intro again. */
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            onboarded: false,

            complete() {
                set({ onboarded: true });
            },

            reset() {
                set({ onboarded: false });
            },
        }),
        {
            name: "god-of-decision:onboarding",
            version: 1,
        },
    ),
);

// Reading `onboarded` during render requires `useHydrated()`.
// See hooks/use-hydrated.ts.
