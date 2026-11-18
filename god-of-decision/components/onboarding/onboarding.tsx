"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, Layers, Sparkles } from "lucide-react";
import { useState, type ElementType } from "react";

import { cn } from "@/lib/utils";

interface Slide {
    key: string;
    title: string;
    body: string;
    art: "oracle" | "pillars" | "reflect";
}

const SLIDES: Slide[] = [
    {
        key: "welcome",
        title: "Chào bạn",
        body: "GOD là người bạn đồng hành nhỏ, ở đây để soi sáng những lúc bạn chưa biết nên nghiêng về đâu.",
        art: "oracle",
    },
    {
        key: "pillars",
        title: "Hai lối đi",
        body: "Rút tarot khi bạn muốn ngẫm cho kỹ. Hỏi vị thần khi bạn chỉ cần một câu trả lời để đi tiếp.",
        art: "pillars",
    },
    {
        key: "reflect",
        title: "Không phải lời tiên tri",
        body: "GOD không đoán tương lai và không quyết thay bạn. Lá bài chỉ mở ra một góc nhìn, phần chọn vẫn là của bạn.",
        art: "reflect",
    },
];

const PILLARS: { icon: ElementType; label: string; hint: string }[] = [
    { icon: Layers, label: "Tarot", hint: "Rút bài, ngẫm sâu" },
    { icon: Sparkles, label: "Vị thần", hint: "Trả lời tức thì" },
];

function SlideArt({ art }: { art: Slide["art"] }) {
    if (art === "oracle") {
        return (
            <div className="relative">
                <div
                    className="absolute -inset-5 rounded-full bg-secondary-300/25 blur-2xl"
                    aria-hidden="true"
                />

                <div
                    className="
            relative
            h-28
            w-28

            overflow-hidden
            rounded-full

            bg-secondary-100

            bg-[url(/images/mascot/lumi-face.webp)]
            bg-cover
            bg-center
            bg-no-repeat

            ring-2
            ring-white/60
          "
                    aria-hidden="true"
                />
            </div>
        );
    }

    if (art === "pillars") {
        return (
            <div className="flex gap-3">
                {PILLARS.map((pillar) => {
                    const Icon = pillar.icon;

                    return (
                        <div
                            key={pillar.label}
                            className="flex w-[112px] flex-col items-center gap-2 rounded-3xl surface bg-white px-3 py-4 shadow-e3"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary-100">
                                <Icon
                                    className="h-5 w-5 text-primary-700"
                                    aria-hidden="true"
                                />
                            </span>

                            <span className="text-center text-[13px] font-bold text-ink">
                                {pillar.label}
                            </span>

                            <span className="text-center text-[10px] leading-3.5 text-ink-soft">
                                {pillar.hint}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                className="absolute -inset-5 rounded-full bg-magic-gold/15 blur-2xl"
                aria-hidden="true"
            />

            <span className="relative flex h-24 w-24 items-center justify-center rounded-full glass">
                <Compass
                    className="h-10 w-10 text-magic-gold"
                    aria-hidden="true"
                />
            </span>
        </div>
    );
}

interface OnboardingProps {
    onFinish: () => void;
}

export function Onboarding({ onFinish }: OnboardingProps) {
    const [index, setIndex] = useState(0);
    /** Which way the next slide should come in from. */
    const [direction, setDirection] = useState(1);

    const isLast = index === SLIDES.length - 1;
    const slide = SLIDES[index];

    function go(next: number) {
        if (next < 0 || next >= SLIDES.length) return;

        setDirection(next > index ? 1 : -1);
        setIndex(next);
    }

    return (
        <div className="flex h-full w-full flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+20px)]">
            {/* Skip, so nobody is trapped in the intro */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onFinish}
                    className="rounded-full px-3 py-2 text-[13px] font-semibold text-white/55 transition hover:text-white"
                >
                    Bỏ qua
                </button>
            </div>

            {/* ==========================================
          SLIDE
      =========================================== */}

            <div className="relative flex flex-1 items-center justify-center">
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={slide.key}
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, x: direction * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -40 }}
                        transition={{ duration: 0.28 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            const threshold = 60;

                            if (info.offset.x < -threshold) go(index + 1);
                            if (info.offset.x > threshold) go(index - 1);
                        }}
                    >
                        <SlideArt art={slide.art} />

                        <h2 className="mt-9 text-center text-[26px] font-extrabold leading-8 tracking-tight text-white">
                            {slide.title}
                        </h2>

                        <p className="mx-auto mt-3 max-w-[300px] text-center text-[15px] leading-7 text-white/65">
                            {slide.body}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ==========================================
          DOTS
      =========================================== */}

            <div className="mb-7 flex justify-center gap-2">
                {SLIDES.map((item, dot) => (
                    <button
                        key={item.key}
                        type="button"
                        aria-label={`Bước ${dot + 1}`}
                        aria-current={dot === index}
                        onClick={() => go(dot)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            dot === index
                                ? "w-6 bg-magic-gold"
                                : "w-2 bg-white/25 hover:bg-white/40",
                        )}
                    />
                ))}
            </div>

            {/* ==========================================
          ACTION
      =========================================== */}

            <button
                type="button"
                onClick={() => (isLast ? onFinish() : go(index + 1))}
                className="
          inline-flex
          h-[52px]
          w-full
          items-center
          justify-center
          gap-2.5

          rounded-[20px]
          bg-magic-gold

          text-[15px]
          font-bold
          text-[#3d2600]

          shadow-e3

          transition
          hover:brightness-105
          active:scale-[0.98]
        "
            >
                {isLast ? "Bắt đầu" : "Tiếp tục"}
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
        </div>
    );
}
