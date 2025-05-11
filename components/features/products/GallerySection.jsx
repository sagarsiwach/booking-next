// components/features/products/GallerySection.jsx
"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link"; // Keep for filmLink
import PropTypes from "prop-types";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"; // For trackpad scroll

import { Button } from "@/components/ui/button";
import {
  ChevronLeft, // For nav buttons
  ChevronRight, // For nav buttons
  PlayCircleIcon, // For filmLink
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {object} GalleryImageSanity
 * @property {string} _key
 * @property {{asset: {url: string, metadata?: {lqip?: string, dimensions?: {width: number, height: number}}}, alt: string, caption?: string}} image
 * @property {string} [headline] // Text overlay title for the slide (e.g., KM3000)
 * @property {string} [subheadline] // Text overlay subtitle (e.g., Exploring through Sahara)
 */

/**
 * @typedef {object} GalleryBlockSanity
 * @property {string} [_key]
 * @property {string} [_type]
 * @property {string} [sectionTitle] // e.g., Product Gallery
 * @property {string} [sectionSubtitle] // e.g., Subtitle for the Gallery
 * @property {GalleryImageSanity[]} images
 * @property {boolean} [autoplay] // Autoplay for the carousel
 * @property {number} [autoplayDelay]
 * @property {object} [filmLink] // Optional link, not in this specific layout but kept for schema consistency
 * @property {string} [filmLink.label]
 * @property {string} [filmLink.url]
 */

const AUTOPLAY_INTERVAL_DEFAULT = 5000;
const SLIDE_WIDTH_PX = 1351;
const SLIDE_HEIGHT_PX = 760;
const SLIDE_GAP_PX = 40; // gap-10

// --- Slide Item Component ---
const GallerySlide = ({ item, isSnapPoint }) => {
  // isSnapPoint can be used for subtle visual cues on the active slide if desired

  // Text overlay styling (approximating Figma specs)
  // w-96 left-[60px] top-[625px] absolute inline-flex flex-col ... gap-5
  // text-color-neutral-900 text-5xl font-semibold font-['Geist']
  // text-color-neutral-700 text-3xl font-normal font-['Geist']

  return (
    <div
      className={cn(
        "relative bg-white rounded-[20px] overflow-hidden",
        "flex-shrink-0" // Important for Embla
      )}
      style={{
        width: `${SLIDE_WIDTH_PX}px`,
        height: `${SLIDE_HEIGHT_PX}px`,
      }}
      role="group"
      aria-roledescription="slide"
      aria-label={item.image?.alt || item.headline || "Gallery image"}
    >
      {item.image?.asset?.url ? (
        <Image
          src={item.image.asset.url}
          alt={item.image.alt || item.headline || "Gallery image"}
          fill
          className="object-cover"
          sizes={`${SLIDE_WIDTH_PX}px`} // Give a hint to Next Image
          priority={isSnapPoint} // Prioritize loading active-ish slides
          placeholder={item.image.asset.metadata?.lqip ? "blur" : "empty"}
          blurDataURL={item.image.asset.metadata?.lqip}
          quality={85}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
          Image not available
        </div>
      )}

      {(item.headline || item.subheadline) && (
        <div
          className="absolute inline-flex flex-col justify-start items-start gap-5 pointer-events-none z-10"
          style={{
            width: "384px", // w-96
            left: "60px",
            top: "625px",
          }}
        >
          {item.headline && (
            <h3 className="self-stretch text-neutral-900 text-5xl font-semibold leading-tight">
              {" "}
              {/* Adjusted leading for 5xl */}
              {item.headline}
            </h3>
          )}
          {item.subheadline && (
            <p className="self-stretch text-neutral-700 text-3xl font-normal leading-relaxed">
              {item.subheadline}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

GallerySlide.propTypes = {
  item: PropTypes.object.isRequired,
  isSnapPoint: PropTypes.bool,
};

// --- Main Gallery Section ---
export default function GallerySection({ block }) {
  const {
    sectionTitle = "Product Gallery",
    sectionSubtitle = "Subtitle for the Gallery",
    images = [],
    autoplay: initialAutoplayProp = false,
    autoplayDelay: blockAutoplayDelay,
    filmLink, // Kept for schema consistency, though not in this specific layout example
  } = block || {};

  const resolvedAutoplayDelay =
    typeof blockAutoplayDelay === "number" && blockAutoplayDelay > 0
      ? blockAutoplayDelay
      : AUTOPLAY_INTERVAL_DEFAULT;

  const [emblaApi, setEmblaApi] = useState(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  // Current index and playing state are not directly used for UI here, but Embla handles it.

  const numImages = images.length;

  const plugins = useMemo(() => {
    const activePlugins = [WheelGesturesPlugin()];
    if (initialAutoplayProp && numImages > 1) {
      activePlugins.push(
        Autoplay({
          delay: resolvedAutoplayDelay,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
          playOnInit: true,
        })
      );
    }
    return activePlugins;
  }, [numImages, resolvedAutoplayDelay, initialAutoplayProp]);

  const [emblaRef] = useEmblaCarousel(
    {
      loop: numImages > 1,
      align: "start", // Start with the first item aligned to the viewport start
      containScroll: "trimSnaps",
      skipSnaps: false,
      slidesToScroll: 1,
      draggable: numImages > 1,
      // To achieve the initial -1329px offset shown in your Figma for the track,
      // if the first slide is 1351px wide and gap is 40px,
      // this means almost one full slide is off-screen to the left.
      // Embla's `startIndex` would be 0. The visual offset is a design choice.
      // The `left-[-1329px]` on the *track* implies the viewport is at the page edge (e.g. left-0)
      // and the track itself is shifted.
      // We can achieve this by styling the embla__container.
    },
    plugins
  );

  useEffect(() => {
    if (!emblaRef || typeof emblaRef === "function" || !emblaRef.current)
      return;
    // Assuming emblaRef from useEmblaCarousel is the viewport ref callback
    // The API might be available after a tick or via a second returned element
    // For now, this effect demonstrates how you might get the API
    // A more common pattern: const [emblaRef, emblaApiInstance] = useEmblaCarousel(...)
  }, [emblaRef]);

  const [emblaViewportRef, emblaApiInstanceFromHook] = useEmblaCarousel(
    {
      /* options as above */
    },
    plugins
  );

  useEffect(() => {
    if (emblaApiInstanceFromHook) {
      setEmblaApi(emblaApiInstanceFromHook);
    }
  }, [emblaApiInstanceFromHook]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect); // Handles resize/reinitialization
    onSelect(); // Initial check
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  if (!images || numImages === 0) {
    if (process.env.NODE_ENV === "development")
      console.warn("GallerySection: No images provided.");
    return null;
  }

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden font-geist",
        "bg-gray-100 dark:bg-neutral-900", // Mapped bg-color-neutral-100
        "h-[1000px]" // Fixed height from your layout
      )}
      aria-label={sectionTitle}
    >
      {/* Header */}
      <header
        className="absolute z-20 inline-flex flex-col justify-start items-start gap-6"
        style={{ top: "80px", left: "64px", width: "560px" }}
      >
        <h2 className="self-stretch text-neutral-900 dark:text-neutral-100 text-6xl font-semibold leading-tight">
          {sectionTitle}
        </h2>
        {sectionSubtitle && (
          <p className="self-stretch text-neutral-700 dark:text-neutral-300 text-3xl font-normal leading-relaxed">
            {sectionSubtitle}
          </p>
        )}
      </header>

      {/* Embla Carousel Viewport & Container */}
      {/* The viewport needs to allow the container to be offset */}
      <div
        className="embla absolute"
        style={{
          // The viewport itself can start at left:0, top:208px and span the full width needed for interaction
          // The visual clipping or positioning of this viewport determines how much is seen.
          // If the track (embla__container) has the negative left, the viewport should cover where the track will be.
          top: "208px",
          left: "0", // Viewport spans full width, track inside is offset
          right: "0", // Or a specific width if viewport is not full page width
          height: `${SLIDE_HEIGHT_PX}px`, // h-[760px]
          // overflow: "hidden", // Embla adds this to its viewport element
        }}
        ref={emblaViewportRef}
      >
        <div
          className="embla__container flex h-full items-stretch" // items-stretch for full height slides
          style={{
            gap: `${SLIDE_GAP_PX}px`, // gap-10
            // This is the critical part for the initial offset:
            // If your design tool shows the track at -1329px, but the *first meaningful slide*
            // should be centered or visible, Embla's `startIndex` or `align: 'center'`
            // combined with enough slides would achieve that.
            // A direct `marginLeft: '-1329px'` on the track with `align: 'start'` is another way.
            marginLeft: "-1329px", // Direct translation of Figma's track offset
          }}
        >
          {images.map((item, index) => (
            <div
              className="embla__slide" // Embla handles flex-shrink-0
              key={item._key || `gallery-slide-${index}`}
              // Width and height are now set on the GallerySlide component itself
            >
              <GallerySlide
                item={item}
                isSnapPoint={index === (emblaApi?.selectedScrollSnap() || 0)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      {numImages > 1 && (
        <div
          className="absolute z-30 inline-flex items-center p-2.5 bg-neutral-900 dark:bg-neutral-800 rounded-[70px] shadow-xl"
          style={{
            top: "858px",
            left: "875px", // This needs to be responsive or calculated for centering
            // transform: 'translateX(-50%)', // If 875px is the center point
          }}
          role="group"
          aria-label="Gallery image navigation"
        >
          <Button
            variant="ghost"
            size="icon"
            className="p-3.5 bg-white hover:bg-gray-200 text-neutral-900 rounded-[50px] w-auto h-auto" // Light button, dark icon
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous image"
          >
            {/* Custom SVG path for the icon if Lucide doesn't match */}
            {/* <div className="w-10 h-10 relative overflow-hidden">
                <div className="w-7 h-6 left-[5.33px] top-[8px] absolute bg-neutral-900" />
            </div> */}
            <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-neutral-900" />
          </Button>
          <div style={{ width: "10px" }}></div> {/* gap-2.5 */}
          <Button
            variant="ghost"
            size="icon"
            className="p-3.5 bg-white hover:bg-gray-200 text-neutral-900 rounded-[50px] w-auto h-auto"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next image"
          >
            <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-neutral-900" />
          </Button>
        </div>
      )}
    </section>
  );
}

GallerySection.propTypes = {
  block: PropTypes.shape({
    sectionTitle: PropTypes.string,
    sectionSubtitle: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.object).isRequired, // Use more specific GalleryImageSanity proptype if defined
    autoplay: PropTypes.bool,
    autoplayDelay: PropTypes.number,
    filmLink: PropTypes.shape({
      label: PropTypes.string,
      url: PropTypes.string,
    }),
  }).isRequired,
};
