// components/features/products/FeatureCarousel.jsx
"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import PropTypes from "prop-types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Add, Close } from "@carbon/icons-react";
import { cn } from "@/lib/utils";

// --- Overlay Content Component (Internal, no PropTypes needed here) ---
const OverlayContentInternal = ({ slideData }) => {
  const overlayTitle = slideData?.overlayTitle || slideData?.title || "Details";
  const overlayBody =
    slideData?.overlayBody || slideData?.subtitle || "More details...";
  const bgColor = slideData?.overlayBgColorOverrideHex || "#FFFFFF";
  const titleSize = slideData?.overlayTitleSizeOverride || 32;
  const bodySize = slideData?.overlayBodySizeOverride || 18;

  return (
    <>
      {" "}
      {/* Use Fragment */}
      <DialogHeader className="p-6 pb-0 pt-10 relative">
        {overlayTitle && (
          <DialogTitle
            style={{ fontSize: `${titleSize}px` }}
            className="text-foreground"
          >
            {overlayTitle}
          </DialogTitle>
        )}
        {/* DialogClose is part of the parent Dialog, trigger it */}
        <DialogClose
          asChild
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <Button variant="ghost" size="icon">
            <Close size={20} />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
      </DialogHeader>
      <div className="p-6 pt-2 text-foreground max-h-[70vh] overflow-y-auto">
        {" "}
        {/* Added max-h and overflow */}
        {slideData?.image?.asset?.url && (
          <div className="mb-6 aspect-video relative overflow-hidden rounded-lg bg-muted">
            <Image
              src={slideData.image.asset.url}
              alt={slideData.alt || overlayTitle}
              fill
              className="object-contain"
            />
          </div>
        )}
        {overlayBody && (
          <DialogDescription
            style={{ fontSize: `${bodySize}px`, whiteSpace: "pre-wrap" }}
            className="text-muted-foreground"
          >
            {overlayBody}
          </DialogDescription>
        )}
      </div>
    </>
  );
};

// --- Main Component ---
export default function FeatureCarousel({ block }) {
  // Removed productContext as it's not used here
  const {
    title: sectionTitle,
    description: sectionSubtitle,
    slides = [],
  } = block || {};

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedSlideData, setSelectedSlideData] = useState(null); // Keep track of the full slide object

  const openOverlay = useCallback((slide) => {
    setSelectedSlideData(slide);
    setIsOverlayOpen(true);
  }, []);

  // onOpenChange for the Dialog will handle setting isOverlayOpen to false
  // No explicit closeOverlay needed here if using onOpenChange

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 overflow-hidden bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-16">
        {sectionTitle && (
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 text-center md:text-left">
            {sectionTitle}
          </h2>
        )}
        {sectionSubtitle && (
          <p className="text-lg md:text-xl text-muted-foreground text-center md:text-left">
            {sectionSubtitle}
          </p>
        )}
      </div>

      {/* Dialog must wrap Carousel if items trigger it */}
      <Dialog open={isOverlayOpen} onOpenChange={setIsOverlayOpen}>
        <Carousel
          opts={{
            align: "start",
            loop: slides.length > 3, // Loop only if enough slides visible
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 pl-4 md:pl-16 lg:pl-24">
            {slides.map((slide, index) => (
              <CarouselItem
                key={slide._key}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-[30%]" // Adjust basis
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden group bg-card/50 shadow-md">
                  {slide.image?.asset?.url && (
                    <Image
                      src={slide.image.asset.url}
                      alt={slide.alt || slide.title || `Feature ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 30vw" // Adjusted sizes
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground z-10">
                    {slide.title && (
                      <h3 className="text-2xl font-semibold mb-1 tracking-tight line-clamp-2">
                        {slide.title}
                      </h3>
                    )}
                    {slide.subtitle && (
                      <p className="text-base text-primary-foreground/80 line-clamp-3">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                  {slide.showOverlayButton && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-4 right-4 rounded-full w-10 h-10 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => openOverlay(slide)} // Pass the specific slide data
                      aria-label={`View details for ${
                        slide.title || "feature"
                      }`}
                    >
                      <Add size={20} />
                    </Button>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {slides.length > 3 && ( // Show nav only if potentially scrollable
            <div className="mt-8 flex justify-center gap-4">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          )}
        </Carousel>

        {/* Overlay Content: Rendered by Dialog when open=true */}
        {selectedSlideData && (
          <DialogContent
            className="max-w-3xl max-h-[85vh] overflow-hidden p-0 flex flex-col" // Adjust styling
            style={{
              backgroundColor:
                selectedSlideData.overlayBgColorOverrideHex || "#FFFFFF",
            }}
            onInteractOutside={(e) => e.preventDefault()} // Optional: prevent closing on outside click
          >
            <OverlayContentInternal slideData={selectedSlideData} />
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

// --- PropTypes ---
const SlidePropTypes = PropTypes.shape({
  _key: PropTypes.string.isRequired,
  id: PropTypes.string,
  image: PropTypes.shape({
    asset: PropTypes.shape({
      url: PropTypes.string,
      // metadata: PropTypes.object // Optional: add if needed
    }),
    alt: PropTypes.string, // Define alt directly if needed by Image component
  }),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showOverlayButton: PropTypes.bool,
  overlayTitle: PropTypes.string,
  overlayBody: PropTypes.string,
  overlayBgColorOverrideHex: PropTypes.string,
  overlayTitleSizeOverride: PropTypes.number,
  overlayBodySizeOverride: PropTypes.number,
});

FeatureCarousel.propTypes = {
  block: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    slides: PropTypes.arrayOf(SlidePropTypes),
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }).isRequired,
  // productContext: PropTypes.object, // Keep if needed by sub-components, but not used here directly
};
