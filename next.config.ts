import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Portadas y miniaturas servidas por AnimeFLV
      { protocol: "https", hostname: "animeflv.net" },
      { protocol: "https", hostname: "www3.animeflv.net" },
    ],
  },
};

export default nextConfig;
