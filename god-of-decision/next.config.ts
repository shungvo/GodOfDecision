import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /**
     * In development Next blocks requests to its own dev assets from
     * any origin other than the hostname it was started with, which
     * is `localhost`.
     *
     * Open the app at 127.0.0.1 instead, as the iOS Simulator does,
     * and every `/_next/*` request is refused: the HMR socket, the
     * source maps, and the JS chunks. The server rendered HTML still
     * arrives, so the page looks fine but never hydrates and sits on
     * its loading state forever.
     *
     * Add your Mac's LAN address here too when testing on a real
     * phone, e.g. "192.168.1.20".
     */
    allowedDevOrigins: [
        "localhost",
        "127.0.0.1",
        "10.10.0.116",
        "192.168.1.137",

        // Tunnels. Without these the page loads over the tunnel and then
        // every `/_next/*` request is refused, which is the failure that
        // looks like the app is broken rather than blocked.
        "*.ngrok-free.app",
        "*.ngrok.app",
        "*.ngrok.io",
    ],

    /**
     * The backend, served under the Next origin.
     *
     * This is what lets one hostname — and so one tunnel — serve the
     * whole app. See the note on `baseUrl` in lib/api.ts.
     *
     * A plain array is `afterFiles`, so anything real under app/api
     * still wins over this.
     */
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:3001/api/:path*",
            },
        ];
    },
};

export default nextConfig;
