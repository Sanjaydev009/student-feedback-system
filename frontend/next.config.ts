import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable caching completely
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Force recompilation
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Ensure we don't use cached assets
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add cache busting to asset imports
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      loader: 'string-replace-loader',
      options: {
        search: 'import',
        replace: `import /* ${Date.now()} */`,
        flags: 'g',
      },
    });
    
    return config;
  },
};

export default nextConfig;
