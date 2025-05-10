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
import {
  motion,
  useMotionValue,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import FeatureSlideItem from "./featureSlideItem";
import FeatureSlideDetailModal from "./featureSlideDetailModal";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData */

export default function FeatureCarouselClient({
  slides,
  productContext,
  cardWidth: propCardWidth = 480,
  gap: propGap = 20,
  paddingStart: propPaddingStart = 60,
  paddingEnd: propPaddingEnd = 60,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlideDataForModal, setSelectedSlideDataForModal] =
    useState(null);

  const x = useMotionValue(0);
  const animationControls = useAnimation();

  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const isDraggingRef = useRef(false);

  const cardWidth = useMemo(() => propCardWidth, [propCardWidth]);
  const gap = useMemo(() => propGap, [propGap]);
  const paddingStart = useMemo(() => propPaddingStart, [propPaddingStart]);
  const paddingEnd = useMemo(() => propPaddingEnd, [propPaddingEnd]);

  useEffect(() => {
    const calculateDimensions = () => {
      if (containerRef.current && slides.length > 0) {
        setContainerWidth(containerRef.current.offsetWidth);
        const totalGapWidth = Math.max(0, slides.length - 1) * gap;
        setTrackWidth(slides.length * cardWidth + totalGapWidth);
      } else {
        setContainerWidth(0);
        setTrackWidth(0);
      }
    };

    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);
    return () => window.removeEventListener("resize", calculateDimensions);
  }, [slides, cardWidth, gap]);

  const snapPoints = useMemo(() => {
    if (slides.length === 0) return [0];
    return slides.map((_, i) => -(i * (cardWidth + gap)));
  }, [slides, cardWidth, gap]);

  const dragConstraints = useMemo(() => {
    if (!containerWidth || !trackWidth || slides.length === 0)
      return { left: 0, right: 0 };

    const rightConstraint = 0;

    let leftConstraint;
    const visibleScrollableWidth = containerWidth - paddingStart - paddingEnd;
    if (trackWidth <= visibleScrollableWidth) {
      leftConstraint = 0;
    } else {
      leftConstraint = -(trackWidth - visibleScrollableWidth);
    }

    return {
      right: Math.min(0, rightConstraint),
      left: Math.min(0, leftConstraint),
    };
  }, [
    containerWidth,
    trackWidth,
    slides.length,
    paddingStart,
    paddingEnd,
    cardWidth, // Added cardWidth as it influences trackWidth indirectly and thus constraints
  ]);

  const navigateToSlide = useCallback(
    (index) => {
      const targetIndex = Math.max(0, Math.min(slides.length - 1, index));
      if (!animationControls || snapPoints.length <= targetIndex) return;

      let targetX = snapPoints[targetIndex];
      targetX = Math.max(
        dragConstraints.left,
        Math.min(dragConstraints.right, targetX)
      );

      animationControls.start({
        x: targetX,
        transition: { type: "spring", damping: 25, stiffness: 200, mass: 0.8 },
      });
      setCurrentIndex(targetIndex);
    },
    [slides.length, animationControls, snapPoints, dragConstraints]
  );

  useEffect(() => {
    if (
      slides.length > 0 &&
      containerWidth > 0 &&
      trackWidth > 0 &&
      snapPoints.length > currentIndex
    ) {
      const initialTargetX = snapPoints[currentIndex];
      x.set(
        Math.max(
          dragConstraints.left,
          Math.min(dragConstraints.right, initialTargetX)
        )
      );
    } else if (slides.length > 0) {
      x.set(0);
    }
  }, [
    slides.length,
    containerWidth,
    trackWidth,
    snapPoints,
    x,
    dragConstraints,
    currentIndex,
  ]);

  const onDragStart = useCallback(() => {
    isDraggingRef.current = true;
    animationControls.stop();
  }, [animationControls]);

  const onDragEnd = useCallback(
    (event, info) => {
      isDraggingRef.current = false;
      if (!trackRef.current || slides.length === 0 || snapPoints.length === 0)
        return;

      const currentX = x.get();
      const velocity = info.velocity.x;
      const offset = info.offset.x; // offset is already part of currentX from motion value sync

      // A more direct way to get projected position
      const projectedPosition = currentX + velocity * 0.2; // velocity here is px/ms from Framer Motion

      let closestSnapIndex = 0;
      let smallestDistance = Infinity;

      snapPoints.forEach((snap, i) => {
        const distance = Math.abs(projectedPosition - snap);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestSnapIndex = i;
        }
      });

      navigateToSlide(closestSnapIndex);
    },
    [x, slides.length, snapPoints, navigateToSlide, cardWidth, currentIndex] // Removed cardWidth and currentIndex as navigateToSlide handles snapping
  );

  const openModalWithSlide = useCallback((slideData) => {
    if (isDraggingRef.current) return;
    setSelectedSlideDataForModal(slideData);
    setIsModalOpen(true);
  }, []);

  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < slides.length - 1;
  const showEdgeFades = slides.length > 1; // Simplified: always show if more than 1 slide, opacity controlled by group-hover

  return (
    <div className="relative mx-auto max-w-[1900px] overflow-x-clip group/carousel">
      {showEdgeFades && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-l from-transparent to-background content-[''] opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 md:w-12 lg:w-16 xl:w-24" />
      )}

      <motion.div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          paddingLeft: `${paddingStart}px`,
          paddingRight: `${paddingEnd}px`,
        }}
      >
        <motion.div
          ref={trackRef}
          className="flex touch-pan-y" // touch-pan-y allows vertical scroll while capturing horizontal drag
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.05} // Slight elastic effect at boundaries
          dragMomentum={true} // Enables momentum-based snapping
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{ x, gap: `${gap}px` }}
          animate={animationControls}
        >
          {slides.map((slide, index) => {
            // Determine if the slide is nearby for eager loading
            // Load current, previous, and next slide with priority
            const isNearby = Math.abs(index - currentIndex) <= 1;

            return (
              <div
                key={slide._key}
                className="min-w-0 shrink-0 grow-0"
                style={{
                  width: `${cardWidth}px`,
                }}
              >
                <FeatureSlideItem
                  slideData={slide}
                  isSnapped={index === currentIndex}
                  isNearby={isNearby} // Pass the isNearby prop
                  onOpenPopup={() =>
                    slide.enablePopup && openModalWithSlide(slide)
                  }
                  plusIcon={<Plus size={24} className="stroke-current" />}
                />
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      {showEdgeFades && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-r from-transparent to-background content-[''] opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 md:w-12 lg:w-16 xl:w-24" />
      )}

      {slides.length > 1 && (
        <div
          className={cn(
            "relative mt-10 flex items-center justify-center gap-3 lg:gap-2.5",
            "lg:sticky lg:bottom-10 xl:bottom-12 2xl:bottom-20 lg:z-30",
            "lg:pointer-events-auto lg:mx-auto lg:w-min lg:rounded-xl lg:bg-card/80 lg:p-1.5 lg:shadow-xl lg:backdrop-blur-sm"
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:inline-flex h-10 w-10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed bg-background/80 hover:bg-muted border-border text-foreground"
            onClick={() => navigateToSlide(currentIndex - 1)}
            disabled={!canScrollPrev}
            aria-label="Previous feature"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center gap-2 lg:gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => navigateToSlide(index)}
                aria-label={`Go to feature ${index + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-200 ease-out",
                  index === currentIndex
                    ? "w-6 md:w-8 lg:w-10 bg-primary"
                    : "w-2 bg-muted hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="hidden lg:inline-flex h-10 w-10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed bg-background/80 hover:bg-muted border-border text-foreground"
            onClick={() => navigateToSlide(currentIndex + 1)}
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
  );
}

FeatureCarouselClient.propTypes = {
  slides: PropTypes.array.isRequired,
  productContext: PropTypes.object,
  cardWidth: PropTypes.number,
  gap: PropTypes.number,
  paddingStart: PropTypes.number,
  paddingEnd: PropTypes.number,
};
