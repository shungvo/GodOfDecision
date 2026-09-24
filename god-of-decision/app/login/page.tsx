"use client";

import { ChevronLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

import { OracleMark } from "@/components/brand/oracle-mark";
import { useAuthStore } from "@/stores/auth.store";

type Mode = "login" | "register";

/**
 * Sign in, or sign up — one screen, two verbs.
 *
 * The app runs fine without an account; what an account buys is the
 * analyses, because those spend model tokens and the day's allowance
 * has to belong to someone. The copy says exactly that, so the form
 * reads as a key to something rather than a toll gate.
 *
 * No Screen wrapper: this is a doorway, not a tab, so it carries
 * neither the app header nor a tab highlight.
 */
export default function LoginPage() {
    return (
        /* useSearchParams needs a Suspense boundary above it, or the
           whole route bails out of prerendering. */
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();

    /**
     * Where to go when done. Only paths are honoured: a full URL in
     * `next` would let a crafted link bounce a fresh login anywhere.
     */
    const rawNext = useSearchParams().get("next");
    const next = rawNext?.startsWith("/") ? rawNext : "/";

    const status = useAuthStore((state) => state.status);
    const busy = useAuthStore((state) => state.busy);
    const error = useAuthStore((state) => state.error);

    const load = useAuthStore((state) => state.load);
    const login = useAuthStore((state) => state.login);
    const register = useAuthStore((state) => state.register);

    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        void load();
    }, [load]);

    /* Already signed in — nothing here to do. Covers both arriving
       by stale link and the moment after a successful submit. */
    useEffect(() => {
        if (status === "authed") router.replace(next);
    }, [status, next, router]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (busy) return;

        const act = mode === "login" ? login : register;

        await act(email, password);
        // Success flips `status`, and the effect above navigates.
    }

    return (
        <main className="relative isolate mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <div className="flex h-14 items-center">
                <Link
                    href={next}
                    aria-label="Quay lại"
                    className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 active:scale-95"
                >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Link>
            </div>

            <div className="flex flex-1 flex-col justify-center pb-16">
                {/* ==========================================
            WHO YOU ARE TALKING TO
        =========================================== */}

                <div className="flex flex-col items-center text-center">
                    <OracleMark className="h-16 w-16 ring-white/40" />

                    <h1 className="mt-4 text-[24px] font-extrabold text-white">
                        {mode === "login"
                            ? "Mừng bạn trở lại"
                            : "Tạo tài khoản"}
                    </h1>

                    <p className="mt-1.5 max-w-[280px] text-[13px] leading-5 text-white/60">
                        Vị thần cần biết bạn là ai, để giữ năng lượng giải nghĩa
                        mỗi ngày cho riêng bạn.
                    </p>
                </div>

                {/* ==========================================
            THE FORM
        =========================================== */}

                <form onSubmit={handleSubmit} className="mt-8 space-y-3">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="
                            h-13 w-full
                            rounded-2xl
                            border border-white/15 bg-white/10
                            px-4 py-3.5
                            text-[15px] text-white
                            placeholder:text-white/40
                            outline-none
                            transition
                            focus:border-magic-gold/60 focus:bg-white/[0.14]
                        "
                    />

                    <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Mật khẩu (từ 6 ký tự)"
                        autoComplete={
                            mode === "login"
                                ? "current-password"
                                : "new-password"
                        }
                        className="
                            h-13 w-full
                            rounded-2xl
                            border border-white/15 bg-white/10
                            px-4 py-3.5
                            text-[15px] text-white
                            placeholder:text-white/40
                            outline-none
                            transition
                            focus:border-magic-gold/60 focus:bg-white/[0.14]
                        "
                    />

                    {error && (
                        <p
                            role="alert"
                            className="px-1 text-[13px] leading-5 text-magic-gold"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={busy}
                        className="
                            mt-2
                            flex h-13 w-full
                            items-center justify-center gap-2
                            rounded-2xl
                            bg-magic-gold
                            text-[15px] font-bold text-[#3d2600]
                            shadow-e2
                            transition
                            active:scale-[0.98]
                            disabled:opacity-60
                        "
                    >
                        {busy && (
                            <LoaderCircle
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}

                        {mode === "login" ? "Đăng nhập" : "Đăng ký"}
                    </button>
                </form>

                {/* ==========================================
            THE OTHER VERB
        =========================================== */}

                <p className="mt-6 text-center text-[13px] text-white/55">
                    {mode === "login"
                        ? "Chưa có tài khoản?"
                        : "Đã có tài khoản?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === "login" ? "register" : "login");
                            useAuthStore.setState({ error: null });
                        }}
                        className="font-bold text-white underline-offset-4 transition hover:underline"
                    >
                        {mode === "login" ? "Đăng ký" : "Đăng nhập"}
                    </button>
                </p>

                <p className="mt-10 text-center text-[11px] leading-5 text-white/35">
                    Rút bài và hỏi vị thần không cần tài khoản.
                    <br />
                    Tài khoản chỉ dành cho phần giải nghĩa sâu.
                </p>
            </div>
        </main>
    );
}
