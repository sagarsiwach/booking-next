// components/features/products/featureCarousel/featureSlideDetailModal.jsx
"use client";

import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  // DialogHeader, // Removed
  // DialogTitle,  // Removed
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** @typedef {import('./featureCarouselBlock').FeatureSlideData} FeatureSlideData */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

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
        className="mt-6 mb-6 scroll-m-20 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl first:mt-0"
      >
        {children}
      </motion.h1>
    ),
    h2: ({ children }) => (
      <motion.h2
        variants={contentItemVariants}
        className="mt-10 mb-5 scroll-m-20 border-b border-border pb-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl first:mt-0 first:border-t-0"
      >
        {children}
      </motion.h2>
    ),
    h3: ({ children }) => (
      <motion.h3
        variants={contentItemVariants}
        className="mt-8 mb-4 scroll-m-20 text-xl font-semibold tracking-tight text-foreground md:text-2xl first:mt-0"
      >
        {children}
      </motion.h3>
    ),
    h4: ({ children }) => (
      <motion.h4
        variants={contentItemVariants}
        className="mt-6 mb-3 scroll-m-20 text-lg font-semibold tracking-tight text-foreground md:text-xl first:mt-0"
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

  const displayImageForHeader =
    slideData.mediaType === "image" ? slideData.image : null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
          <DialogOverlay asChild>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            />
          </DialogOverlay>

          <DialogContent
            className={cn(
              "fixed z-50 flex flex-col w-full max-h-[calc(100dvh-4rem)] border bg-background shadow-lg p-0",
              "max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-[1200px]",
              "duration-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=closed]:md:slide-out-to-center-0 data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:md:slide-in-from-center-0",
              "top-auto bottom-0 left-1/2 -translate-x-1/2 rounded-t-2xl",
              "md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-2xl"
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
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
            {/* Close button is a direct child of DialogContent for absolute positioning relative to it */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 md:h-10 md:w-10 rounded-full z-[60] bg-background/30 hover:bg-background/50 dark:bg-foreground/10 dark:hover:bg-foreground/20"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground dark:text-white/70" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>

            {/* This motion.div is the scrollable content area */}
            <motion.div
              className="flex-1 overflow-y-auto w-full px-6 py-10 md:px-8 md:py-12 lg:px-12 lg:py-16 xl:px-16"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.25 },
                },
              }}
              initial="hidden"
              animate="visible"
              // No explicit style padding here; handled by Tailwind classes above
            >
              {/* Optional: Main Media (Image/Video) */}
              {slideData.mediaType === "image" &&
                displayImageForHeader?.asset?.url && (
                  <motion.div
                    variants={contentItemVariants}
                    className="mb-8 aspect-[16/10] overflow-hidden rounded-xl bg-muted shadow-lg md:mb-10 lg:mb-12 lg:aspect-[16/9]"
                  >
                    <Image
                      src={displayImageForHeader.asset.url}
                      alt={
                        displayImageForHeader.alt ||
                        slideData.title ||
                        "Modal image"
                      }
                      width={
                        displayImageForHeader.asset.metadata?.dimensions
                          ?.width || 1600
                      }
                      height={
                        displayImageForHeader.asset.metadata?.dimensions
                          ?.height || 900
                      }
                      className="h-full w-full object-cover"
                      blurDataURL={displayImageForHeader.asset.metadata?.lqip}
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
                    autoPlay={false}
                    playsInline
                    poster={slideData.image?.asset?.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </motion.div>
              )}

              {/* Portable Text Content */}
              {slideData.popupContent && slideData.popupContent.length > 0 ? (
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
                  className="text-muted-foreground text-center py-10"
                >
                  No additional details available.
                </motion.p>
              )}
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

FeatureSlideDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  slideData: PropTypes.shape({
    _key: PropTypes.string,
    title: PropTypes.string,
    overlayTitle: PropTypes.string,
    subtitle: PropTypes.string,
    mediaType: PropTypes.oneOf(["image", "video"]),
    image: PropTypes.shape({
      alt: PropTypes.string,
      asset: PropTypes.shape({
        url: PropTypes.string,
        metadata: PropTypes.shape({
          lqip: PropTypes.string,
          dimensions: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number,
          }),
        }),
      }),
    }),
    videoUrl: PropTypes.string,
    enablePopup: PropTypes.bool,
    popupContent: PropTypes.array,
  }),
};
