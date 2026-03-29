import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin({
  // Path to the request config that provides `locale` and `messages`
  requestConfig: "./src/i18n/request.ts",
});

export default withNextIntl(nextConfig);
