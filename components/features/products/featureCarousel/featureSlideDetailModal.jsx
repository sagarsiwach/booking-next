// components/features/products/featureCarousel/featureSlideDetailModal.jsx
"use client";

import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Add } from "@carbon/icons-react"; // For the rotated close button
import { cn } from "@/lib/utils";

/** @typedef {import('./featureCarouselBlock').SlideData} SlideData */

// --- Portable Text Components for Modal Content ---
const modalPortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?.url) return null;
      return (
        <div className="my-6 md:my-8 relative aspect-video md:aspect-[16/9] max-w-full mx-auto overflow-hidden rounded-lg shadow-lg bg-neutral-200 dark:bg-neutral-700">
          <Image
            src={value.asset.url}
            alt={value.alt || "Content image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 70vw, 800px"
            blurDataURL={value.asset.metadata?.lqip}
            placeholder={value.asset.metadata?.lqip ? "blur" : "empty"}
            quality={80}
          />
          {value.caption && (
            <figcaption className="mt-2 px-1 text-center text-xs italic text-neutral-600 dark:text-neutral-400">
              {value.caption}
            </figcaption>
          )}
        </div>
      );
    },
  },
  block: {
    // Modal Title 1: 4xl/5xl bold, leading-tight/leading-[48px]
    h1: ({ children }) => (
      <h1 className="text-black dark:text-white text-4xl md:text-5xl font-bold leading-tight md:leading-[48px] tracking-tight">
        {children}
      </h1>
    ),
    // Modal Title 2 (Secondary Heading): 3xl/4xl bold, leading-tight/leading-9
    h2: ({ children }) => (
      <h2 className="mt-10 md:mt-12 text-neutral-800 dark:text-neutral-100 text-3xl md:text-4xl font-bold leading-tight md:leading-9 tracking-tight">
        {children}
      </h2>
    ),
    // Modal Title 3 (Tertiary Heading): 2xl/3xl semibold, leading-snug/leading-loose
    h3: ({ children }) => (
      <h3 className="mt-8 md:mt-10 text-neutral-700 dark:text-neutral-200 text-2xl md:text-3xl font-semibold leading-snug md:leading-loose tracking-tight">
        {children}
      </h3>
    ),
    // Modal Description / Normal Text: xl/2xl, leading-snug/leading-relaxed
    normal: ({ children }) => (
      <p className="mt-3 md:mt-4 text-neutral-600 dark:text-neutral-400 text-lg md:text-xl leading-snug md:leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic text-neutral-600 dark:text-neutral-400">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : "_self"}
        rel={value?.blank ? "noopener noreferrer" : undefined}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-black dark:text-white">
        {children}
      </strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
  },
};

export default function FeatureSlideDetailModal({
  isOpen,
  onClose,
  slideData,
}) {
  if (!slideData) return null;

  const dialogTitle = slideData.title || "Details";
  const dialogDescription =
    slideData.subtitle || "Further information about this feature.";

  // Determine the cover image for the modal (usually from the slide itself)
  const coverImage =
    slideData.mediaType === "image"
      ? slideData.image
      : slideData.videoUrl && slideData.image;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {isOpen && (
            <>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-[199] bg-neutral-950/30 dark:bg-black/60 backdrop-blur-[20px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content
                asChild
                forceMount
                onEscapeKeyDown={onClose}
              >
                <motion.div
                  className={cn(
                    "fixed left-1/2 top-1/2 z-[200] overflow-y-auto overflow-x-hidden p-0 border-none",
                    "-translate-x-1/2 -translate-y-1/2",
                    "w-[calc(100%-48px)] sm:w-[calc(100%-80px)] md:w-auto", // Responsive width
                    "max-w-none sm:max-w-xl md:max-w-2xl lg:max-w-[1024px]", // Max width
                    "h-auto max-h-[calc(100vh-48px)] sm:max-h-[calc(100vh-80px)]", // Responsive height
                    "bg-white dark:bg-neutral-800 rounded-[40px] shadow-2xl"
                  )}
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.97 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.9,
                  }}
                  role="dialog"
                  aria-labelledby="modal-title-feat"
                  aria-describedby="modal-description-feat"
                >
                  <VisuallyHidden>
                    <DialogPrimitive.Title id="modal-title-feat">
                      {dialogTitle}
                    </DialogPrimitive.Title>
                  </VisuallyHidden>
                  <VisuallyHidden>
                    <DialogPrimitive.Description id="modal-description-feat">
                      {dialogDescription}
                    </DialogPrimitive.Description>
                  </VisuallyHidden>

                  <DialogPrimitive.Close asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className={cn(
                        "absolute z-30 rounded-[50px] p-1.5 shadow-md",
                        "top-5 right-5 md:top-[27.57px] md:right-[27.57px]", // Approx 20px/27.57px inset
                        "bg-neutral-900 dark:bg-black hover:bg-neutral-800 dark:hover:bg-neutral-700",
                        "transform rotate-45" // Rotate the button for '+' to 'x'
                      )}
                      aria-label="Close details"
                    >
                      <div className="w-10 h-10 md:w-14 md:h-14 relative flex items-center justify-center">
                        <Add
                          size={32}
                          className="w-8 h-8 md:w-10 md:h-10 text-neutral-300 dark:text-neutral-400"
                        />
                      </div>
                    </Button>
                  </DialogPrimitive.Close>

                  {/* Content Area with padding and specific top margins for text */}
                  <div className="px-6 pt-10 pb-10 sm:px-10 sm:pt-16 sm:pb-12 md:px-[80px] md:pt-[80px] md:pb-[80px] flex flex-col">
                    {/* Top Text Section (Title 1 & Desc 1) */}
                    <div
                      className="w-full md:max-w-[576px]" // Max width for text block
                      style={{
                        // Figma: top-[200px] (desktop), top-[160px] (tablet/mobile)
                        // This margin is from the top of the modal *content padding area*
                        marginTop: "calc(var(--modal-text-top-margin, 120px))", // 200px - 80px padding OR 160px - 80px
                      }}
                    >
                      <div className="inline-flex flex-col justify-start items-start gap-3 md:gap-5">
                        {slideData.title && (
                          <h1 className="self-stretch text-black dark:text-white text-4xl md:text-5xl font-bold leading-tight md:leading-[48px] tracking-tight">
                            {slideData.title}
                          </h1>
                        )}
                        {slideData.subtitle && (
                          <p className="self-stretch text-neutral-600 dark:text-neutral-400 text-lg md:text-xl leading-snug md:leading-relaxed">
                            {slideData.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cover Image Section */}
                    {coverImage?.asset?.url && (
                      <div className="relative w-full mt-10 md:mt-[80px] self-center overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-700 shadow-md">
                        <div className="aspect-[4/3] md:aspect-[16/9]">
                          {" "}
                          {/* Responsive aspect ratio */}
                          <Image
                            src={coverImage.asset.url}
                            alt={
                              coverImage.alt ||
                              slideData.title ||
                              "Feature image"
                            }
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 70vw, 1024px"
                            quality={85}
                            placeholder={
                              coverImage.asset.metadata?.lqip ? "blur" : "empty"
                            }
                            blurDataURL={coverImage.asset.metadata?.lqip}
                          />
                        </div>
                      </div>
                    )}

                    {/* Portable Text Content (Additional headings, paragraphs, images) */}
                    {slideData.popupContent &&
                      slideData.popupContent.length > 0 && (
                        <div
                          className="mt-10 md:mt-[80px] w-full md:max-w-[576px] prose-headings:font-geist prose-p:font-geist prose-li:font-geist 
                                        prose-headings:tracking-tight prose-p:leading-relaxed dark:prose-invert max-w-none"
                        >
                          <PortableText
                            value={slideData.popupContent}
                            components={modalPortableTextComponents}
                          />
                        </div>
                      )}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

FeatureSlideDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  slideData: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    mediaType: PropTypes.string,
    image: PropTypes.object,
    videoUrl: PropTypes.string,
    popupContent: PropTypes.array, // Array of Portable Text blocks
    enablePopup: PropTypes.bool, // From SlideData for consistency
  }),
};
