"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * three.js is several hundred KB. Split out and client only, so the
 * Home screen paints without it and the server never touches WebGL.
 */
const LumiScene = dynamic(() => import("./lumi-scene"), { ssr: false });

interface LumiProps {
    className?: string;
}

/**
 * Lumi, the mascot, as a floating 3D figure.
 *
 * Decoration only: hidden from assistive tech and from the pointer,
 * so whatever sits underneath keeps every gesture.
 *
 * Fades in once the model has loaded rather than popping in.
 */
export function Lumi({ className }: LumiProps) {
    const [ready, setReady] = useState(false);
    const handleReady = useCallback(() => setReady(true), []);

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none transition-opacity duration-700 ease-out",
                ready ? "opacity-100" : "opacity-0",
                className,
            )}
        >
            <LumiScene onReady={handleReady} />
        </div>
    );
}
