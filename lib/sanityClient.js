// lib/sanityClient.js
import { createClient } from "@sanity/client";

// Validate environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (!projectId) {
  console.error(
    "❌ Sanity Error: Project ID is missing. Set NEXT_PUBLIC_SANITY_PROJECT_ID in your .env.local"
  );
}
if (!dataset) {
  console.error(
    "❌ Sanity Error: Dataset is missing. Set NEXT_PUBLIC_SANITY_DATASET in your .env.local or default is used."
  );
}

export const sanityClient = createClient({
  // Use dummy values if env vars are missing to prevent hard crash during build/dev,
  // but rely on console errors to indicate the real problem.
  projectId: projectId || "dummy-project-id",
  dataset: dataset || "production", // Keep default even if logged as missing
  useCdn: process.env.NODE_ENV === "production", // Use CDN for production builds
  apiVersion: "2023-05-03", // Use a consistent API version date
  // token: process.env.SANITY_API_READ_TOKEN, // Uncomment if dataset is private
});
