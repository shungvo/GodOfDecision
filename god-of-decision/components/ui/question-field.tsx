"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const MAX_LENGTH = 500;

interface QuestionFieldProps {
    value: string;
    onChange: (value: string) => void;

    onSubmit: () => void;

    placeholder?: string;
    submitLabel: string;

    /** Icon shown inside the submit button. */
    icon?: ElementType;

    pending?: boolean;
    pendingLabel?: string;

    error?: string | null;

    /** Rendered between the field and the submit button. */
    children?: ReactNode;
}

export function QuestionField({
    value,
    onChange,
    onSubmit,
    placeholder = "Điều gì đang ở trong lòng bạn?",
    submitLabel,
    icon: Icon,
    pending = false,
    pendingLabel = "Đang hỏi…",
    error,
    children,
}: QuestionFieldProps) {
    const remaining = MAX_LENGTH - value.length;
    const isEmpty = value.trim().length === 0;

    return (
        <div className="space-y-4">
            <div
                className="
          rounded-3xl
          surface bg-white
          p-4

          shadow-e3

          ring-2
          ring-transparent
          transition

          focus-within:ring-secondary-300
        "
            >
                <textarea
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value.slice(0, MAX_LENGTH))
                    }
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" &&
                            (event.metaKey || event.ctrlKey)
                        ) {
                            event.preventDefault();
                            onSubmit();
                        }
                    }}
                    placeholder={placeholder}
                    rows={3}
                    disabled={pending}
                    className="
            w-full
            resize-none
            bg-transparent
            text-[15px]
            leading-7
            text-ink
            outline-none

            placeholder:text-ink-soft/60
            disabled:opacity-60
          "
                />

                <div className="mt-1 flex justify-end">
                    <span
                        className={cn(
                            "text-[11px] tabular-nums",
                            remaining < 50
                                ? "font-semibold text-[#b45309]"
                                : "text-ink-soft/60",
                        )}
                    >
                        {remaining}
                    </span>
                </div>
            </div>

            {children}

            {error && (
                <motion.p
                    role="alert"
                    className="
            flex
            items-start
            gap-2.5

            rounded-2xl
            border
            border-magic-gold/40
            bg-magic-gold/15
            px-4
            py-3
            text-sm
            font-medium
            leading-6
            text-magic-gold
          "
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                    />

                    {error}
                </motion.p>
            )}

            <button
                type="button"
                onClick={onSubmit}
                disabled={pending || isEmpty}
                className="
          inline-flex
          w-full
          items-center
          justify-center
          gap-2.5

          rounded-[20px]
          bg-magic-gold
          px-6
          py-4

          text-[15px]
          font-bold
          text-[#3d2600]

          shadow-e3

          transition
          active:scale-[0.98]

          hover:brightness-105

          disabled:cursor-not-allowed
          disabled:bg-white/20
          disabled:text-white/50
          disabled:shadow-none
          disabled:active:scale-100
        "
            >
                {pending ? (
                    <RefreshCw
                        className="h-[18px] w-[18px] animate-spin"
                        aria-hidden="true"
                    />
                ) : (
                    Icon && (
                        <Icon
                            className="h-[18px] w-[18px]"
                            aria-hidden="true"
                        />
                    )
                )}

                {pending ? pendingLabel : submitLabel}
            </button>
        </div>
    );
}
