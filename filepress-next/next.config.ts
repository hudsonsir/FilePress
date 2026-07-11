import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许外部图片域名（可按需追加）
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // 服务端组件可以使用 Node.js 原生模块（mysql2、bcryptjs 等）
  serverExternalPackages: ["mysql2", "bcryptjs"],
  // 关闭 Strict Mode 以减少开发时双重调用
  reactStrictMode: false,
};

export default nextConfig;
