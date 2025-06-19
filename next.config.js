/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // SVG 파일 처리를 위한 설정
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  images: {
    domains: [
      'picsum.photos', 
      'teaelrzxuigiocnukwha.supabase.co',
      'teaelrzxuigiocnukwha.supabase.in'
    ],
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 