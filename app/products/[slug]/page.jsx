// app/products/[slug]/page.jsx
import React from "react";
import { notFound } from "next/navigation";
import { fetchProductItemBySlug, fetchActiveProductSlugs } from "@/lib/api";

// Import your block components (paths adjusted based on your structure)
import HeroSection from "@/components/features/products/HeroSection";
import ConfiguratorSection from "@/components/features/products/turntable/ConfiguratorSection"; // Corrected Path
import FaqSection from "@/components/features/products/faq/FaqSection"; // Corrected Path
import TechSpecsSection from "@/components/features/products/TechSpecsSection";
import GallerySection from "@/components/features/products/GallerySection";
import TestimonialSection from "@/components/features/products/TestimonialCarousel";
import VideoSection from "@/components/features/products/VideoSection";
import FeatureCarouselBlock from "@/components/features/products/featureCarousel/featureCarouselBlock"; // Corrected Path

// --- Component Mapper ---
const blockComponents = {
  heroSectionBlock: HeroSection,
  configuratorSectionBlock: ConfiguratorSection,
  featureCarouselBlock: FeatureCarouselBlock,
  faqBlock: FaqSection,
  techSpecsSection: TechSpecsSection,
  gallerySection: GallerySection,
  testimonialSection: TestimonialSection,
  videoSection: VideoSection,
};

// --- Main Page Component ---
export default async function ProductItemPage({ params }) {
  const { slug } = params;

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

  const { title, pageBuilder = [], relatedVehicleData } = productItemData;

  const productContext = {
    id: productItemData._id,
    productPageTitle: title,
    productSlug: productItemData.slug?.current,
  };

  return (
    <main>
      {pageBuilder && pageBuilder.length > 0 ? (
        pageBuilder.map((block) => {
          if (!block || !block._type || !block._key) {
            console.warn("Skipping invalid block structure:", block);
            return null;
          }

          const Component = blockComponents[block._type];

          if (!Component) {
            console.warn(`No component found for block type: ${block._type}`);
            if (process.env.NODE_ENV === "development") {
              return (
                <div
                  key={block._key}
                  className="container mx-auto my-4 border border-dashed border-red-400 bg-red-50 p-4 py-8"
                >
                  <p className="font-semibold text-red-700">
                    Missing Component Warning:
                  </p>
                  <p className="text-sm text-red-600">
                    No component registered in <code>page.jsx</code> for block
                    type "<code>{block._type}</code>".
                  </p>
                  <details className="mt-2 text-xs">
                    <summary>Block Data</summary>
                    <pre className="mt-1 overflow-auto rounded bg-red-100 p-2 text-red-900">
                      {JSON.stringify(block, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            }
            return null;
          }

          try {
            return (
              <Component
                key={block._key}
                block={block}
                productContext={productContext}
              />
            );
          } catch (error) {
            console.error(
              `Error rendering component for block type ${block._type} (key: ${block._key}):`,
              error
            );
            if (process.env.NODE_ENV === "development") {
              return (
                <div
                  key={block._key}
                  className="container mx-auto my-4 border border-dashed border-red-500 bg-red-100 p-4 py-8"
                >
                  <p className="font-semibold text-red-800">
                    Component Rendering Error ({block._type})
                  </p>
                  <p className="mt-1 text-sm text-red-700">{error.message}</p>
                  <details className="mt-2 text-xs">
                    <summary>Block Data</summary>
                    <pre className="mt-1 overflow-auto rounded bg-red-200 p-2 text-red-900">
                      {JSON.stringify(block, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            }
            return null;
          }
        })
      ) : (
        <div className="container mx-auto py-12 px-4 text-center">
          <p className="text-xl text-muted-foreground">
            This product page has no content sections defined yet. Please add
            content in the CMS.
          </p>
        </div>
      )}
    </main>
  );
}

// --- Generate Metadata ---
export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: "Product Not Found" };

  const productItemData = await fetchProductItemBySlug(slug);

  if (!productItemData) {
    return { title: "Product Not Found", robots: { index: false } };
  }

  const pageTitle =
    productItemData.seo?.metaTitle ||
    productItemData.title ||
    "Kabira Mobility Product";
  const pageDescription =
    productItemData.seo?.metaDescription ||
    `Learn more about the ${
      productItemData.title || "Kabira EV"
    } from Kabira Mobility. High-performance electric vehicles.`;

  let ogImage = productItemData.seo?.ogImage?.asset?.url;
  if (!ogImage) {
    const heroBlock = productItemData.pageBuilder?.find(
      (b) => b._type === "heroSectionBlock" && b.image?.asset?.url
    );
    ogImage = heroBlock?.image?.asset?.url;
  }

  return {
    title: pageTitle,
    description: pageDescription.substring(0, 160),
    openGraph: {
      title: pageTitle,
      description: pageDescription.substring(0, 160),
      type: "website",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
  };
}

// --- Generate Static Params ---
export async function generateStaticParams() {
  const slugs = await fetchActiveProductSlugs();
  return slugs;
}
