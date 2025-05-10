// components/features/products/featureCarousel/FeatureCarouselLoader.jsx
"use client"; // This is crucial

import React from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Dynamically import FeatureCarouselClient with ssr: false
const FeatureCarouselClient = dynamic(
  () => import("./featureCarouselClient"), // Path to your actual client component
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-[1900px] overflow-hidden">
        <div className="relative z-20 px-6 pb-10 text-center md:px-10 md:text-left xl:px-16">
          <Skeleton className="h-12 w-1/2 mb-4 mx-auto md:mx-0 rounded-md" />
          <Skeleton className="h-6 w-3/4 md:max-w-[60ch] mx-auto md:mx-0 rounded-md" />
        </div>
        <div
          className="flex"
          style={{
            paddingLeft: "60px", // Corresponds to EMBLA_DEFAULTS.viewportPaddingStart
            paddingRight: "60px", // Corresponds to EMBLA_DEFAULTS.viewportPaddingEnd
          }}
        >
          {[...Array(3)].map(
            (
              _,
              i // Render 3 skeleton cards
            ) => (
              <div
                key={i}
                className="shrink-0 grow-0"
                style={{
                  flexBasis: "400px", // Corresponds to EMBLA_DEFAULTS.cardWidth
                  paddingLeft: `${20 / 2}px`, // Corresponds to EMBLA_DEFAULTS.slideGap / 2
                  paddingRight: `${20 / 2}px`,
                }}
              >
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              </div>
            )
          )}
        </div>
      </div>
    ),
  }
);

/**
 * @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData
 * @typedef {import('./featureCarouselBlock').FeatureCarouselBlockProps} FeatureCarouselBlockProps
 */

/**
 * A client component responsible for dynamically loading the main FeatureCarouselClient.
 * This acts as a boundary for client-side specific logic and imports.
 * @param {{ slides: FeatureSlideData[], productContext?: object }} props
 * @returns {JSX.Element}
 */
export default function FeatureCarouselLoader({ slides, productContext }) {
  // Simply renders the dynamically imported client component, passing props through.
  return (
    <FeatureCarouselClient slides={slides} productContext={productContext} />
  );
}

FeatureCarouselLoader.propTypes = {
  slides: PropTypes.arrayOf(PropTypes.object).isRequired,
  productContext: PropTypes.object,
};
