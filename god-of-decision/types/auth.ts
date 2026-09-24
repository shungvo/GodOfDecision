/**
 * Accounts.
 *
 * An account exists for exactly one reason: analyses spend model
 * tokens, and an allowance needs somebody to belong to. Everything
 * else — draws, the journal, the daily card — works without one.
 */

export interface AuthUser {
    id: number;
    email: string;
    /** ISO string. */
    createdAt: string;
}

/** Today's analysis allowance, in model tokens. Resets at midnight. */
export interface TokenQuota {
    limit: number;
    used: number;
    remaining: number;
}

/** Returned by login and register. */
export interface AuthSession {
    user: AuthUser;
    quota: TokenQuota;
}

/** Returned by GET /api/auth/me. Both null for a guest. */
export interface AuthMe {
    user: AuthUser | null;
    quota: TokenQuota | null;
}
