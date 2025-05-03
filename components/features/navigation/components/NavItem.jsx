// components/features/navigation/components/NavItem.jsx
"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types"; // Import prop-types

// Mimicking Design Tokens with Tailwind - Adjust these mappings as needed!
const designTokenMap = {
  colors: {
    neutral: {
      100: "bg-neutral-100 dark:bg-neutral-800", // bg-colorHoverFocus
      500: "ring-neutral-500", // focusRingColor (used with ring-offset)
      700: "text-neutral-700 dark:text-neutral-200", // colorDefault
      900: "text-neutral-900 dark:text-neutral-50", // colorHoverFocus, colorActiveExpanded
    },
    white: "bg-white dark:bg-black", // Used for ring offset
    blue: {
      500: "ring-blue-500", // Optional focus color
    },
  },
  spacing: {
    1.5: "py-1.5", // ~6px vertical padding
    3: "px-3", // ~12px horizontal padding
  },
  fontWeight: {
    medium: "font-medium",
  },
  transitionDuration: {
    150: "duration-150",
  },
};

export const NavItem = React.forwardRef((props, ref) => {
  // Remove type annotations from props destructuring
  const {
    id,
    label,
    isActive = false,
    hasPopup = false,
    isExpanded = false,
    controlsId,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onKeyDown,
    href = "#",
    role,
    className,
    // Destructure style props used for mapping
    fontWeight = designTokenMap.fontWeight.medium,
    colorDefault = designTokenMap.colors.neutral[700],
    colorHoverFocus = designTokenMap.colors.neutral[900],
    colorActiveExpanded = designTokenMap.colors.neutral[900],
    bgColorHoverFocus = designTokenMap.colors.neutral[100],
    focusRingColor = designTokenMap.colors.neutral[500],
    // Destructure unused style props to avoid passing them down if not needed
    fontFamily, // Usually handled globally
    fontSize = 16, // Keep for potential mapping logic if needed, but not directly used
    ...restProps
  } = props;

  const [isFocusedVisible, setIsFocusedVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const isPointerDown = React.useRef(false);

  const isEffectivelyActive = isActive || isExpanded;
  const showInteractiveState =
    !isEffectivelyActive && (isHovered || isFocusedVisible);

  // --- Event Handlers ---
  const handlePointerDown = React.useCallback(() => {
    isPointerDown.current = true;
  }, []);
  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);
  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    isPointerDown.current = false;
    onMouseLeave?.();
  }, [onMouseLeave]);
  const handleFocus = React.useCallback(() => {
    if (!isPointerDown.current) {
      setIsFocusedVisible(true);
    }
    isPointerDown.current = false;
    onFocus?.();
  }, [onFocus]);
  const handleBlur = React.useCallback(() => {
    setIsFocusedVisible(false);
    isPointerDown.current = false;
    onBlur?.();
  }, [onBlur]);

  // --- Tailwind Class Generation ---
  const navItemClasses = cn(
    "relative flex items-center justify-center", // Base layout
    "cursor-pointer whitespace-nowrap", // Interaction & text handling
    "px-3 py-1.5", // Padding
    "text-sm", // Base text size
    fontWeight, // Apply font weight class
    "tracking-tight",
    "transition-colors ease-out",
    designTokenMap.transitionDuration["150"],
    "focus:outline-none",
    "rounded-none",

    // Default State Color
    !isEffectivelyActive && !showInteractiveState && colorDefault,

    // Hover/Focus State
    showInteractiveState && [colorHoverFocus, bgColorHoverFocus],

    // Active/Expanded State
    isEffectivelyActive && colorActiveExpanded,

    // Focus Visible Ring
    isFocusedVisible && [
      "ring-2 ring-offset-1",
      focusRingColor,
      "ring-offset-background",
    ],

    className
  );

  const LinkComponent = motion(Link); // Use motion-wrapped Link

  return (
    <LinkComponent
      ref={ref}
      id={id}
      href={href}
      role={role}
      aria-haspopup={hasPopup ? "menu" : undefined}
      aria-expanded={hasPopup ? isExpanded : undefined}
      aria-controls={hasPopup ? controlsId : undefined}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      onPointerDown={handlePointerDown}
      className={navItemClasses}
      tabIndex={0} // Ensure tabbable
      prefetch={false}
      transition={{ duration: 0.15, ease: "easeOut" }}
      {...restProps}
    >
      <span>{label}</span>
      {/* Add dropdown indicator if needed */}
      {/* {hasPopup && <ChevronDown className={...} />} */}
    </LinkComponent>
  );
});

NavItem.displayName = "NavItem";

// Add PropTypes for runtime checking in JavaScript
NavItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  hasPopup: PropTypes.bool,
  isExpanded: PropTypes.bool,
  controlsId: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  href: PropTypes.string,
  role: PropTypes.string,
  className: PropTypes.string,
  fontWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  colorDefault: PropTypes.string,
  colorHoverFocus: PropTypes.string,
  colorActiveExpanded: PropTypes.string,
  bgColorHoverFocus: PropTypes.string,
  focusRingColor: PropTypes.string,
  fontFamily: PropTypes.string, // Optional prop
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Optional prop
};

export default NavItem;
