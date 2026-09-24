import type { MetadataRoute } from "next";

import { CANVAS_TOP } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "GodOfDecision",
        short_name: "GodOfDecision",

        description: "Ask the oracle. Let fate decide.",

        start_url: "/",
        scope: "/",

        display: "standalone",

        orientation: "portrait",

        /*
         * background_color is the flat colour of the native launch
         * screen, which the splash then continues from — so it wants
         * to be the splash's own top row.
         */
        background_color: CANVAS_TOP,
        theme_color: CANVAS_TOP,

        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                /*
                 * Its own file, not the same image again.
                 *
                 * A maskable icon gets cropped to whatever shape the
                 * launcher likes, so the face has to sit inside the
                 * middle 80%. Pointing this at the full bleed icon —
                 * as it used to — means a round mask cuts the chin off.
                 */
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
