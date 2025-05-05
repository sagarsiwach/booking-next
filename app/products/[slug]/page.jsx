// app/products/[slug]/page.jsx
import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchProductItemBySlug } from "@/lib/api";
import { sanityClient } from "@/lib/sanityClient";

// --- Main Page Component ---
export default async function ProductItemPage({ params }) {
  // Keep params object
  // --- Access slug *after* the await, as a diagnostic step ---
  const productItemData = await fetchProductItemBySlug(params.slug);

  // --- Handle Not Found ---
  if (!productItemData) {
    // Log the slug that was not found
    console.log(`Active productItem with slug "${params.slug}" not found.`);
    notFound();
  }

  // Now access the slug from params again or use the fetched one
  const slug = params.slug; // Or use productItemData.slug

  // --- Destructure the basic data with robust fallbacks ---
  const {
    title = "Product Title",
    slug: currentSlug, // Use slug from data if available
    description,
    mainImage,
  } = productItemData;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>

      <p className="text-lg text-gray-600 mb-2">
        Slug: /products/{currentSlug || slug || "..."}
      </p>

      {mainImage?.asset?.url ? (
        <div className="mb-6 relative aspect-video max-w-2xl bg-gray-100 rounded overflow-hidden">
          <Image
            src={mainImage.asset.url}
            alt={mainImage.alt || "Product image"} // Ensure alt text is always a string
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            placeholder={mainImage.asset.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={mainImage.asset.metadata?.lqip}
          />
        </div>
      ) : (
        <div className="mb-6 aspect-video max-w-2xl bg-gray-200 rounded flex items-center justify-center text-gray-500">
          (No Image Uploaded in CMS)
        </div>
      )}

      {description ? ( // Render description only if it's not null/empty
        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold mb-2">Description</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{description}</p>
        </div>
      ) : (
        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold mb-2">Description</h2>
          <p className="text-gray-500 italic">
            (No description provided in CMS)
          </p>
        </div>
      )}

      <div className="mt-12 p-4 border border-dashed border-gray-300">
        <p className="text-center text-gray-500">
          [Future content sections will go here]
        </p>
      </div>
    </main>
  );
}

// --- Generate Metadata (More Robust Checks) ---
export async function generateMetadata({ params: { slug } }) {
  const productItemData = await fetchProductItemBySlug(slug);

  if (!productItemData) {
    return {
      title: "Product Not Found",
      robots: { index: false }, // Prevent indexing not found pages
    };
  }

  // --- Provide safe defaults for all values ---
  const pageTitle = productItemData.title ?? "Kabira Mobility Product"; // Use ?? for null/undefined
  // Ensure description is always a string
  const pageDescription = (productItemData.description ?? "").substring(0, 160);
  // Ensure ogImageUrl is null if asset or url is missing
  const ogImageUrl = productItemData.mainImage?.asset?.url ?? null;

  // --- Build OpenGraph object carefully ---
  const openGraphData = {
    title: pageTitle,
    description: pageDescription,
    type: "product", // Correct type
    // Only include 'images' key if ogImageUrl is a valid string
    ...(ogImageUrl &&
      typeof ogImageUrl === "string" && { images: [{ url: ogImageUrl }] }),
  };

  console.log("Generated Metadata:", {
    // Log the final object
    title: pageTitle,
    description: pageDescription,
    openGraph: openGraphData,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: openGraphData,
  };
}

// --- Generate Static Params (Keep as is, filter added previously) ---
export async function generateStaticParams() {
  const query = `*[_type == "productItem" && defined(slug.current) && active == true]{ "slug": slug.current }`;
  try {
    const slugs = await sanityClient.fetch(query);
    console.log(`Generating static params for ${slugs.length} product items.`);
    return slugs
      .filter((item) => typeof item.slug === "string" && item.slug.length > 0)
      .map((item) => ({
        slug: item.slug,
      }));
  } catch (error) {
    console.error(
      "Failed to fetch slugs for generateStaticParams (productItem):",
      error
    );
    return [];
  }
}
