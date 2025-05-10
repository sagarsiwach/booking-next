// components/features/products/featureCarousel/featureCarouselClient.jsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { Leva, useControls, folder } from "leva";
import { cn } from "@/lib/utils";
import FeatureSlideItem from "./featureSlideItem";
import FeatureSlideDetailModal from "./featureSlideDetailModal";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData */

// Defaults based on your last request/screenshot
const EMBLA_DEFAULTS = {
  cardWidth: 480,
  slideGap: 20,
  viewportPaddingStart: 60,
  viewportPaddingEnd: 60,
  align: "start",
  slidesToScroll: 1,
  containScroll: null,
  imagePreloadMargin: 250,
  wheelPluginSpeed: 1,
};

export default function FeatureCarouselClient({ slides, productContext }) {
  const {
    showLevaControls,
    levaCardWidth,
    levaSlideGap,
    levaViewportPaddingStart,
    levaViewportPaddingEnd,
    levaAlign,
    levaSlidesToScroll,
    levaContainScroll,
    levaImagePreloadMargin,
    levaWheelPluginSpeed,
  } = useControls(
    "Feature Carousel UI",
    {
      showLevaControls: {
        value: process.env.NODE_ENV === "development",
        label: "Show Dev Controls",
      },
      Layout: folder(
        {
          levaCardWidth: {
            value: EMBLA_DEFAULTS.cardWidth,
            min: 200,
            max: 800,
            step: 10,
            label: "Card Width (px)",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
          levaSlideGap: {
            value: EMBLA_DEFAULTS.slideGap,
            min: 0,
            max: 80,
            step: 2,
            label: "Slide Gap (px)",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
          levaViewportPaddingStart: {
            value: EMBLA_DEFAULTS.viewportPaddingStart,
            min: 0,
            max: 200,
            step: 5,
            label: "Viewport Padding Start (px)",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
          levaViewportPaddingEnd: {
            value: EMBLA_DEFAULTS.viewportPaddingEnd,
            min: 0,
            max: 200,
            step: 5,
            label: "Viewport Padding End (px)",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
        },
        { render: (get) => get("Feature Carousel UI.showLevaControls") }
      ),
      EmblaOptions: folder(
        {
          levaAlign: {
            value: EMBLA_DEFAULTS.align,
            options: ["start", "center", "end"],
            label: "Align",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
          levaSlidesToScroll: {
            value: EMBLA_DEFAULTS.slidesToScroll.toString(),
            options: ["1", "auto"],
            label: "Slides To Scroll (Buttons)",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
          levaContainScroll: {
            value:
              EMBLA_DEFAULTS.containScroll === null
                ? "null"
                : EMBLA_DEFAULTS.containScroll,
            options: ["null", "trimSnaps", "keepSnaps"],
            label: "Contain Scroll Behavior",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
        },
        { render: (get) => get("Feature Carousel UI.showLevaControls") }
      ),
      Performance: folder(
        {
          levaImagePreloadMargin: {
            value: EMBLA_DEFAULTS.imagePreloadMargin,
            min: 0,
            max: 1000,
            step: 50,
            label: "Image Preload Margin (px)",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
          levaWheelPluginSpeed: {
            value: EMBLA_DEFAULTS.wheelPluginSpeed,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: "Wheel Plugin Speed",
            render: (get) => get("Feature Carousel UI.showLevaControls"),
          },
        },
        { render: (get) => get("Feature Carousel UI.showLevaControls") }
      ),
    },
    {
      collapsed: process.env.NODE_ENV === "production",
    }
  );

  const emblaOptions = useMemo(
    () => ({
      align: levaAlign,
      slidesToScroll:
        levaSlidesToScroll === "auto" ? "auto" : Number(levaSlidesToScroll),
      containScroll: levaContainScroll === "null" ? null : levaContainScroll,
      loop: false,
      skipSnaps: false,
      watchDrag: true,
    }),
    [levaAlign, levaSlidesToScroll, levaContainScroll]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions, [
    WheelGesturesPlugin({ speed: levaWheelPluginSpeed }),
  ]);

  const viewportElementRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      if (typeof emblaRef === "function") emblaRef(node);
      else if (emblaRef) emblaRef.current = node;
      viewportElementRef.current = node;
    },
    [emblaRef]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlideDataForModal, setSelectedSlideDataForModal] =
    useState(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const onSelectCallback = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelectCallback();
    setScrollSnaps(emblaApi.scrollSnapList());

    emblaApi.on("select", onSelectCallback);
    emblaApi.on("reInit", onSelectCallback);
    const reInitScrollSnaps = () => setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("reInit", reInitScrollSnaps);

    return () => {
      emblaApi.off("select", onSelectCallback);
      emblaApi.off("reInit", onSelectCallback);
      emblaApi.off("reInit", reInitScrollSnaps);
    };
  }, [emblaApi, onSelectCallback]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit(emblaOptions);
    }
  }, [emblaApi, emblaOptions]);

  const openModalWithSlide = useCallback((slideData) => {
    if (slideData && slideData.enablePopup) {
      setSelectedSlideDataForModal(slideData);
      setIsModalOpen(true);
    }
  }, []);

  const halfGap = levaSlideGap / 2;
  const viewportStyle = {
    paddingLeft: `${levaViewportPaddingStart}px`,
    paddingRight: `${levaViewportPaddingEnd}px`,
  };
  const containerStyle = {
    marginLeft: `-${halfGap}px`, // Counteract first item's left padding
    marginRight: `-${halfGap}px`, // Counteract last item's right padding
  };

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <Leva
          hidden={!showLevaControls}
          titleBar={{ title: "Carousel Config", filter: false, drag: true }}
          collapsed={true}
          oneLineLabels
        />
      )}
      <div className="relative mx-auto max-w-[1900px] group/carousel">
        {/* Edge Fades for visual indication of more content */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-l from-transparent to-background content-[''] opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 md:w-12 lg:w-16 xl:w-24" />

        <div
          className="embla overflow-hidden"
          ref={setRefs}
          style={viewportStyle}
        >
          <div className="embla__container flex" style={containerStyle}>
            {slides.map((slide, index) => (
              <div
                className="embla__slide relative shrink-0 grow-0"
                key={slide._key || `slide-${index}`}
                style={{
                  flex: `0 0 ${levaCardWidth}px`,
                  minWidth: `${levaCardWidth}px`,
                  paddingLeft: `${halfGap}px`,
                  paddingRight: `${halfGap}px`,
                }}
              >
                <FeatureSlideItem
                  slideData={slide}
                  isSnapped={index === selectedIndex}
                  scrollRootRef={viewportElementRef}
                  imagePreloadMargin={levaImagePreloadMargin}
                  onOpenPopup={() => openModalWithSlide(slide)}
                  plusIcon={<Plus size={24} className="stroke-current" />}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-r from-transparent to-background content-[''] opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 md:w-12 lg:w-16 xl:w-24" />

        {/* Navigation Controls - Styled to be similar to Rivian example */}
        {slides.length > 1 && (
          <div
            className={cn(
              // Common styles
              "relative flex items-center justify-center pointer-events-none", // Parent is pointer-none, children are auto
              "mt-8 md:mt-10 lg:mt-12", // Spacing from carousel
              // Desktop specific styles for the "bar"
              "lg:pointer-events-auto lg:mx-auto lg:w-min lg:p-1.5 lg:rounded-xl",
              "lg:bg-card/80 lg:dark:bg-neutral-800/80 lg:shadow-lg lg:backdrop-blur-sm"
            )}
          >
            <Button
              variant="outline" // Or your "inverted primary" equivalent
              size="icon"
              className={cn(
                "pointer-events-auto mx-1 lg:mx-0", // Ensure buttons are interactive
                "h-10 w-10 rounded-full",
                "bg-background/70 hover:bg-muted dark:bg-neutral-700/70 dark:hover:bg-neutral-600", // Example colors
                "border-border dark:border-neutral-600",
                "text-foreground dark:text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "hidden lg:inline-flex" // Only show on large screens as per example
              )}
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous feature"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots container */}
            <div className="flex items-center justify-center gap-2 pointer-events-auto px-2">
              {scrollSnaps.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to feature ${index + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 ease-out",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    index === selectedIndex
                      ? "w-6 sm:w-8 bg-primary dark:bg-primary" // Active dot
                      : "w-2 bg-muted hover:bg-muted-foreground/50 dark:bg-neutral-600 dark:hover:bg-neutral-500" // Inactive dot
                  )}
                  data-active-slide={index === selectedIndex} // For potential data-driven styling
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className={cn(
                "pointer-events-auto mx-1 lg:mx-0",
                "h-10 w-10 rounded-full",
                "bg-background/70 hover:bg-muted dark:bg-neutral-700/70 dark:hover:bg-neutral-600",
                "border-border dark:border-neutral-600",
                "text-foreground dark:text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "hidden lg:inline-flex"
              )}
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next feature"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {selectedSlideDataForModal && (
          <FeatureSlideDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            slideData={selectedSlideDataForModal}
          />
        )}
      </div>
    </>
  );
}

FeatureCarouselClient.propTypes = {
  slides: PropTypes.arrayOf(PropTypes.object).isRequired,
  productContext: PropTypes.object,
};
