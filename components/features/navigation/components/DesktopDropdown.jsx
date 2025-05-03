// components/features/navigation/components/DesktopDropdown.jsx
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// FocusRingWrapper Helper (Optional - can use Tailwind focus-visible directly on items)
// If using, define it here or import from a shared utility file
const FocusRingWrapper = ({
  children,
  focusStyleClasses = "focus-visible:ring-2 focus-visible:ring-ring",
  ...props
}) => {
  const [isFocusedVisible, setIsFocusedVisible] = React.useState(false);
  const isPointerDown = React.useRef(false);
  const handlePointerDown = React.useCallback(() => {
    isPointerDown.current = true;
  }, []);
  const handleFocus = React.useCallback(() => {
    if (!isPointerDown.current) setIsFocusedVisible(true);
    isPointerDown.current = false;
  }, []);
  const handleBlur = React.useCallback(() => {
    setIsFocusedVisible(false);
    isPointerDown.current = false;
  }, []);

  return React.cloneElement(React.Children.only(children), {
    onPointerDown: handlePointerDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: cn(
      children.props.className,
      isFocusedVisible && focusStyleClasses
    ),
    ...props,
  });
};

// ----- Sub Components -----

const ModelItemDisplay = ({ item, onItemClickInternal, variants }) => {
  const MotionLink = motion(Link);
  return (
    <motion.li variants={variants.itemVariants} role="none">
      {/* Apply focus ring directly to the Link */}
      <MotionLink
        href={item.url || "#"}
        role="menuitem"
        tabIndex={-1}
        className={cn(
          "flex flex-col group rounded-none overflow-hidden", // No rounding
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background" // Focus Ring
        )}
        onClick={(e) => onItemClickInternal(item, e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemClickInternal(item, e);
          }
        }}
        prefetch={false}
      >
        <div className="w-full aspect-[16/9] relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.label}
              layout="fill"
              objectFit="contain"
              className="p-2"
              loading="lazy"
              unoptimized={!item.image?.includes("cloudinary")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 italic">
              Image
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-full p-4 sm:p-5 bg-white dark:bg-neutral-900",
            "flex justify-between items-center",
            "transition-colors duration-150 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800"
          )}
        >
          <span className="text-neutral-700 dark:text-neutral-200 text-xl sm:text-2xl md:text-[30px] font-semibold tracking-[-0.04em] leading-tight">
            {item.label}
          </span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 dark:text-neutral-300 flex-shrink-0" />
        </div>
      </MotionLink>
    </motion.li>
  );
};

const LinkItemDisplay = ({
  item,
  onItemClickInternal,
  variants,
  baseStyleClasses,
  labelStyleClasses,
  iconSize = 20,
}) => {
  const MotionLink = motion(Link);
  return (
    <motion.li variants={variants.itemVariants} role="none">
      {/* Apply focus ring directly to the Link */}
      <MotionLink
        href={item.url || "#"}
        role="menuitem"
        tabIndex={-1}
        className={cn(
          baseStyleClasses, // Base padding, flex etc.
          "transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800", // Hover BG
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background" // Focus Ring
        )}
        onClick={(e) => onItemClickInternal(item, e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemClickInternal(item, e);
          }
        }}
        prefetch={false}
      >
        <span className={cn(labelStyleClasses)}>{item.label}</span>
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 relative">
          <ExternalLink
            className="w-5 h-5 text-neutral-700 dark:text-neutral-300"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      </MotionLink>
    </motion.li>
  );
};

// ----- Main Component -----

export const DesktopDropdown = React.forwardRef(
  (
    {
      id,
      triggerId,
      // isOpen prop is not needed as visibility is controlled by AnimatePresence
      type,
      items = [],
      onItemClick, // Callback from parent
      onMouseEnter,
      onMouseLeave,
      onKeyDown, // For keyboard nav within dropdown
      animationConfig = {
        // Default animation values
        dropdownDuration: 0.4,
        dropdownExitDelay: 0.25,
        itemDuration: 0.3,
        itemStaggerDelay: 0.05,
        itemEntranceDelay: 0.1,
      },
      // Style props could be added here if needed, but using Tailwind is preferred
    },
    ref
  ) => {
    const dropdownRefInternal = React.useRef(null);

    // Combine forwarded ref with internal ref
    const combinedRef = React.useMemo(
      () => (node) => {
        dropdownRefInternal.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    // Internal click handler to prevent default for '#' links
    const handleItemClickInternal = React.useCallback(
      (item, event) => {
        if (!item.url || item.url === "#") {
          event.preventDefault();
        }
        onItemClick(item); // Call the parent handler
      },
      [onItemClick]
    );

    // Animation Variants
    const variants = React.useMemo(
      () => ({
        dropdownVariants: {
          hidden: {
            opacity: 0,
            y: -10,
            transition: {
              duration: animationConfig.dropdownDuration * 0.5,
              ease: "easeIn",
            },
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: animationConfig.dropdownDuration,
              ease: "easeOut",
            },
          },
          exit: {
            opacity: 0,
            y: -10,
            transition: {
              duration: animationConfig.dropdownDuration * 0.5,
              ease: "easeIn",
              delay: animationConfig.dropdownExitDelay,
            },
          },
        },
        contentContainerVariants: {
          initial: { opacity: 1 },
          animate: {
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
        },
        itemVariants: {
          initial: { opacity: 0, y: -10 },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              duration: animationConfig.itemDuration,
              ease: "easeOut",
            },
          },
          exit: {
            opacity: 0,
            y: -10,
            transition: {
              duration: animationConfig.itemDuration * 0.5,
              ease: "easeIn",
            },
          },
        },
      }),
      [animationConfig]
    );

    // --- RENDER LOGIC ---
    const renderDropdownContent = () => {
      switch (type) {
        case "motorbikes":
        case "scooters":
          const models = items.filter((item) => item.type === "model");
          const links = items.filter((item) => item.type === "link");
          if (models.length === 0 && links.length === 0) {
            return (
              <div className="p-6 text-neutral-500 dark:text-neutral-400 text-center">
                No items available.
              </div>
            );
          }
          return (
            <motion.div
              key={type} // Ensure key changes for AnimatePresence
              variants={variants.contentContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col md:flex-row justify-start items-stretch gap-2.5 max-w-7xl mx-auto w-full pb-10 px-4 lg:px-16" // Match NavBar padding
            >
              {/* Models Section */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-auto items-end">
                {models.map((item) => (
                  <ModelItemDisplay
                    key={item.label}
                    item={item}
                    onItemClickInternal={handleItemClickInternal}
                    variants={variants}
                  />
                ))}
              </ul>
              {/* Links Section */}
              {links.length > 0 && (
                <ul className="w-full md:w-80 flex-shrink-0 flex flex-col justify-end items-start mt-5 md:mt-0 md:pt-[240px] lg:pt-[260px]">
                  {" "}
                  {/* Adjust top padding to align */}
                  {links.map((item) => (
                    <LinkItemDisplay
                      key={item.label}
                      item={item}
                      onItemClickInternal={handleItemClickInternal}
                      variants={variants}
                      baseStyleClasses="self-stretch py-[15px] px-2.5 flex justify-between items-center cursor-pointer"
                      labelStyleClasses="text-neutral-500 dark:text-neutral-400 text-2xl font-normal tracking-[-0.04em]"
                    />
                  ))}
                </ul>
              )}
            </motion.div>
          );

        case "more":
          const moreItems = items.filter(
            (item) => item.type === "link" && typeof item.group === "number"
          );
          const groupedItems = moreItems.reduce((acc, item) => {
            const groupKey = item.group ?? 0;
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(item);
            return acc;
          }, {});
          const groupKeys = Object.keys(groupedItems).map(Number).sort();

          if (moreItems.length === 0) {
            return (
              <div className="p-6 text-neutral-500 dark:text-neutral-400 text-center">
                No items available.
              </div>
            );
          }
          return (
            <motion.div
              key={type}
              variants={variants.contentContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-wrap justify-start items-stretch gap-10 max-w-7xl mx-auto w-full pb-10 px-4 lg:px-16" // Match NavBar padding
            >
              {groupKeys.map((groupIndex) => (
                <ul
                  key={`more-group-${groupIndex}`}
                  className="flex-1 basis-auto max-w-xs min-w-[280px] flex flex-col justify-end items-start"
                >
                  {groupedItems[groupIndex].map((item) => (
                    <LinkItemDisplay
                      key={item.label}
                      item={item}
                      onItemClickInternal={handleItemClickInternal}
                      variants={variants}
                      baseStyleClasses="self-stretch p-4 flex justify-between items-center cursor-pointer"
                      labelStyleClasses="text-neutral-700 dark:text-neutral-200 text-[30px] font-semibold tracking-[-0.04em]"
                      iconSize={24}
                    />
                  ))}
                </ul>
              ))}
              {/* Placeholder columns for alignment if needed */}
              {[...Array(Math.max(0, 2 - groupKeys.length))].map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="flex-1 basis-auto max-w-xs min-w-[280px] hidden md:block"
                  aria-hidden="true"
                ></div>
              ))}
            </motion.div>
          );

        default:
          return (
            <div className="p-6 text-neutral-500 dark:text-neutral-400 text-center">
              Invalid dropdown type.
            </div>
          );
      }
    };

    return (
      // This outer motion.div handles the main container animation (height, opacity, y-offset)
      <motion.div
        ref={combinedRef}
        id={id}
        role="menu"
        aria-labelledby={triggerId}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants.dropdownVariants}
        className={cn(
          "w-full absolute left-0 top-full", // Positioned below NavBar
          "bg-white dark:bg-neutral-950", // Background
          "border-b border-neutral-300 dark:border-neutral-700", // Bottom border
          "shadow-lg overflow-hidden", // Shadow and hide overflow
          "z-40 focus:outline-none" // Stacking and focus
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown} // Handle keyboard nav within
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {renderDropdownContent()}
      </motion.div>
    );
  }
);

DesktopDropdown.displayName = "DesktopDropdown";
export default DesktopDropdown;
