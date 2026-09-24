import { create } from "zustand";

interface NavState {
    /**
     * Route the user asked for and has not arrived at yet.
     *
     * Shared rather than local because two things in the layout need
     * it and they are siblings: the tab bar, which shows the intent
     * on the tap, and the overlay that covers the outgoing screen.
     */
    pending: string | null;

    start: (href: string) => void;
    settle: () => void;
}

/**
 * In-flight navigation.
 *
 * Deliberately not persisted, and deliberately not derived from
 * `usePathname`: the whole point is to know where the user is going
 * before the router agrees.
 */
export const useNavStore = create<NavState>((set) => ({
    pending: null,

    start(href) {
        set({ pending: href });
    },

    settle() {
        set({ pending: null });
    },
}));
