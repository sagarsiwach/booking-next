// components/features/navigation/DesktopNavigation.jsx
"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion"; // Import motion here
import NavBar from "./components/NavBar";
import DesktopDropdown from "./components/DesktopDropdown";
import {
  desktopMenuItems as defaultDesktopMenuItems,
  motorbikesDropdownItems as defaultMotorbikesData,
  scootersDropdownItems as defaultScootersData,
  moreDropdownItems as defaultMoreData,
} from "../../../lib/navigation-data.js"; // Adjust path if necessary
import PropTypes from "prop-types"; // Import prop-types
import { cn } from "@/lib/utils"; // Assuming cn is needed in DesktopDropdown or NavBar

// --- REMOVED TypeScript Interfaces ---
// interface DesktopNavItemData { ... }
// interface AnyDropdownItem { ... }
// interface DesktopNavigationProps { ... }

// Helper functions (remain the same)
const focusFirstItem = (element /* Removed type annotation */) => {
  if (!element) return;
  const firstFocusable = element.querySelector(
    'a[role="menuitem"]:not([disabled])'
  );
  firstFocusable?.focus();
};
const focusElementById = (elementId /* Removed type annotation */) => {
  if (!elementId) return;
  requestAnimationFrame(() => {
    document.getElementById(elementId)?.focus();
  });
};

export const DesktopNavigation = ({
  logoColorClass,
  logoHoverColorClass,
  initialActiveItem = "",
  desktopMenuItems = defaultDesktopMenuItems,
  motorbikesDropdownItems = defaultMotorbikesData,
  scootersDropdownItems = defaultScootersData,
  moreDropdownItems = defaultMoreData,
  // Add default values or ensure they are passed if needed for animation/styling
  // animationConfig,
  // styleProps,
}) => {
  const router = useRouter();

  // --- State ---
  const [activeDropdown, setActiveDropdown] = useState("");
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);
  const mouseLeaveTimeoutRef = useRef(null);
  const navRef = useRef(null);
  const itemRefs = useRef([]);

  // --- ID Generation ---
  const generateId = useCallback(
    (
      prefix,
      label // Removed type annotations
    ) => `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    []
  );
  const getNavItemId = useCallback(
    (label) => generateId("nav-item", label),
    [generateId]
  );
  const getDropdownId = useCallback(
    (label) => generateId("dropdown", label),
    [generateId]
  );

  // Process items to ensure IDs and attach dropdown data
  const processedDesktopItems = useMemo(
    () =>
      desktopMenuItems.map((item, index) => ({
        ...item,
        id: item.id || getNavItemId(item.label) || `nav-fallback-${index}`,
        // Map dropdown type based on label
        dropdownType: item.label.toLowerCase().includes("bike")
          ? "motorbikes"
          : item.label.toLowerCase().includes("scooter")
          ? "scooters"
          : item.label.toLowerCase() === "more"
          ? "more"
          : undefined,
        // Attach the corresponding items directly
        dropdownItems: item.label.toLowerCase().includes("bike")
          ? motorbikesDropdownItems
          : item.label.toLowerCase().includes("scooter")
          ? scootersDropdownItems
          : item.label.toLowerCase() === "more"
          ? moreDropdownItems
          : [],
      })),
    [
      desktopMenuItems,
      getNavItemId,
      motorbikesDropdownItems,
      scootersDropdownItems,
      moreDropdownItems,
    ]
  );

  // --- Timer Logic ---
  const clearCloseTimer = useCallback(() => {
    if (mouseLeaveTimeoutRef.current)
      clearTimeout(mouseLeaveTimeoutRef.current);
  }, []);

  const startCloseTimer = useCallback(() => {
    clearCloseTimer();
    mouseLeaveTimeoutRef.current = setTimeout(() => {
      if (!isHoveringNavItem && !isHoveringDropdown) {
        setActiveDropdown("");
      }
    }, 200); // Adjust delay
  }, [isHoveringNavItem, isHoveringDropdown, clearCloseTimer]);

  // --- Hover/Focus Handlers ---
  const handleItemHover = useCallback(
    (item) => {
      // Removed type annotation
      setIsHoveringNavItem(true);
      clearCloseTimer();
      const key = item.hasDropdown ? item.label.toLowerCase() : "";
      if (key !== activeDropdown) {
        setActiveDropdown(key);
      }
    },
    [clearCloseTimer, activeDropdown]
  );

  const handleItemLeave = useCallback(() => {
    setIsHoveringNavItem(false);
    startCloseTimer();
  }, [startCloseTimer]);

  const handleItemFocus = useCallback(
    (item) => {
      // Removed type annotation
      setIsHoveringNavItem(true);
      clearCloseTimer();
      const key = item.hasDropdown ? item.label.toLowerCase() : "";
      if (activeDropdown && activeDropdown !== key) {
        setActiveDropdown("");
      }
    },
    [clearCloseTimer, activeDropdown]
  );

  const handleItemBlur = useCallback(() => {
    setTimeout(() => {
      const focusedElement = document.activeElement;
      if (
        navRef.current &&
        focusedElement &&
        !navRef.current.contains(focusedElement)
      ) {
        setIsHoveringNavItem(false);
        setIsHoveringDropdown(false);
        startCloseTimer();
      } else {
        setIsHoveringNavItem(false);
      }
    }, 0);
  }, [startCloseTimer, activeDropdown]);

  const handleDropdownEnter = useCallback(() => {
    setIsHoveringDropdown(true);
    clearCloseTimer();
  }, [clearCloseTimer]);

  const handleDropdownLeave = useCallback(() => {
    setIsHoveringDropdown(false);
    startCloseTimer();
  }, [startCloseTimer]);

  // --- Close & Click Handlers ---
  const closeDropdown = useCallback(
    (returnFocusToLabel) => {
      // Removed type annotation
      const currentOpenLabel = activeDropdown;
      if (!currentOpenLabel) return;
      setActiveDropdown("");

      const triggerLabel = returnFocusToLabel || currentOpenLabel;
      const trigger = processedDesktopItems.find(
        (i) => i.label.toLowerCase() === triggerLabel.toLowerCase()
      );
      if (trigger?.id) {
        setTimeout(() => focusElementById(trigger.id), 300);
      }
    },
    [activeDropdown, processedDesktopItems]
  );

  const handleDesktopItemClick = useCallback(
    (item, event) => {
      // Removed type annotations
      const labelLower = item.label.toLowerCase();
      if (!item.hasDropdown) {
        closeDropdown();
        if (item.url && item.url !== "#") {
          // Allow Link component to navigate
          // router.push(item.url); // Alternative if not using Link directly
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
          focusElementById(item.id);
        }
      }
    },
    [activeDropdown, closeDropdown, clearCloseTimer, getDropdownId]
  ); // Added getDropdownId

  // Click *inside* the dropdown
  const handleDropdownItemClick = useCallback(
    (item) => {
      // Removed type annotation
      closeDropdown(activeDropdown);
      if (item.url && item.url !== "#") {
        // Use router push for navigation after closing
        // Delay slightly to allow close animation if needed
        setTimeout(() => router.push(item.url), 50);
      }
    },
    [activeDropdown, closeDropdown, router]
  );

  // --- Keyboard Navigation ---
  const handleItemKeyDown = useCallback(
    (item, event) => {
      // Removed type annotations
      const lowerLabel = item.label.toLowerCase();
      const currentIndex = processedDesktopItems.findIndex(
        (i) => i.id === item.id
      );
      let nextFocusTarget = null;
      let closeCurrentDropdown = false;

      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          handleDesktopItemClick(item, event);
          break;
        case "ArrowDown":
          if (item.hasDropdown) {
            event.preventDefault();
            if (activeDropdown !== lowerLabel) {
              setActiveDropdown(lowerLabel);
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
              );
            }
          }
          break;
        case "ArrowUp":
          if (item.hasDropdown && activeDropdown === lowerLabel) {
            event.preventDefault();
            closeDropdown(item.label);
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          const prevIndex =
            (currentIndex - 1 + processedDesktopItems.length) %
            processedDesktopItems.length;
          nextFocusTarget = itemRefs.current[prevIndex];
          closeCurrentDropdown = true;
          break;
        case "ArrowRight":
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % processedDesktopItems.length;
          nextFocusTarget = itemRefs.current[nextIndex];
          closeCurrentDropdown = true;
          break;
        case "Escape":
          if (activeDropdown) {
            event.preventDefault();
            closeDropdown(activeDropdown);
          }
          break;
        case "Tab":
          setTimeout(() => {
            const focusedElement = document.activeElement;
            if (
              activeDropdown &&
              navRef.current &&
              focusedElement &&
              !navRef.current.contains(focusedElement)
            ) {
              closeDropdown();
            }
          }, 0);
          break;
      }

      if (closeCurrentDropdown && activeDropdown) {
        setActiveDropdown(""); // Close dropdown when moving between items
      }
      if (nextFocusTarget) {
        setTimeout(() => nextFocusTarget?.focus(), 0);
      }
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
      // Removed type annotation
      if (!activeDropdown) return;
      const dropdownElement = event.currentTarget; // Removed type assertion
      const focusableItems = Array.from(
        dropdownElement.querySelectorAll(
          // Removed type assertion
          'a[role="menuitem"]:not([disabled])'
        )
      );
      if (focusableItems.length === 0) return;

      const currentFocusedIndex = focusableItems.findIndex(
        (el) => el === document.activeElement
      );
      let nextFocusTarget = null;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          let nextIndex = currentFocusedIndex + direction;
          if (nextIndex < 0) nextIndex = focusableItems.length - 1;
          if (nextIndex >= focusableItems.length) nextIndex = 0;
          nextFocusTarget = focusableItems[nextIndex];
          break;
        case "Home":
          event.preventDefault();
          nextFocusTarget = focusableItems[0];
          break;
        case "End":
          event.preventDefault();
          nextFocusTarget = focusableItems[focusableItems.length - 1];
          break;
        case "Escape":
        case "Tab":
          event.preventDefault();
          closeDropdown(activeDropdown);
          break;
      }
      if (nextFocusTarget) {
        setTimeout(() => nextFocusTarget?.focus(), 0);
      }
    },
    [activeDropdown, closeDropdown]
  );

  // --- Effects ---
  useEffect(() => {
    // Click outside handler
    const handleClickOutside = (event) => {
      // Removed type annotation
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

  useEffect(() => {
    // Cleanup timer on unmount
    return () => clearTimeout(mouseLeaveTimeoutRef.current ?? undefined);
  }, []);

  // --- Render ---
  const navBarHeight = navRef.current?.offsetHeight || 81; // Estimate or measure

  return (
    // Container with ref and leave handler
    <div
      ref={navRef}
      className="w-full relative z-50 hidden lg:block"
      onMouseLeave={handleItemLeave}
    >
      <NavBar
        isMobile={false}
        logoColorClass={logoColorClass}
        logoHoverColorClass={logoHoverColorClass}
        navItems={processedDesktopItems}
        activeItemLabel={activeDropdown} // Pass active dropdown label for potential NavItem styling
        activeDropdownLabel={activeDropdown} // Pass for NavItem's aria-expanded
        getDropdownId={getDropdownId}
        onItemHover={handleItemHover}
        onItemLeave={() => {
          /* Leave handled by container */
        }}
        onItemFocus={handleItemFocus}
        onItemBlur={handleItemBlur}
        onItemClick={handleDesktopItemClick}
        onItemKeyDown={handleItemKeyDown}
        navItemRefs={itemRefs}
        // Pass down style props if NavItem uses them
      />

      {/* Dropdown Container */}
      <div
        className="absolute top-full left-0 right-0 z-40"
        style={{ top: `${navBarHeight}px` }} // Position below navbar
      >
        <AnimatePresence mode="wait">
          {activeDropdown &&
            processedDesktopItems.find(
              (i) => i.label.toLowerCase() === activeDropdown
            )?.hasDropdown && (
              <DesktopDropdown
                key={activeDropdown}
                id={getDropdownId(activeDropdown)}
                triggerId={
                  processedDesktopItems.find(
                    (i) => i.label.toLowerCase() === activeDropdown
                  )?.id || ""
                }
                // isOpen prop managed by AnimatePresence
                type={
                  processedDesktopItems.find(
                    (i) => i.label.toLowerCase() === activeDropdown
                  )?.dropdownType
                }
                items={
                  processedDesktopItems.find(
                    (i) => i.label.toLowerCase() === activeDropdown
                  )?.dropdownItems || []
                }
                onItemClick={handleDropdownItemClick} // Make sure DesktopDropdown passes this down
                onMouseEnter={handleDropdownEnter}
                onMouseLeave={handleDropdownLeave}
                onKeyDown={handleDropdownKeyDown}
                // animationConfig={...} // Pass if needed
                // styleProps={...} // Pass if needed
              />
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

DesktopNavigation.propTypes = {
  logoColorClass: PropTypes.string,
  logoHoverColorClass: PropTypes.string,
  initialActiveItem: PropTypes.string,
  desktopMenuItems: PropTypes.array,
  motorbikesDropdownItems: PropTypes.array,
  scootersDropdownItems: PropTypes.array,
  moreDropdownItems: PropTypes.array,
  // animationConfig: PropTypes.object, // Define shape if needed
  // styleProps: PropTypes.object, // Define shape if needed
};

export default DesktopNavigation;
