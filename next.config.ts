import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Add other image hostnames here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'another-image-provider.com',
      //   port: '',
      //   pathname: '/**',
      // }
    ],
  },
};

export default nextConfig;
