// components/features/products/GallerySection.jsx
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
  // DialogTrigger, // Trigger manually
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Close } from "@carbon/icons-react";
import { cn } from "@/lib/utils";

// --- Internal Lightbox Component ---
const LightboxContent = ({ image, onClose }) => {
  if (!image?.asset?.url) return null;

  return (
    <DialogContent
      className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-2 bg-black/80 border-none flex items-center justify-center"
      onInteractOutside={onClose} // Close on outside click
    >
      <Image
        src={image.asset.url}
        alt={image.alt || "Gallery image"}
        width={1920} // Set a reasonable max width
        height={1080} // Set a reasonable max height
        className="max-w-full max-h-full w-auto h-auto object-contain"
        quality={95}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white h-9 w-9"
        aria-label="Close lightbox"
      >
        <Close size={20} />
      </Button>
    </DialogContent>
  );
};

LightboxContent.propTypes = {
  image: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

// --- Main Gallery Component ---
export default function GallerySection({ block }) {
  const {
    title: sectionTitle,
    subtitle: sectionSubtitle,
    images = [],
  } = block || {};

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const openLightbox = useCallback((image) => {
    setSelectedImage(image);
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    // Delay clearing to allow fade-out
    setTimeout(() => setSelectedImage(null), 300);
  }, []);

  if (!images || images.length === 0) {
    return null; // Don't render if no images
  }

  return (
    <section className="py-16 md:py-24 overflow-hidden bg-background text-foreground">
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

      {/* Wrap Carousel with Dialog for Lightbox functionality */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <Carousel
          opts={{
            align: "start",
            loop: images.length > 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 pl-4 md:pl-16 lg:pl-24">
            {images.map((img, index) => (
              <CarouselItem
                key={img._key || `gallery-${index}`}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5" // Adjust for more items potentially
              >
                <button
                  className="relative aspect-square rounded-lg overflow-hidden group bg-muted w-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => openLightbox(img)}
                  aria-label={`View image ${index + 1}${
                    img.alt ? `: ${img.alt}` : ""
                  }`}
                >
                  {img.asset?.url ? (
                    <Image
                      src={img.asset.url}
                      alt={img.alt || `Gallery image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300"></div>
                  {/* Optional: Add icon overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      ></path>
                    </svg>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <div className="mt-8 flex justify-center gap-4">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          )}
        </Carousel>

        {/* Lightbox Content (Conditional Render) */}
        {selectedImage && (
          <LightboxContent image={selectedImage} onClose={closeLightbox} />
        )}
      </Dialog>
    </section>
  );
}

// --- PropTypes ---
const ImagePropTypes = PropTypes.shape({
  _key: PropTypes.string,
  asset: PropTypes.shape({
    url: PropTypes.string,
    // metadata: PropTypes.object // Optional
  }),
  alt: PropTypes.string,
  caption: PropTypes.string,
});

GallerySection.propTypes = {
  block: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    images: PropTypes.arrayOf(ImagePropTypes),
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }).isRequired,
};
