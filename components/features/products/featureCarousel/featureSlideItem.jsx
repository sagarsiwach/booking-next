// components/features/products/featureCarousel/featureSlideItem.jsx
"use client";

import React, { useState, useEffect, useRef } from "react"; // Added useState, useEffect, useRef
import PropTypes from "prop-types";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData */

export default function FeatureSlideItem({
  slideData,
  isSnapped,
  // isNearby prop is no longer needed with IntersectionObserver
  onOpenPopup,
  plusIcon,
  // We might need the carousel's scroll container ref if default viewport doesn't work
  // carouselRootRef
}) {
  const { title, subtitle, mediaType, image, videoUrl, enablePopup } =
    slideData;
  const itemRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target); // Important: stop observing once in view
          observer.disconnect(); // Optional: fully disconnect if only one target per observer
        }
      },
      {
        root: null, // Defaults to browser viewport. Pass carouselRootRef.current if needed.
        rootMargin: "0px 0px 100px 0px", // Preload images that are 100px below the viewport
        threshold: 0.01, // Trigger when even 1% of the item is visible
      }
    );

    const currentItemRef = itemRef.current;
    if (currentItemRef) {
      observer.observe(currentItemRef);
    }

    return () => {
      if (currentItemRef) {
        observer.unobserve(currentItemRef);
      }
      observer.disconnect();
    };
  }, []); // Run only once on mount

  const shouldLoadWithPriority = isSnapped || isInView;

  return (
    <button
      ref={itemRef} // Attach ref here
      type="button"
      onClick={enablePopup ? onOpenPopup : undefined}
      disabled={mediaType === "video" && !enablePopup}
      className={cn(
        "group relative block w-full aspect-[2/3] transition-all duration-300 ease-out-expo",
        "rounded-xl overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enablePopup ? "cursor-pointer" : "cursor-default"
      )}
      data-snapped={isSnapped}
      aria-label={title || "View feature details"}
    >
      <div className="absolute inset-0 -z-10 bg-muted">
        {mediaType === "image" && image?.asset?.url && (
          <Image
            src={image.asset.url}
            alt={image.alt || title || ""}
            fill
            className={cn(
              "object-cover transition-transform duration-300 ease-out-expo",
              "group-hover:scale-[1.03] group-focus-visible:scale-[1.03] group-data-[snapped=true]:scale-[1.05]"
            )}
            sizes="(max-width: 640px) 90vw, (max-width: 768px) 60vw, (max-width: 1280px) 480px, 480px"
            priority={shouldLoadWithPriority} // Use combined state for priority
            blurDataURL={image.asset.metadata?.lqip}
            placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
          />
        )}
        {mediaType === "video" && videoUrl && (
          <video
            src={videoUrl}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 ease-out-expo",
              "group-hover:scale-[1.03] group-focus-visible:scale-[1.03] group-data-[snapped=true]:scale-[1.05]"
            )}
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-80 group-hover:opacity-90 group-data-[snapped=true]:opacity-95 transition-opacity duration-300" />

      <div
        className={cn(
          "absolute inset-0 rounded-xl shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)] opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100 group-data-[snapped=true]:opacity-100"
        )}
      />

      <div
        className={cn(
          "relative z-10 flex h-full flex-col justify-end p-5 pb-8 text-white transition-transform duration-300 ease-out-expo md:p-6 md:pb-10",
          "group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-data-[snapped=true]:-translate-y-1.5"
        )}
      >
        {title && (
          <h3
            className="font-sans text-[clamp(18px,1.8vi+15px,26px)] font-semibold leading-[1.2] tracking-tight text-shadow-sm"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-1 font-sans text-[clamp(13px,1vi+10px,15px)] font-normal leading-snug text-neutral-200/90 text-shadow-xs">
            {subtitle}
          </p>
        )}
      </div>

      {enablePopup && plusIcon && (
        <div
          className={cn(
            "absolute right-4 top-4 grid aspect-square w-9 h-9 place-items-center rounded-full bg-white/25 dark:bg-black/25 text-white dark:text-neutral-100 opacity-0 transition-all duration-300 ease-out-expo backdrop-blur-sm",
            "group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-100 group-data-[snapped=true]:-translate-y-0.5 group-data-[snapped=true]:opacity-100"
          )}
        >
          {React.cloneElement(plusIcon, {
            className: cn(plusIcon.props.className, "w-5 h-5"),
          })}
        </div>
      )}
    </button>
  );
}

FeatureSlideItem.propTypes = {
  slideData: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    mediaType: PropTypes.oneOf(["image", "video"]).isRequired,
    image: PropTypes.object,
    videoUrl: PropTypes.string,
    enablePopup: PropTypes.bool,
  }).isRequired,
  isSnapped: PropTypes.bool.isRequired,
  // isNearby: PropTypes.bool.isRequired, // Removed
  onOpenPopup: PropTypes.func.isRequired,
  plusIcon: PropTypes.element.isRequired,
  // carouselRootRef: PropTypes.object, // Optional: if you need to pass the carousel's scroll root
};
