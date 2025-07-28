import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   eslint: {
    // Warning: disabling ESLint during builds will allow potentially
    // unsafe code to ship. Use with caution.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
