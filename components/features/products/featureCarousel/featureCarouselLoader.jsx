// components/features/products/featureCarousel/FeatureCarouselLoader.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import { Skeleton } from "@/components/ui/skeleton";

// These should align with EMBLA_DEFAULTS_PROD in FeatureCarouselClient.jsx for consistency
const SKELETON_CARD_WIDTH = 480;
const SKELETON_SLIDE_GAP = 20;
const SKELETON_VIEWPORT_PADDING_START = 16;
const SKELETON_VIEWPORT_PADDING_END = 16;

const FeatureCarouselClient = dynamic(() => import("./featureCarouselClient"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-full w-full h-full px-0 flex flex-col flex-grow overflow-hidden">
      <div className="relative z-20 px-6 pt-10 pb-6 sm:pt-12 sm:pb-8 md:px-10 xl:px-16 text-left shrink-0">
        <Skeleton className="h-10 sm:h-12 w-1/2 mb-3 sm:mb-4 rounded-md" />
        <Skeleton className="h-5 sm:h-6 w-3/4 md:max-w-[60ch] rounded-md" />
      </div>
      <div
        className="flex flex-grow min-h-0 items-stretch"
        style={{
          paddingLeft: `${SKELETON_VIEWPORT_PADDING_START}px`,
          paddingRight: `${SKELETON_VIEWPORT_PADDING_END}px`,
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shrink-0 grow-0 h-full"
            style={{
              flexBasis: `${SKELETON_CARD_WIDTH}px`,
              minWidth: `${SKELETON_CARD_WIDTH}px`,
              paddingLeft: `${SKELETON_SLIDE_GAP / 2}px`,
              paddingRight: `${SKELETON_SLIDE_GAP / 2}px`,
            }}
          >
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  ),
});

/** @typedef {import('./featureCarouselClient').SlideData} SlideData */
// Assuming SlideData type definition from featureCarouselClient.jsx is desired here.
// If FeatureSlideDataSanity from featureCarouselBlock.jsx is the source type for slides,
// then that typedef might be more appropriate if FeatureCarouselClient expects that structure.
// For now, assuming SlideData is a compatible or identical structure.

export default function FeatureCarouselLoader({ slides, productContext }) {
  return (
    <FeatureCarouselClient slides={slides} productContext={productContext} />
  );
}

FeatureCarouselLoader.propTypes = {
  slides: PropTypes.arrayOf(PropTypes.object).isRequired,
  productContext: PropTypes.object,
};
