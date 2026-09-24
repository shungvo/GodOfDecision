import { create } from "zustand";

import { ApiError, api } from "@/lib/api";
import type { AuthUser, TokenQuota } from "@/types/auth";

/**
 * "unknown" is the state before /me has answered once. Screens that
 * show account things render skeletons on it rather than flashing
 * the guest view at someone who is logged in.
 */
type Status = "unknown" | "guest" | "authed";

interface AuthState {
    status: Status;
    user: AuthUser | null;
    quota: TokenQuota | null;

    /** A login or register is in flight. */
    busy: boolean;
    error: string | null;

    /** Ask /me once. Later calls are free — they do nothing. */
    load: () => Promise<void>;

    /** Ask /me again, for screens that show the quota. */
    refresh: () => Promise<void>;

    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const FALLBACK_ERROR =
    "Không kết nối được tới vị thần. Kiểm tra kết nối mạng và thử lại.";

function message(error: unknown) {
    return error instanceof ApiError ? error.message : FALLBACK_ERROR;
}

/**
 * Session state.
 *
 * Not persisted: the session itself is an httpOnly cookie the
 * browser keeps, so persisting a copy here could only ever disagree
 * with it. One /me on first need is the price, and it doubles as
 * today's quota reading.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
    status: "unknown",
    user: null,
    quota: null,

    busy: false,
    error: null,

    async load() {
        if (get().status !== "unknown") return;

        await get().refresh();
    },

    async refresh() {
        try {
            const { user, quota } = await api.auth.me();

            set({ status: user ? "authed" : "guest", user, quota });
        } catch {
            // Offline says nothing about being logged in or out.
            // Leave "unknown" so the next screen asks again.
        }
    },

    async login(email, password) {
        if (get().busy) return false;

        set({ busy: true, error: null });

        try {
            const { user, quota } = await api.auth.login(email, password);

            set({ status: "authed", user, quota, busy: false });

            return true;
        } catch (error) {
            set({ busy: false, error: message(error) });

            return false;
        }
    },

    async register(email, password) {
        if (get().busy) return false;

        set({ busy: true, error: null });

        try {
            const { user, quota } = await api.auth.register(email, password);

            set({ status: "authed", user, quota, busy: false });

            return true;
        } catch (error) {
            set({ busy: false, error: message(error) });

            return false;
        }
    },

    async logout() {
        try {
            await api.auth.logout();
        } catch {
            // The cookie may or may not be gone; the guest state
            // below makes the app behave as though it is, and the
            // next /me settles it.
        }

        set({ status: "guest", user: null, quota: null, error: null });
    },
}));
