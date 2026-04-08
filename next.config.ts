import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output — copies only needed node_modules for VPS/Docker
  output: "standalone",

  // BFF: browser hits plantoday.in/bff/api/v1/... → proxied server-side
  // to internal NestJS (no CORS, no token leakage in browser network tab)
  async rewrites() {
    const internalApi =
      process.env.INTERNAL_API_URL || "http://localhost:3001";
    return [
      {
        source: "/bff/:path*",
        destination: `${internalApi}/:path*`,
      },
    ];
  },

  // Image optimisation
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      { protocol: "https", hostname: "**.plantoday.in" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Security + cache headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
