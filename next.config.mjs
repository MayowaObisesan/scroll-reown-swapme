/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: config => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding')

        // Enable tree shaking for unused protocol code
        config.optimization = {
            ...config.optimization,
            usedExports: true,
            sideEffects: true,
        }

        return config
    },
    // Enable CDN optimization for static assets
    images: {
        domains: ['assets.coingecko.com', 'raw.githubusercontent.com'],
        unoptimized: false,
    },
    // Enable compression
    compress: true,
    // experimental: {
    //     turbo: {
    //         rules: {
    //             '*.svg': {
    //                 loaders: ['@svgr/webpack'],
    //                 as: '*.ts',
    //             },
    //         },
    //     },
    // },
}
export default nextConfig;
