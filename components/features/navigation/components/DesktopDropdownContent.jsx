// components/features/navigation/components/DesktopDropdownContent.jsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types"; // Import prop-types

// Helper component for individual items
const DropdownItemLink = React.forwardRef(
  ({ href = "#", children, className, ...props }, ref) => (
    <Link
      href={href}
      ref={ref}
      className={cn(
        "block relative text-left", // Base styles
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500", // Focus styles
        className
      )}
      prefetch={false}
      {...props}
    >
      {children}
    </Link>
  )
);
DropdownItemLink.displayName = "DropdownItemLink";
DropdownItemLink.propTypes = {
  href: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

// Model Item Display
const ModelItemDisplay = ({ item }) => {
  return (
    <li role="none" className="flex flex-col">
      {" "}
      {/* List item for semantics */}
      <DropdownItemLink
        href={item.url}
        role="menuitem"
        className={cn(
          "group flex flex-col overflow-hidden", // No rounding
          "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150" // Hover background
        )}
        aria-label={item.label}
      >
        <div className="w-full aspect-[16/9] relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {item.image ? (
            <Image
              src={item.image}
              alt="" // Decorative, label is on the link
              fill // Use fill instead of layout
              style={{ objectFit: "contain" }} // Use style for objectFit
              className="p-2" // Padding around image
              loading="lazy"
              unoptimized={!item.image?.includes("cloudinary")} // Example condition
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 italic">
              Image
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-full p-4 sm:p-5", // Padding for text area
            "flex justify-between items-center"
          )}
        >
          {/* Adjusted text styles to match Framer */}
          <span className="text-neutral-700 dark:text-neutral-200 text-xl sm:text-2xl md:text-[30px] font-semibold tracking-[-0.04em] leading-tight">
            {item.label}
          </span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 dark:text-neutral-300 flex-shrink-0" />
        </div>
      </DropdownItemLink>
    </li>
  );
};
ModelItemDisplay.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
    image: PropTypes.string,
    type: PropTypes.oneOf(["model"]).isRequired,
  }).isRequired,
};

// Link Item Display
const LinkItemDisplay = ({ item, labelStyleClasses, iconSize = 20 }) => {
  // Removed iconName prop
  return (
    <li role="none" className="self-stretch">
      {" "}
      {/* List item for semantics */}
      <DropdownItemLink
        href={item.url}
        role="menuitem"
        className={cn(
          "py-[15px] px-2.5 flex justify-between items-center", // Base padding & layout
          "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150", // Hover state
          "border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-600" // Subtle border on hover
        )}
        aria-label={item.label}
      >
        <span className={cn("tracking-[-0.04em]", labelStyleClasses)}>
          {item.label}
        </span>
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 relative">
          {/* Use Lucide ExternalLink directly */}
          <ExternalLink
            className="w-5 h-5 text-neutral-700 dark:text-neutral-300" // Adjusted size
            strokeWidth={1.5}
            aria-hidden="true"
            size={iconSize} // Use the prop for size
          />
        </div>
      </DropdownItemLink>
    </li>
  );
};
LinkItemDisplay.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
    type: PropTypes.oneOf(["link"]).isRequired,
    group: PropTypes.number, // Relevant for 'more' type
  }).isRequired,
  labelStyleClasses: PropTypes.string,
  iconSize: PropTypes.number,
};

// Main content component
export const DesktopDropdownContent = ({ type, items = [] }) => {
  // Specific Styles based on type (adjust Tailwind classes as needed)
  const secondaryLinkStyles =
    "text-neutral-500 dark:text-neutral-400 text-2xl font-normal";
  const moreLinkStyles =
    "text-neutral-700 dark:text-neutral-200 text-[30px] font-semibold";

  const renderContent = () => {
    switch (type) {
      case "motorbikes":
      case "scooters":
        const models = items.filter((item) => item.type === "model");
        const links = items.filter((item) => item.type === "link");

        if (models.length === 0 && links.length === 0) {
          return (
            <div className="p-6 text-neutral-500 dark:text-neutral-400 text-center w-full">
              No items available.
            </div>
          );
        }

        return (
          <div className="flex flex-col md:flex-row justify-start items-stretch gap-2.5 w-full">
            {/* Models Section */}
            <ul
              role="none"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-auto items-end"
            >
              {models.map((item) => (
                <ModelItemDisplay key={item.label} item={item} />
              ))}
            </ul>
            {/* Links Section */}
            {links.length > 0 && (
              <ul
                role="none"
                className="w-full md:w-80 flex-shrink-0 flex flex-col justify-end items-start mt-5 md:mt-0 md:pt-[240px] lg:pt-[260px]" /* Adjust top padding */
              >
                {links.map((item) => (
                  <LinkItemDisplay
                    key={item.label}
                    item={item}
                    labelStyleClasses={secondaryLinkStyles}
                    iconSize={20}
                  />
                ))}
              </ul>
            )}
          </div>
        );

      case "more":
        const moreLinks = items.filter(
          (item) => item.type === "link" && typeof item.group === "number"
        );
        const groupedItems = moreLinks.reduce((acc, item) => {
          const groupKey = item.group ?? 0;
          acc[groupKey] = acc[groupKey] || [];
          acc[groupKey].push(item);
          return acc;
        }, {});
        const groupKeys = Object.keys(groupedItems).map(Number).sort();

        if (moreLinks.length === 0) {
          return (
            <div className="p-6 text-neutral-500 dark:text-neutral-400 text-center w-full">
              No items available.
            </div>
          );
        }

        return (
          <div className="flex flex-wrap justify-start items-stretch gap-10 w-full">
            {groupKeys.map((groupIndex) => (
              <ul
                key={`more-group-${groupIndex}`}
                role="none"
                className="flex-1 basis-auto max-w-xs min-w-[280px] flex flex-col justify-end items-start"
              >
                {groupedItems[groupIndex].map((item) => (
                  <LinkItemDisplay
                    key={item.label}
                    item={item}
                    labelStyleClasses={moreLinkStyles}
                    iconSize={24}
                  />
                ))}
              </ul>
            ))}
            {/* Placeholder columns for alignment */}
            {[...Array(Math.max(0, 3 - groupKeys.length))].map((_, i) => (
              <div
                key={`placeholder-col-${i}`}
                className="flex-1 basis-auto max-w-xs min-w-[280px] hidden md:block"
                aria-hidden="true"
              ></div>
            ))}
          </div>
        );

      default:
        return (
          <div className="p-6 text-neutral-500 dark:text-neutral-400 text-center w-full">
            Invalid dropdown type.
          </div>
        );
    }
  };

  // Container for the content with padding
  return (
    <div className="max-w-7xl mx-auto w-full pb-10 px-4 lg:px-16">
      {" "}
      {/* Match NavBar padding */}
      {renderContent()}
    </div>
  );
};
DesktopDropdownContent.propTypes = {
  type: PropTypes.oneOf(["motorbikes", "scooters", "more"]).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["model", "link"]).isRequired,
      url: PropTypes.string,
      image: PropTypes.string, // Optional for models
      group: PropTypes.number, // Optional for 'more' links
    })
  ),
};

export default DesktopDropdownContent;
