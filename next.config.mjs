/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for GitHub Pages static hosting
  output: 'export',
  // Replace with your repo name; used as the base URL path
  basePath: '/3-chance-poker',
  // Helps avoid issues with relative paths on GitHub Pages
  trailingSlash: true,
};

export default nextConfig;
