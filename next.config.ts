import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Portadas, backdrops y capturas de episodios servidas por AnimeAV1
      { protocol: "https", hostname: "cdn.animeav1.com" },
    ],
  },
};

export default nextConfig;
