"use client";

import { Check, Download, LoaderCircle, Share2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { renderStoryCard, type StoryCard } from "@/lib/story-card";

/** Where the picture can go on this device. */
type Route = "share" | "download" | null;

/*
 * Which route this device offers, read without an effect.
 *
 * `navigator.share` exists only in a secure context, so this is also
 * what quietly demotes the button to a download when the app is opened
 * over plain http on a LAN address — the one setup where sharing
 * cannot work at all.
 *
 * useSyncExternalStore rather than a state-setting effect: the server
 * render has no navigator, and this is the sanctioned way to say "the
 * server sees nothing, the client sees this" without a hydration
 * mismatch or a render-then-correct flash.
 */
const noSubscribe = () => () => {};

const clientRoute = (): Route =>
    typeof navigator !== "undefined" && typeof navigator.share === "function"
        ? "share"
        : "download";

const serverRoute = (): Route => null;

interface StoryShareButtonProps {
    /**
     * What to draw. Null while the reading is still arriving.
     *
     * Pass it only once the text has settled: every distinct object
     * here costs one canvas render, and a card rebuilt per streamed
     * chunk would redraw a 1080×1920 frame dozens of times.
     */
    card: StoryCard | null;

    className?: string;
}

/**
 * Share a reading as a story picture.
 *
 * The picture is drawn *before* the tap, not during it. iOS only
 * honours `navigator.share` while a user gesture is still live, and it
 * stops being live somewhere inside the few hundred milliseconds a
 * 1080×1920 canvas takes to encode — so a button that rendered on
 * click throws `NotAllowedError` on exactly the platform this feature
 * is for. Rendering ahead keeps the handler's first act the share
 * itself.
 *
 * There is no way to post directly into Instagram from a web app. The
 * one-tap route native apps use (`instagram-stories://share`) reads the
 * image off the iOS pasteboard under a private Facebook UTI, which
 * JavaScript cannot write — a page that fired that link would open
 * Instagram onto an empty story. So this opens the system share sheet,
 * where Instagram is a destination, and the caption says so.
 */
export function StoryShareButton({ card, className }: StoryShareButtonProps) {
    const route = useSyncExternalStore(noSubscribe, clientRoute, serverRoute);

    /*
     * Everything below is stored *with the card it belongs to* and read
     * back by comparing keys, rather than being cleared when the card
     * changes. Clearing would mean setting state in an effect body,
     * which cascades a render — and worse, would leave a moment where
     * the button looks ready while still holding the previous reading's
     * picture.
     */
    const [built, setBuilt] = useState<{ key: string; file: File } | null>(
        null,
    );
    const [failedKey, setFailedKey] = useState<string | null>(null);
    const [sharedKey, setSharedKey] = useState<string | null>(null);

    const key = card ? JSON.stringify(card) : null;

    const file = built && built.key === key ? built.file : null;
    const failed = key !== null && failedKey === key;
    const shared = key !== null && sharedKey === key;

    /** Drawing, or nothing to draw yet. Either way there is nothing to send. */
    const busy = card !== null && file === null && !failed;

    useEffect(() => {
        if (!key || !card) return;

        let cancelled = false;

        renderStoryCard(card)
            .then((rendered) => {
                if (!cancelled) setBuilt({ key, file: rendered });
            })
            .catch(() => {
                if (!cancelled) setFailedKey(key);
            });

        return () => {
            cancelled = true;
        };
        // `key` is the card's identity. `card` itself is a fresh object
        // on every parent render, so depending on it would redraw the
        // canvas continuously.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    async function handleClick() {
        if (!file || !key) return;

        // Nothing is awaited before this call — see the note above.
        if (route === "share" && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file] });
                setSharedKey(key);
            } catch (error) {
                /*
                 * Dismissing the share sheet rejects with AbortError.
                 * Changing your mind is not a failure, so it must not
                 * paint one.
                 */
                if ((error as Error)?.name !== "AbortError") {
                    setFailedKey(key);
                }
            }

            return;
        }

        // Fallback: put the file on disk and let them pick it in
        // Instagram themselves.
        const url = URL.createObjectURL(file);

        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();

        // Revoked later: Safari has not finished reading the blob by the
        // time click() returns.
        setTimeout(() => URL.revokeObjectURL(url), 10_000);

        setSharedKey(key);
    }

    const label = shared
        ? route === "download"
            ? "Đã lưu ảnh"
            : "Đã chia sẻ"
        : failed
          ? "Không tạo được ảnh"
          : busy
            ? "Đang vẽ ảnh…"
            : "Chia sẻ lên story";

    const Icon = shared ? Check : route === "download" ? Download : Share2;

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleClick}
                disabled={busy || failed}
                className="
                    flex
                    h-13
                    w-full
                    items-center
                    justify-center
                    gap-2.5

                    rounded-2xl
                    border
                    border-ink/12
                    bg-canvas

                    text-[15px]
                    font-bold
                    text-ink

                    transition
                    active:scale-[0.98]

                    disabled:opacity-50
                "
            >
                {busy ? (
                    <LoaderCircle
                        className="h-[18px] w-[18px] animate-spin text-primary-600"
                        aria-hidden="true"
                    />
                ) : (
                    <Icon
                        className="h-[18px] w-[18px] text-primary-600"
                        aria-hidden="true"
                    />
                )}

                {label}
            </button>

            {/*
             * The second tap is the whole reason to say this. Without a
             * line here, a share sheet appearing where the button
             * promised Instagram reads as the feature misfiring.
             */}
            {!shared && !failed && route && (
                <p className="mt-2 text-center text-[11px] leading-4 text-ink-soft/70">
                    {route === "share"
                        ? "Chọn Instagram → Story trong bảng chia sẻ"
                        : "Ảnh sẽ được lưu về máy để bạn đăng lên story"}
                </p>
            )}
        </div>
    );
}
