// components/features/products/featureCarousel/featureSlideItem.jsx
"use client";

import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Add } from "@carbon/icons-react"; // Using Carbon Add icon for the "+"
import { Button } from "@/components/ui/button"; // <<<< IMPORT ADDED HERE

/**
 * @typedef {import('./featureCarouselClient').SlideData} SlideData
 */

/**
 * Renders an individual slide item for the Feature Carousel.
 * The slide has a fixed height (from track) and its width is determined by a 2/3 aspect ratio.
 *
 * @param {object} props - Component props.
 * @param {SlideData} props.slideData - Data for the slide.
 * @param {Function} props.onOpenPopup - Callback to open the popup modal.
 * @param {number} props.trackHeight - The height of the carousel track (e.g., 880px).
 * @returns {JSX.Element}
 */
const FeatureSlideItemComponent = ({ slideData, onOpenPopup, trackHeight }) => {
  const { title, subtitle, mediaType, image, videoUrl, enablePopup } =
    slideData;

  // Calculate width based on 2/3 aspect ratio (width/height) and the fixed trackHeight
  // Card aspect ratio is 2/3 (width/height), so width = height * (2/3)
  const slideCalculatedWidth = trackHeight * (2 / 3);

  const handleCardClick = () => {
    if (enablePopup && typeof onOpenPopup === "function") {
      onOpenPopup();
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (enablePopup && typeof onOpenPopup === "function") {
      onOpenPopup();
    }
  };

  return (
    <motion.div
      onClick={handleCardClick} // Whole card can be clickable if desired
      className={cn(
        "relative h-full font-geist",
        "bg-white dark:bg-neutral-800 rounded-[20px] overflow-hidden shadow-md",
        enablePopup ? "cursor-pointer" : "cursor-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-dark focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
      )}
      style={{ width: `${slideCalculatedWidth}px` }}
      role={enablePopup ? "button" : "group"}
      tabIndex={enablePopup ? 0 : -1}
      aria-label={title || subtitle || "Feature details"}
      whileHover={
        enablePopup
          ? {
              y: -3,
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              transition: { duration: 0.2, ease: "circOut" },
            }
          : {}
      }
    >
      {/* Image/Video takes up the entire card space */}
      <div className="absolute inset-0 w-full h-full">
        {mediaType === "image" && image?.asset?.url && (
          <Image
            src={image.asset.url}
            alt={image.alt || title || "Feature image"}
            fill
            className="object-cover"
            sizes={`${Math.round(slideCalculatedWidth)}px`} // Pass calculated width as hint
            priority // Prioritize all visible slides for this type of gallery
            blurDataURL={image.asset.metadata?.lqip}
            placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
            quality={85}
          />
        )}
        {mediaType === "video" && videoUrl && (
          <video
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={image?.asset?.url}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Text Content - Absolutely Positioned based on Figma */}
      {(title || subtitle) && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            width: "384px", // w-96
            left: "60px",
            top: "625px",
          }}
        >
          <div className="inline-flex flex-col justify-start items-start gap-5">
            {title && (
              <h3 className="self-stretch text-neutral-900 dark:text-white text-5xl font-semibold leading-tight tracking-[-.04em]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="self-stretch text-neutral-700 dark:text-neutral-300 text-3xl font-normal leading-relaxed tracking-[-.04em]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Plus button for modal - top right, 20px inset */}
      {enablePopup && (
        <Button
          variant="default"
          size="icon"
          onClick={handleButtonClick}
          className={cn(
            "absolute z-20 rounded-[50px] p-2.5 shadow-md", // p-2.5 is 10px
            "top-5 right-5", // 20px inset
            "bg-neutral-900 dark:bg-black hover:bg-neutral-800 dark:hover:bg-neutral-700 w-auto h-auto" // Dark button
          )}
          aria-label={`View details for ${title || "this feature"}`}
        >
          <div className="w-10 h-10 relative flex items-center justify-center">
            {/* Carbon Add icon usage */}
            <Add
              size={28}
              className="w-7 h-7 text-neutral-300 dark:text-neutral-400"
            />
          </div>
        </Button>
      )}
    </motion.div>
  );
};

FeatureSlideItemComponent.propTypes = {
  slideData: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    mediaType: PropTypes.oneOf(["image", "video"]).isRequired,
    image: PropTypes.shape({
      asset: PropTypes.shape({ url: PropTypes.string.isRequired }),
      alt: PropTypes.string,
      metadata: PropTypes.shape({ lqip: PropTypes.string }),
    }),
    videoUrl: PropTypes.string,
    enablePopup: PropTypes.bool,
  }).isRequired,
  onOpenPopup: PropTypes.func.isRequired,
  trackHeight: PropTypes.number.isRequired,
};

const FeatureSlideItem = React.memo(FeatureSlideItemComponent);
FeatureSlideItem.displayName = "FeatureSlideItem";

export default FeatureSlideItem;
