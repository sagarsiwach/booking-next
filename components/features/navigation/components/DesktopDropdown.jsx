// components/features/navigation/components/DesktopDropdown.jsx
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import DesktopDropdownContent from "./DesktopDropdownContent"; // Import the content renderer
import PropTypes from "prop-types"; // Import prop-types

// Default animation values
const defaultAnimationConfig = {
  dropdownDuration: 0.4,
  dropdownExitDelay: 0.25,
  itemDuration: 0.3,
  itemStaggerDelay: 0.05,
  itemEntranceDelay: 0.1,
};

export const DesktopDropdown = React.forwardRef((props, ref) => {
  const {
    id,
    triggerId,
    type,
    items = [],
    // onItemClick, // Passed down to content if needed
    onMouseEnter,
    onMouseLeave,
    onKeyDown,
    animationConfig = defaultAnimationConfig,
    className,
    ...restProps
  } = props;

  // Animation Variants
  const variants = React.useMemo(
    () => ({
      dropdownVariants: {
        hidden: {
          opacity: 0,
          height: 0,
          transition: {
            duration: animationConfig.dropdownDuration * 0.5,
            ease: "easeIn",
            when: "afterChildren",
          },
        },
        visible: {
          opacity: 1,
          height: "auto",
          transition: {
            duration: animationConfig.dropdownDuration,
            ease: "easeOut",
            when: "beforeChildren",
          },
        },
        exit: {
          opacity: 0,
          height: 0,
          transition: {
            duration: animationConfig.dropdownDuration * 0.5,
            ease: "easeIn",
            delay: animationConfig.dropdownExitDelay,
            when: "afterChildren",
          },
        },
      },
      contentVariants: {
        hidden: { opacity: 0, transition: { duration: 0.1 } },
        visible: { opacity: 1, transition: { duration: 0.2, delay: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      },
    }),
    [animationConfig]
  );

  return (
    <motion.div
      // Cast ref type if needed for specific motion properties, otherwise basic ref is often fine
      ref={ref}
      id={id}
      role="menu"
      aria-labelledby={triggerId}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants.dropdownVariants}
      className={cn(
        "w-full absolute left-0 top-full",
        "bg-white dark:bg-neutral-950",
        "border-b border-neutral-300 dark:border-neutral-700",
        "shadow-lg overflow-hidden",
        "z-40 focus:outline-none",
        className
      )}
      style={{
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
      {...restProps}
    >
      <motion.div
        variants={variants.contentVariants}
        className="py-10" // Padding applied here
      >
        <DesktopDropdownContent
          type={type}
          items={items}
          // Pass props down if needed
        />
      </motion.div>
    </motion.div>
  );
});

DesktopDropdown.displayName = "DesktopDropdown";

DesktopDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  triggerId: PropTypes.string.isRequired,
  // isOpen prop removed as presence is handled by AnimatePresence
  type: PropTypes.oneOf(["motorbikes", "scooters", "more"]).isRequired,
  items: PropTypes.array,
  onItemClick: PropTypes.func, // Callback passed down if needed
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onKeyDown: PropTypes.func,
  animationConfig: PropTypes.object,
  className: PropTypes.string,
};

export default DesktopDropdown;
