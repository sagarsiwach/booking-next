// components/features/products/featureCarousel/featureSlideItem.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

/** @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData */

const EMBLA_DEFAULTS = {
  cardWidth: 400, // Used for fallback in 'sizes' prop of Image
};

export default function FeatureSlideItem({
  slideData,
  isSnapped,
  onOpenPopup,
  plusIcon = <Plus size={24} className="stroke-current" />,
  scrollRootRef,
  imagePreloadMargin = 200,
}) {
  const { title, subtitle, mediaType, image, videoUrl, enablePopup } =
    slideData;

  const itemRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !itemRef.current) {
      return;
    }

    const currentItemRef = itemRef.current;
    // If scrollRootRef.current is not available, observer will use browser viewport by default.
    const rootElement = scrollRootRef?.current || null;

    if (scrollRootRef && !scrollRootRef.current) {
      // console.warn("FeatureSlideItem: scrollRootRef.current not available for IntersectionObserver. Observer will use viewport.");
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
      if (currentItemRef) {
        observer.unobserve(currentItemRef);
      }
      observer.disconnect();
    };
  }, [scrollRootRef, imagePreloadMargin]);

  const shouldLoadWithPriority = isSnapped || isInView;

  const handleClick = () => {
    // console.log("[FeatureSlideItem] Clicked. Slide Title:", slideData?.title, "EnablePopup:", enablePopup, "onOpenPopup type:", typeof onOpenPopup);
    if (enablePopup && typeof onOpenPopup === "function") {
      onOpenPopup();
    }
  };

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={handleClick}
      disabled={!enablePopup || (mediaType === "video" && !enablePopup)}
      className={cn(
        "group relative block w-full aspect-[2/3] transition-all duration-300 ease-out-expo",
        "rounded-xl overflow-hidden shadow-lg hover:shadow-2xl focus-visible:shadow-2xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        enablePopup ? "cursor-pointer" : "cursor-default"
      )}
      data-snapped={isSnapped ? "true" : "false"}
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
              "group-hover:scale-[1.03] group-focus-visible:scale-[1.03]",
              isSnapped ? "scale-[1.05]" : "scale-100"
            )}
            sizes={`(max-width: 640px) 90vw, (max-width: 1024px) 50vw, ${EMBLA_DEFAULTS.cardWidth}px`}
            priority={shouldLoadWithPriority}
            blurDataURL={image.asset.metadata?.lqip}
            placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
            quality={80}
          />
        )}
        {mediaType === "video" && videoUrl && (
          <video
            src={videoUrl}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 ease-out-expo",
              "group-hover:scale-[1.03] group-focus-visible:scale-[1.03]",
              isSnapped ? "scale-[1.05]" : "scale-100"
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

      {isSnapped && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-primary/70 ring-offset-2 ring-offset-transparent transition-all duration-300 pointer-events-none" />
      )}

      <div
        className={cn(
          "relative z-10 flex h-full flex-col justify-end p-5 pb-8 text-white transition-transform duration-300 ease-out-expo md:p-6 md:pb-10",
          "group-hover:-translate-y-1 group-focus-visible:-translate-y-1",
          isSnapped ? "-translate-y-1.5" : "translate-y-0"
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
            "group-hover:opacity-100 group-focus-visible:opacity-100",
            isSnapped
              ? "opacity-100 -translate-y-0.5"
              : "group-hover:-translate-y-0.5"
          )}
        >
          {React.isValidElement(plusIcon)
            ? React.cloneElement(plusIcon, {
                className: cn(plusIcon.props.className, "w-5 h-5"),
              })
            : null}
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
  onOpenPopup: PropTypes.func.isRequired,
  plusIcon: PropTypes.element,
  scrollRootRef: PropTypes.shape({ current: PropTypes.object }),
  imagePreloadMargin: PropTypes.number,
};
