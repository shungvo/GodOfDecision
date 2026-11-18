import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SkyBackdrop } from "@/components/layout/sky-backdrop";
import { TapSparkles } from "@/components/layout/tap-sparkles";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { NavOverlay } from "@/components/navigation/nav-overlay";
import { AppGate } from "@/components/onboarding/app-gate";
import { CANVAS_TOP } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://godofdecision.app"),

    title: {
        default: "GodOfDecision",
        template: "%s | GodOfDecision",
    },

    description: "Ask the oracle. Let fate decide.",

    applicationName: "GodOfDecision",

    keywords: [
        "GodOfDecision",
        "oracle",
        "decision maker",
        "tarot",
        "AI oracle",
    ],

    authors: [
        {
            name: "GodOfDecision",
        },
    ],

    manifest: "/manifest.webmanifest",

    icons: {
        icon: [
            {
                url: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                url: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
        apple: [
            {
                url: "/icons/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    },

    appleWebApp: {
        capable: true,
        title: "GodOfDecision",
        statusBarStyle: "default",
    },

    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",

    // Tints Safari's toolbar and Android Chrome's status bar. An
    // installed iOS web app ignores this and uses the <html>
    // background instead — see lib/theme.ts.
    themeColor: CANVAS_TOP,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="vi"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable}`}
            /*
             * Written here rather than in globals.css so lib/theme.ts is
             * the only place the colour appears. It lands in the server
             * rendered HTML, so it is set before any stylesheet is applied.
             */
            style={{ "--canvas-top": CANVAS_TOP } as React.CSSProperties}
        >
            <body className="antialiased">
                {/* First, so every positioned element after it paints above. */}
                <SkyBackdrop />
                <TapSparkles />
                {children}
                <NavOverlay />
                <BottomTabBar />
                <AppGate />
            </body>
        </html>
    );
}
