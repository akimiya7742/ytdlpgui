import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Bắt buộc để Electron chạy offline
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
