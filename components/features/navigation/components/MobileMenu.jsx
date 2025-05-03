// components/features/navigation/components/MobileMenu.jsx
"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react"; // Added useCallback
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types"; // Import prop-types

// Mimicking Design Tokens with Tailwind
const mobileDesignTokenMap = {
  colors: {
    neutral: {
      50: "hover:bg-neutral-50 dark:hover:bg-neutral-800",
      200: "bg-neutral-200 dark:bg-neutral-900",
      300: "border-neutral-300 dark:border-neutral-700",
      400: "border-neutral-400 dark:border-neutral-600",
      500: "text-neutral-500 dark:text-neutral-400 ring-neutral-500", // Added ring color class
      700: "text-neutral-700 dark:text-neutral-200",
      900: "text-neutral-900 dark:text-neutral-100",
    },
    white: "bg-white dark:bg-black",
  },
  spacing: {
    2.5: "px-2.5",
    4: "mt-4",
    5: "p-5",
    6: "pt-6",
    8: "size-8",
    24: "pb-24",
  },
  fontWeight: {
    regular: "font-normal", // 400
    semibold: "font-semibold", // 600
  },
  boxShadow: {
    lg: "shadow-lg",
  },
  zIndex: {
    110: "z-[110]",
    120: "z-[120]",
    130: "z-[130]",
  },
};

// Default Animation Config
const defaultMobileAnimationConfig = {
  drawerDuration: 0.4,
  drawerExitDelay: 0.35,
  listTransitionDuration: 0.3,
  itemDuration: 0.3,
  itemStaggerDelay: 0.05,
  itemEntranceDelay: 0.1,
  titleDuration: 0.3,
  bottomButtonDuration: 0.3,
};

// Focus ring classes
const focusRingDarkBg =
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-neutral-200 dark:focus-visible:ring-offset-neutral-900";
const focusRingLightBg =
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black";

export const MobileMenu = ({
  isOpen,
  onClose,
  navItems = [],
  onItemClick,
  activeSubmenu,
  animationConfig = defaultMobileAnimationConfig,
}) => {
  const scrollContainerRef = useRef(null);
  const menuRef = useRef(null);

  // Scroll to top when submenu changes
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [activeSubmenu]);

  // Focus trapping and Escape key handling
  useEffect(() => {
    const handleEscape = (e) => {
      // Removed type annotation
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      const timer = setTimeout(() => {
        menuRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // --- Animation Variants ---
  const easeInQuint = [0.6, 0.05, 0.01, 0.9];
  const easeOutExpo = [0.16, 1, 0.3, 1];

  const variants = useMemo(
    () => ({
      drawerVariants: {
        hidden: {
          x: "100%",
          transition: {
            type: "tween",
            duration: animationConfig.drawerDuration * 0.75,
            ease: easeInQuint,
          },
        },
        visible: {
          x: 0,
          transition: {
            type: "tween",
            duration: animationConfig.drawerDuration,
            ease: easeOutExpo,
          },
        },
        exit: {
          x: "100%",
          transition: {
            type: "tween",
            duration: animationConfig.drawerDuration * 0.75,
            ease: easeInQuint,
            delay: animationConfig.drawerExitDelay,
          },
        },
      },
      listContainerVariants: {
        initial: { opacity: 1, x: 0 }, // Start visible for transitions
        animate: {
          opacity: 1,
          x: 0,
          transition: {
            delayChildren: animationConfig.itemEntranceDelay,
            staggerChildren: animationConfig.itemStaggerDelay,
            duration: animationConfig.listTransitionDuration,
            ease: "easeOut",
          },
        },
        exit: {
          opacity: 1,
          x: 0,
          transition: {
            staggerChildren: animationConfig.itemStaggerDelay,
            staggerDirection: -1,
            duration: animationConfig.listTransitionDuration * 0.66,
            ease: "easeIn",
            when: "afterChildren",
          },
        },
      },
      itemVariants: {
        initial: { opacity: 0, x: 30 },
        animate: {
          opacity: 1,
          x: 0,
          transition: {
            duration: animationConfig.itemDuration,
            ease: "easeOut",
          },
        },
        exit: {
          opacity: 0,
          x: -30,
          transition: {
            duration: animationConfig.itemDuration * 0.66,
            ease: "easeIn",
          },
        },
      },
      titleVariants: {
        initial: { opacity: 0, y: -10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { delay: 0.1, duration: animationConfig.titleDuration },
        },
        exit: {
          opacity: 0,
          y: -5,
          transition: { duration: animationConfig.titleDuration * 0.5 },
        },
      },
      bottomButtonVariants: {
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            delay:
              animationConfig.itemEntranceDelay +
              animationConfig.itemStaggerDelay * 3,
            duration: animationConfig.bottomButtonDuration,
            ease: "easeOut",
          },
        },
        exit: {
          opacity: 0,
          y: 10,
          transition: { duration: animationConfig.bottomButtonDuration * 0.5 },
        },
      },
    }),
    [animationConfig]
  );

  // --- Icon Renderer ---
  const renderIcon = useCallback((item) => {
    // Removed type annotation
    const iconSize = item.icon === "right" ? 16 : 20; // Smaller chevron
    const IconComponent =
      item.icon === "more"
        ? MoreHorizontal
        : item.icon === "topRight"
        ? ExternalLink
        : item.hasChildren || item.icon === "right"
        ? ChevronRight
        : null;

    return IconComponent ? (
      <IconComponent
        className={cn(
          "flex-shrink-0",
          item.variant === "mobileSubItem"
            ? "size-4 text-neutral-500"
            : "size-5 text-neutral-500" // Adjusted size/color
        )}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    ) : (
      <div className="w-5 h-5 flex-shrink-0"></div>
    ); // Placeholder for alignment
  }, []); // Empty dependency array if it doesn't depend on external state/props

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          key="mobile-menu-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Main Menu"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants.drawerVariants}
          className={cn(
            "fixed inset-y-0 right-0 w-full md:w-[400px]",
            mobileDesignTokenMap.zIndex[110],
            mobileDesignTokenMap.colors.neutral[200],
            "flex flex-col overflow-hidden",
            "antialiased outline-none"
          )}
          tabIndex={-1}
        >
          {/* Header */}
          <div className={cn("relative flex-shrink-0 px-5 pt-6")}>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={onClose}
              className={cn(
                "absolute top-6 right-5",
                "size-8 rounded-md",
                mobileDesignTokenMap.colors.neutral[900],
                focusRingDarkBg
              )}
            >
              <X className="size-5" />
            </Button>

            {/* Title Area */}
            <div
              className={cn(
                "mt-4 min-h-[70px] relative overflow-hidden w-full",
                "border-b",
                mobileDesignTokenMap.colors.neutral[400],
                "px-2.5 py-[15px]",
                "flex items-center"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSubmenu || "main-title"}
                  variants={variants.titleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex items-center"
                >
                  <h2
                    className={cn(
                      "text-4xl font-semibold tracking-tighter leading-tight",
                      mobileDesignTokenMap.colors.neutral[900]
                    )}
                  >
                    {activeSubmenu || "Menu"}
                  </h2>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-grow overflow-y-auto overflow-x-hidden",
              "px-5 pb-24" // Match PADDING_X_CONTAINER and PADDING_BOTTOM_SCROLL
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubmenu || "main-list"}
                variants={variants.listContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn("w-full relative pb-5")}
                role="menu"
                aria-label={activeSubmenu || "Main menu"}
              >
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label + index + (activeSubmenu || "main")}
                    variants={variants.itemVariants}
                    role="none"
                    className={cn(
                      "border-b last:border-b-0",
                      mobileDesignTokenMap.colors.neutral[400] // Divider color
                    )}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={cn(
                        "py-[15px] px-2.5",
                        "flex justify-between items-center cursor-pointer w-full text-left",
                        "focus:outline-none rounded-md",
                        mobileDesignTokenMap.colors.neutral[50], // Hover background
                        focusRingDarkBg, // Focus style
                        item.variant === "mobileSubItem" ? "pl-4" : "" // Indentation
                      )}
                      onClick={() => onItemClick(item)}
                      aria-label={item.label}
                    >
                      <span
                        className={cn(
                          "pr-2.5 leading-snug tracking-tighter", // Base label style
                          // Apply specific text styles based on state/variant
                          !activeSubmenu
                            ? "text-4xl font-semibold text-neutral-900 dark:text-neutral-100" // Root item style
                            : activeSubmenu.toLowerCase() === "more"
                            ? "text-3xl font-semibold text-neutral-700 dark:text-neutral-200" // 'More' submenu style
                            : item.variant === "mobileChild"
                            ? "text-3xl font-semibold text-neutral-700 dark:text-neutral-200" // Product submenu style
                            : "text-2xl font-normal text-neutral-500 dark:text-neutral-400" // Default/Secondary link style
                        )}
                      >
                        {item.label}
                      </span>
                      {(item.icon || item.hasChildren) && renderIcon(item)}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Back/Close Button */}
          <motion.div
            key="bottom-button-container"
            variants={variants.bottomButtonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "absolute bottom-5 left-5 right-5",
              "flex justify-center",
              mobileDesignTokenMap.zIndex[120]
            )}
          >
            <Button
              variant="outline"
              onClick={
                activeSubmenu ? () => onItemClick({ back: true }) : onClose
              }
              aria-label={activeSubmenu ? "Back" : "Close menu"}
              className={cn(
                "inline-flex items-center justify-center gap-2.5 px-5 py-2.5",
                "rounded-full",
                mobileDesignTokenMap.boxShadow.lg,
                mobileDesignTokenMap.colors.white,
                "border",
                mobileDesignTokenMap.colors.neutral[300],
                "text-neutral-700 dark:text-neutral-200",
                "text-xl font-normal",
                focusRingLightBg
              )}
            >
              <motion.span
                className="flex items-center justify-center size-5"
                animate={{ rotate: activeSubmenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeSubmenu ? (
                  <ArrowLeft className="size-4" aria-hidden="true" />
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
              </motion.span>
              <span>{activeSubmenu ? "Back" : "Close"}</span>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

MobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      hasChildren: PropTypes.bool,
      icon: PropTypes.oneOf(["right", "topRight", "more"]),
      variant: PropTypes.oneOf(["mobile", "mobileChild", "mobileSubItem"]),
      url: PropTypes.string,
      back: PropTypes.bool,
    })
  ),
  onItemClick: PropTypes.func.isRequired,
  activeSubmenu: PropTypes.string.isRequired,
  animationConfig: PropTypes.object, // Add more specific shape if needed
};

export default MobileMenu;
