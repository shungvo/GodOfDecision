"use client";

import {
    BookOpen,
    ChevronRight,
    Download,
    Flame,
    Layers,
    LogIn,
    LogOut,
    MessageCircleQuestion,
    PlusSquare,
    Share,
    Sparkles,
    Trash2,
    UserRound,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";

import { OracleMark } from "@/components/brand/oracle-mark";
import { Screen } from "@/components/layout/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useHydrated } from "@/hooks/use-hydrated";
import { computeStreak } from "@/lib/streak";
import { useAuthStore } from "@/stores/auth.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useHistoryStore } from "@/stores/history.store";

/** How many of the most drawn cards to list. */
const FAVOURITE_COUNT = 4;

export default function ProfilePage() {
    const hydrated = useHydrated();
    const entries = useHistoryStore((state) => state.entries);
    const clear = useHistoryStore((state) => state.clear);
    const replayIntro = useOnboardingStore((state) => state.reset);

    const online = useOnlineStatus();
    const { mode: installMode, promptInstall } = useInstallPrompt();

    const authStatus = useAuthStore((state) => state.status);
    const account = useAuthStore((state) => state.user);
    const quota = useAuthStore((state) => state.quota);
    const refreshAuth = useAuthStore((state) => state.refresh);
    const logout = useAuthStore((state) => state.logout);

    /*
     * Always refresh, never just load: the numbers move every time an
     * analysis runs, so a cached quota from ten minutes ago is exactly
     * what this screen must not show.
     */
    useEffect(() => {
        void refreshAuth();
    }, [refreshAuth]);

    const [confirming, setConfirming] = useState(false);

    /** iOS cannot be asked to install, so the steps are shown instead. */
    const [showSteps, setShowSteps] = useState(false);

    const stats = useMemo(() => {
        const tarot = entries.filter((entry) => entry.pillar === "tarot");
        const decision = entries.filter((entry) => entry.pillar === "decision");

        const counts = new Map<string, number>();

        for (const entry of tarot) {
            if (entry.pillar !== "tarot") continue;

            for (const card of entry.cards) {
                counts.set(card.name.vi, (counts.get(card.name.vi) ?? 0) + 1);
            }
        }

        const favourites = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, FAVOURITE_COUNT);

        /*
         * Entries are stored newest first, so the journey started with
         * the last one. Read off the end rather than sorting a list
         * that is already in order.
         */
        const first = entries[entries.length - 1];

        return {
            total: entries.length,
            tarot: tarot.length,
            decision: decision.length,
            streak: computeStreak(entries.map((entry) => entry.date)),
            favourites,
            /** The count of the most drawn card, for the bars. */
            peak: favourites[0]?.[1] ?? 1,
            since: first ? new Date(first.date) : null,
        };
    }, [entries]);

    /** Nothing has happened yet, so numbers would all read zero. */
    const empty = hydrated && stats.total === 0;

    return (
        <Screen title="Hồ sơ">
            {/* ==========================================
          WHO

          The one focal surface on the screen, at e4.
          Everything below is quieter on purpose — the
          page used to be five white cards of equal
          weight, which left nothing to look at first.
      =========================================== */}

            <section className="relative overflow-hidden rounded-[28px] surface bg-white p-5">
                {/*
                 * A wash of colour behind the mark, so the card is not
                 * a plain white rectangle.
                 *
                 * A gradient rather than a blurred blob. The blob
                 * leaked: WebKit clips `overflow-hidden` to the padding
                 * box but applies a filter's result to the border box,
                 * so an 8px band of it sat outside the rounded corner —
                 * measured at #5830ad against a #33117c canvas. A
                 * gradient has no filter to escape with, and costs
                 * nothing to paint.
                 */}
                <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage:
                            "radial-gradient(120% 95% at 0% 0%, rgb(183 150 254 / 0.34) 0%, transparent 58%)",
                    }}
                    aria-hidden="true"
                />

                <div className="relative flex items-center gap-4">
                    <OracleMark className="h-14 w-14 ring-secondary-200" />

                    <div className="min-w-0 flex-1">
                        {!hydrated ? (
                            <>
                                <Skeleton
                                    tone="light"
                                    className="h-6 w-32 rounded-lg"
                                />
                                <Skeleton
                                    tone="light"
                                    className="mt-2 h-3.5 w-40 rounded-md"
                                />
                            </>
                        ) : (
                            <>
                                <p className="flex items-baseline gap-1.5 text-[20px] font-extrabold leading-6 text-ink">
                                    {stats.streak > 0 ? (
                                        <>
                                            <Flame
                                                className="h-[18px] w-[18px] translate-y-px fill-magic-gold text-magic-gold"
                                                aria-hidden="true"
                                            />
                                            Chuỗi {stats.streak} ngày
                                        </>
                                    ) : (
                                        "Người đi tìm"
                                    )}
                                </p>

                                <p className="mt-1 text-[12px] leading-5 text-ink-soft">
                                    {stats.since
                                        ? `Đồng hành từ ${stats.since.toLocaleDateString(
                                              "vi-VN",
                                              {
                                                  day: "numeric",
                                                  month: "long",
                                              },
                                          )}`
                                        : "Chưa có hành trình nào"}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Connection state, as a footnote rather than a chip
                    floating on its own above everything. */}
                <div className="relative mt-4 flex items-center gap-2 border-t border-ink/8 pt-3">
                    <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            online ? "bg-emerald-500" : "bg-magic-gold"
                        }`}
                        aria-hidden="true"
                    />

                    <p className="text-[11px] font-medium text-ink-soft">
                        {online
                            ? "Đang kết nối · vị thần đang lắng nghe"
                            : "Đang ngoại tuyến · nhật ký vẫn đọc được"}
                    </p>
                </div>
            </section>

            {/* ==========================================
          THE JOURNAL

          Its own surface rather than a row buried in
          Tuỳ chọn: it is a place to go, not a setting.
          It left the tab bar, so this is now the only
          way in — which is why it renders even at zero
          rather than appearing once there is something
          to see.
      =========================================== */}

            <Link
                href="/history"
                className="mt-3 flex items-center gap-4 rounded-3xl surface bg-white p-5 shadow-e2 transition hover:shadow-e3 active:scale-[0.99]"
            >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-100">
                    <BookOpen
                        className="h-5 w-5 text-primary-700"
                        aria-hidden="true"
                    />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-ink">
                        Nhật ký
                    </span>

                    <span className="mt-0.5 block text-[12px] leading-5 text-ink-soft">
                        Những câu hỏi bạn đã mang tới đây
                    </span>
                </span>

                {/*
                 * No count here. It would be `stats.total`, which is
                 * the number already printed as "Lần hỏi" in the tiles
                 * directly below — and squeezing it in pushed the
                 * subtitle onto a second line to say one word.
                 */}
                <ChevronRight
                    className="h-5 w-5 shrink-0 text-ink-soft/50"
                    aria-hidden="true"
                />
            </Link>

            {/* ==========================================
          EMPTY
      =========================================== */}

            {empty ? (
                <Link
                    href="/tarot"
                    className="mt-3 flex items-center gap-4 rounded-3xl surface bg-white p-5 shadow-e2 transition hover:shadow-e3 active:scale-[0.99]"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-100">
                        <Layers
                            className="h-5 w-5 text-primary-700"
                            aria-hidden="true"
                        />
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-ink">
                            Rút lá bài đầu tiên
                        </span>

                        <span className="mt-0.5 block text-[12px] leading-5 text-ink-soft">
                            Những con số ở đây sẽ đầy lên theo thời gian
                        </span>
                    </span>

                    <ChevronRight
                        className="h-5 w-5 shrink-0 text-ink-soft/50"
                        aria-hidden="true"
                    />
                </Link>
            ) : (
                <>
                    {/* ==========================================
              COUNTS

              Three numbers that do not repeat each
              other. The old page showed the tarot
              count twice, once here and once in a
              second row below.
          =========================================== */}

                    <div className="mt-3 grid grid-cols-3 gap-3">
                        {(
                            [
                                {
                                    label: "Lần hỏi",
                                    value: stats.total,
                                    icon: MessageCircleQuestion,
                                },
                                {
                                    label: "Rút bài",
                                    value: stats.tarot,
                                    icon: Layers,
                                },
                                {
                                    label: "Hỏi thần",
                                    value: stats.decision,
                                    icon: Sparkles,
                                },
                            ] as {
                                label: string;
                                value: number;
                                icon: ElementType;
                            }[]
                        ).map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <div
                                    key={stat.label}
                                    className="rounded-3xl surface bg-white px-3 py-4 text-center shadow-e2"
                                >
                                    <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-100">
                                        <Icon
                                            className="h-4 w-4 text-primary-700"
                                            aria-hidden="true"
                                        />
                                    </span>

                                    <p className="mt-2 text-[22px] font-extrabold leading-7 tabular-nums text-ink">
                                        {hydrated ? stat.value : "—"}
                                    </p>

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                                        {stat.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* ==========================================
              FAVOURITES

              A bar each, scaled against the most drawn
              card. The counts alone were a column of
              small numbers with nothing to compare.
          =========================================== */}

                    {stats.favourites.length > 0 && (
                        <section className="mt-8">
                            <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                                Lá hay gặp
                            </h2>

                            <ul className="overflow-hidden rounded-3xl surface bg-white shadow-e1">
                                {stats.favourites.map(
                                    ([name, count], index) => (
                                        <li
                                            key={name}
                                            className="flex items-center gap-3 border-ink/8 px-4 py-3 [&+li]:border-t"
                                        >
                                            <span className="w-4 shrink-0 text-center text-[11px] font-bold tabular-nums text-primary-600/60">
                                                {index + 1}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-semibold text-ink">
                                                    {name}
                                                </span>

                                                <span
                                                    className="mt-1.5 block h-1 rounded-full bg-primary-600/70"
                                                    style={{
                                                        width: `${Math.max(
                                                            8,
                                                            (count /
                                                                stats.peak) *
                                                                100,
                                                        )}%`,
                                                    }}
                                                    aria-hidden="true"
                                                />
                                            </span>

                                            <span className="shrink-0 text-xs font-bold tabular-nums text-primary-600">
                                                {count}×
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </section>
                    )}
                </>
            )}

            {/* ==========================================
          ACCOUNT

          Why an account exists at all: analyses spend
          model tokens, and the day's allowance needs
          somebody to belong to. So the section leads
          with the allowance, not with the email.
      =========================================== */}

            <section className="mt-8">
                <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                    Tài khoản
                </h2>

                <div className="overflow-hidden rounded-3xl surface bg-white shadow-e1">
                    {authStatus === "unknown" && (
                        <div className="px-5 py-4">
                            <Skeleton
                                tone="light"
                                className="h-5 w-44 rounded-lg"
                            />
                            <Skeleton
                                tone="light"
                                className="mt-2.5 h-3.5 w-56 rounded-md"
                            />
                        </div>
                    )}

                    {authStatus === "guest" && (
                        <Link
                            href="/login?next=/profile"
                            className="flex items-center gap-3 px-5 py-4 transition hover:bg-canvas"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-100">
                                <LogIn
                                    className="h-4 w-4 text-primary-700"
                                    aria-hidden="true"
                                />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-ink">
                                    Đăng nhập / Đăng ký
                                </span>

                                <span className="mt-0.5 block text-[11px] leading-4 text-ink-soft">
                                    Mở phần giải nghĩa sâu của vị thần
                                </span>
                            </span>

                            <ChevronRight
                                className="h-4 w-4 shrink-0 text-ink-soft/50"
                                aria-hidden="true"
                            />
                        </Link>
                    )}

                    {authStatus === "authed" && account && (
                        <>
                            <div className="flex items-center gap-3 px-5 py-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-100">
                                    <UserRound
                                        className="h-4 w-4 text-primary-700"
                                        aria-hidden="true"
                                    />
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-ink">
                                        {account.email}
                                    </span>

                                    <span className="mt-0.5 block text-[11px] leading-4 text-ink-soft">
                                        Thành viên từ{" "}
                                        {new Date(
                                            account.createdAt,
                                        ).toLocaleDateString("vi-VN", {
                                            day: "numeric",
                                            month: "long",
                                        })}
                                    </span>
                                </span>
                            </div>

                            {/* ----------------------------------
                                THE ALLOWANCE

                                Shown as what is left, like a
                                battery — spend is a side effect,
                                remaining is the answer to "can I
                                ask again?".
                            ----------------------------------- */}

                            {quota && (
                                <div className="border-t border-ink/8 px-5 py-4">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-600">
                                            <Zap
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                            Năng lượng hôm nay
                                        </p>

                                        <p className="text-xs font-bold tabular-nums text-ink">
                                            {quota.remaining.toLocaleString(
                                                "vi-VN",
                                            )}
                                            <span className="font-medium text-ink-soft">
                                                {" / "}
                                                {quota.limit.toLocaleString(
                                                    "vi-VN",
                                                )}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                                        <div
                                            className={`h-full rounded-full ${
                                                quota.remaining / quota.limit <
                                                0.15
                                                    ? "bg-magic-gold"
                                                    : "bg-primary-600/80"
                                            }`}
                                            style={{
                                                width: `${Math.max(
                                                    quota.remaining > 0 ? 4 : 0,
                                                    (quota.remaining /
                                                        quota.limit) *
                                                        100,
                                                )}%`,
                                            }}
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <p className="mt-2 text-[11px] leading-4 text-ink-soft">
                                        Tính bằng token của mỗi lần giải nghĩa ·
                                        đầy lại lúc nửa đêm
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => void logout()}
                                className="flex w-full items-center gap-3 border-t border-ink/8 px-5 py-4 text-left transition hover:bg-canvas"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-100">
                                    <LogOut
                                        className="h-4 w-4 text-primary-700"
                                        aria-hidden="true"
                                    />
                                </span>

                                <span className="min-w-0 flex-1 text-sm font-semibold text-ink">
                                    Đăng xuất
                                </span>
                            </button>
                        </>
                    )}
                </div>
            </section>

            {/* ==========================================
          ACTIONS

          One card with dividers rather than three
          separate rounded slabs, so the list reads as
          settings instead of as more content.
      =========================================== */}

            <section className="mt-8">
                <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                    Tuỳ chọn
                </h2>

                <div className="overflow-hidden rounded-3xl surface bg-white shadow-e1">
                    {installMode === "prompt" && (
                        <ActionRow
                            icon={Download}
                            label="Cài lên màn hình chính"
                            onClick={promptInstall}
                        />
                    )}

                    {/*
                     * iOS has no install event to fire, so this row
                     * explains where Apple put the button instead of
                     * pretending it can press it.
                     */}
                    {installMode === "manual" && (
                        <>
                            <ActionRow
                                icon={Download}
                                label="Cài lên màn hình chính"
                                onClick={() => setShowSteps((open) => !open)}
                            />

                            {showSteps && (
                                <ol className="space-y-2.5 border-t border-ink/8 bg-canvas px-5 py-4">
                                    {[
                                        {
                                            step: "Mở menu Chia sẻ ở thanh dưới của Safari",
                                            icon: Share,
                                        },
                                        {
                                            step: 'Chọn "Thêm vào Màn hình chính"',
                                            icon: PlusSquare,
                                        },
                                    ].map(({ step, icon: Icon }, index) => (
                                        <li
                                            key={step}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-[11px] font-bold text-primary-700">
                                                {index + 1}
                                            </span>

                                            <Icon
                                                className="h-4 w-4 shrink-0 text-primary-600"
                                                aria-hidden="true"
                                            />

                                            <span className="text-[12px] leading-5 text-ink-soft">
                                                {step}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </>
                    )}

                    <ActionRow
                        icon={Sparkles}
                        label="Xem lại phần giới thiệu"
                        onClick={() => {
                            replayIntro();
                            window.location.reload();
                        }}
                    />
                </div>

                {/*
                 * The destructive one sits apart and reads differently.
                 * It used to be the third identical white row, one
                 * pixel of difference away from "replay the intro".
                 */}
                <button
                    type="button"
                    onClick={() => {
                        if (confirming) {
                            clear();
                            setConfirming(false);
                            return;
                        }

                        setConfirming(true);
                    }}
                    onBlur={() => setConfirming(false)}
                    disabled={!hydrated || stats.total === 0}
                    className={`
                        mt-3
                        flex
                        w-full
                        items-center
                        gap-3

                        rounded-3xl
                        border

                        px-5
                        py-4

                        text-left

                        transition
                        active:scale-[0.99]

                        disabled:cursor-not-allowed
                        disabled:opacity-40

                        ${
                            confirming
                                ? "border-[#b45309]/40 bg-[#b45309]/12"
                                : "border-white/15 bg-white/[0.06]"
                        }
                    `}
                >
                    <Trash2
                        className={`h-4 w-4 shrink-0 ${
                            confirming ? "text-[#f0b168]" : "text-white/65"
                        }`}
                        aria-hidden="true"
                    />

                    <span
                        className={`text-sm font-semibold ${
                            confirming ? "text-[#f0b168]" : "text-white/75"
                        }`}
                    >
                        {confirming
                            ? "Chạm lần nữa để xoá toàn bộ nhật ký"
                            : "Xoá nhật ký"}
                    </span>
                </button>
            </section>

            <p className="mt-6 text-center text-[11px] leading-5 text-white/45">
                Nhật ký chỉ lưu trên máy của bạn.
            </p>
        </Screen>
    );
}

/* ==============================================================
   ACTION ROW
   ============================================================== */

interface ActionRowProps {
    icon: ElementType;
    label: string;
    onClick: () => void;
}

function ActionRow({ icon: Icon, label, onClick }: ActionRowProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
        flex
        w-full
        items-center
        gap-3

        border-ink/8
        px-5
        py-4

        text-left

        transition
        hover:bg-canvas

        [&+button]:border-t
      "
        >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-100">
                <Icon className="h-4 w-4 text-primary-700" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1 text-sm font-semibold text-ink">
                {label}
            </span>

            <ChevronRight
                className="h-4 w-4 shrink-0 text-ink-soft/50"
                aria-hidden="true"
            />
        </button>
    );
}
