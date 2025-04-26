// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Add the images configuration block here
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'res.cloudinary.com',
          port: '', // Leave empty for default ports (80/443)
          pathname: '/kabira-mobility/image/upload/**', // Optional: Be more specific about the path if needed
        },
        // Add other hostnames here if you use images from other domains
        // Example:
        // {
        //   protocol: 'https',
        //   hostname: 'another-image-host.com',
        // },
         {
           protocol: 'https',
           hostname: 'framerusercontent.com', // Add this for the default framer image too
           port: '',
           pathname: '/images/**',
         },
      ],
    },
    // ... any other existing configurations you might have
  };
  
  export default nextConfig;