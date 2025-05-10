// components/features/products/featureCarousel/featureSlideItem.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Plus from "lucide-react/dist/esm/icons/plus";

/** @typedef {import('./featureCarouselBlock').FeatureSlideDataSanity} SlideData */

const FALLBACK_CARD_WIDTH_FOR_SIZES = 480;

const FeatureSlideItemComponent = ({
  slideData,
  isSnapped,
  onOpenPopup,
  plusIcon = <Plus size={24} className="stroke-current" />, // Default Icon
  scrollRootRef,
  imagePreloadMargin = 250,
  cardWidth,
}) => {
  const { title, subtitle, mediaType, image, videoUrl, enablePopup } =
    slideData;

  const itemRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !itemRef.current) return;
    const currentItemRef = itemRef.current;
    const rootElement = scrollRootRef?.current || null;
    if (scrollRootRef && !scrollRootRef.current) {
      /* console.warn("Observer uses viewport"); */
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (currentItemRef) observer.unobserve(currentItemRef);
        }
      },
      {
        root: rootElement,
        rootMargin: `0px ${imagePreloadMargin}px 0px ${imagePreloadMargin}px`,
        threshold: 0.01,
      }
    );
    observer.observe(currentItemRef);
    return () => {
      if (currentItemRef) observer.unobserve(currentItemRef);
      observer.disconnect();
    };
  }, [scrollRootRef, imagePreloadMargin]);

  const shouldLoadWithPriority = isSnapped || isInView;
  const handleClick = () => {
    if (enablePopup && typeof onOpenPopup === "function") {
      onOpenPopup();
    }
  };
  const imageSizes = `(max-width: 640px) 90vw, (max-width: 1024px) 50vw, ${
    cardWidth || FALLBACK_CARD_WIDTH_FOR_SIZES
  }px`;

  return (
    <motion.button
      layout
      ref={itemRef}
      type="button"
      onClick={handleClick}
      disabled={!enablePopup || (mediaType === "video" && !enablePopup)}
      className={cn(
        "group relative block w-full h-full",
        "rounded-xl",
        "shadow-lg hover:shadow-2xl focus-visible:shadow-2xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enablePopup ? "cursor-pointer" : "cursor-default"
      )}
      data-snapped={isSnapped ? "true" : "false"}
      aria-label={title || "View feature details"}
      whileHover={{ scale: 1.02 }}
      animate={{ scale: isSnapped ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.7 }}
    >
      {/* This div takes full height/width of button, and its children are positioned within it */}
      <div className="relative w-full h-full rounded-xl overflow-hidden flex flex-col">
        {/* Media container - this div will enforce the 2/3 aspect ratio */}
        <div className="relative w-full aspect-[2/3] bg-muted shrink-0 overflow-hidden rounded-t-xl md:rounded-xl">
          {" "}
          {/* Apply aspect here, rounded top or full if no text below */}
          {mediaType === "image" && image?.asset?.url && (
            <Image
              src={image.asset.url}
              alt={image.alt || title || ""}
              fill
              className="object-cover w-full h-full"
              sizes={imageSizes}
              priority={shouldLoadWithPriority}
              blurDataURL={image.asset.metadata?.lqip}
              placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
              quality={80}
            />
          )}
          {mediaType === "video" && videoUrl && (
            <video
              src={videoUrl}
              className="object-cover w-full h-full"
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

        {/* Gradient overlay for text on top of media */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-100 group-hover:opacity-90 group-data-[snapped=true]:opacity-95 transition-opacity duration-300 pointer-events-none" />

        {isSnapped && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-primary/50 dark:ring-primary/70 ring-offset-1 dark:ring-offset-black ring-offset-white transition-all duration-300 pointer-events-none" />
        )}

        {/* Text content - positioned at the bottom of the entire card */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-10 flex flex-col justify-end p-4 pb-5 sm:p-5 sm:pb-6 text-white" // Consistent padding
            // translateY can be removed if scale animation is enough
            // isSnapped ? "-translate-y-1" : "translate-y-0 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5"
          )}
        >
          {title && (
            <h3
              className="font-sans text-[clamp(15px,1.6vi+12px,22px)] sm:text-[clamp(16px,1.7vi+13px,24px)] font-semibold leading-[1.25] tracking-tight text-shadow-sm"
              style={{ textWrap: "balance" }}
            >
              {" "}
              {title}{" "}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 sm:mt-1 font-sans text-[clamp(11px,0.8vi+8px,13px)] sm:text-[clamp(12px,0.9vi+9px,14px)] font-normal leading-snug text-neutral-200/90 text-shadow-xs">
              {" "}
              {subtitle}{" "}
            </p>
          )}
        </div>

        {enablePopup && plusIcon && (
          <motion.div
            className={cn(
              "absolute right-3 top-3 sm:right-4 sm:top-4 grid aspect-square w-8 h-8 sm:w-9 sm:h-9 place-items-center rounded-full bg-white/20 dark:bg-black/20 text-white dark:text-neutral-100 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-black/30"
            )}
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{
              opacity:
                isSnapped ||
                (itemRef.current &&
                  itemRef.current.matches(":hover, :focus-within"))
                  ? 1
                  : 0,
              y:
                isSnapped ||
                (itemRef.current &&
                  itemRef.current.matches(":hover, :focus-within"))
                  ? -1
                  : 5,
              scale:
                isSnapped ||
                (itemRef.current &&
                  itemRef.current.matches(":hover, :focus-within"))
                  ? 1
                  : 0.8,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {React.isValidElement(plusIcon)
              ? React.cloneElement(plusIcon, {
                  className: cn(
                    plusIcon.props.className,
                    "w-4 h-4 sm:w-5 sm:h-5"
                  ),
                })
              : null}
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

const FeatureSlideItem = React.memo(FeatureSlideItemComponent);
FeatureSlideItem.displayName = "FeatureSlideItem";

FeatureSlideItem.propTypes = {
  slideData: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    mediaType: PropTypes.oneOf(["image", "video"]).isRequired,
    image: PropTypes.object,
    videoUrl: PropTypes.string,
    enablePopup: PropTypes.bool,
    popupContent: PropTypes.array,
  }).isRequired,
  isSnapped: PropTypes.bool.isRequired,
  onOpenPopup: PropTypes.func.isRequired,
  plusIcon: PropTypes.element,
  scrollRootRef: PropTypes.shape({ current: PropTypes.object }),
  imagePreloadMargin: PropTypes.number,
  cardWidth: PropTypes.number,
};

export default FeatureSlideItem;
