// components/features/products/featureCarousel/featureSlideDetailModal.jsx
"use client";

import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogOverlay, // Keep for custom animated overlay
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose, // Use this imported component
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData */

// Animation for the backdrop
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

// Variants for content items *inside* the scrollable area for staggering
const contentItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.6,
      duration: 0.5,
    },
  },
};

// Define custom components for Portable Text
const portableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?.url) return null;
      return (
        <motion.div
          variants={contentItemVariants}
          className="my-8 overflow-hidden rounded-xl shadow-lg bg-muted md:my-10 lg:my-12"
        >
          <Image
            src={value.asset.url}
            alt={value.alt || "Popup image"}
            width={value.asset.metadata?.dimensions?.width || 1200}
            height={value.asset.metadata?.dimensions?.height || 675}
            className="h-auto w-full object-contain transition-opacity duration-300"
            blurDataURL={value.asset.metadata?.lqip}
            placeholder={value.asset.metadata?.lqip ? "blur" : "empty"}
            quality={85}
          />
          {value.caption && (
            <figcaption className="mt-3 px-2 text-center text-sm italic text-muted-foreground">
              {value.caption}
            </figcaption>
          )}
        </motion.div>
      );
    },
  },
  block: {
    h1: ({ children }) => (
      <motion.h1
        variants={contentItemVariants}
        className="mt-10 mb-6 scroll-m-20 text-4xl font-bold tracking-tight text-foreground lg:text-5xl first:mt-0"
      >
        {children}
      </motion.h1>
    ),
    h2: ({ children }) => (
      <motion.h2
        variants={contentItemVariants}
        className="mt-12 mb-5 scroll-m-20 border-b border-border pb-3 text-3xl font-semibold tracking-tight text-foreground first:mt-0 first:border-t-0"
      >
        {children}
      </motion.h2>
    ),
    h3: ({ children }) => (
      <motion.h3
        variants={contentItemVariants}
        className="mt-10 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight text-foreground first:mt-0"
      >
        {children}
      </motion.h3>
    ),
    h4: ({ children }) => (
      <motion.h4
        variants={contentItemVariants}
        className="mt-8 mb-3 scroll-m-20 text-xl font-semibold tracking-tight text-foreground first:mt-0"
      >
        {children}
      </motion.h4>
    ),
    normal: ({ children }) => (
      <motion.p
        variants={contentItemVariants}
        className="mb-6 text-base leading-relaxed text-foreground/90 md:text-lg md:leading-loose last:mb-0"
      >
        {children}
      </motion.p>
    ),
    blockquote: ({ children }) => (
      <motion.blockquote
        variants={contentItemVariants}
        className="mt-8 mb-8 border-l-4 border-primary pl-6 italic text-muted-foreground"
      >
        {children}
      </motion.blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <motion.ul
        variants={contentItemVariants}
        className="my-8 ml-6 list-disc space-y-3 text-foreground/90 [&>li]:mt-2"
      >
        {children}
      </motion.ul>
    ),
    number: ({ children }) => (
      <motion.ol
        variants={contentItemVariants}
        className="my-8 ml-6 list-decimal space-y-3 text-foreground/90 [&>li]:mt-2"
      >
        {children}
      </motion.ol>
    ),
  },
  listItem: ({ children }) => <li>{children}</li>,
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : "_self"}
        rel={value?.blank ? "noopener noreferrer" : undefined}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground">
        {children}
      </code>
    ),
    underline: ({ children }) => (
      <u className="underline underline-offset-2">{children}</u>
    ),
  },
};

export default function FeatureSlideDetailModal({
  isOpen,
  onClose,
  slideData,
}) {
  if (!slideData) return null;

  const modalTitle = slideData.overlayTitle || slideData.title;
  const displayImageForHeader =
    slideData.mediaType === "image" ? slideData.image : null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
          {/* Custom Animated Overlay using DialogOverlay as a primitive host for motion.div */}
          <DialogOverlay asChild>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
          </DialogOverlay>

          <DialogContent
            className={cn(
              "fixed z-50 grid w-full max-h-[calc(100dvh-4rem)] gap-4 overflow-hidden border bg-background p-0 shadow-lg",
              "max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-[1200px]",
              // Default Shadcn animations for DialogContent
              "duration-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=closed]:md:slide-out-to-center-0 data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:md:slide-in-from-center-0",
              "top-auto bottom-0 left-1/2 -translate-x-1/2 rounded-t-2xl",
              "md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-2xl"
            )}
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus on first element
            onPointerDownOutside={(event) => {
              if (event.target.closest("[data-radix-popper-content-wrapper]")) {
                event.preventDefault();
              }
            }}
            onInteractOutside={(event) => {
              if (event.target.closest("[data-radix-popper-content-wrapper]")) {
                event.preventDefault();
              }
            }}
          >
            <div className="flex flex-col max-h-full h-full">
              <DialogHeader
                className={cn(
                  "shrink-0 border-b bg-background/80 px-6 pt-6 pb-4 backdrop-blur-md md:px-8 md:pt-8 md:pb-5 dark:border-neutral-800"
                )}
              >
                {modalTitle && (
                  <DialogTitle className="text-2xl font-semibold text-foreground sm:text-3xl">
                    {modalTitle}
                  </DialogTitle>
                )}
                {/* Corrected: Use imported DialogClose component */}
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-10 w-10 rounded-full md:top-5 md:right-5"
                    aria-label="Close modal"
                  >
                    <XIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </DialogHeader>

              <motion.div
                className="flex-1 overflow-y-auto"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.08, delayChildren: 0.45 },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                <div className="p-8 md:p-12 lg:p-16">
                  {slideData.mediaType === "image" &&
                    displayImageForHeader?.asset?.url && (
                      <motion.div
                        variants={contentItemVariants}
                        className="mb-8 aspect-[16/10] overflow-hidden rounded-xl bg-muted shadow-lg md:mb-10 lg:mb-12 lg:aspect-[16/9]"
                      >
                        <Image
                          src={displayImageForHeader.asset.url}
                          alt={displayImageForHeader.alt || modalTitle}
                          width={
                            displayImageForHeader.asset.metadata?.dimensions
                              ?.width || 1600
                          }
                          height={
                            displayImageForHeader.asset.metadata?.dimensions
                              ?.height || 900
                          }
                          className="h-full w-full object-cover"
                          blurDataURL={
                            displayImageForHeader.asset.metadata?.lqip
                          }
                          placeholder={
                            displayImageForHeader.asset.metadata?.lqip
                              ? "blur"
                              : "empty"
                          }
                          priority
                          quality={90}
                        />
                      </motion.div>
                    )}
                  {slideData.mediaType === "video" && slideData.videoUrl && (
                    <motion.div
                      variants={contentItemVariants}
                      className="mb-8 aspect-video overflow-hidden rounded-xl bg-black shadow-lg md:mb-10 lg:mb-12"
                    >
                      <video
                        src={slideData.videoUrl}
                        className="h-full w-full object-contain"
                        controls
                        autoPlay={false} // Consider UX: autoplay might be intrusive
                        playsInline
                        poster={
                          slideData.mediaType === "video" &&
                          displayImageForHeader?.asset?.url
                            ? displayImageForHeader.asset.url
                            : undefined // Only use poster if image is specifically for video
                        }
                      >
                        Your browser does not support the video tag.
                      </video>
                    </motion.div>
                  )}

                  {slideData.popupContent &&
                  slideData.popupContent.length > 0 ? (
                    <div
                      className="prose prose-base md:prose-lg dark:prose-invert max-w-none 
                                            prose-headings:font-sans prose-p:font-sans prose-li:font-sans
                                            prose-headings:mb-5 prose-headings:mt-8 prose-p:mb-5 prose-li:mb-2 
                                            prose-img:my-8 prose-img:rounded-lg prose-img:shadow-md
                                            dark:prose-headings:text-foreground dark:prose-p:text-foreground/90 
                                            dark:prose-li:text-foreground/90 dark:prose-blockquote:text-muted-foreground 
                                            dark:prose-strong:text-foreground dark:prose-a:text-primary"
                    >
                      <PortableText
                        value={slideData.popupContent}
                        components={portableTextComponents}
                      />
                    </div>
                  ) : (
                    <motion.p
                      variants={contentItemVariants}
                      className="text-muted-foreground"
                    >
                      No additional details available.
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

FeatureSlideDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  slideData: PropTypes.object, // More specific shape can be added based on FeatureSlideData
};
