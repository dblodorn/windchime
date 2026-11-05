/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compiles `graphql` tagged literals (react-relay) into imports of the artifacts `pnpm relay` writes to
  // `__generated__/` beside each file. Mirrors relay.config.json; the two must agree.
  compiler: {
    relay: { src: ".", language: "javascript", eagerEsModules: true },
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
