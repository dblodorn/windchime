import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compiles `graphql` tagged literals (react-relay) into imports of the artifacts `pnpm relay` writes to
  // `__generated__/` beside each file. Mirrors relay.config.json; the two must agree.
  compiler: {
    relay: { src: ".", language: "typescript", eagerEsModules: true },
  },
  // A composition's card (app/c/[id]/opengraph-image.tsx) is drawn per request, not prerendered like the site's,
  // so the files it reads must be copied into its function.
  outputFileTracingIncludes: {
    "/c/[id]/opengraph-image": [
      "./node_modules/@dblodorn/sound-tokens/dist/fonts/AA_Knif-mono.woff",
      "./app/og-head.png",
    ],
  },
  async headers() {
    return [
      {
        source: "/:file(.*\\.sf2)",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
