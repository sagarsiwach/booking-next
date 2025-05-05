// components/features/products/TestimonialSection.jsx
"use client";

import React from "react";
import Image from "next/image";
import PropTypes from "prop-types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card"; // Use Card for structure
import { cn } from "@/lib/utils";

export default function TestimonialSection({ block }) {
  const {
    title: sectionTitle,
    description: sectionSubtitle,
    testimonials = [],
  } = block || {};

  if (!testimonials || testimonials.length === 0) {
    return null; // Don't render if no testimonials
  }

  return (
    <section className="py-16 md:py-24 bg-neutral-900 dark:bg-neutral-950 text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-16">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center md:text-left mb-12 max-w-2xl mx-auto md:mx-0">
            {sectionTitle && (
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 text-white">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg md:text-xl text-gray-300">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Use container for padding control */}
      <div className="container mx-auto px-0 sm:px-6 lg:px-8">
        <Carousel
          opts={{
            align: "start",
            loop: testimonials.length > 1,
          }}
          className="w-full" // Let container handle max-width if needed
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((item, index) => (
              <CarouselItem
                key={item._key || `testimonial-${index}`}
                className="pl-4 basis-full md:basis-1/2 lg:basis-1/3" // Responsive column width
              >
                <Card className="h-full flex flex-col border-none bg-neutral-800/50 dark:bg-neutral-900/60 shadow-lg rounded-lg overflow-hidden">
                  {/* Optional Background Image */}
                  {item.backgroundImage?.asset?.url && (
                    <div className="relative h-32 sm:h-40 w-full flex-shrink-0">
                      <Image
                        src={item.backgroundImage.asset.url}
                        alt={item.backgroundImage.alt || ""}
                        fill
                        className="object-cover opacity-30 group-hover:opacity-50 transition-opacity"
                      />
                    </div>
                  )}

                  <CardContent className="p-6 flex flex-col flex-grow justify-between">
                    <blockquote className="mb-6 border-l-4 border-primary pl-4 italic text-lg sm:text-xl text-gray-200 flex-grow">
                      "{item.quote || "Missing quote."}"
                    </blockquote>
                    <figcaption className="flex items-center space-x-3">
                      {item.authorImage?.asset?.url && (
                        <Image
                          src={item.authorImage.asset.url}
                          alt={item.authorImage.alt || item.authorName || ""}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                      <cite className="text-sm font-medium text-gray-300 not-italic">
                        {item.authorName || "Anonymous"}
                      </cite>
                    </figcaption>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          {testimonials.length > 1 && (
            <div className="mt-8 flex justify-center gap-4">
              <CarouselPrevious
                variant="outline"
                className="text-white bg-neutral-700/50 border-neutral-600 hover:bg-neutral-700/80"
              />
              <CarouselNext
                variant="outline"
                className="text-white bg-neutral-700/50 border-neutral-600 hover:bg-neutral-700/80"
              />
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}

// --- PropTypes ---
const ImageAssetPropType = PropTypes.shape({
  asset: PropTypes.shape({
    url: PropTypes.string,
  }),
  alt: PropTypes.string,
});

const TestimonialItemPropTypes = PropTypes.shape({
  _key: PropTypes.string.isRequired,
  id: PropTypes.string,
  quote: PropTypes.string,
  authorName: PropTypes.string,
  authorImage: ImageAssetPropType,
  backgroundImage: ImageAssetPropType,
});

TestimonialSection.propTypes = {
  block: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    testimonials: PropTypes.arrayOf(TestimonialItemPropTypes),
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }).isRequired,
};
