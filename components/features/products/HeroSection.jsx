// components/features/products/HeroSection.jsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import PropTypes from "prop-types";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * @typedef {object} SanityLinkObject
 * @property {'external' | 'path'} linkType
 * @property {string} [externalUrl]
 * @property {string} [path]
 */

/**
 * Resolves a Sanity link object to a URL string.
 * @param {SanityLinkObject | string | undefined} linkObject - The link object or a direct string URL.
 * @returns {string} The resolved URL or "#" if invalid.
 */
const resolveSanityLinkUrl = (linkObject) => {
  if (typeof linkObject === "string") {
    if (
      linkObject.startsWith("/") ||
      linkObject.startsWith("http") ||
      linkObject.startsWith("mailto:") ||
      linkObject.startsWith("tel:")
    ) {
      return linkObject;
    }
    return "#";
  }

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
        url = `https://${url}`;
      }
      return url;
    case "path":
      return linkObject.path && linkObject.path.startsWith("/")
        ? linkObject.path
        : "#";
    default:
      return "#";
  }
};

/**
 * @typedef {object} KeySpec
 * @property {string} [_key]
 * @property {string} [name]
 * @property {string} [value]
 * @property {string} [unit]
 */

/**
 * @typedef {object} SanityImageMetadata
 * @property {string} [lqip]
 */

/**
 * @typedef {object} SanityImageAsset
 * @property {string} [url]
 * @property {SanityImageMetadata} [metadata]
 */

/**
 * @typedef {object} SanityImageBlock
 * @property {string} [alt]
 * @property {SanityImageAsset} [asset]
 */

/**
 * @typedef {object} HeroSectionBlockProps
 * @property {string} [_key]
 * @property {string} [_type]
 * @property {string} [title]
 * @property {string} [subtitle]
 * @property {SanityImageBlock} [image]
 * @property {KeySpec[]} [keySpecs]
 * @property {string} [primaryButtonLabel]
 * @property {SanityLinkObject | string} [primaryButtonLink]
 * @property {string} [secondaryButtonLabel]
 * @property {SanityLinkObject | string} [secondaryButtonLink]
 * @property {string} [optionalButtonLabel]
 * @property {SanityLinkObject | string} [optionalButtonLink]
 */

/**
 * @typedef {object} ProductContext
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [slug]
 */

/**
 * Hero section component for product pages.
 * @param {{ block?: HeroSectionBlockProps, productContext?: ProductContext }} props
 * @returns {JSX.Element | null}
 */
export default function HeroSection({ block, productContext }) {
  if (!block) {
    // Handle case where block data might be missing
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "HeroSection: block data is missing. Rendering empty or placeholder."
      );
    }
    return null; // Or render a placeholder
  }

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
  } = block;

  const heroTitle = blockTitle || productContext?.title || "Product Title";

  const buttons = [];
  if (primaryButtonLabel) {
    const href1 = resolveSanityLinkUrl(primaryButtonLink);
    buttons.push({
      key: "primary",
      label: primaryButtonLabel,
      href:
        href1 && href1 !== "#"
          ? href1
          : `/book?model=${productContext?.slug || ""}`,
      variant: "secondary",
    });
  } else {
    buttons.push({
      key: "book-default",
      label: "Book Now",
      href: `/book?model=${productContext?.slug || ""}`,
      variant: "secondary",
    });
  }

  if (secondaryButtonLabel) {
    const href2 = resolveSanityLinkUrl(secondaryButtonLink);
    buttons.push({
      key: "secondary",
      label: secondaryButtonLabel,
      href:
        href2 && href2 !== "#"
          ? href2
          : `/test-ride?model=${productContext?.slug || ""}`,
      variant: "outline",
    });
  } else {
    buttons.push({
      key: "testride-default",
      label: "Test Ride",
      href: `/test-ride?model=${productContext?.slug || ""}`,
      variant: "outline",
    });
  }

  if (optionalButtonLabel) {
    const hrefOptional = resolveSanityLinkUrl(optionalButtonLink);
    if (hrefOptional && hrefOptional !== "#") {
      buttons.push({
        key: "optional",
        label: optionalButtonLabel,
        href: hrefOptional,
        variant: "ghost",
      });
    }
  }

  return (
    <section
      className="relative flex items-end bg-black text-white overflow-hidden h-[90vh]" // UPDATED height
    >
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
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>

      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-20 md:pb-24 w-full">
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-2 sm:mb-3 text-white">
          {heroTitle}
        </h1>
        {subtitle && (
          <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-gray-200 mb-6 sm:mb-8 md:mb-12 max-w-3xl">
            {subtitle}
          </p>
        )}

        {keySpecs && keySpecs.length > 0 && (
          <div className="flex flex-row flex-wrap justify-around sm:justify-start items-baseline gap-x-4 gap-y-4 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-6 md:gap-12 lg:gap-16 mb-8 sm:mb-10 md:mb-16">
            {keySpecs.map((spec, index) => (
              <div
                key={spec._key || `spec-${index}`}
                className="flex flex-col items-center text-center sm:items-start sm:text-left min-w-[80px] xs:min-w-[100px]"
              >
                <p className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl leading-none tracking-tight text-white font-light">
                  {spec.value || "-"}
                  {spec.unit && (
                    <span className="text-base xs:text-lg sm:text-xl md:text-2xl align-baseline ml-1 font-light">
                      {spec.unit}
                    </span>
                  )}
                </p>
                <p className="text-sm xs:text-base sm:text-lg md:text-xl font-medium tracking-tight text-gray-300 mt-1">
                  {spec.name || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}

        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {buttons.map((btn) => (
              <Button
                key={btn.key}
                asChild
                size="lg"
                className={cn(
                  "w-full sm:w-auto group text-base md:text-lg",
                  btn.variant === "outline" &&
                    "border-white/50 text-white hover:bg-white/10 hover:text-white",
                  btn.variant === "ghost" && "text-white hover:bg-white/10"
                )}
                variant={btn.variant === "secondary" ? "default" : btn.variant}
              >
                <Link href={btn.href}>
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
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  block: PropTypes.shape({
    _key: PropTypes.string,
    _type: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    image: PropTypes.shape({
      alt: PropTypes.string,
      asset: PropTypes.shape({
        url: PropTypes.string,
        metadata: PropTypes.shape({ lqip: PropTypes.string }),
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
  }),
  productContext: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    slug: PropTypes.string,
  }),
};
