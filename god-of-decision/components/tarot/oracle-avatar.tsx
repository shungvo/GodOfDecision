/**
 * Lumi, the mascot, for the corner of a sheet header.
 *
 * Same pre-framed face crop as OracleMark, as a background so the
 * circle clips it.
 */
export function OracleAvatar() {
    return (
        <div className="relative h-[64px] w-[64px] shrink-0">
            {/* Soft halo */}
            <div
                className="absolute -inset-1 rounded-full bg-secondary-100/60 blur-md"
                aria-hidden="true"
            />

            <div
                className="
          relative
          h-full
          w-full

          overflow-hidden
          rounded-full

          bg-secondary-100

          bg-[url(/images/mascot/lumi-face.webp)]
          bg-cover
          bg-center
          bg-no-repeat

          ring-2
          ring-white
        "
                aria-hidden="true"
            />

            {/* Speech bubble, as in the reference */}
            <div
                className="
          absolute
          -left-2
          -top-1

          flex
          h-7
          w-9
          items-center
          justify-center
          gap-[3px]

          rounded-xl
          rounded-bl-[4px]

          bg-primary-600

          shadow-e2
        "
                aria-hidden="true"
            >
                <span className="h-[3px] w-[3px] rounded-full bg-white" />
                <span className="h-[3px] w-[3px] rounded-full bg-white" />
                <span className="h-[3px] w-[3px] rounded-full bg-white" />
            </div>
        </div>
    );
}
