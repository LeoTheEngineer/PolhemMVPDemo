/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for optimized Docker builds
  output: 'standalone',
  
  // React Compiler for performance
  reactCompiler: true,
  
  // Disable image optimization if not using next/image extensively
  images: {
    unoptimized: true,
  },
  
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
