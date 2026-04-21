//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');


/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  // Enable standalone output for Docker containerization
  output: 'standalone',
  productionBrowserSourceMaps: false,
  compress: true,
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);


//@ts-check
// const { composePlugins, withNx } = require('@nx/next');

// /** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
// const nextConfig = {
//   nx: {},

//   async rewrites() {
//     return {
//       beforeFiles: [
//         // ✅ Force proxy auth too
//         {
//           source: '/api/auth/:path*',
//           destination: 'http://127.0.0.1:4000/api/auth/:path*',
//         },
//         // ✅ Proxy everything else under /api
//         {
//           source: '/api/:path*',
//           destination: 'http://127.0.0.1:4000/api/:path*',
//         },
//       ],
//       afterFiles: [],
//       fallback: [],
//     };
//   },
// };

// module.exports = composePlugins(withNx)(nextConfig);
