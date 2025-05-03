// components/features/navigation/DesktopNavigation.jsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { KMFullLogo } from "./components/NavLogo"; // Import logo
import NavItem from "./components/NavItem"; // Import custom NavItem
import DesktopDropdown from "./components/DesktopDropdown"; // Import custom Dropdown

// Helper function from original Framer code
const focusFirstItem = (element) => {
  if (!element) return;
  const firstFocusable = element.querySelector(
    'a[role="menuitem"], button[role="menuitem"]'
  );
  firstFocusable?.focus();
};
const focusElementById = (elementId) => {
  if (!elementId) return;
  requestAnimationFrame(() => {
    document.getElementById(elementId)?.focus();
  });
};

export const DesktopNavigation = ({
  logoColorClass = "text-neutral-700 dark:text-neutral-200",
  logoHoverColorClass = "text-neutral-900 dark:text-neutral-50",
  initialActiveItem = "", // Currently not used for styling, NavItem handles internally
  desktopMenuItems = [],
  motorbikesDropdownItems = [],
  scootersDropdownItems = [],
  moreDropdownItems = [],
  onNavigate: navigateAction,
  // Animation config can be passed or use defaults in DesktopDropdown
  animationConfig,
  // Style props can be passed or use defaults in NavItem/DesktopDropdown
  styleProps,
}) => {
  const router = useRouter();
  const onNavigate = navigateAction || router.push;

  // State Management (Similar to Framer)
  const [activeDropdown, setActiveDropdown] = useState(""); // Stores LOWERCASE label
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);
  const [isLogoFocused, setIsLogoFocused] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Refs
  const mouseLeaveTimeoutRef = useRef(null);
  const navRef = useRef(null);
  const itemRefs = useRef([]); // Refs for NavItem anchors

  // ID Generation
  const generateId = React.useCallback(
    (prefix, label) =>
      `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    []
  );
  const getNavItemId = React.useCallback(
    (label) => generateId("nav-item", label),
    [generateId]
  );
  const getDropdownId = React.useCallback(
    (label) => generateId("dropdown", label),
    [generateId]
  );

  // Ensure IDs are generated for menu items
  const processedDesktopItems = React.useMemo(
    () =>
      desktopMenuItems.map((item) => ({
        ...item,
        id: item.id || getNavItemId(item.label),
      })),
    [desktopMenuItems, getNavItemId]
  );

  // Sync itemRefs array size
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, processedDesktopItems.length);
  }, [processedDesktopItems]);

  // Timer Logic
  const clearCloseTimer = useCallback(() => {
    if (mouseLeaveTimeoutRef.current)
      clearTimeout(mouseLeaveTimeoutRef.current);
  }, []);

  const startCloseTimer = useCallback(() => {
    clearCloseTimer();
    mouseLeaveTimeoutRef.current = setTimeout(() => {
      // Close only if mouse is not over a nav item AND not over the dropdown panel
      if (!isHoveringNavItem && !isHoveringDropdown) {
        setActiveDropdown("");
      }
    }, 200); // Adjust delay (ms)
  }, [isHoveringNavItem, isHoveringDropdown, clearCloseTimer]);

  // Hover/Focus Handlers
  const handleItemHover = useCallback(
    (item) => {
      setIsHoveringNavItem(true);
      clearCloseTimer();
      const key = item.hasDropdown ? item.label.toLowerCase() : "";
      if (key !== activeDropdown) {
        // Avoid resetting if already open
        setActiveDropdown(key);
      }
    },
    [clearCloseTimer, activeDropdown]
  );

  const handleItemLeave = useCallback(() => {
    // Mouse leaves a NavItem _or_ the whole NavBar container
    setIsHoveringNavItem(false);
    startCloseTimer();
  }, [startCloseTimer]);

  const handleItemFocus = useCallback(
    (item) => {
      // Focus on NavItem
      setIsHoveringNavItem(true); // Treat focus like hover for timer
      clearCloseTimer();
      // Don't automatically open dropdown on focus alone
      // If a different dropdown was open via hover, close it
      const key = item.hasDropdown ? item.label.toLowerCase() : "";
      if (activeDropdown && activeDropdown !== key) {
        setActiveDropdown("");
      }
    },
    [clearCloseTimer, activeDropdown]
  );

  const handleItemBlur = useCallback(
    (event) => {
      // Blur from NavItem
      // Check if focus is moving *outside* the entire nav container
      // Use setTimeout to allow focus to shift first
      setTimeout(() => {
        if (
          navRef.current &&
          !navRef.current.contains(document.activeElement)
        ) {
          setIsHoveringNavItem(false);
          startCloseTimer(); // Start close timer if focus left nav entirely
        }
      }, 0);
      // If focus moves within the nav (to another item or dropdown), isHoveringNavItem will be set true again by the target's focus handler
    },
    [startCloseTimer]
  );

  const handleDropdownEnter = useCallback(() => {
    setIsHoveringDropdown(true);
    clearCloseTimer();
  }, [clearCloseTimer]);

  const handleDropdownLeave = useCallback(() => {
    setIsHoveringDropdown(false);
    startCloseTimer();
  }, [startCloseTimer]);

  // Close & Click Handlers
  const closeDropdown = useCallback(
    (returnFocusToLabel) => {
      const currentOpenLabel = activeDropdown;
      if (!currentOpenLabel) return;

      setActiveDropdown(""); // Trigger exit animation

      const triggerLabel = returnFocusToLabel || currentOpenLabel;
      const trigger = processedDesktopItems.find(
        (i) => i.label.toLowerCase() === triggerLabel.toLowerCase()
      );
      if (trigger?.id) {
        // Delay focus return slightly (adjust timing)
        setTimeout(() => focusElementById(trigger.id), 250);
      }
    },
    [activeDropdown, processedDesktopItems]
  );

  const handleDesktopItemClick = useCallback(
    (item, event) => {
      const labelLower = item.label.toLowerCase();

      if (!item.hasDropdown) {
        closeDropdown();
        if (item.url && item.url !== "#") {
          onNavigate(item.url);
        } else {
          event.preventDefault();
        }
      } else {
        event.preventDefault();
        const isCurrentlyOpen = activeDropdown === labelLower;
        const nextActiveDropdown = isCurrentlyOpen ? "" : labelLower;
        setActiveDropdown(nextActiveDropdown);
        clearCloseTimer();

        if (nextActiveDropdown) {
          setTimeout(
            () =>
              focusFirstItem(
                document.getElementById(getDropdownId(item.label))
              ),
            50
          );
        } else {
          focusElementById(item.id); // Return focus to trigger on close via click
        }
      }
    },
    [
      activeDropdown,
      closeDropdown,
      clearCloseTimer,
      onNavigate,
      getDropdownId,
      processedDesktopItems,
    ]
  );

  const handleDropdownItemClick = useCallback(
    (item) => {
      const triggerLabel = activeDropdown; // Capture which dropdown was open
      closeDropdown(triggerLabel); // Close and return focus to the trigger
      if (item.url && item.url !== "#") {
        // Perform navigation *after* dropdown close animation might finish
        setTimeout(() => onNavigate(item.url), 250); // Adjust delay if needed
      }
    },
    [activeDropdown, closeDropdown, onNavigate]
  );

  // Keyboard Navigation Handlers
  const handleItemKeyDown = useCallback(
    (item, event) => {
      const lowerLabel = item.label.toLowerCase();
      const currentIndex = processedDesktopItems.findIndex(
        (i) => i.id === item.id
      );
      let nextFocusTarget = null;
      let handled = false;

      switch (event.key) {
        case "Enter":
        case " ":
          handleDesktopItemClick(item, event); // Reuse click logic
          handled = true;
          break;
        case "ArrowDown":
          if (item.hasDropdown) {
            event.preventDefault();
            if (activeDropdown !== lowerLabel) {
              setActiveDropdown(lowerLabel); // Open it
              clearCloseTimer();
              setTimeout(
                () =>
                  focusFirstItem(
                    document.getElementById(getDropdownId(item.label))
                  ),
                50
              );
            } else {
              focusFirstItem(
                document.getElementById(getDropdownId(item.label))
              ); // Focus inside if already open
            }
            handled = true;
          }
          break;
        case "ArrowUp": // Added ArrowUp to close dropdown
          if (item.hasDropdown && activeDropdown === lowerLabel) {
            event.preventDefault();
            closeDropdown(item.label); // Close dropdown, focus returns to trigger
            handled = true;
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          const prevIndex =
            (currentIndex - 1 + processedDesktopItems.length) %
            processedDesktopItems.length;
          nextFocusTarget = itemRefs.current[prevIndex];
          if (activeDropdown) closeDropdown(); // Close dropdown when moving between items
          handled = true;
          break;
        case "ArrowRight":
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % processedDesktopItems.length;
          nextFocusTarget = itemRefs.current[nextIndex];
          if (activeDropdown) closeDropdown(); // Close dropdown when moving between items
          handled = true;
          break;
        case "Escape":
          if (activeDropdown) {
            event.preventDefault();
            closeDropdown(activeDropdown); // Close and return focus based on which was open
            handled = true;
          }
          break;
        case "Tab":
          // Allow natural tab flow. Close dropdown if focus moves outside.
          setTimeout(() => {
            if (
              navRef.current &&
              !navRef.current.contains(document.activeElement)
            ) {
              if (activeDropdown) closeDropdown();
            }
          }, 0);
          // Don't set handled=true
          break;
      }

      if (nextFocusTarget) {
        setTimeout(() => nextFocusTarget?.focus(), 0);
      }
      // if (handled) event.stopPropagation(); // Usually not needed unless nested focus traps
    },
    [
      activeDropdown,
      clearCloseTimer,
      closeDropdown,
      processedDesktopItems,
      getDropdownId,
      handleDesktopItemClick,
    ]
  );

  const handleDropdownKeyDown = useCallback(
    (event) => {
      if (!activeDropdown) return;

      const dropdownElement = document.getElementById(
        getDropdownId(activeDropdown)
      );
      if (!dropdownElement) return;

      const focusableItems = Array.from(
        dropdownElement.querySelectorAll(
          'a[role="menuitem"], button[role="menuitem"]'
        )
      );
      if (focusableItems.length === 0) return;

      const currentFocusedIndex = focusableItems.findIndex(
        (el) => el === document.activeElement
      );
      let nextFocusTarget = null;
      let handled = false;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          const nextIndex =
            (currentFocusedIndex + direction + focusableItems.length) %
            focusableItems.length;
          nextFocusTarget = focusableItems[nextIndex];
          handled = true;
          break;
        case "Tab": // Trap focus within dropdown or close it
          event.preventDefault();
          // Close and return focus to trigger on Tab
          closeDropdown(activeDropdown);
          handled = true;
          break;
        case "Escape":
          event.preventDefault();
          closeDropdown(activeDropdown); // Close and return focus to trigger
          handled = true;
          break;
        case "Home":
          event.preventDefault();
          nextFocusTarget = focusableItems[0];
          handled = true;
          break;
        case "End":
          event.preventDefault();
          nextFocusTarget = focusableItems[focusableItems.length - 1];
          handled = true;
          break;
      }

      if (nextFocusTarget) {
        setTimeout(() => nextFocusTarget?.focus(), 0);
      }
      // if (handled) event.stopPropagation();
    },
    [activeDropdown, closeDropdown, getDropdownId]
  );

  // Effects
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeDropdown &&
        navRef.current &&
        !navRef.current.contains(event.target)
      ) {
        setActiveDropdown("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  // Cleanup timer
  useEffect(() => {
    return () => clearTimeout(mouseLeaveTimeoutRef.current);
  }, []);

  // Data Mapping for Dropdowns
  const dropdownDataMap = {
    motorbikes: { type: "motorbikes", items: motorbikesDropdownItems },
    scooter: { type: "scooters", items: scootersDropdownItems },
    more: { type: "more", items: moreDropdownItems },
  };

  return (
    // Main container with ref and leave handler
    <div
      ref={navRef}
      className="w-full relative z-50"
      onMouseLeave={handleItemLeave}
    >
      {/* Visual NavBar Structure */}
      <div
        className={cn(
          "w-full bg-background border-b border-neutral-300 dark:border-neutral-700", // Adjusted border color
          "px-4 lg:px-16 py-5", // Match original padding
          "flex justify-between items-center"
        )}
      >
        {/* Logo */}
        <div className={`w-[177px] h-[40px] flex-shrink-0`}>
          <Link
            href="/"
            aria-label="Homepage"
            className={cn(
              "block h-full transition-colors duration-150 ease-out",
              isLogoHovered ? logoHoverColorClass : logoColorClass,
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500" // Example focus ring
            )}
            onFocus={() => setIsLogoFocused(true)}
            onBlur={() => setIsLogoFocused(false)}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <KMFullLogo className="block w-full h-full" color="currentColor" />
          </Link>
        </div>

        {/* Desktop Navigation Items */}
        <nav
          aria-label="Main Navigation"
          role="menubar"
          className="hidden lg:flex justify-center items-center gap-5 relative"
        >
          {processedDesktopItems.map((item, index) => (
            <NavItem
              ref={(el) => (itemRefs.current[index] = el)}
              key={item.id}
              id={item.id}
              label={item.label}
              // isActive={initialActiveItem === item.label} // Active state handled internally based on hover/focus/expanded
              hasPopup={item.hasDropdown}
              isExpanded={activeDropdown === item.label.toLowerCase()}
              controlsId={
                item.hasDropdown ? getDropdownId(item.label) : undefined
              }
              onClick={(e) => handleDesktopItemClick(item, e)}
              onMouseEnter={() => handleItemHover(item)}
              onMouseLeave={handleItemLeave} // This will trigger container leave check
              onFocus={() => handleItemFocus(item)}
              onBlur={handleItemBlur} // This will trigger container leave check
              onKeyDown={(e) => handleItemKeyDown(item, e)}
              href={item.url}
              role="menuitem"
            />
          ))}
        </nav>

        {/* Spacer */}
        <div
          className="w-[177px] flex-shrink-0 hidden lg:block"
          aria-hidden="true"
        ></div>
      </div>

      {/* Conditionally Rendered Dropdown */}
      <div className="absolute top-full left-0 right-0 z-40">
        {" "}
        {/* Container for positioning */}
        <AnimatePresence mode="wait">
          {activeDropdown && dropdownDataMap[activeDropdown] && (
            <DesktopDropdown
              key={activeDropdown} // Key ensures remount on change
              id={getDropdownId(activeDropdown)}
              triggerId={
                processedDesktopItems.find(
                  (i) => i.label.toLowerCase() === activeDropdown
                )?.id || ""
              }
              // isOpen prop not needed
              type={dropdownDataMap[activeDropdown].type}
              items={dropdownDataMap[activeDropdown].items}
              onItemClick={handleDropdownItemClick}
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
              onKeyDown={handleDropdownKeyDown} // Pass keyboard handler
              animationConfig={animationConfig}
              // Pass styleProps if needed
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DesktopNavigation;
