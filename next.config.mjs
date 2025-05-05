// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add the images configuration
  images: {
    formats: ["image/avif", "image/webp"], // Enable AVIF format
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/kabira-mobility/image/upload/**",
      },
      // Add Sanity CDN domain
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "framerusercontent.com",
        port: "",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
