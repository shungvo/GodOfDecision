/** Consecutive days ending today (or yesterday) with at least one reading. */
export function computeStreak(dates: string[]) {
    if (dates.length === 0) return 0;

    const days = new Set(dates.map((iso) => new Date(iso).toDateString()));

    const cursor = new Date();

    // A streak survives if the user has not yet asked today.
    if (!days.has(cursor.toDateString())) {
        cursor.setDate(cursor.getDate() - 1);

        if (!days.has(cursor.toDateString())) return 0;
    }

    let streak = 0;

    while (days.has(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}
