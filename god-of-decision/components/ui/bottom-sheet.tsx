"use client";

import {
    AnimatePresence,
    animate as animateValue,
    motion,
    useDragControls,
    useMotionValue,
    type PanInfo,
} from "framer-motion";
import {
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface BottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    children: ReactNode;

    /**
     * Percentage of viewport height.
     *
     * Example:
     * [0.25, 0.55, 0.9]
     *
     * 25%  → peek
     * 55%  → half
     * 90%  → expanded
     */
    snapPoints?: number[];

    /**
     * Initial snap index.
     *
     * 0 = first snap point
     * 1 = second snap point
     * 2 = third snap point
     */
    initialSnap?: number;

    title?: string;
    /**
     * Sits under the title. Text, or a small control when the
     * header would otherwise be empty.
     */
    description?: ReactNode;

    /**
     * Illustration for the right of the header.
     *
     * Sits beside the title rather than above the body, so it
     * costs no vertical room in the scroll area.
     */
    art?: ReactNode;

    /**
     * Action bar pinned to the bottom of the sheet.
     *
     * Lives outside the scroll area on purpose. A `sticky` child
     * inside it cannot reach past the scroller's bottom padding,
     * which leaves a stubborn gap underneath.
     */
    footer?: ReactNode;

    showCloseButton?: boolean;

    closeOnBackdropClick?: boolean;

    /**
     * Enable drag gesture.
     */
    draggable?: boolean;

    /**
     * Allow dismiss by dragging below
     * the lowest snap point.
     */
    dismissible?: boolean;

    className?: string;
}

const DEFAULT_SNAP_POINTS = [0.25, 0.55, 0.9];

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function BottomSheet({
    open,
    onOpenChange,
    children,
    snapPoints = DEFAULT_SNAP_POINTS,
    initialSnap = 1,
    title,
    description,
    art,
    footer,
    showCloseButton = false,
    closeOnBackdropClick = true,
    draggable = true,
    dismissible = true,
    className = "",
}: BottomSheetProps) {
    /**
     * ========================================
     * Client mount
     * ========================================
     */

    // Determine if component is mounted on the client. This avoids a state update inside an effect.
    const [mounted] = useState(() => typeof window !== "undefined");

    /**
     * ========================================
     * Normalize snap points
     * ========================================
     */

    const normalizedSnapPoints = useMemo(() => {
        const points = snapPoints
            .filter((point) => point > 0 && point <= 1)
            .sort((a, b) => a - b);

        return points.length ? points : DEFAULT_SNAP_POINTS;
    }, [snapPoints]);

    /**
     * ========================================
     * Active snap
     *
     * Instead of syncing this with an effect,
     * initialize from props directly.
     * ========================================
     */

    const safeInitialSnap = clamp(
        initialSnap,
        0,
        normalizedSnapPoints.length - 1,
    );

    const [snapIndex, setSnapIndex] = useState(safeInitialSnap);

    /**
     * ========================================
     * Viewport height
     * ========================================
     */

    /**
     * Measured eagerly, never zero.
     *
     * A zero first render forced the sheet to mix a percentage
     * initial with a pixel target, and the open animation never
     * resolved. The component already refuses to render on the
     * server, so reading the viewport here is safe.
     */
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window === "undefined"
            ? 0
            : (window.visualViewport?.height ?? window.innerHeight),
    );

    useEffect(() => {
        if (!open) return;

        const updateViewport = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;

            setViewportHeight(height);
        };

        updateViewport();

        const visualViewport = window.visualViewport;

        visualViewport?.addEventListener("resize", updateViewport);

        window.addEventListener("resize", updateViewport);

        return () => {
            visualViewport?.removeEventListener("resize", updateViewport);

            window.removeEventListener("resize", updateViewport);
        };
    }, [open]);

    /**
     * ========================================
     * Sheet height
     *
     * The sheet itself is 90% viewport.
     * ========================================
     */

    const sheetHeight = viewportHeight * 0.9;

    /**
     * ========================================
     * Convert snap percentage
     * to Y position.
     * ========================================
     */

    const getSnapY = useCallback(
        (point: number) => {
            if (!viewportHeight) {
                return 0;
            }

            const visibleHeight = viewportHeight * point;

            return Math.max(0, sheetHeight - visibleHeight);
        },
        [sheetHeight, viewportHeight],
    );

    /**
     * ========================================
     * Current snap
     * ========================================
     */

    const currentSnap = normalizedSnapPoints[snapIndex];

    const currentY = getSnapY(currentSnap);

    /**
     * ========================================
     * Vertical position
     *
     * Owned here rather than by the `animate` prop.
     * Dragging writes to this same value, and when
     * both drive it the open animation never lands.
     * ========================================
     */

    const y = useMotionValue(sheetHeight);

    const SPRING = useMemo(
        () => ({
            type: "spring" as const,
            stiffness: 380,
            damping: 34,
            mass: 0.8,
        }),
        [],
    );

    // Enter from below every time the sheet opens.
    useEffect(() => {
        if (!open) return;

        y.set(sheetHeight);
    }, [open, sheetHeight, y]);

    // Settle on the active snap point.
    useEffect(() => {
        if (!open) return;

        const controls = animateValue(y, currentY, SPRING);

        return () => controls.stop();
    }, [open, currentY, y, SPRING]);

    /**
     * ========================================
     * Find nearest snap point
     * ========================================
     */

    const findNearestSnap = useCallback(
        (y: number) => {
            let closestIndex = 0;

            let closestDistance = Number.POSITIVE_INFINITY;

            normalizedSnapPoints.forEach((point, index) => {
                const snapY = getSnapY(point);

                const distance = Math.abs(y - snapY);

                if (distance < closestDistance) {
                    closestDistance = distance;

                    closestIndex = index;
                }
            });

            return closestIndex;
        },
        [normalizedSnapPoints, getSnapY],
    );

    /**
     * ========================================
     * Handle drag
     * ========================================
     */

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const offsetY = info.offset.y;

            const velocityY = info.velocity.y;

            /**
             * Project where the sheet
             * will naturally land.
             */
            const projectedY = currentY + offsetY + velocityY * 0.12;

            /**
             * Lowest snap point.
             */
            const lowestSnapY = getSnapY(normalizedSnapPoints[0]);

            /**
             * If the user drags down
             * beyond the lowest snap,
             * dismiss the sheet.
             */
            const shouldDismiss =
                dismissible &&
                (projectedY > lowestSnapY + 100 || velocityY > 1000);

            if (shouldDismiss) {
                onOpenChange(false);
                return;
            }

            /**
             * Otherwise snap to nearest.
             */
            const nextIndex = findNearestSnap(projectedY);

            setSnapIndex(nextIndex);
        },
        [
            currentY,
            dismissible,
            findNearestSnap,
            getSnapY,
            normalizedSnapPoints,
            onOpenChange,
        ],
    );

    /**
     * ========================================
     * Close
     * ========================================
     */

    const close = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    /**
     * ========================================
     * Drag ownership
     *
     * The sheet cannot listen for drags itself. Its content
     * scrolls, and a scroll container swallows every vertical
     * touch before the drag ever starts.
     *
     * So drags are started by hand from two places:
     *
     *   the grabber and header, always
     *   the content, only while it is scrolled to the top
     *                and the finger is moving down
     * ========================================
     */

    const dragControls = useDragControls();

    const contentRef = useRef<HTMLDivElement>(null);

    const gestureOrigin = useRef<{ x: number; y: number } | null>(null);

    const startDrag = useCallback(
        (event: ReactPointerEvent) => {
            if (!draggable) return;

            dragControls.start(event);
        },
        [draggable, dragControls],
    );

    const handleContentPointerDown = useCallback(
        (event: ReactPointerEvent) => {
            const content = contentRef.current;

            gestureOrigin.current =
                draggable && content && content.scrollTop <= 0
                    ? { x: event.clientX, y: event.clientY }
                    : null;
        },
        [draggable],
    );

    const handleContentPointerMove = useCallback(
        (event: ReactPointerEvent) => {
            const origin = gestureOrigin.current;
            const content = contentRef.current;

            if (!origin || !content) return;

            // Scrolled away from the top mid gesture. Let it scroll.
            if (content.scrollTop > 0) {
                gestureOrigin.current = null;
                return;
            }

            const deltaY = event.clientY - origin.y;
            const deltaX = event.clientX - origin.x;

            // Downward and mostly vertical.
            if (deltaY > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
                gestureOrigin.current = null;
                dragControls.start(event);
            }
        },
        [dragControls],
    );

    const endGesture = useCallback(() => {
        gestureOrigin.current = null;
    }, []);

    /**
     * ========================================
     * ESC
     * ========================================
     */

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                close();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, close]);

    /**
     * ========================================
     * Body scroll lock
     * ========================================
     */

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    /**
     * ========================================
     * Backdrop opacity
     * ========================================
     */

    const backdropOpacity = Math.min(0.5, currentSnap * 0.55);

    /**
     * ========================================
     * Don't render server-side
     * ========================================
     */

    if (!mounted) {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <div
                    className="
            fixed
            inset-0
            z-[100]
          "
                    role="dialog"
                    aria-modal="true"
                    aria-label={title ?? "Bottom sheet"}
                >
                    {/* ==================================
              BACKDROP
          =================================== */}

                    <motion.button
                        type="button"
                        aria-label="Close bottom sheet"
                        className="
              absolute
              inset-0
              h-full
              w-full

              cursor-default

              bg-black

              backdrop-blur-[3px]
            "
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: backdropOpacity,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                        onClick={() => {
                            if (closeOnBackdropClick) {
                                close();
                            }
                        }}
                    />

                    {/* ==================================
              SHEET
          =================================== */}

                    <motion.div
                        className={`
              absolute
              inset-x-0
              bottom-0

              mx-auto

              w-full
              max-w-lg

              flex
              flex-col

              overflow-hidden

              rounded-t-[32px]

              border
              border-black/5

              surface bg-white

              ${className}
            `}
                        style={{
                            y,

                            height: `${sheetHeight}px`,

                            paddingBottom: "env(safe-area-inset-bottom)",
                        }}
                        /**
                         * A tween on the way out, not a spring.
                         *
                         * A spring approaches its target and is only declared
                         * finished once it settles inside framer-motion's rest
                         * thresholds, which over the sheet's full height takes
                         * well over a second. AnimatePresence keeps this whole
                         * subtree mounted for that entire time — including the
                         * safe area filler below, which by then is the only thing
                         * left on screen: a white strip along the bottom edge
                         * that hangs around after the sheet has visibly gone.
                         *
                         * A tween ends when it says it will.
                         */
                        exit={{
                            y: sheetHeight,
                            transition: {
                                type: "tween",
                                duration: 0.26,
                                ease: [0.4, 0, 1, 1],
                            },
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 34,
                            mass: 0.8,
                        }}
                        drag={draggable ? "y" : false}
                        dragListener={false}
                        dragControls={dragControls}
                        /**
                         * The sheet may be dragged all the way off screen.
                         * Where it lands is decided on release, not by
                         * clamping the gesture.
                         */
                        dragConstraints={{
                            top: 0,
                            bottom: sheetHeight,
                        }}
                        dragElastic={{
                            top: 0.02,
                            bottom: 0,
                        }}
                        dragMomentum={false}
                        onDragEnd={handleDragEnd}
                    >
                        {/* ==================================
                TOP GLASS HIGHLIGHT
            =================================== */}

                        <div
                            className="
                pointer-events-none
                absolute
                inset-x-10
                top-0
                h-px

                bg-gradient-to-r
                from-transparent
                via-black/10
                to-transparent
              "
                        />

                        {/* ==================================
                GRAB ZONE

                Grabber plus header. Dragging from
                here always moves the sheet.
            =================================== */}

                        <div
                            className="
                shrink-0
                cursor-grab
                active:cursor-grabbing
              "
                            style={{ touchAction: "none" }}
                            onPointerDown={startDrag}
                        >
                            <div
                                className="
                  flex
                  h-9
                  items-center
                  justify-center
                "
                            >
                                <div
                                    className="
                    h-1.5
                    w-11

                    rounded-full

                    bg-ink/20
                  "
                                />
                            </div>

                            {/* ==================================
                HEADER
            =================================== */}

                            {(title ||
                                description ||
                                art ||
                                showCloseButton) && (
                                <header
                                    className="
                  flex
                  shrink-0
                  items-center
                  gap-3

                  px-5
                  pb-2
                "
                                >
                                    <div className="min-w-0 flex-1">
                                        {title && (
                                            <h2
                                                className="
                        text-[26px]
                        font-extrabold
                        leading-8
                        tracking-tight
                        text-ink
                      "
                                            >
                                                {title}
                                            </h2>
                                        )}

                                        {description && (
                                            <div
                                                className="
                        mt-1
                        text-[12px]
                        font-medium
                        leading-5
                        text-primary-600
                      "
                                            >
                                                {description}
                                            </div>
                                        )}
                                    </div>

                                    {art && (
                                        <div className="shrink-0">{art}</div>
                                    )}

                                    {showCloseButton && (
                                        <button
                                            type="button"
                                            aria-label="Close"
                                            onPointerDown={(event) =>
                                                event.stopPropagation()
                                            }
                                            onClick={close}
                                            className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center

                      rounded-full

                      bg-ink/5

                      text-ink-soft

                      transition

                      hover:bg-ink/10

                      active:scale-95
                    "
                                        >
                                            <X size={16} strokeWidth={2} />
                                        </button>
                                    )}
                                </header>
                            )}
                        </div>

                        {/* ==================================
                CONTENT

                Scrolls on its own. Hands the gesture
                over to the sheet only when it is
                already at the top and the finger
                is heading down.
            =================================== */}

                        <div
                            ref={contentRef}
                            onPointerDown={handleContentPointerDown}
                            onPointerMove={handleContentPointerMove}
                            onPointerUp={endGesture}
                            onPointerCancel={endGesture}
                            className="
                min-h-0
                flex-1

                overflow-y-auto

                overscroll-contain

                px-5
                pb-8

                [scrollbar-width:none]

                [&::-webkit-scrollbar]:hidden
              "
                        >
                            {children}
                        </div>

                        {/* ==================================
                FOOTER
            =================================== */}

                        {footer && (
                            <div
                                className="
                  shrink-0

                  

                  bg-transparent

                  px-5
                  pb-4
                  pt-3
                "
                            >
                                {footer}
                            </div>
                        )}
                    </motion.div>

                    {/* ==================================
              SAFE AREA FILLER

              Painted in the sheet's own colour across the
              home indicator strip. If the sheet ever stops
              short of the very bottom, this is what the user
              sees there instead of the violet canvas.

              Under the sheet in paint order, so it is
              invisible whenever the sheet does reach.

              It fades on the way out rather than simply
              being unmounted. The sheet slides clear of
              this strip a moment before the subtree goes,
              which used to leave it standing alone at the
              bottom of the screen.
          =================================== */}

                    <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 bg-white"
                        style={{ height: "env(safe-area-inset-bottom)" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                    />
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
