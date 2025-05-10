// components/features/products/HeroSection.jsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link"; // Standard Next.js Link
import PropTypes from "prop-types";
import { ArrowRight } from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Your Shadcn Button

// Helper function to resolve links from Sanity 'link' object type
const resolveSanityLinkUrl = (linkObject) => {
  if (!linkObject || !linkObject.linkType) return "#";

  switch (linkObject.linkType) {
    case "external":
      let url = linkObject.externalUrl || "#";
      if (
        url !== "#" &&
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("mailto:") &&
        !url.startsWith("tel:")
      ) {
        console.warn(
          `External URL "${url}" is missing a protocol. Assuming https.`
        );
        url = `https://${url}`;
      }
      return url;
    case "path":
      return linkObject.path && linkObject.path.startsWith("/")
        ? linkObject.path
        : "#";
    default:
      console.warn(
        `Unknown link type "${linkObject.linkType}" in resolveSanityLinkUrl`
      );
      return "#";
  }
};

export default function HeroSection({ block, productContext }) {
  // Destructure directly from block props
  const {
    title: blockTitle,
    subtitle,
    image,
    keySpecs = [],
    primaryButtonLabel,
    primaryButtonLink,
    secondaryButtonLabel,
    secondaryButtonLink,
    optionalButtonLabel,
    optionalButtonLink,
  } = block || {};

  // Determine the final title using fallbacks
  const heroTitle = blockTitle || productContext?.title || "Product Title";

  // Function to render key specification items
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

  // --- Button Definition Logic ---
  const buttons = [];
  if (primaryButtonLabel) {
    const href1 =
      typeof primaryButtonLink === "string"
        ? primaryButtonLink
        : resolveSanityLinkUrl(primaryButtonLink);
    if (href1 && href1 !== "#")
      buttons.push({
        key: "primary",
        label: primaryButtonLabel,
        href: href1,
        variant: "secondary",
      });
    else {
      console.warn(
        `Primary button "${primaryButtonLabel}" has invalid/missing link. Falling back to booking page.`
      );
      buttons.push({
        key: "book-fallback-primary",
        label: primaryButtonLabel,
        href: `/book?model=${productContext?.slug || ""}`,
        variant: "secondary",
      });
    }
  } else {
    buttons.push({
      key: "book-default",
      label: "Book Now",
      href: `/book?model=${productContext?.slug || ""}`,
      variant: "secondary",
    });
  }
  if (secondaryButtonLabel) {
    const href2 =
      typeof secondaryButtonLink === "string"
        ? secondaryButtonLink
        : resolveSanityLinkUrl(secondaryButtonLink);
    if (href2 && href2 !== "#")
      buttons.push({
        key: "secondary",
        label: secondaryButtonLabel,
        href: href2,
        variant: "outline",
      });
    else {
      console.warn(
        `Secondary button "${secondaryButtonLabel}" has invalid/missing link. Falling back to test ride page.`
      );
      buttons.push({
        key: "testride-fallback-secondary",
        label: secondaryButtonLabel,
        href: `/test-ride?model=${productContext?.slug || ""}`,
        variant: "outline",
      });
    }
  } else {
    buttons.push({
      key: "testride-default",
      label: "Test Ride",
      href: `/test-ride?model=${productContext?.slug || ""}`,
      variant: "outline",
    });
  }
  if (optionalButtonLabel) {
    const hrefOptional =
      typeof optionalButtonLink === "string"
        ? optionalButtonLink
        : resolveSanityLinkUrl(optionalButtonLink);
    if (hrefOptional && hrefOptional !== "#")
      buttons.push({
        key: "optional",
        label: optionalButtonLabel,
        href: hrefOptional,
        variant: "ghost",
      });
    else {
      console.warn(
        `Optional button "${optionalButtonLabel}" has invalid/missing link. Button not rendered.`
      );
    }
  }
  // --- End Button Definition Logic ---

  return (
    <section className="relative h-[90vh] min-h-[650px] flex items-end bg-black text-white overflow-hidden">
      {/* Background Image */}
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
          sizes="100vw"
        />
      )}
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>

      {/* Content Container */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 w-full">
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-3 text-white">
          {heroTitle}
        </h1>
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-gray-200 mb-8 md:mb-12 max-w-3xl">
            {subtitle}
          </p>
        )}

        {/* Key Specs */}
        {keySpecs && keySpecs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 lg:gap-16 mb-10 md:mb-16">
            {renderKeySpecs()}
          </div>
        )}

        {/* --- CORRECTED BUTTON RENDERING --- */}
        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {buttons.map((btn) => (
              // Button wraps Link when using asChild
              <Button
                key={btn.key}
                asChild // Button renders Link as its child
                size="lg"
                variant={btn.variant}
                className={cn(
                  "w-full sm:w-auto group text-base md:text-lg px-6 py-3", // Base styles
                  // Specific variant styles
                  btn.variant === "outline" &&
                    "border-white/50 text-white hover:bg-white/10 hover:text-white",
                  btn.variant === "secondary" && "", // Add specific styles if needed
                  btn.variant === "ghost" && "text-white hover:bg-white/10" // Example ghost style
                )}
              >
                <Link href={btn.href}>
                  {/* Content goes INSIDE the Link */}
                  {btn.label}
                  <ArrowRight
                    size={20}
                    aria-hidden="true"
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </Button>
            ))}
          </div>
        )}
        {/* --- END CORRECTED BUTTON RENDERING --- */}
      </div>
    </section>
  );
}

// --- PropTypes ---
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
    ]),
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
    // cta field prop type if you use it
  }),
  productContext: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    slug: PropTypes.string,
  }),
};
