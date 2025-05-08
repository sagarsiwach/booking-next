// app/products/[slug]/page.jsx
import React from "react";
import { notFound } from "next/navigation";
import { fetchProductItemBySlug, fetchActiveProductSlugs } from "@/lib/api"; // Updated import
// import { sanityClient } from "@/lib/sanityClient"; // No longer directly needed here for fetching

// Import your block components
import HeroSection from "@/components/features/products/HeroSection";
import ConfiguratorSection from "@/components/features/products/ConfiguratorSection";
// Import other block components as you create/need them
// import FaqSection from "@/components/features/products/FaqSection";
// import TextWithImageSection from "@/components/features/products/TextWithImageSection"; // Example

// --- Component Mapper ---
const blockComponents = {
  heroSectionBlock: HeroSection,
  configuratorSectionBlock: ConfiguratorSection,
  // faqBlock: FaqSection,
  // textWithImageBlock: TextWithImageSection,
  // Add other mappings here
};

// --- Main Page Component ---
export default async function ProductItemPage({ params }) {
  // No need for props, directly use params
  const slug = params?.slug;

  if (!slug) {
    console.error("ProductItemPage: Slug is missing from params.");
    notFound();
  }

  const productItemData = await fetchProductItemBySlug(slug);

  if (!productItemData) {
    console.log(
      `ProductItemPage: Active productItem with slug "${slug}" not found.`
    );
    notFound();
  }

  const { title, pageBuilder = [] } = productItemData;

  // --- Product Context for child components ---
  // This is where you'd pass down any top-level product data
  // that individual blocks might need (e.g., related vehicle for configurator)
  // For now, it's minimal. Expand as needed based on Sanity data structure.
  const productContext = {
    id: productItemData._id,
    title: productItemData.title,
    slug: productItemData.slug,
    // Example: If 'productItem' links to a 'vehicle' document that has configurator details:
    // relatedVehicle: productItemData.relatedVehicle // (You'd fetch this in your GROQ query if needed)
    // For your current `ConfiguratorSection`, it expects `relatedVehicle.slug`, `relatedVehicle.colors`, `relatedVehicle.frameCount`
    // So, if your `productItem` Sanity document has a reference field named `vehicleData` that points to your `vehicle` document,
    // your GROQ query would need to fetch it like:
    // ...,
    // "relatedVehicle": vehicleData->{
    //   "slug": modelCode.current, // Assuming modelCode in vehicle schema is for configurator path
    //   colors[]{ name, "slug": slug.current, isDefault, "colorValue": colorStart.hex }, // Adjust to your vehicle color schema
    //   "frameCount": configuratorSetup.frameCount // Adjust to your vehicle frameCount schema
    // }
    // For now, let's assume ConfiguratorSection gets these directly from its own block props if designed that way,
    // or we'll need to adjust the GROQ.
    // Based on your ConfiguratorSection.jsx, it seems to expect this from `productContext.relatedVehicle`.
    // Let's mock it for now if not fetched, or ensure your GROQ for `productItem` fetches it.

    // **IMPORTANT**: For the ConfiguratorSection to work as written,
    // `productItemData` needs a `relatedVehicle` field that looks like:
    // relatedVehicle: { slug: "km3000", colors: [{name: "Red", slug:"red", isDefault: true}], frameCount: 360 }
    // Adjust your `fetchProductItemBySlug` GROQ if `productItem` links to a `vehicle` document.
    // If `configuratorSectionBlock` itself contains `modelCode`, `colors`, `frameCount`, then this context is less critical for it.
    // Your `configuratorSectionBlock` in Sanity has `modelCode`, `frameCount`, `colors`. So, it's self-contained.
    // Let's simplify the context for now.
  };

  return (
    <main>
      {/* Optional: Render a global page title if not handled by a hero */}
      {/* <h1 className="text-4xl font-bold mb-8 text-center">{title || "Product"}</h1> */}

      {pageBuilder && pageBuilder.length > 0 ? (
        pageBuilder.map((block) => {
          const Component = blockComponents[block._type];
          if (!Component) {
            console.warn(`No component found for block type: ${block._type}`);
            return (
              <div
                key={block._key}
                className="container mx-auto px-4 py-8 my-4 border border-dashed border-red-400 bg-red-50"
              >
                <p className="text-red-700">
                  <strong>Warning:</strong> Component for block type "
                  <code>{block._type}</code>" is not implemented.
                </p>
                <pre className="text-xs bg-red-100 p-2 overflow-auto mt-2">
                  {JSON.stringify(block, null, 2)}
                </pre>
              </div>
            );
          }
          // Pass the block data and the product context to each component
          return (
            <Component
              key={block._key}
              block={block}
              productContext={productContext}
            />
          );
        })
      ) : (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-xl text-gray-500">
            This product page has no content sections defined yet.
          </p>
        </div>
      )}
    </main>
  );
}

// --- Generate Metadata (Adjusted to use the new fetch function) ---
export async function generateMetadata({ params }) {
  const slug = params?.slug;
  if (!slug) return { title: "Product Not Found" };

  const productItemData = await fetchProductItemBySlug(slug);

  if (!productItemData) {
    return {
      title: "Product Not Found",
      robots: { index: false },
    };
  }

  const pageTitle = productItemData.title || "Kabira Mobility Product";
  // For meta description, you'd ideally pull from an SEO field in Sanity.
  // Falling back to a generic one or the first bit of text content.
  const pageDescription =
    productItemData.seo?.metaDescription ||
    `Learn more about ${pageTitle} from Kabira Mobility.`; // Example fallback

  const ogImage =
    productItemData.seo?.ogImage?.asset?.url ||
    productItemData.pageBuilder?.find((b) => b._type === "heroSectionBlock")
      ?.image?.asset?.url;

  return {
    title: pageTitle,
    description: pageDescription.substring(0, 160),
    openGraph: {
      title: pageTitle,
      description: pageDescription.substring(0, 160),
      type: "website", // Or "product" if you have specific product OG type data
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
  };
}

// --- Generate Static Params (Using the new fetch function) ---
export async function generateStaticParams() {
  const slugs = await fetchActiveProductSlugs(); // Uses the updated function
  console.log(`Generating static params for ${slugs.length} product items.`);
  return slugs; // `fetchActiveProductSlugs` already returns the correct format [{slug: '...'}, ...]
}
