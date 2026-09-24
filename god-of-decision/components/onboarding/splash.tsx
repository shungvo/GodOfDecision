"use client";

import { motion } from "framer-motion";

/**
 * Launch screen.
 *
 * Rendered on the server so it is already painted in the first
 * HTML, before any JavaScript runs. That is what stops the app
 * flashing into view underneath the intro.
 *
 * Its background matches the manifest `background_color`, so the
 * handoff from the native launch screen is seamless.
 */
export function Splash() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center px-8">
            {/* No entrance animation on the block itself: this
                markup ships in the first HTML, and animating it
                from opacity 0 would leave it invisible until the
                JavaScript lands. Only the decoration moves. */}
            <div className="flex flex-col items-center">
                {/* Halo */}
                <div className="relative">
                    <motion.div
                        className="absolute -inset-6 rounded-full bg-secondary-300/25 blur-2xl"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{
                            duration: 2.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        aria-hidden="true"
                    />

                    <div
                        className="
              relative
              h-24
              w-24

              overflow-hidden
              rounded-full

              bg-secondary-100

              bg-[url(/images/avt_img.webp)]
              bg-[length:190%]
              bg-[position:50%_14%]
              bg-no-repeat

              ring-2
              ring-white/60
            "
                        aria-hidden="true"
                    />
                </div>

                <h1 className="mt-7 text-4xl font-extrabold tracking-[0.12em] text-white">
                    GOD
                </h1>

                <p className="mt-2 text-[13px] font-medium tracking-wide text-secondary-200">
                    Guidance Of Destiny
                </p>

                <p className="mt-6 text-sm text-white/55">Khi lý lẽ không đủ</p>
            </div>

            {/* Quiet activity hint, low enough not to compete */}
            <motion.div
                className="absolute bottom-16 flex gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                aria-hidden="true"
            >
                {[0, 1, 2].map((index) => (
                    <motion.span
                        key={index}
                        className="h-1.5 w-1.5 rounded-full bg-white/50"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.15,
                        }}
                    />
                ))}
            </motion.div>
        </div>
    );
}
