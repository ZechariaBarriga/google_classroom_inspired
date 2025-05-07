// next.config.ts
import type { NextConfig } from "next";
import { default as nextBundleAnalyzer } from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
   reactStrictMode: true,

   experimental: {
      optimizePackageImports: [
         "lucide-react",
         "react-toastify",
         "jose",
         "zod",
         "@prisma/client",
      ],
      memoryBasedWorkersCount: true,
      optimizeServerReact: true,
   },
   compiler: {
      removeConsole: process.env.NODE_ENV === "production", 
   },
   eslint: {
      ignoreDuringBuilds: true,
   },
   transpilePackages: ["@prisma/client", "pg"],
};

export default nextBundleAnalyzer({
   enabled: process.env.ANALYZE === "true",
})(nextConfig);
