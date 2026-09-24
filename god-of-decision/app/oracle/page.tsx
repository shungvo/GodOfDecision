"use client";

import { LogIn, RefreshCw, RotateCcw, ScrollText } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Screen } from "@/components/layout/screen";
import { Fingerprint } from "@/components/oracle/fingerprint";
import { StoryShareButton } from "@/components/share/story-share-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useOracleStore } from "@/stores/oracle.store";

/** How long the finger has to stay put. */
const HOLD_MS = 5000;

/** How quickly an abandoned press unwinds. */
const RELEASE_MS = 320;

/**
 * The oracle.
 *
 * One disc, and the whole screen is that disc. Hold it and the
 * fingerprint traces itself in gold, ridge by ridge, over five
 * seconds; let go early and the trace unwinds.
 *
 * When the read completes the disc does not hand off to anything — it
 * *becomes* the answer, in place, with one ring of light leaving it.
 * Keeping a single object on screen is the same discipline as the daily
 * card: nothing jumps, so the moment reads as a change of state rather
 * than a change of layout.
 *
 * The longer interpretation is a sheet, reachable by tapping the disc.
 * A paragraph does not belong inside a circle.
 */
export default function OraclePage() {
    const status = useOracleStore((state) => state.status);
    const draw = useOracleStore((state) => state.draw);
    const error = useOracleStore((state) => state.error);

    const interpretation = useOracleStore((state) => state.interpretation);
    const readStatus = useOracleStore((state) => state.readStatus);
    const readError = useOracleStore((state) => state.readError);
    const readErrorStatus = useOracleStore((state) => state.readErrorStatus);

    const ask = useOracleStore((state) => state.ask);
    const interpret = useOracleStore((state) => state.interpret);
    const reset = useOracleStore((state) => state.reset);

    const [holding, setHolding] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    const { text: typed, typing } = useTypewriter(interpretation ?? "");

    const timer = useRef<number | null>(null);

    /**
     * Releasing after a completed hold still fires a click, and by then
     * the disc answers taps by opening the sheet. Without this the
     * sheet would arrive on top of the reveal.
     */
    const swallowNextClick = useRef(false);

    const answered = status === "ready" && draw !== null;
    const asking = status === "asking";

    /** Holding would start a read. */
    const canHold = status === "idle" || status === "error";

    function clear() {
        if (timer.current === null) return;

        window.clearTimeout(timer.current);
        timer.current = null;
    }

    function start() {
        if (!canHold) return;

        setHolding(true);

        timer.current = window.setTimeout(() => {
            timer.current = null;
            setHolding(false);
            swallowNextClick.current = true;

            /*
             * The answer arrives on its own. The analysis does not:
             * the reader asks for that separately, which is both what
             * they came for first and — once the model is wired up —
             * the difference between one call per press and one call
             * per person who actually wants the longer read.
             */
            void ask();
        }, HOLD_MS);
    }

    function cancel() {
        clear();
        setHolding(false);
    }

    useEffect(() => clear, []);

    function askAgain() {
        cancel();
        setSheetOpen(false);
        reset();
    }

    /**
     * The second question: explain that to me.
     *
     * This is where the model call is, which is the reason it is not in
     * the draw. Safe to call again — the store keeps the first
     * interpretation and reopens the sheet on top of it rather than
     * paying for another.
     */
    function openMeaning() {
        setSheetOpen(true);
        void interpret();
    }

    const hint = asking
        ? "Vị thần đang lật sách…"
        : status === "error"
          ? error
          : holding
            ? "Giữ tay, đừng rời ra…"
            : null;

    /** The trace holds at full once a read has started. */
    const traced = holding || asking || answered;

    return (
        <Screen
            title="Vị thần quyết định"
            subtitle="Khi bạn chỉ cần một câu trả lời để đi tiếp."
            className="flex flex-col"
        >
            <div className="flex flex-1 flex-col items-center justify-center pb-4">
                {/* ==========================================
            THE DISC
        =========================================== */}

                <button
                    type="button"
                    aria-label={
                        answered
                            ? `${draw.answer.vi} — chạm để nghe giải thích`
                            : "Giữ trong 5 giây để hỏi vị thần"
                    }
                    onPointerDown={start}
                    onPointerUp={cancel}
                    onPointerLeave={cancel}
                    onPointerCancel={cancel}
                    onClick={() => {
                        if (swallowNextClick.current) {
                            swallowNextClick.current = false;
                            return;
                        }

                        if (answered) openMeaning();
                    }}
                    /* The hold is a pointer gesture, so the keyboard is
                       given a plain activation instead. */
                    onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;

                        event.preventDefault();

                        if (answered) {
                            openMeaning();
                            return;
                        }

                        if (canHold) void ask();
                    }}
                    className="
            relative
            aspect-square
            w-[min(70vw,264px)]

            select-none
            [-webkit-touch-callout:none]

            rounded-full
            outline-none

            focus-visible:ring-2
            focus-visible:ring-white/50
            focus-visible:ring-offset-4
            focus-visible:ring-offset-transparent
          "
                    style={{ touchAction: "manipulation" }}
                >
                    {/* Glow. Brightens as the read progresses, over
                        exactly the length of the hold. */}
                    <span
                        className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-magic-gold/25 blur-2xl transition-opacity ease-out"
                        style={{
                            opacity: traced ? 1 : 0,
                            transitionDuration: `${
                                holding ? HOLD_MS : RELEASE_MS
                            }ms`,
                        }}
                        aria-hidden="true"
                    />

                    {/* One ring of light, once, at the reveal. */}
                    {answered && (
                        <>
                            <span
                                className="pointer-events-none absolute inset-0 rounded-full border border-magic-gold/60"
                                style={{
                                    animation:
                                        "oracle-ping 1000ms ease-out 1 both",
                                }}
                                aria-hidden="true"
                            />
                            <span
                                className="pointer-events-none absolute inset-0 rounded-full border border-magic-gold/40"
                                style={{
                                    animation:
                                        "oracle-ping 1000ms ease-out 220ms 1 both",
                                }}
                                aria-hidden="true"
                            />
                        </>
                    )}

                    {/* The disc itself */}
                    <span
                        className="
              absolute
              inset-0

              flex
              items-center
              justify-center

              rounded-full
              glass

              transition-transform
              ease-out
            "
                        style={{
                            transform: holding ? "scale(0.97)" : "scale(1)",
                            transitionDuration: `${
                                holding ? HOLD_MS : RELEASE_MS
                            }ms`,
                        }}
                    >
                        {/* The print. Fades out as the answer takes its
                            place in the same circle, rather than one
                            being swapped for the other. */}
                        <span
                            className="absolute inset-[14%] transition-opacity duration-500 ease-out"
                            style={{ opacity: answered ? 0 : 1 }}
                            aria-hidden="true"
                        >
                            <Fingerprint
                                progress={traced ? 1 : 0}
                                duration={HOLD_MS}
                                release={RELEASE_MS}
                                className="h-full w-full"
                            />
                        </span>

                        {/* The answer, in the same circle. */}
                        <span
                            className="relative px-8 text-center text-[21px] font-extrabold leading-7 text-white transition-opacity duration-500 ease-out"
                            style={{ opacity: answered ? 1 : 0 }}
                        >
                            {draw?.answer.vi}
                        </span>
                    </span>

                    {/* Progress ring, drawn on the rim. */}
                    <svg
                        viewBox="0 0 100 100"
                        className="pointer-events-none absolute inset-0 -rotate-90"
                        fill="none"
                        aria-hidden="true"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="49"
                            className="stroke-magic-gold"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeDasharray="308"
                            style={{
                                strokeDashoffset: traced ? 0 : 308,
                                transitionProperty: "stroke-dashoffset",
                                transitionTimingFunction: "linear",
                                transitionDuration: `${
                                    holding ? HOLD_MS : RELEASE_MS
                                }ms`,
                            }}
                        />
                    </svg>
                </button>

                {/* ==========================================
            UNDER THE DISC

            One slot, one fixed height, whatever state the
            screen is in — so the disc never moves. It
            holds the instruction before a read and the two
            things worth doing after one.
        =========================================== */}

                <div className="mt-7 flex h-[54px] w-full items-start justify-center">
                    {answered ? (
                        <div className="flex items-center gap-2.5">
                            {/*
                             * The analysis is opt in. It is a second
                             * question — "explain that to me" — and it
                             * should look like one rather than arriving
                             * unasked on top of the answer.
                             */}
                            <button
                                type="button"
                                onClick={openMeaning}
                                className="
                    inline-flex
                    h-11
                    items-center
                    gap-2

                    rounded-[18px]
                    bg-magic-gold

                    px-4

                    text-[13px]
                    font-bold
                    text-[#3d2600]

                    shadow-e2

                    transition
                    active:scale-95
                  "
                            >
                                <ScrollText
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Hiểu rõ hơn
                            </button>

                            <IconButton
                                icon={RotateCcw}
                                label="Hỏi lại"
                                onClick={askAgain}
                                tone="glass"
                            />
                        </div>
                    ) : hint ? (
                        <p
                            className={`max-w-[270px] text-center text-[13px] font-semibold leading-5 ${
                                status === "error"
                                    ? "text-magic-gold"
                                    : "text-white/70"
                            }`}
                        >
                            {hint}
                        </p>
                    ) : (
                        /*
                         * At rest the instruction is the point of the
                         * screen: there is nothing to type, so the
                         * question is meant to be held in mind rather
                         * than written down.
                         */
                        <p className="max-w-[270px] text-center leading-5">
                            <span className="block text-[13px] font-semibold text-white/75">
                                Hãy suy nghĩ đến điều bạn đang phân vân
                            </span>

                            <span className="mt-0.5 block text-[12px] text-white/45">
                                rồi đặt ngón tay và giữ trong 5 giây
                            </span>
                        </p>
                    )}
                </div>
            </div>

            {/* ==============================================
          THE EXPLANATION
      =============================================== */}

            <BottomSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title={draw?.answer.vi}
                description="Vị thần quyết định"
                snapPoints={[0.55, 0.92]}
                initialSnap={1}
                showCloseButton
            >
                {draw && (
                    <div className="space-y-5 pb-8">
                        {/* Placeholder shaped like what replaces it, so
                            the first words land without shifting
                            anything.

                            Keyed on there being no prose yet rather
                            than on the request being open: the
                            typewriter drains its buffer at its own
                            pace, so the stream can finish while the
                            screen is still empty. Tying this to
                            "reading" leaves that moment showing
                            nothing at all. */}
                        {!typed && readStatus !== "error" && (
                            <div>
                                <Skeleton
                                    tone="light"
                                    className="h-6 w-[54%] rounded-lg"
                                />

                                <SkeletonText
                                    lines={10}
                                    tone="light"
                                    className="mt-4"
                                    lineClassName="h-4"
                                    label="Vị thần đang lật sách"
                                />
                            </div>
                        )}

                        {typed && (
                            <div>
                                <h3 className="text-[20px] font-bold text-ink">
                                    Vì sao lại thế
                                </h3>

                                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-ink-soft">
                                    {typed}

                                    {(typing || readStatus === "reading") && (
                                        <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary-600" />
                                    )}
                                </p>
                            </div>
                        )}

                        {readStatus === "error" && (
                            <div className="rounded-3xl border border-magic-gold/40 bg-magic-gold/10 p-5">
                                <p className="text-sm leading-6 text-[#8a5a00]">
                                    {readError}
                                </p>

                                {/* A 401 is a door, not a fault —
                                    retrying it changes nothing. */}
                                {readErrorStatus === 401 ? (
                                    <Link
                                        href="/login?next=/oracle"
                                        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-magic-gold px-4 py-2.5 text-sm font-bold text-[#3d2600] transition active:scale-95"
                                    >
                                        <LogIn
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Đăng nhập
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => void interpret()}
                                        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-magic-gold px-4 py-2.5 text-sm font-bold text-[#3d2600] transition active:scale-95"
                                    >
                                        <RefreshCw
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Thử lại
                                    </button>
                                )}
                            </div>
                        )}

                        {/*
                         * The answer alone is worth posting, so this
                         * does not wait for the analysis — `body` is
                         * simply null until one has settled.
                         */}
                        <StoryShareButton
                            card={{
                                kind: "oracle",
                                answer: draw.answer.vi,
                                answerId: draw.answer.id,
                                body:
                                    readStatus === "reading"
                                        ? null
                                        : interpretation,
                            }}
                        />

                        <p className="text-center text-[11px] text-ink-soft/70">
                            Sách của vị thần quyết định · {draw.answer.id}
                        </p>
                    </div>
                )}
            </BottomSheet>
        </Screen>
    );
}
