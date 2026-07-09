import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      // Escudos FPFS + fontes públicas (logodetimes / wikimedia)
      {
        protocol: "https",
        hostname: "admfutsal.com.br",
        pathname: "/assets/images/foto/escudo/**",
      },
      {
        protocol: "http",
        hostname: "admfutsal.com.br",
        pathname: "/assets/images/foto/escudo/**",
      },
      {
        protocol: "https",
        hostname: "logodetimes.com",
        pathname: "/times/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts", "sonner"],
    // optimizeCss exige o pacote `critters` (não instalado) — sem ele, qualquer
    // render da página _error explode com MODULE_NOT_FOUND e vira 500 em cascata.
    webpackBuildWorker: true,
  },
  logging: {
    fetches: { fullUrl: false },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      // /_next/static: NÃO sobrescrever Cache-Control aqui. Em produção o Next
      // já serve com immutable (nomes com hash); em dev os chunks do Turbopack
      // têm nome estável, e um immutable de 1 ano faz o browser rodar JS velho
      // (UI fantasma, hydration mismatch, "botões sem efeito").
    ]
  },
};

export default nextConfig;
