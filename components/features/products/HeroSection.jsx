// components/features/products/HeroSection.jsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import PropTypes from "prop-types";
import { ArrowRight } from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Helper function to resolve links (adapt based on your Sanity link object structure)
const resolveLinkUrl = (link) => {
  if (!link) return "#";
  switch (link.linkType) {
    case "internal":
      // Basic example: assumes slugs are unique across types or uses a base path
      // You'll likely need a more robust slug generation strategy based on _type
      const basePath =
        link.internalType === "post"
          ? "/blog"
          : link.internalType === "productPage"
          ? "/products"
          : "/pages";
      return link.internalSlug ? `${basePath}/${link.internalSlug}` : "#";
    case "external":
      return link.externalUrl || "#";
    case "path":
      return link.path || "#";
    default:
      return "#";
  }
};

export default function HeroSection({ block, productContext }) {
  const { title, subtitle, image, keySpecs = [], cta } = block || {};

  const renderKeySpecs = () => {
    if (!keySpecs || keySpecs.length === 0) return null;
    return keySpecs.map((spec, index) => (
      <div
        key={spec._key || `spec-${index}`} // Use Sanity key
        className="flex flex-col items-center sm:items-start text-center sm:text-left mb-6 sm:mb-0"
      >
        <p className="text-4xl sm:text-5xl md:text-6xl leading-none tracking-tight text-white font-light">
          {spec.value || "-"}
          {spec.unit && (
            <span className="text-lg sm:text-xl md:text-2xl align-baseline ml-1 font-light">
              {spec.unit}
            </span>
          )}
        </p>
        <p className="text-base sm:text-lg md:text-xl font-medium tracking-tight text-gray-300 mt-1">
          {spec.name || "N/A"}
        </p>
      </div>
    ));
  };

  const heroTitle = title || productContext?.title || "Product Title";

  return (
    <section className="relative h-[90vh] min-h-[650px] flex items-end bg-black text-white">
      {image?.asset?.url && (
        <Image
          src={image.asset.url}
          alt={image.alt || heroTitle}
          fill
          priority
          className="object-cover object-center z-0 opacity-40 md:opacity-50"
          quality={90}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>

      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 w-full">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter mb-3 text-white">
          {heroTitle}
        </h1>
        {subtitle && (
          <p className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-gray-200 mb-8 md:mb-12 max-w-3xl">
            {subtitle}
          </p>
        )}
        {keySpecs && keySpecs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-12 lg:gap-16 mb-10 md:mb-12">
            {renderKeySpecs()}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Default Buttons using productContext */}
          <Link href={`/book?model=${productContext?.slug || ""}`} passHref>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto group text-lg"
            >
              Book Now
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Button>
          </Link>
          <Link
            href={`/test-ride?model=${productContext?.slug || ""}`}
            passHref
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto group text-lg border-white/50 text-white hover:bg-white/10 hover:text-white"
            >
              Test Ride
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Button>
          </Link>
          {/* CTA from Sanity */}
          {cta?.label && cta?.link && (
            <Link href={resolveLinkUrl(cta.link)} passHref>
              <Button
                size="lg"
                variant="default"
                className="w-full sm:w-auto group text-lg"
              >
                {cta.label}
                <ArrowRight
                  size={20}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// --- PropTypes ---
HeroSection.propTypes = {
  block: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    image: PropTypes.shape({
      asset: PropTypes.shape({
        url: PropTypes.string,
      }),
      alt: PropTypes.string,
    }),
    keySpecs: PropTypes.arrayOf(
      PropTypes.shape({
        _key: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.string,
        unit: PropTypes.string,
      })
    ),
    cta: PropTypes.shape({
      label: PropTypes.string,
      link: PropTypes.object, // Use PropTypes.object for complex link structure
    }),
    _key: PropTypes.string.isRequired, // Required for mapping
    _type: PropTypes.string.isRequired,
  }),
  productContext: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    slug: PropTypes.string,
    relatedVehicle: PropTypes.object, // Keep as object for flexibility
  }),
};
