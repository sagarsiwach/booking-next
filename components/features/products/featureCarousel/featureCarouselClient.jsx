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
import Autoplay from "embla-carousel-autoplay";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import FeatureSlideItem from "./featureSlideItem";
import FeatureSlideDetailModal from "./featureSlideDetailModal";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Standard chevrons
import { Button } from "@/components/ui/button";

const AUTOPLAY_DEFAULT_DELAY = 5000;
const SLIDE_GAP_PX = 20; // 1.25rem or gap-5

/**
 * @typedef {import('./featureCarouselBlock').SlideData} SlideData
 */

export default function FeatureCarouselClient({
  slides,
  productContext,
  autoplayConfig,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlideDataForModal, setSelectedSlideDataForModal] =
    useState(null);

  const openModalWithSlide = useCallback((slideData) => {
    if (slideData && slideData.enablePopup) {
      // Make sure modal only opens if enabled
      setSelectedSlideDataForModal(slideData);
      setIsModalOpen(true);
    }
  }, []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const resolvedAutoplayDelay = autoplayConfig?.delay || AUTOPLAY_DEFAULT_DELAY;
  const initialAutoplayEnabled = autoplayConfig?.enabled && slides.length > 1;

  const plugins = useMemo(() => {
    const activePlugins = [WheelGesturesPlugin({ forceWheelAxis: "x" })];
    if (initialAutoplayEnabled) {
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
  }, [initialAutoplayEnabled, resolvedAutoplayDelay]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: slides.length > 2, // Loop if more than 2 slides for better peeking experience
      align: "start", // Start align, peeking achieved by viewport padding/slide widths
      containScroll: "trimSnaps",
      slidesToScroll: 1,
      skipSnaps: false,
      draggable: slides.length > 1,
    },
    plugins
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); // For dots

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index) => {
      // For dots
      if (emblaApi) {
        emblaApi.scrollTo(index);
        const autoplay = emblaApi.plugins()?.autoplay;
        if (autoplay?.isPlaying()) {
          autoplay.stop();
        }
      }
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onUpdateControls = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onUpdateControls);
    emblaApi.on("reInit", onUpdateControls);
    emblaApi.on("scroll", onUpdateControls);
    onUpdateControls();

    return () => {
      emblaApi.off("select", onUpdateControls);
      emblaApi.off("reInit", onUpdateControls);
      emblaApi.off("scroll", onUpdateControls);
    };
  }, [emblaApi]);

  return (
    <>
      <div
        className="embla w-full h-full relative flex flex-col items-center"
        role="region"
        aria-label="Feature Highlights"
      >
        {/* Viewport takes available height from parent (flex-grow in Block component) */}
        <div
          className="embla__viewport w-full h-full overflow-hidden"
          ref={emblaRef}
        >
          <div
            className="embla__container flex h-full items-stretch"
            style={{
              // Padding on the container to create the peeking effect from the edges
              // This padding should roughly be (ViewportWidth - SlideWidth - GapsForVisibleSlides) / 2
              // For simplicity and to match Apple's typical full-bleed start:
              paddingLeft: `calc((100% - (var(--slide-width-basis, 300px) + ${SLIDE_GAP_PX}px)) / 2 + ${
                SLIDE_GAP_PX / 2
              }px)`,
              paddingRight: `calc((100% - (var(--slide-width-basis, 300px) + ${SLIDE_GAP_PX}px)) / 2 + ${
                SLIDE_GAP_PX / 2
              }px)`,
              // Or more simply, if slides are percentage based:
              // paddingLeft: 'calc(var(--peek-amount, 10%))',
              // paddingRight: 'calc(var(--peek-amount, 10%))',
            }}
          >
            {slides.map((slide, index) => (
              <div
                className={cn(
                  "embla__slide relative flex-shrink-0",
                  index > 0 ? `ml-[${SLIDE_GAP_PX}px]` : ""
                )}
                key={slide._key || `slide-${index}`}
                // Slide width will be controlled by FeatureSlideItem's aspect ratio and track height
                // Or define a flex-basis here for peeking effect
                style={{
                  flex: "0 0 auto", // Let content define width initially
                }}
              >
                <FeatureSlideItem
                  slideData={slide}
                  isSnapped={index === currentIndex}
                  onOpenPopup={openModalWithSlide}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom Navigation Controls (as per new Figma screenshot) */}
        {slides.length > 1 && (
          <div
            className="mt-8 md:mt-12 z-30 inline-flex items-center p-2.5 bg-white dark:bg-neutral-100 rounded-[70px] shadow-xl"
            role="group"
            aria-label="Gallery navigation"
          >
            <Button
              variant="ghost"
              size="icon"
              className="p-3.5 bg-neutral-700 dark:bg-neutral-800 hover:bg-neutral-600 dark:hover:bg-neutral-700 rounded-[50px] w-auto h-auto group"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous slide"
            >
              <div className="w-10 h-10 relative overflow-hidden transform scale-x-[-1]">
                <div className="w-7 h-6 left-[calc(50%-14px)] top-[calc(50%-12px)] absolute bg-white dark:bg-neutral-200 group-hover:bg-gray-200 dark:group-hover:bg-neutral-400 transition-colors" />
              </div>
            </Button>
            <div style={{ width: "10px" }}></div> {/* gap-2.5 is 10px */}
            <Button
              variant="ghost"
              size="icon"
              className="p-3.5 bg-neutral-700 dark:bg-neutral-800 hover:bg-neutral-600 dark:hover:bg-neutral-700 rounded-[50px] w-auto h-auto group"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next slide"
            >
              <div className="w-10 h-10 relative overflow-hidden">
                <div className="w-7 h-6 left-[calc(50%-14px)] top-[calc(50%-12px)] absolute bg-white dark:bg-neutral-200 group-hover:bg-gray-200 dark:group-hover:bg-neutral-400 transition-colors" />
              </div>
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && selectedSlideDataForModal && (
          <FeatureSlideDetailModal
            isOpen={isModalOpen}
            onClose={closeModal}
            slideData={selectedSlideDataForModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}

FeatureCarouselClient.propTypes = {
  slides: PropTypes.arrayOf(PropTypes.object).isRequired,
  productContext: PropTypes.object,
  autoplayConfig: PropTypes.shape({
    enabled: PropTypes.bool,
    delay: PropTypes.number,
  }),
};
