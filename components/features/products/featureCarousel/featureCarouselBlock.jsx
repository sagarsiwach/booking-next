// components/features/products/featureCarousel/featureCarouselBlock.jsx
import React from "react";
import PropTypes from "prop-types";
import FeatureCarouselLoader from "./featureCarouselLoader";
// Statically import the FeatureCarouselLoader client component

// Skeleton is now only a dependency of FeatureCarouselLoader, not needed here directly.

/**
 * @typedef {object} ImageAsset
 * @property {string} [_id]
 * @property {string} url
 * @property {{dimensions?: {width: number, height: number, aspectRatio?: number}, lqip?: string}} [metadata]
 */

/**
 * @typedef {object} SanityImageObject
 * @property {string} [alt]
 * @property {ImageAsset} asset
 */

/**
 * @typedef {object} PortableTextBlockChild
 * @property {string} _key
 * @property {string} _type
 * @property {string[]} [marks]
 * @property {string} text
 */

/**
 * @typedef {object} PortableTextBlock
 * @property {string} _key
 * @property {string} _type
 * @property {Array<PortableTextBlockChild>} children
 * @property {Array<object>} markDefs
 * @property {string} [style]
 * @property {SanityImageObject} [asset]
 * @property {string} [alt]
 * @property {string} [caption]
 */

/**
 * @typedef {object} FeatureSlideDataSanity
 * @property {string} _key
 * @property {string} title
 * @property {string} [subtitle]
 * @property {'image' | 'video'} mediaType
 * @property {SanityImageObject} [image]
 * @property {string} [videoUrl]
 * @property {boolean} [enablePopup]
 * @property {Array<PortableTextBlock>} [popupContent]
 */

/**
 * @typedef {object} FeatureCarouselBlockProps
 * @property {string} _key
 * @property {string} _type
 * @property {string} sectionTitle
 * @property {string} [sectionSubtitle]
 * @property {Array<FeatureSlideDataSanity>} slides
 */

export default function FeatureCarouselBlock({ block, productContext }) {
  const { sectionTitle, sectionSubtitle, slides } = block || {};

  if (!slides || slides.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `FeatureCarouselBlock (key: ${
          block?._key || "N/A"
        }): No slides provided. Skipping render.`
      );
    }
    return null;
  }

  return (
    <section
      className="py-0 bg-background text-foreground flex flex-col"
      style={{ height: "calc(100dvh - 81px)" }} // Hardcoded 81px for nav height
    >
      <div className="mx-auto max-w-full w-full px-0 flex flex-col flex-grow overflow-hidden">
        {(sectionTitle || sectionSubtitle) && (
          <div className="relative z-20 px-6 pt-10 pb-4 sm:pt-12 sm:pb-6 md:px-10 xl:px-16 text-left shrink-0">
            {sectionTitle && (
              <h2
                className="my-0 font-sans text-[clamp(26px,2.3vi+18px,44px)] sm:text-[clamp(28px,2.5vi+20px,48px)] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground"
                style={{ textWrap: "balance" }}
              >
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p
                className="mt-1 sm:mt-2 mb-0 font-sans text-[clamp(15px,1vi+11px,18px)] sm:text-[clamp(16px,1.2vi+12px,20px)] font-normal leading-normal sm:leading-[1.6] tracking-[-0.01em] text-muted-foreground md:max-w-[60ch]"
                style={{ textWrap: "pretty" }}
              >
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        {/* The FeatureCarouselLoader will take up the remaining vertical space */}
        <div className="flex-grow min-h-0 relative">
          <FeatureCarouselLoader
            slides={slides}
            productContext={productContext}
          />
        </div>
      </div>
    </section>
  );
}

FeatureCarouselBlock.propTypes = {
  block: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
    sectionTitle: PropTypes.string.isRequired,
    sectionSubtitle: PropTypes.string,
    slides: PropTypes.arrayOf(
      PropTypes.shape({
        _key: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string,
        mediaType: PropTypes.oneOf(["image", "video"]).isRequired,
        image: PropTypes.object, // Should be SanityImageObject
        videoUrl: PropTypes.string,
        enablePopup: PropTypes.bool,
        popupContent: PropTypes.array, // Array of PortableTextBlock
      })
    ).isRequired,
  }).isRequired,
  productContext: PropTypes.object,
};
