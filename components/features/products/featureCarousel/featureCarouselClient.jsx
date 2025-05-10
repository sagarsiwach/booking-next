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

let LevaComponent = () => null;
let useControlsHook = (name, schema, options) => {
  const defaults = { showLevaControls: false }; // Default showLevaControls to false for production
  if (schema) {
    for (const key in schema) {
      if (key === "Layout" || key === "EmblaOptions" || key === "Performance") {
        defaults[key] = {};
        if (schema[key] && typeof schema[key] === "object") {
          for (const subKey in schema[key]) {
            if (
              typeof schema[key][subKey] === "object" &&
              "value" in schema[key][subKey]
            ) {
              defaults[key][subKey] = schema[key][subKey].value;
            }
          }
        }
      } else if (typeof schema[key] === "object" && "value" in schema[key]) {
        defaults[key] = schema[key].value;
      }
    }
  }
  // Explicitly set defaults for all expected controls based on EMBLA_DEFAULTS_PROD
  defaults.levaCardMaxWidth =
    schema?.Layout?.levaCardMaxWidth?.value ?? EMBLA_DEFAULTS_PROD.cardMaxWidth;
  defaults.levaSlideGap =
    schema?.Layout?.levaSlideGap?.value ?? EMBLA_DEFAULTS_PROD.slideGap;
  defaults.levaViewportPadding =
    schema?.Layout?.levaViewportPadding?.value ??
    EMBLA_DEFAULTS_PROD.viewportPadding; // Using single padding
  defaults.levaAlign =
    schema?.EmblaOptions?.levaAlign?.value ?? EMBLA_DEFAULTS_PROD.align;
  defaults.levaSlidesToScroll =
    schema?.EmblaOptions?.levaSlidesToScroll?.value ??
    EMBLA_DEFAULTS_PROD.slidesToScroll.toString();
  defaults.levaContainScroll =
    schema?.EmblaOptions?.levaContainScroll?.value ??
    (EMBLA_DEFAULTS_PROD.containScroll === null
      ? "null"
      : EMBLA_DEFAULTS_PROD.containScroll);
  defaults.levaImagePreloadMargin =
    schema?.Performance?.levaImagePreloadMargin?.value ??
    EMBLA_DEFAULTS_PROD.imagePreloadMargin;
  defaults.levaWheelPluginSpeed =
    schema?.Performance?.levaWheelPluginSpeed?.value ??
    EMBLA_DEFAULTS_PROD.wheelPluginSpeed;

  if (
    schema &&
    schema.showLevaControls &&
    typeof schema.showLevaControls.value === "boolean"
  ) {
    defaults.showLevaControls = schema.showLevaControls.value;
  }
  return defaults;
};
let folderHook = (schema, options) => schema;

if (process.env.NODE_ENV === "development") {
  try {
    const leva = require("leva");
    LevaComponent = leva.Leva;
    useControlsHook = leva.useControls;
    folderHook = leva.folder;
  } catch (error) {
    console.warn("Leva could not be loaded for FeatureCarouselClient.", error);
  }
}

import { cn } from "@/lib/utils";
import FeatureSlideItem from "./featureSlideItem";
import FeatureSlideDetailModal from "./featureSlideDetailModal";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Plus from "lucide-react/dist/esm/icons/plus";
import { Button } from "@/components/ui/button";

/** @typedef {import('./featureCarouselBlock').FeatureSlideDataSanity} SlideData */

function useModalState() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlideDataForModal, setSelectedSlideDataForModal] =
    useState(null);
  const openModalWithSlide = useCallback((slideData) => {
    if (slideData && slideData.enablePopup) {
      setSelectedSlideDataForModal(slideData);
      setIsModalOpen(true);
    }
  }, []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Consider delaying nullification for exit animations if modal content unmounts abruptly
    // setTimeout(() => setSelectedSlideDataForModal(null), 300); // Example
  }, []);
  return {
    isModalOpen,
    selectedSlideDataForModal,
    openModalWithSlide,
    closeModal,
  };
}

const EMBLA_DEFAULTS_PROD = {
  cardMaxWidth: 480,
  slideGap: 20,
  viewportPadding: 16, // Mobile default horizontal padding
  viewportPaddingDesktop: 64, // Desktop default horizontal padding
  align: "start",
  slidesToScroll: 1,
  containScroll: null,
  imagePreloadMargin: 250,
  wheelPluginSpeed: 1,
};

export default function FeatureCarouselClient({ slides, productContext }) {
  const levaSchema = {
    showLevaControls: {
      value: process.env.NODE_ENV === "development",
      label: "Show Dev Controls",
      transient: true,
    },
    Layout: folderHook(
      {
        levaCardMaxWidth: {
          value: EMBLA_DEFAULTS_PROD.cardMaxWidth,
          min: 200,
          max: 800,
          step: 10,
          label: "Card Max Width (px)",
        },
        levaSlideGap: {
          value: EMBLA_DEFAULTS_PROD.slideGap,
          min: 0,
          max: 80,
          step: 2,
          label: "Slide Gap (px)",
        },
        levaViewportPaddingMobile: {
          value: EMBLA_DEFAULTS_PROD.viewportPadding,
          min: 0,
          max: 100,
          step: 2,
          label: "VP H-Pad Mobile (px)",
        },
        levaViewportPaddingDesktop: {
          value: EMBLA_DEFAULTS_PROD.viewportPaddingDesktop,
          min: 0,
          max: 200,
          step: 4,
          label: "VP H-Pad Desktop (px)",
        },
      },
      { render: (get) => get("Feature Carousel UI.showLevaControls") === true }
    ),
    EmblaOptions: folderHook(
      {
        levaAlign: {
          value: EMBLA_DEFAULTS_PROD.align,
          options: ["start", "center", "end"],
          label: "Align",
        },
        levaSlidesToScroll: {
          value: EMBLA_DEFAULTS_PROD.slidesToScroll.toString(),
          options: ["1", "auto"],
          label: "Slides To Scroll (Buttons)",
        },
        levaContainScroll: {
          value:
            EMBLA_DEFAULTS_PROD.containScroll === null
              ? "null"
              : EMBLA_DEFAULTS_PROD.containScroll,
          options: ["null", "trimSnaps", "keepSnaps"],
          label: "Contain Scroll Behavior",
        },
      },
      { render: (get) => get("Feature Carousel UI.showLevaControls") === true }
    ),
    Performance: folderHook(
      {
        levaImagePreloadMargin: {
          value: EMBLA_DEFAULTS_PROD.imagePreloadMargin,
          min: 0,
          max: 1000,
          step: 50,
          label: "Image Preload Margin (px)",
        },
        levaWheelPluginSpeed: {
          value: EMBLA_DEFAULTS_PROD.wheelPluginSpeed,
          min: 0.1,
          max: 5,
          step: 0.1,
          label: "Wheel Plugin Speed",
        },
      },
      { render: (get) => get("Feature Carousel UI.showLevaControls") === true }
    ),
  };
  const levaPanelOptions = {
    collapsed: true,
    render: (get) => get("Feature Carousel UI.showLevaControls") === true,
  };
  const controls = useControlsHook(
    "Feature Carousel UI",
    levaSchema,
    levaPanelOptions
  );

  const cardMaxWidth = controls.levaCardMaxWidth;
  const slideGap = controls.levaSlideGap;
  const viewportPaddingMobile = controls.levaViewportPaddingMobile;
  const viewportPaddingDesktop = controls.levaViewportPaddingDesktop;
  const align = controls.levaAlign;
  const slidesToScroll = controls.levaSlidesToScroll;
  const containScroll = controls.levaContainScroll;
  const imagePreloadMargin = controls.levaImagePreloadMargin;
  const wheelPluginSpeed = controls.levaWheelPluginSpeed;
  const showLevaControls = controls.showLevaControls;

  const {
    isModalOpen,
    selectedSlideDataForModal,
    openModalWithSlide,
    closeModal,
  } = useModalState();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined")
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
  }, []);

  const emblaOptions = useMemo(
    () => ({
      align: align,
      slidesToScroll:
        slidesToScroll === "auto" ? "auto" : Number(slidesToScroll),
      containScroll: containScroll === "null" ? null : containScroll,
      loop: false,
      skipSnaps: false,
      watchDrag: true,
    }),
    [align, slidesToScroll, containScroll]
  );

  const emblaPlugins = useMemo(
    () =>
      isTouchDevice ? [] : [WheelGesturesPlugin({ speed: wheelPluginSpeed })],
    [isTouchDevice, wheelPluginSpeed]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions, emblaPlugins);
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
  // const [scrollSnaps, setScrollSnaps] = useState([]); // Not using dots, not strictly needed
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrevCb = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNextCb = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelectCallback = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelectCallback();
    // setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelectCallback);
    emblaApi.on("reInit", onSelectCallback);
    // const reInitScrollSnaps = () => setScrollSnaps(emblaApi.scrollSnapList());
    // emblaApi.on("reInit", reInitScrollSnaps);
    return () => {
      emblaApi.off("select", onSelectCallback);
      emblaApi.off("reInit", onSelectCallback);
      // emblaApi.off("reInit", reInitScrollSnaps);
    };
  }, [emblaApi, onSelectCallback]);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit(emblaOptions);
  }, [emblaApi, emblaOptions]);

  useEffect(() => {
    const viewportNode = viewportElementRef.current;
    if (!emblaApi || !viewportNode) return;
    const handleKeyDown = (event) => {
      if (
        !viewportNode.contains(document.activeElement) &&
        document.activeElement !== viewportNode
      )
        return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi.scrollNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi.scrollPrev();
      }
    };
    viewportNode.setAttribute("tabindex", "0");
    viewportNode.addEventListener("keydown", handleKeyDown);
    return () => viewportNode.removeEventListener("keydown", handleKeyDown);
  }, [emblaApi]);

  const halfGap = slideGap / 2;

  // Use Tailwind for responsive padding on the viewport div
  const viewportPaddingClasses = cn(
    `px-${viewportPaddingMobile / 4}`, // e.g., px-4 for 16px if Tailwind step is 4px
    `lg:px-${viewportPaddingDesktop / 4}` // e.g., lg:px-16 for 64px
  );

  const containerStyle = {
    marginLeft: `-${halfGap}px`,
    marginRight: `-${halfGap}px`,
    height: "100%",
  };

  return (
    <>
      {showLevaControls && (
        <LevaComponent
          collapsed={true}
          oneLineLabels
          titleBar={{ title: "Carousel (Client)", filter: false, drag: true }}
        />
      )}
      <div
        role="region"
        aria-label="Feature Carousel"
        className="relative h-full w-full flex flex-col"
      >
        <div
          className={cn(
            "embla overflow-hidden flex-grow",
            viewportPaddingClasses
          )}
          ref={setRefs}
          id="embla-viewport-feature-carousel"
        >
          <div className="embla__container flex h-full" style={containerStyle}>
            {slides.map((slide, index) => (
              <div
                className={cn(
                  "embla__slide relative shrink-0 grow-0 h-full rounded-xl overflow-hidden",
                  // Responsive slide basis:
                  "basis-[90vw] xs:basis-[85vw] sm:basis-[70vw] md:basis-[calc(50%-var(--slide-gap-calc,0px))] lg:basis-[calc(33.333%-var(--slide-gap-calc,0px))] xl:basis-[calc(25%-var(--slide-gap-calc,0px))]"
                )}
                key={slide._key || `slide-${index}`}
                style={{
                  paddingLeft: `${halfGap}px`,
                  paddingRight: `${halfGap}px`,
                  maxWidth: `${cardMaxWidth}px`,
                  // CSS variable for more accurate calc() in basis if needed, though Tailwind doesn't directly support this in basis utilities
                  "--slide-gap-calc": `${slideGap}px`,
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${slides.length}: ${
                  slide.title || "Feature"
                }`}
              >
                <FeatureSlideItem
                  slideData={slide}
                  isSnapped={index === selectedIndex}
                  scrollRootRef={viewportElementRef}
                  imagePreloadMargin={imagePreloadMargin}
                  cardWidth={cardMaxWidth}
                  onOpenPopup={() => openModalWithSlide(slide)}
                />
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && emblaApi && (
          <div
            className={cn(
              "absolute bottom-6 left-1/2 -translate-x-1/2 z-30",
              "flex items-center gap-3 sm:gap-4"
            )}
          >
            <Button
              variant="default"
              size="icon"
              className={cn(
                "pointer-events-auto h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg",
                "bg-black/50 hover:bg-black/60 active:bg-black/70 text-white backdrop-blur-sm", // Adjusted for more prominent look
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              onClick={scrollPrevCb}
              disabled={!canScrollPrev}
              aria-label="Previous feature"
              aria-controls="embla-viewport-feature-carousel"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className={cn(
                "pointer-events-auto h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg",
                "bg-black/50 hover:bg-black/60 active:bg-black/70 text-white backdrop-blur-sm",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
              onClick={scrollNextCb}
              disabled={!canScrollNext}
              aria-label="Next feature"
              aria-controls="embla-viewport-feature-carousel"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        )}
        {selectedSlideDataForModal && (
          <FeatureSlideDetailModal
            isOpen={isModalOpen}
            onClose={closeModal}
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
