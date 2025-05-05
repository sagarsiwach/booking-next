// app/products/[slug]/page.jsx
import React from "react";
import { notFound } from "next/navigation";
import PropTypes from "prop-types";
import { sanityClient } from "@/lib/sanityClient";
import { cn } from "@/lib/utils";

// --- Import ONLY the Section Components We Are Implementing Now ---
import HeroSection from "@/components/features/products/HeroSection";
import FeatureCarousel from "@/components/features/products/FeatureCarousel";
import VideoSection from "@/components/features/products/VideoSection";
import GallerySection from "@/components/features/products/GallerySection";
import FaqSection from "@/components/features/products/FaqSection";
import ConfiguratorSection from "@/components/features/products/ConfiguratorSection";
import TestimonialSection from "@/components/features/products/TestimonialCarousel";
import TechSpecsSection from "@/components/features/products/TechSpecsSection";
// Skipping: TextBlock, CtaBlock, TextWithImageBlock

// --- Generate Static Paths ---
export async function generateStaticParams() {
  try {
    // No explicit type needed, fetch should infer string[] or handle errors
    const slugs = await sanityClient.fetch(
      `*[_type == "productPage" && defined(slug.current) && active == true].slug.current`
    );
    // Ensure slugs is an array before mapping
    if (!Array.isArray(slugs)) {
      console.error(
        "generateStaticParams: Fetched slugs is not an array:",
        slugs
      );
      return [];
    }
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error fetching slugs for generateStaticParams:", error);
    return []; // Return empty array on error
  }
}

// --- Generate Metadata ---
export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) {
    console.error("generateMetadata: Slug parameter is missing.");
    return { title: "Invalid Product | Kabira Mobility" };
  }

  try {
    // No explicit type needed here either
    const product = await sanityClient.fetch(
      `*[_type == "productPage" && slug.current == $slug && active == true][0]{
              title,
              "metaTitle": seo.metaTitle,
              "metaDescription": seo.metaDescription,
              "ogImageUrl": seo.ogImage.asset->url
            }`,
      { slug }
    );

    if (!product) {
      // Let notFound() handle this in the page component if preferred,
      // but setting metadata is still good practice.
      return {
        title: "Product Not Found | Kabira Mobility",
        description: "The requested product could not be found.",
      };
    }

    const pageTitle =
      product.metaTitle || product.title || "Kabira Mobility Product";
    const pageDescription =
      product.metaDescription ||
      `Explore the ${product.title || "Kabira Electric Vehicle"}`;

    return {
      title: `${pageTitle} | Kabira Mobility`,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        images: product.ogImageUrl ? [{ url: product.ogImageUrl }] : [],
      },
    };
  } catch (error) {
    console.error(`Error fetching metadata for slug ${slug}:`, error);
    return {
      title: "Error | Kabira Mobility",
      description: "Could not load product information.",
    };
  }
}

// --- Helper: Map Sanity Block Types to Components ---
const blockComponents = {
  heroSection: HeroSection,
  featureCarousel: FeatureCarousel,
  techSpecsSection: TechSpecsSection,
  videoSection: VideoSection,
  testimonialSection: TestimonialSection,
  gallerySection: GallerySection,
  productFaqs: FaqSection,
  configuratorData: ConfiguratorSection,
  // Skipped other block types
};

// --- Main Page Component ---
export default async function ProductPage({ params }) {
  const { slug } = params;

  if (!slug) {
    console.error("ProductPage: Slug parameter is missing.");
    notFound(); // Trigger 404 if slug is missing
  }

  let product;
  try {
    // Updated GROQ query to fetch frameCount and resolve necessary assets
    product = await sanityClient.fetch(
      `*[_type == "productPage" && slug.current == $slug && active == true][0]{
                _id,
                title,
                "slug": slug.current,
                relatedVehicle->{
                    _id, // Include ID if needed
                    name,
                    "slug": modelCode.current,
                    colors[]{ _key, name, colorStart, colorEnd, isDefault },
                    frameCount // **** FETCH frameCount ****
                },
                seo,
                pageBuilder[]{
                    ..., // Get all base fields of the block
                    _key,
                    _type, // Essential for component mapping

                    // --- Resolve references/assets within specific blocks ---
                    _type == "productFaqs" => {
                        ...,
                        referencedFaqs[]->{_id, question, "answer": pt::text(answer)} // Get plain text answer
                    },
                    _type == "gallerySection" => {
                        ...,
                        images[]{ ..., _key, asset->{url, metadata{dimensions}}} // Resolve gallery image assets + dimensions
                    },
                    _type == "featureCarousel" => {
                       ...,
                       slides[]{
                           ...,
                           _key,
                           image{..., asset->{url, metadata{dimensions}}}, // Resolve slide image assets + dimensions
                           "overlayBgColorOverrideHex": overlayBgColorOverride.hex
                       }
                    },
                    _type == "testimonialSection" => {
                       ...,
                       testimonials[]{
                           ...,
                           _key,
                           authorImage{..., asset->{url, metadata{dimensions}}},
                           backgroundImage{..., asset->{url, metadata{dimensions}}}
                       }
                     },
                     _type == "videoSection" => {
                        ...,
                        videoFile{asset->{url, originalFilename, mimeType, size}},
                        posterImage{..., asset->{url, metadata{dimensions}}}
                     },
                      _type == "heroSection" => {
                           ...,
                           image{..., asset->{url, metadata{dimensions}}},
                           // Resolve internal link reference for CTA if it exists
                           cta { ..., link { ..., _type == "link" && linkType == "internal" => { "internalSlug": @.internalReference->slug.current, "internalType": @.internalReference->_type } } }
                      },
                      _type == "configuratorData" => { // No specific asset resolution needed, but fetch overrides
                        ...,
                        sectionTitleOverride,
                        sectionSubtitleOverride,
                        initialFrameOverride,
                        autoRotateOverride
                        // Fetch other overrides if added to schema
                     }
                }
            }`,
      { slug }
    );
  } catch (error) {
    console.error(`Error fetching product page data for slug ${slug}:`, error);
    // Throwing error here might be better to trigger Next.js error handling
    throw new Error(`Failed to load product page: ${slug}`);
    // Or use notFound() if a fetch error should result in 404
    // notFound();
  }

  // Handle Product Not Found
  if (!product) {
    console.log(`Product not found for slug: ${slug}`);
    notFound();
  }

  // Validate essential data for Configurator if it's present
  const hasConfigurator = product.pageBuilder?.some(
    (b) => b._type === "configuratorData"
  );
  if (
    hasConfigurator &&
    (!product.relatedVehicle?.slug || !product.relatedVehicle?.frameCount)
  ) {
    console.error(
      `Missing critical data for Configurator on product page ${product._id}: relatedVehicle.slug or relatedVehicle.frameCount is undefined.`
    );
    // Decide how to handle this - show an error message, or maybe just don't render the configurator block?
    // For now, we'll let the configurator component handle its internal error state.
  }

  // Render the page using the Page Builder
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      {(product.pageBuilder || []).map((block) => {
        // **** Added check for block and block._type ****
        if (!block || !block._type) {
          console.warn(
            "Skipping block in pageBuilder due to missing data or _type:",
            block
          );
          return null;
        }

        const Component = blockComponents[block._type];

        if (!Component) {
          console.warn(`No component found for block type: ${block._type}`);
          if (process.env.NODE_ENV === "development") {
            return (
              <div
                key={block._key || Math.random()} // Fallback key
                className="container mx-auto my-8 p-4 border border-dashed border-red-500 bg-red-50"
              >
                <p className="font-bold text-red-700">
                  Missing Component for Block Type: '{block._type}'
                </p>
                <pre className="text-xs text-red-600 overflow-auto bg-red-100 p-2 rounded mt-2 max-h-60">
                  {JSON.stringify(block, null, 2)}
                </pre>
              </div>
            );
          }
          return null; // Don't render unknown blocks in production
        }

        // Construct productContext more carefully
        const productContextValue = {
          id: product._id,
          title: product.title,
          slug: product.slug, // Use the fetched slug
          // Only include relatedVehicle if it exists
          relatedVehicle: product.relatedVehicle
            ? {
                name: product.relatedVehicle.name,
                slug: product.relatedVehicle.slug, // Already fetched as modelCode.current
                colors: product.relatedVehicle.colors || [],
                frameCount: product.relatedVehicle.frameCount, // Pass frameCount
              }
            : null, // Pass null if relatedVehicle wasn't fetched or linked
        };

        // Add specific check before rendering Configurator
        if (
          block._type === "configuratorData" &&
          !productContextValue.relatedVehicle?.frameCount
        ) {
          console.warn(
            `Skipping ConfiguratorSection for product ${product.title} because frameCount is missing.`
          );
          if (process.env.NODE_ENV === "development") {
            return (
              <div
                key={block._key}
                className="container mx-auto my-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800"
              >
                Configurator skipped: Missing 'frameCount' in related vehicle
                data.
              </div>
            );
          }
          return null;
        }

        return (
          <Component
            key={block._key}
            block={block}
            productContext={productContextValue} // Pass constructed context
          />
        );
      })}
    </main>
  );
}

// Define PropTypes for the Page component's props (params)
ProductPage.propTypes = {
  params: PropTypes.shape({
    slug: PropTypes.string, // Slug might be undefined during initial render phases
  }).isRequired,
};
