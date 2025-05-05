// booking-next/components/features/navigation/components/MobileMenu.jsx
"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Import Carbon icons
import {
  ChevronRight,
  ArrowUpRight, // For external links
  OverflowMenuHorizontal, // For 'More' (ellipsis)
  Close, // For 'X'
  ArrowLeft,
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

export const MobileMenu = ({
  isOpen,
  onClose,
  navItems = [],
  onItemClick,
  activeSubmenu,
}) => {
  const scrollContainerRef = useRef(null);
  const menuRef = useRef(null);

  // Scroll to top when submenu changes
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    });
  }, [activeSubmenu]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Animation variants
  const drawerVariants = {
    hidden: {
      x: "100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: [0.6, 0.05, 0.01, 0.9],
      },
    },
    visible: {
      x: 0,
      transition: { type: "tween", duration: 0.4, ease: [0.0, 0.0, 0.2, 1] },
    },
    exit: {
      x: "100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: [0.6, 0.05, 0.01, 0.9],
        delay: 0.35,
      },
    },
  };

  const listContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
    exit: {
      opacity: 1,
      transition: { staggerChildren: 0.04, staggerDirection: -1 },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, x: 30 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const titleVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } },
    exit: { opacity: 0, y: -5, transition: { duration: 0.15 } },
  };

  const bottomButtonVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
  };
  // --- End Animation Variants ---

  // Icon rendering helper function using Carbon Icons
  const renderIcon = (item) => {
    const iconSize = 20; // Consistent size for mobile nav icons
    const iconClasses =
      "flex-shrink-0 w-5 h-5 text-neutral-500 dark:text-neutral-400";

    if (item.icon === "more") {
      // Use OverflowMenuHorizontal for 'more'
      return (
        <OverflowMenuHorizontal
          size={iconSize}
          className={iconClasses}
          aria-hidden="true"
        />
      );
    } else if (item.icon === "topRight") {
      // Use ArrowUpRight for external links
      return (
        <ArrowUpRight
          size={iconSize}
          className={iconClasses}
          aria-hidden="true"
        />
      );
    } else if (item.hasChildren || item.icon === "right") {
      return (
        <ChevronRight
          size={iconSize}
          className={iconClasses}
          aria-hidden="true"
        />
      );
    }
    // Return a placeholder div if no specific icon matches to maintain alignment
    return <div className="w-5 h-5 flex-shrink-0" />;
  };

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
          variants={drawerVariants}
          className={cn(
            "fixed inset-y-0 right-0 w-full md:w-[400px]",
            "z-[110] bg-neutral-200 dark:bg-neutral-900",
            "flex flex-col overflow-hidden", // Keeps parent as flex column
            "antialiased outline-none"
          )}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="relative flex-shrink-0 px-5 pt-6">
            {/* Close Button */}
            <button
              className={cn(
                "absolute top-6 right-5 z-[130]",
                "w-8 h-8",
                "flex items-center justify-center",
                "text-neutral-900 dark:text-neutral-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-200 dark:focus-visible:ring-offset-neutral-900"
              )}
              onClick={onClose}
              aria-label="Close menu"
              type="button"
            >
              {/* Replace Lucide X with Carbon Close */}
              <Close size={20} aria-hidden="true" />
            </button>

            {/* Title Area */}
            <div className="h-[70px]">
              <AnimatePresence mode="wait">
                {activeSubmenu && (
                  <motion.div
                    key={`title-${activeSubmenu}`}
                    variants={titleVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="pt-10 pb-2.5 border-b border-neutral-400 dark:border-neutral-600 mb-5"
                  >
                    <h2 className="text-neutral-900 dark:text-neutral-100 text-[30px] font-semibold tracking-[-0.04em] leading-tight m-0">
                      {activeSubmenu}
                    </h2>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div
            ref={scrollContainerRef}
            className="flex-grow overflow-y-auto overflow-x-hidden px-5 pb-24 relative flex flex-col" // Added flex flex-col here
          >
            <motion.div
              key={activeSubmenu || "main"}
              variants={listContainerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full mt-auto" // Pushes content down if space allows
              role="menu"
              aria-label={activeSubmenu || "Main menu"}
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label + index}
                  variants={itemVariants}
                  role="none"
                  className="border-b border-neutral-400 dark:border-neutral-600 last:border-b-0"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      "py-[15px] px-2.5", // Item padding
                      "flex justify-between items-center cursor-pointer w-full text-left",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-200 dark:focus-visible:ring-offset-neutral-900 focus-visible:ring-neutral-500", // Focus state
                      "hover:bg-neutral-100 dark:hover:bg-neutral-800", // Hover state
                      item.variant === "mobileSubItem" && "pl-4" // Indentation for sub-items
                    )}
                    onClick={() => onItemClick(item)}
                    aria-label={item.label}
                  >
                    <span
                      className={cn(
                        "pr-2.5 leading-snug tracking-[-0.04em]",
                        // Text styles based on state/variant
                        !activeSubmenu
                          ? "text-4xl font-semibold text-neutral-900 dark:text-neutral-100" // Root item
                          : activeSubmenu.toLowerCase() === "more"
                          ? "text-3xl font-semibold text-neutral-700 dark:text-neutral-200" // 'More' submenu
                          : item.variant === "mobileChild"
                          ? "text-3xl font-semibold text-neutral-700 dark:text-neutral-200" // Product submenu
                          : "text-2xl font-normal text-neutral-500 dark:text-neutral-400" // Secondary link
                      )}
                    >
                      {item.label}
                    </span>
                    {/* Render Carbon Icon */}
                    {(item.icon || item.hasChildren) && renderIcon(item)}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Back/Close Button */}
          <motion.div
            key="bottom-button-container"
            variants={bottomButtonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[120]" // Centered button
          >
            <button
              type="button"
              className={cn(
                "flex items-center py-2.5 px-5",
                "bg-white dark:bg-neutral-800",
                "rounded-full shadow-lg", // Keep rounded for this button only
                "border border-neutral-300 dark:border-neutral-700",
                "gap-2.5 cursor-pointer",
                "text-neutral-700 dark:text-neutral-200 text-lg font-medium tracking-[-0.02em] leading-none", // Text style
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-200 dark:focus-visible:ring-offset-neutral-800" // Focus state
              )}
              onClick={
                activeSubmenu ? () => onItemClick({ back: true }) : onClose
              }
              aria-label={activeSubmenu ? "Go back" : "Close menu"}
            >
              <motion.span
                className={cn(
                  "w-5 h-5 flex items-center justify-center", // Icon wrapper
                  "text-neutral-700 dark:text-neutral-200"
                )}
                // Animate rotation if needed, but maybe not for back/close
                // animate={{ rotate: activeSubmenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeSubmenu ? (
                  // Replace Lucide ArrowLeft with Carbon ArrowLeft
                  <ArrowLeft size={16} aria-hidden="true" />
                ) : (
                  // Replace Lucide X with Carbon Close
                  <Close size={16} aria-hidden="true" />
                )}
              </motion.span>
              <span>
                {" "}
                {/* Text is part of the button */}
                {activeSubmenu ? "Back" : "Close"}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
