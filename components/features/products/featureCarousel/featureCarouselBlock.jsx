// components/features/products/featureCarousel/featureCarouselBlock.jsx
import React from "react";
import PropTypes from "prop-types";
import FeatureCarouselLoader from "./featureCarouselLoader";
import { cn } from "@/lib/utils";

/**
 * @typedef {object} SlideData
 * @property {string} _key
 * @property {string} title // For text overlay on slide (e.g., "Powerful Shocks")
 * @property {string} [subtitle] // For text overlay on slide (e.g., "Feels better...")
 * @property {'image' | 'video'} mediaType
 * @property {object} [image] // SanityImageObject with asset, alt
 * @property {string} [videoUrl]
 * @property {boolean} [enablePopup] // To control if modal opens
 * @property {Array<object>} [popupContent] // For FeatureSlideDetailModal, PortableTextBlock structure
 * @property {string} [coverImageAltText] // Specific alt text for the main image of the slide
 */

/**
 * @typedef {object} FeatureCarouselBlockProps
 * @property {string} _key
 * @property {string} _type
 * @property {string} [sectionTitle] // e.g., "Design"
 * @property {string} [sectionSubtitle] // e.g., "Avantgarde design..."
 * @property {Array<SlideData>} slides
 * @property {boolean} [autoplay]
 * @property {number} [autoplayDelay]
 */

export default function FeatureCarouselBlock({ block, productContext }) {
  const {
    sectionTitle = "Design",
    sectionSubtitle = "Avantgarde design, exhilarating performance.",
    slides,
    autoplay: initialAutoplay,
    autoplayDelay,
  } = block || {};

  if (!slides || slides.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `FeatureCarouselBlock (key: ${
          block?._key || "N/A"
        }): No slides. Skipping.`
      );
    }
    return null;
  }

  const sectionClasses = cn(
    "relative w-full flex flex-col font-geist overflow-hidden",
    "bg-neutral-900", // Dark background for the section
    "py-16 md:py-24", // Vertical padding
    "min-h-[80vh]" // Ensure section is substantial, height driven by content below
  );

  const headerContainerClasses = cn(
    "container mx-auto w-full flex-shrink-0 z-10 relative",
    "px-4 sm:px-6 md:px-8 lg:px-16" // Generous padding for header
  );

  const headerFlexClasses = cn(
    "flex flex-col text-left" // Header text aligned left
  );

  const titleClasses = cn(
    "text-neutral-100", // Lighter text for title on dark bg
    "text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight"
  );

  const subtitleClasses = cn(
    "text-neutral-300", // Slightly less prominent subtitle color
    "text-lg sm:text-xl md:text-2xl font-normal tracking-tight leading-relaxed mt-2 md:mt-3 max-w-2xl"
  );

  return (
    <section
      className={sectionClasses}
      data-analytics-section-engagement="name:design-carousel"
    >
      <div className={headerContainerClasses}>
        <header className={headerFlexClasses}>
          {sectionTitle && <h2 className={titleClasses}>{sectionTitle}</h2>}
          {sectionSubtitle && (
            <p className={subtitleClasses}>{sectionSubtitle}</p>
          )}
        </header>
      </div>

      {/* Carousel Section - takes remaining space, mt-12 for spacing from header */}
      <div className="flex-grow min-h-0 w-full mt-10 md:mt-16 relative">
        <FeatureCarouselLoader
          slides={slides}
          productContext={productContext}
          autoplayConfig={{
            enabled: initialAutoplay,
            delay: autoplayDelay,
          }}
        />
      </div>
    </section>
  );
}

FeatureCarouselBlock.propTypes = {
  block: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
    sectionTitle: PropTypes.string,
    sectionSubtitle: PropTypes.string,
    slides: PropTypes.arrayOf(PropTypes.object).isRequired,
    autoplay: PropTypes.bool,
    autoplayDelay: PropTypes.number,
  }).isRequired,
  productContext: PropTypes.object,
};
