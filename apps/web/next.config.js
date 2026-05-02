/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kanban/types'],
  // Produce a self-contained server bundle for Docker deployment.
  // Output is written to .next/standalone/ and the entry point is server.js.
  output: 'standalone',
};

module.exports = nextConfig;
