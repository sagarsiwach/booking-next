// booking-next/components/features/navigation/components/DesktopDropdown.jsx
"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
// Import Carbon icons
import { ArrowRight, ArrowUpRight } from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

// Focus management helper (remains)
const focusFirstItem = (element) => {
  if (!element) return;
  const firstFocusable = element.querySelector(
    'a[role="menuitem"]:not([disabled])'
  );
  firstFocusable?.focus();
};

export const DesktopDropdown = React.forwardRef(
  (
    {
      id,
      triggerId,
      type,
      items = [], // Default items to an empty array
      onItemClick,
      onMouseEnter,
      onMouseLeave,
      onKeyDown,
      animationConfig = {
        dropdownDuration: 0.4,
        dropdownExitDelay: 0.25,
        itemDuration: 0.3,
        itemStaggerDelay: 0.05,
        itemEntranceDelay: 0.1,
      },
      className,
      ...restProps
    },
    ref
  ) => {
    // Animation variants
    const dropdownVariants = {
      hidden: {
        opacity: 0,
        height: 0,
        y: -10,
        transition: {
          duration: animationConfig.dropdownDuration * 0.5,
          ease: "easeIn",
          when: "afterChildren",
        },
      },
      visible: {
        opacity: 1,
        height: "auto",
        y: 0,
        transition: {
          duration: animationConfig.dropdownDuration,
          ease: "easeOut",
          when: "beforeChildren",
        },
      },
      exit: {
        opacity: 0,
        height: 0,
        y: -10,
        transition: {
          duration: animationConfig.dropdownDuration * 0.5,
          ease: "easeIn",
          delay: animationConfig.dropdownExitDelay,
        },
      },
    };
    const contentVariants = {
      hidden: { opacity: 1 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: animationConfig.itemStaggerDelay,
          delayChildren: animationConfig.itemEntranceDelay,
        },
      },
      exit: {
        opacity: 1,
        transition: {
          staggerChildren: animationConfig.itemStaggerDelay * 0.8,
          staggerDirection: -1,
        },
      },
    };
    const itemVariants = {
      hidden: { opacity: 0, y: -10, x: -10 },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: { duration: animationConfig.itemDuration, ease: "easeOut" },
      },
      exit: {
        opacity: 0,
        y: -10,
        x: -10,
        transition: {
          duration: animationConfig.itemDuration * 0.5,
          ease: "easeIn",
        },
      },
    };
    // --- End Animation Variants ---

    const dropdownRef = useRef(null);

    const renderContent = () => {
      // Safeguard against non-array items prop
      const validItems = Array.isArray(items) ? items : [];

      switch (type) {
        case "motorbikes":
        case "scooters": {
          const models = validItems.filter((item) => item?.type === "model");
          const links = validItems.filter((item) => item?.type === "link");

          if (models.length === 0 && links.length === 0) {
            return (
              <div className="p-4 text-neutral-500 dark:text-neutral-400 text-center w-full">
                No items available for this category.
              </div>
            );
          }

          return (
            // Use items-start on the main flex row
            <div className="flex flex-col md:flex-row items-start w-full gap-x-10 gap-y-5">
              {/* Models Section - Grid handles wrapping, items-end aligns cards within cells */}
              <ul
                role="none"
                // flex-1 allows grid to take available space
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-end flex-1"
              >
                {models.map((item) => (
                  <motion.li
                    key={item?.label || Math.random()} // Add fallback key
                    variants={itemVariants}
                    role="none"
                    className="flex flex-col justify-end group" // justify-end aligns content bottom
                  >
                    <motion.a
                      href={item?.url || "#"}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.preventDefault();
                        onItemClick?.(item);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onItemClick?.(item);
                        }
                      }}
                      className={cn(
                        "flex flex-col overflow-hidden", // Layout
                        "bg-white dark:bg-neutral-900", // Background
                        "transition-colors duration-150 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800", // Hover BG
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500", // Focus
                        "rounded-none"
                      )}
                      aria-label={item?.label}
                    >
                      {/* Image Area */}
                      <div className="w-full h-[240px] relative overflow-hidden mb-0 bg-neutral-100 dark:bg-neutral-800">
                        {item?.image ? (
                          <Image
                            src={item.image}
                            alt="" // Decorative
                            fill
                            style={{ objectFit: "cover" }} // Cover the area
                            className="p-0" // No padding for cover
                            loading="lazy"
                            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" // Responsive sizes hint
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 italic">
                            Image
                          </div>
                        )}
                      </div>
                      {/* Text Area */}
                      <div className="w-full p-5 flex justify-between items-center">
                        <span className="text-neutral-700 dark:text-neutral-200 text-[30px] font-semibold tracking-[-0.04em]">
                          {item?.label}
                        </span>
                        <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-neutral-700 dark:text-neutral-300">
                          <ArrowRight size={24} aria-hidden="true" />{" "}
                          {/* Carbon Icon */}
                        </span>
                      </div>
                    </motion.a>
                  </motion.li>
                ))}
              </ul>

              {/* Links Section */}
              <ul
                role="none"
                // justify-end aligns the list items (li > a) to the bottom of this column
                className="w-full md:w-80 flex-shrink-0 flex flex-col justify-end items-start mt-5 md:mt-0"
              >
                {links.map((item) => (
                  <motion.li
                    key={item?.label || Math.random()}
                    variants={itemVariants}
                    role="none"
                    className="self-stretch"
                  >
                    <motion.a
                      href={item?.url || "#"}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.preventDefault();
                        onItemClick?.(item);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onItemClick?.(item);
                        }
                      }}
                      className={cn(
                        "p-4 flex justify-between items-center cursor-pointer self-stretch", // Layout
                        "transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800", // Hover
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500", // Focus
                        "border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-600" // Hover border
                      )}
                      aria-label={item?.label}
                    >
                      {/* Styling matches secondary links */}
                      <span className="text-neutral-500 dark:text-neutral-400 text-2xl font-normal tracking-[-0.04em]">
                        {item?.label}
                      </span>
                      <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-neutral-700 dark:text-neutral-300">
                        <ArrowUpRight size={20} aria-hidden="true" />{" "}
                        {/* Carbon Icon */}
                      </span>
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </div>
          );
        }

        case "more": {
          // Use validItems instead of items
          const moreItems = validItems.filter(
            (item) => item?.type === "link" && typeof item?.group === "number"
          );

          if (moreItems.length === 0) {
            return (
              <div className="p-4 text-neutral-500 dark:text-neutral-400 text-center w-full">
                No items available for this category.
              </div>
            );
          }

          const groupedItems = moreItems.reduce((acc, item) => {
            const groupKey = item.group;
            if (groupKey !== undefined) {
              acc[groupKey] = acc[groupKey] || [];
              acc[groupKey].push(item);
            }
            return acc;
          }, {});

          const groupKeys = Object.keys(groupedItems).map(Number).sort();

          return (
            // Use grid layout for 'More' section, items-end aligns columns bottom
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-5 w-full items-end">
              {groupKeys.map((groupIndex) => (
                // Each group is a grid item, internally aligning its links to bottom
                <ul
                  key={`more-group-${groupIndex}`}
                  role="none"
                  // flex flex-col justify-end aligns li items bottom within this column/cell
                  className="flex flex-col justify-end items-start"
                >
                  {groupedItems[groupIndex].map((item) => (
                    <motion.li
                      key={item?.label || Math.random()}
                      variants={itemVariants}
                      role="none"
                      className="self-stretch w-full"
                    >
                      {" "}
                      {/* Ensure li takes full width */}
                      <motion.a
                        href={item?.url || "#"}
                        role="menuitem"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.preventDefault();
                          onItemClick?.(item);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onItemClick?.(item);
                          }
                        }}
                        className={cn(
                          // Padding adjusted
                          "p-3 flex justify-between items-center cursor-pointer self-stretch",
                          "transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500",
                          "border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"
                        )}
                        aria-label={item?.label}
                      >
                        {/* Styling matches secondary links */}
                        <span className="text-neutral-500 dark:text-neutral-400 text-2xl font-normal tracking-[-0.04em]">
                          {item?.label}
                        </span>
                        <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-neutral-700 dark:text-neutral-300">
                          <ArrowUpRight size={20} aria-hidden="true" />{" "}
                          {/* Carbon Icon */}
                        </span>
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              ))}
              {/* Grid handles empty space automatically */}
            </div>
          );
        }

        default:
          console.warn("DesktopDropdown: Invalid type provided:", type);
          return (
            <div className="p-4 text-neutral-500 dark:text-neutral-400 text-center w-full">
              Invalid dropdown category type.
            </div>
          );
      }
    };

    // Outer container - height is auto, no min-height
    return (
      <motion.div
        ref={dropdownRef}
        id={id}
        role="menu"
        aria-labelledby={triggerId}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={dropdownVariants}
        className={cn(
          "w-full absolute left-0 top-[81px]", // Position below navbar
          "bg-white dark:bg-neutral-950 overflow-hidden", // BG and overflow
          "z-40 focus:outline-none", // Stacking and focus
          "shadow-lg", // Shadow
          "border-b border-neutral-300 dark:border-neutral-700", // Bottom border
          className
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
        {...restProps}
      >
        {/* Inner container - full width with padding */}
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mx-auto w-full py-6 px-4 lg:px-16" // Full width, padding adjusted
        >
          {renderContent()}
        </motion.div>
      </motion.div>
    );
  }
);

DesktopDropdown.displayName = "DesktopDropdown";

// PropTypes remain the same
DesktopDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  triggerId: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["motorbikes", "scooters", "more"]).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["model", "link"]).isRequired,
      url: PropTypes.string,
      image: PropTypes.string,
      group: PropTypes.number,
    })
  ),
  onItemClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onKeyDown: PropTypes.func,
  animationConfig: PropTypes.object,
  className: PropTypes.string,
};

export default DesktopDropdown;
