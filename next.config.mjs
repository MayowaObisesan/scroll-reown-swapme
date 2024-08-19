/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: config => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding')
        return config
    },
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
