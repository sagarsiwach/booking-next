// components/features/products/HeroSection.jsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import PropTypes from "prop-types";
import { ArrowRight } from "@carbon/icons-react"; // Assuming you use this or similar
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Helper function to resolve links from Sanity 'link' object type
// This needs to match the structure of your 'link' object in Sanity
const resolveSanityLinkUrl = (linkObject) => {
  if (!linkObject || !linkObject.linkType) return "#";

  switch (linkObject.linkType) {
    case "external":
      return linkObject.externalUrl || "#";
    case "path": // Assuming 'path' is for internal relative paths
      return linkObject.path && linkObject.path.startsWith("/")
        ? linkObject.path
        : "#";
    // Add other cases if your 'link' object has more types (e.g., internal document reference)
    // case "internalPage":
    //   return linkObject.internalPage?.slug ? `/pages/${linkObject.internalPage.slug}` : "#";
    default:
      return "#";
  }
};

export default function HeroSection({ block, productContext }) {
  // Destructure directly from block
  const {
    title: blockTitle, // Title from the hero block itself
    subtitle,
    image,
    keySpecs = [],
    primaryButtonLabel, // Label for the first button
    primaryButtonLink, // Link data for the first button (can be string or object)
    secondaryButtonLabel,
    secondaryButtonLink,
    optionalButtonLabel,
    optionalButtonLink,
    cta, // If your hero block has a dedicated 'cta' field of type 'ctaBlock'
  } = block || {};

  const heroTitle = blockTitle || productContext?.title || "Product Title"; // Fallback logic

  const renderKeySpecs = () => {
    if (!keySpecs || keySpecs.length === 0) return null;
    return keySpecs.map((spec, index) => (
      <div
        key={spec._key || `spec-${index}`}
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

  // --- Button Rendering Logic ---
  // This logic needs to be robust to handle different ways links might be stored.
  // The GROQ query in api.js should fetch link data appropriately.

  const buttons = [];

  // Button 1 (Primary)
  if (primaryButtonLabel) {
    // If primaryButtonLink is a simple string (URL)
    const href1 =
      typeof primaryButtonLink === "string"
        ? primaryButtonLink
        : resolveSanityLinkUrl(primaryButtonLink);
    if (href1 && href1 !== "#") {
      buttons.push({
        key: "primary",
        label: primaryButtonLabel,
        href: href1,
        variant: "secondary", // Example variant
      });
    } else {
      // Fallback to booking link if primary is not configured but label exists
      buttons.push({
        key: "book-fallback-primary",
        label: primaryButtonLabel,
        href: `/book?model=${productContext?.slug || ""}`,
        variant: "secondary",
      });
    }
  } else {
    // Default "Book Now" button if no primaryButtonLabel from CMS
    buttons.push({
      key: "book-default",
      label: "Book Now",
      href: `/book?model=${productContext?.slug || ""}`,
      variant: "secondary",
    });
  }

  // Button 2 (Secondary)
  if (secondaryButtonLabel) {
    const href2 =
      typeof secondaryButtonLink === "string"
        ? secondaryButtonLink
        : resolveSanityLinkUrl(secondaryButtonLink);
    if (href2 && href2 !== "#") {
      buttons.push({
        key: "secondary",
        label: secondaryButtonLabel,
        href: href2,
        variant: "outline", // Example variant
      });
    } else {
      // Fallback to test ride if secondary is not configured but label exists
      buttons.push({
        key: "testride-fallback-secondary",
        label: secondaryButtonLabel,
        href: `/test-ride?model=${productContext?.slug || ""}`,
        variant: "outline",
      });
    }
  } else {
    // Default "Test Ride" button if no secondaryButtonLabel from CMS
    buttons.push({
      key: "testride-default",
      label: "Test Ride",
      href: `/test-ride?model=${productContext?.slug || ""}`,
      variant: "outline",
    });
  }

  // Optional Third Button (from block.optionalButtonLabel/Link)
  if (optionalButtonLabel) {
    const hrefOptional =
      typeof optionalButtonLink === "string"
        ? optionalButtonLink
        : resolveSanityLinkUrl(optionalButtonLink);
    if (hrefOptional && hrefOptional !== "#") {
      buttons.push({
        key: "optional",
        label: optionalButtonLabel,
        href: hrefOptional,
        variant: "ghost", // Example variant
      });
    }
  }

  // Or if your hero block directly uses a 'cta' field of type 'ctaBlock'
  // This would typically be an alternative to the individual button fields above.
  // Your Sanity schema for heroSectionBlock has primary/secondary/optional button fields,
  // AND an optional 'cta' field. Decide which one takes precedence or how they combine.
  // For now, the individual buttons will render. If `cta` is present and should override,
  // you'd add logic here.
  // Example: if (cta && cta.buttonLabel && cta.link) { ... add to buttons array ... }

  return (
    <section className="relative h-[90vh] min-h-[650px] flex items-end bg-black text-white overflow-hidden">
      {image?.asset?.url && (
        <Image
          src={image.asset.url}
          alt={image.alt || heroTitle}
          fill
          priority
          className="object-cover object-center z-0 opacity-40 md:opacity-50"
          quality={90}
          placeholder={image.asset.metadata?.lqip ? "blur" : "empty"}
          blurDataURL={image.asset.metadata?.lqip}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>

      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 w-full">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-3 text-white">
          {heroTitle}
        </h1>
        {subtitle && (
          <p className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-gray-200 mb-8 md:mb-12 max-w-3xl">
            {subtitle}
          </p>
        )}

        {keySpecs && keySpecs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 lg:gap-16 mb-10 md:mb-16">
            {renderKeySpecs()}
          </div>
        )}

        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {buttons.map((btn) => (
              <Link key={btn.key} href={btn.href} passHref legacyBehavior>
                <Button
                  as="a" // Important for Link with Shadcn Button
                  size="lg"
                  variant={btn.variant}
                  className={cn(
                    "w-full sm:w-auto group text-base md:text-lg px-6 py-3",
                    btn.variant === "outline" &&
                      "border-white/50 text-white hover:bg-white/10 hover:text-white"
                  )}
                >
                  {btn.label}
                  <ArrowRight
                    size={20}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  block: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    image: PropTypes.shape({
      alt: PropTypes.string,
      asset: PropTypes.shape({
        url: PropTypes.string,
        metadata: PropTypes.shape({
          lqip: PropTypes.string,
        }),
      }),
    }),
    keySpecs: PropTypes.arrayOf(
      PropTypes.shape({
        _key: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.string,
        unit: PropTypes.string,
      })
    ),
    primaryButtonLabel: PropTypes.string,
    primaryButtonLink: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]), // Can be URL string or link object
    secondaryButtonLabel: PropTypes.string,
    secondaryButtonLink: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    optionalButtonLabel: PropTypes.string,
    optionalButtonLink: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    cta: PropTypes.shape({
      // Structure for the ctaBlock if used
      buttonLabel: PropTypes.string,
      link: PropTypes.object, // Your 'link' object schema
    }),
  }),
  productContext: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    slug: PropTypes.string,
  }),
};
