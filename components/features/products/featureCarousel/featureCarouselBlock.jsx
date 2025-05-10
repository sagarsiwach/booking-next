// components/features/products/featureCarousel/featureCarouselBlock.jsx
import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import FeatureCarouselClient from "./featureCarouselClient"; // Adjusted path

/**
 * @typedef {object} ImageAsset
 * @property {string} [_id]
 * @property {string} url
 * @property {{dimensions?: {width: number, height: number, aspectRatio: number}, lqip?: string}} [metadata]
 */

/**
 * @typedef {object} SanityImage
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
 * // For images within portable text
 * @property {SanityImage} [asset]
 * @property {string} [alt]
 * @property {string} [caption]
 */

/**
 * @typedef {object} FeatureSlideData
 * @property {string} _key
 * @property {string} title
 * @property {string} [subtitle]
 * @property {'image' | 'video'} mediaType
 * @property {SanityImage} [image]
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
 * @property {Array<FeatureSlideData>} slides
 */

/**
 * Server component wrapper for the Feature Carousel.
 * @param {{ block: FeatureCarouselBlockProps, productContext?: object }} props
 * @returns {JSX.Element | null}
 */
export default function FeatureCarouselBlock({ block, productContext }) {
  const { sectionTitle, sectionSubtitle, slides } = block;

  if (!slides || slides.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `FeatureCarouselBlock (key: ${block._key}): No slides provided. Skipping render.`
      );
    }
    return null;
  }

  return (
    <section className="py-20 bg-background text-foreground lg:py-24 xl:py-32">
      <div className="mx-auto max-w-[1900px]">
        {(sectionTitle || sectionSubtitle) && (
          <div className="relative z-20 px-6 pb-10 text-center md:px-10 md:text-left xl:px-16">
            {sectionTitle && (
              <h2
                className="my-0 font-sans text-[clamp(28px,2.5vi+20px,48px)] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground"
                style={{ textWrap: "balance" }}
              >
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p
                className="mt-2 mb-0 font-sans text-[clamp(16px,1.2vi+12px,20px)] font-normal leading-[1.6] tracking-[-0.01em] text-muted-foreground md:max-w-[60ch]"
                style={{ textWrap: "pretty" }}
              >
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        <FeatureCarouselClient
          slides={slides}
          productContext={productContext}
          // Pass your desired layout values from the prompt
          cardWidth={480}
          gap={20}
          paddingStart={60}
          paddingEnd={60}
        />
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
        image: PropTypes.object,
        videoUrl: PropTypes.string,
        enablePopup: PropTypes.bool,
        popupContent: PropTypes.array,
      })
    ).isRequired,
  }).isRequired,
  productContext: PropTypes.object,
};
