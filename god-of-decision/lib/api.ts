import type {
    Arcana,
    CardRef,
    Lang,
    ReadingDepth,
    Spread,
    Suit,
    TarotCardEntry,
    TarotCardList,
    TarotDraw,
    Topic,
} from "@/types/tarot";
import type { AuthMe, AuthSession } from "@/types/auth";
import type { OracleDraw } from "@/types/oracle";

/** Port the Express backend listens on. */
const API_PORT = 3001;

/**
 * Where the API lives.
 *
 * In the browser: nowhere. Requests go out same-origin as `/api/...`
 * and the rewrite in next.config.ts forwards them to the backend.
 *
 * That indirection is doing real work. Calling the backend's port
 * directly would mean the app only functions where port 3001 happens
 * to be reachable under the same hostname — which is true on this
 * machine and false everywhere else:
 *
 *   - from a phone on the LAN, `localhost:3001` is the phone itself
 *   - through a single ngrok tunnel there is no :3001 at all
 *   - and over an https tunnel a plain http call is blocked outright
 *     as mixed content
 *
 * One origin also means no CORS preflight on every request.
 *
 * Set NEXT_PUBLIC_API_URL to point somewhere fixed instead, e.g. a
 * deployed backend.
 *
 * Called per request rather than resolved once at import time, so a
 * value computed during server rendering cannot leak to the client.
 */
function baseUrl() {
    const configured = process.env.NEXT_PUBLIC_API_URL;

    if (configured) return configured;

    if (typeof window !== "undefined") return "";

    // Server rendering has no origin to be relative to. Nothing calls
    // the API from there today; localhost is right for a server sitting
    // beside the backend in any case.
    return `http://localhost:${API_PORT}`;
}

type ApiResponse<T> =
    { success: true; data: T } | { success: false; error: string };

export class ApiError extends Error {
    readonly status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${baseUrl()}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...init?.headers,
            },
        });
    } catch {
        throw new ApiError(
            "Không kết nối được tới vị thần. Kiểm tra kết nối mạng và thử lại.",
        );
    }

    let body: ApiResponse<T>;

    try {
        body = (await response.json()) as ApiResponse<T>;
    } catch {
        throw new ApiError(
            "Vị thần trả lời bằng thứ ngôn ngữ không đọc được.",
            response.status,
        );
    }

    if (!response.ok || !body.success) {
        throw new ApiError(
            body.success ? "Đã có lỗi xảy ra." : body.error,
            response.status,
        );
    }

    return body.data;
}

/**
 * Post `body` and read the plain text reply as it arrives.
 *
 * Both pillars stream prose, and both want it the same way: chunks
 * handed over the moment they land, plus the whole thing at the end
 * for whoever is caching it.
 *
 * The response is either prose or JSON, never both. A failure lands
 * before the first byte of text — after that the status is already
 * sent and the server can only hang up, which reads here as a short
 * reading rather than an error.
 */
async function streamText(
    path: string,
    body: unknown,
    onDelta: (delta: string) => void,
): Promise<string> {
    let response: Response;

    try {
        response = await fetch(`${baseUrl()}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch {
        throw new ApiError(
            "Không kết nối được tới vị thần. Kiểm tra kết nối mạng và thử lại.",
        );
    }

    if (!response.ok) {
        let message = "Đã có lỗi xảy ra.";

        try {
            const failure = (await response.json()) as { error?: string };
            if (failure?.error) message = failure.error;
        } catch {
            // Not JSON. Keep the generic message.
        }

        throw new ApiError(message, response.status);
    }

    if (!response.body) {
        const text = await response.text();
        onDelta(text);
        return text;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let full = "";

    for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
            full += chunk;
            onDelta(chunk);
        }
    }

    // Flush any bytes held back mid character.
    const tail = decoder.decode();

    if (tail) {
        full += tail;
        onDelta(tail);
    }

    return full;
}

interface CardFilter {
    arcana?: Arcana;
    suit?: Suit;
}

export const api = {
    /**
     * Sessions ride an httpOnly cookie, which same-origin fetches
     * carry by themselves — so nothing here touches a token, and
     * nothing outside these four calls knows auth exists.
     */
    auth: {
        register(email: string, password: string) {
            return request<AuthSession>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
        },

        login(email: string, password: string) {
            return request<AuthSession>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
        },

        logout() {
            return request<null>("/api/auth/logout", {
                method: "POST",
                body: "{}",
            });
        },

        /** Who am I, and how much analysis is left today. */
        me() {
            return request<AuthMe>("/api/auth/me");
        },
    },

    tarot: {
        cards(filter: CardFilter = {}) {
            const query = new URLSearchParams();

            if (filter.arcana) query.set("arcana", filter.arcana);
            if (filter.suit) query.set("suit", filter.suit);

            // `URLSearchParams.size` is Safari 17, above this
            // project's Safari 16.4 baseline. Stringify instead.
            const search = query.toString();
            const suffix = search ? `?${search}` : "";

            return request<TarotCardList>(`/api/tarot/cards${suffix}`);
        },

        card(slug: string) {
            return request<TarotCardEntry>(
                `/api/tarot/cards/${encodeURIComponent(slug)}`,
            );
        },

        /** Cards only. No question, no AI. */
        draw(spread: Spread = "single") {
            return request<TarotDraw>("/api/tarot/draw", {
                method: "POST",
                body: JSON.stringify({ spread }),
            });
        },

        /**
         * Read an already drawn spread for one life aspect.
         *
         * Only slugs travel; the server resolves the meanings.
         *
         * The reading arrives as plain text in pieces, so the first
         * words are on screen long before the model has finished.
         * `onDelta` fires per chunk; the promise resolves with the
         * whole thing.
         *
         * `depth` decides how much room the reading gets: `brief` for a
         * spread, which is read at a glance, `deep` for a single card
         * someone has opened a sheet to sit with.
         *
         * Options come in an object rather than as positional
         * arguments so that adding one does not mean putting a setting
         * after the callback.
         */
        interpretStream(
            {
                cards,
                topic,
                lang = "vi",
                depth = "brief",
            }: {
                cards: CardRef[];
                topic: Topic;
                lang?: Lang;
                depth?: ReadingDepth;
            },
            onDelta: (delta: string) => void,
        ) {
            return streamText(
                "/api/tarot/interpret",
                { cards, topic, lang, depth },
                onDelta,
            );
        },
    },

    decision: {
        /**
         * Draw from the book.
         *
         * Answer only, no prose — the server does not call a model for
         * this, so it comes back at once and every press can afford it.
         *
         * The question is optional and the Oracle screen sends none;
         * only the interpretation would ever use one.
         */
        draw(question?: string) {
            return request<OracleDraw>("/api/decision/draw", {
                method: "POST",
                body: JSON.stringify(question ? { question } : {}),
            });
        },

        /**
         * The longer read on an answer already in hand.
         *
         * Its own request because most readers stop at the answer.
         * Folding this into the draw would mean writing a few
         * paragraphs for every press to be opened by a fraction of
         * them.
         *
         * Only the id goes out. The server looks the answer up in the
         * book, so nothing here decides what the model reads.
         */
        interpretStream(
            {
                answerId,
                question = null,
                lang = "vi",
            }: {
                answerId: string;
                question?: string | null;
                lang?: Lang;
            },
            onDelta: (delta: string) => void,
        ) {
            return streamText(
                "/api/decision/interpret",
                { answerId, question, lang },
                onDelta,
            );
        },
    },
};
