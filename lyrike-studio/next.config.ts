import type { NextConfig } from "next";
import createNextIntlSplitPlugin from "next-intl-split/plugin";

const withNextIntlSplit = createNextIntlSplitPlugin(
  "./messages",
  "./shared/lib/i18n/request.ts",
);

const _nextConfig: NextConfig = {
  /* config options here */
};

const nextConfig: NextConfig = withNextIntlSplit(_nextConfig);

export default nextConfig;
