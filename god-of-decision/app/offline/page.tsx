"use client";

import Link from "next/link";

import { BookOpen, RefreshCw, WifiOff } from "lucide-react";

import { Screen } from "@/components/layout/screen";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function OfflinePage() {
    const online = useOnlineStatus();

    return (
        <Screen>
            <div className="flex flex-col items-center py-16 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full surface bg-white shadow-e3">
                    <WifiOff
                        className="h-8 w-8 text-primary-700"
                        aria-hidden="true"
                    />
                </span>

                <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-white">
                    Vị thần đang ngoài vùng phủ sóng
                </h1>

                <p className="mt-3 max-w-xs text-sm leading-6 text-white/55">
                    Cần kết nối mạng để rút bài và nhận lời luận. Nhật ký của
                    bạn vẫn ở đây, đọc lại lúc nào cũng được.
                </p>

                <div className="mt-9 flex flex-col gap-3 self-stretch">
                    {online && (
                        <Link
                            href="/"
                            className="
                inline-flex
                items-center
                justify-center
                gap-2.5
                rounded-[20px]
                bg-primary-600
                px-6
                py-4
                text-[15px]
                font-semibold
                text-white
                shadow-e3
                transition
                hover:bg-primary-700
                active:scale-[0.98]
              "
                        >
                            <RefreshCw
                                className="h-[18px] w-[18px]"
                                aria-hidden="true"
                            />
                            Đã có mạng, quay lại
                        </Link>
                    )}

                    <Link
                        href="/history"
                        className="
              inline-flex
              items-center
              justify-center
              gap-2
              py-2
              text-sm
              font-medium
              text-white/65
              transition
              hover:text-white
            "
                    >
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Mở nhật ký
                    </Link>
                </div>
            </div>
        </Screen>
    );
}
