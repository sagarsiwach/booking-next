// app/products/[slug]/page.jsx
// app/products/[slug]/page.jsx
import React from "react";
import { notFound } from "next/navigation";
import { fetchProductItemBySlug, fetchActiveProductSlugs } from "@/lib/api";

// Import your block components
import HeroSection from "@/components/features/products/HeroSection";
import ConfiguratorSection from "@/components/features/products/turntable/ConfiguratorSection";
import FaqSection from "@/components/features/products/faq/FaqSection";
import TechSpecsSection from "@/components/features/products/TechSpecsSection";
import TestimonialSection from "@/components/features/products/TestimonialCarousel";
import FeatureCarouselBlock from "@/components/features/products/featureCarousel/featureCarouselBlock";
import GallerySection from "@/components/features/products/GallerySection"; // Handles 'galleryBlock'
import VideoSection from "@/components/features/products/VideoSection"; // Handles 'videoBlock'
// Ensure other used block components are imported if they appear in pageBuilder:
// import TextWithImageBlock from "@/components/TextWithImageBlock"; // Example
// import RichTextBlock from "@/components/RichTextBlock"; // For standalone blockContent

// --- Component Mapper ---
const blockComponents = {
  heroSectionBlock: HeroSection,
  configuratorSectionBlock: ConfiguratorSection,
  featureCarouselBlock: FeatureCarouselBlock,
  faqBlock: FaqSection,
  techSpecsSection: TechSpecsSection,
  galleryBlock: GallerySection,
  videoBlock: VideoSection,
  testimonialSection: TestimonialSection,
  // textWithImageBlock: TextWithImageBlock, // Add if used and component exists
  // blockContent: RichTextBlock, // Add if standalone rich text blocks are part of pageBuilder
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

  const { title, pageBuilder = [] } = productItemData; // relatedVehicleData removed as it's not used in the loop

  const productContext = {
    id: productItemData._id,
    productPageTitle: title, // Changed from productItemData.title to title for consistency
    productSlug: productItemData.slug, // slug is an object { current: "actual-slug" } from Sanity, but API returns string now
  };

  return (
    <main>
      {pageBuilder && pageBuilder.length > 0 ? (
        pageBuilder.map((block) => {
          if (!block || !block._type || !block._key) {
            console.warn(
              "Skipping invalid block structure in pageBuilder:",
              block
            );
            return null;
          }

          const Component = blockComponents[block._type];

          if (!Component) {
            console.warn(
              `ProductItemPage: No component found for block type: ${block._type}`
            );
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
                    No component registered in <code>productItem/page.jsx</code>{" "}
                    for block type "<code>{block._type}</code>".
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
              `ProductItemPage: Error rendering component for block type ${block._type} (key: ${block._key}):`,
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
  // Try to find an image from pageBuilder if SEO image is missing
  if (
    !ogImage &&
    productItemData.pageBuilder &&
    productItemData.pageBuilder.length > 0
  ) {
    // Prefer Hero image
    const heroBlock = productItemData.pageBuilder.find(
      (b) => b._type === "heroSectionBlock" && b.image?.asset?.url
    );
    if (heroBlock) {
      ogImage = heroBlock.image.asset.url;
    }
    // Then gallery image
    if (!ogImage) {
      const galleryBlock = productItemData.pageBuilder.find(
        (b) =>
          b._type === "galleryBlock" &&
          b.images?.length > 0 &&
          b.images[0].image?.asset?.url
      );
      if (galleryBlock) {
        ogImage = galleryBlock.images[0].image.asset.url;
      }
    }
    // Then feature carousel image
    if (!ogImage) {
      const featureCarousel = productItemData.pageBuilder.find(
        (b) =>
          b._type === "featureCarouselBlock" &&
          b.slides?.length > 0 &&
          b.slides[0].mediaType === "image" &&
          b.slides[0].image?.asset?.url
      );
      if (featureCarousel) {
        ogImage = featureCarousel.slides[0].image.asset.url;
      }
    }
    // Then video poster image
    if (!ogImage) {
      const videoBlock = productItemData.pageBuilder.find(
        (b) => b._type === "videoBlock" && b.posterImage?.asset?.url
      );
      if (videoBlock) {
        ogImage = videoBlock.posterImage.asset.url;
      }
    }
  }

  return {
    title: pageTitle,
    description: pageDescription.substring(0, 160), // Ensure description isn't too long
    openGraph: {
      title: pageTitle,
      description: pageDescription.substring(0, 160),
      type: "website",
      url: `/products/${slug}`, // Add the canonical URL for this page
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    // Add other metadata as needed, e.g., Twitter card
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription.substring(0, 160),
      ...(ogImage && { images: [ogImage] }),
    },
    // Robots tag based on SEO settings from Sanity
    ...(productItemData.seo?.noIndex && { robots: { index: false } }),
    ...(productItemData.seo?.noFollow && { robots: { follow: false } }), // Note: Next.js combines these
    ...(productItemData.seo?.canonicalUrl && {
      alternates: { canonical: productItemData.seo.canonicalUrl },
    }),
  };
}

// --- Generate Static Params ---
export async function generateStaticParams() {
  const slugsObjects = await fetchActiveProductSlugs();
  return slugsObjects.map((item) => ({ slug: item.slug }));
}
