// components/features/navigation/DesktopNavigation.jsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import NavBar from "./components/NavBar";
import DesktopDropdown from "./components/DesktopDropdown";
import { cn } from "@/lib/utils";

// Focus management helper
const focusFirstItem = (element) => {
  if (!element) return;
  const firstFocusable = element.querySelector(
    'a[role="menuitem"]:not([disabled])'
  );
  firstFocusable?.focus();
};

export const DesktopNavigation = ({
  logoColorClass,
  logoHoverColorClass,
  desktopMenuItems = [],
  motorbikesDropdownItems = [],
  scootersDropdownItems = [],
  moreDropdownItems = [],
}) => {
  const router = useRouter();

  // State
  const [activeDropdown, setActiveDropdown] = useState("");
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);

  // Refs
  const mouseLeaveTimeoutRef = useRef(null);
  const navRef = useRef(null);
  const itemRefs = useRef([]);

  // ID generation
  const generateId = useCallback(
    (prefix, label) =>
      `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
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

  // Timer management
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
    }, 200);
  }, [isHoveringNavItem, isHoveringDropdown, clearCloseTimer]);

  // Event handlers
  const handleItemHover = useCallback(
    (item) => {
      setIsHoveringNavItem(true);
      clearCloseTimer();
      if (item.hasDropdown) {
        setActiveDropdown(item.label.toLowerCase());
      }
    },
    [clearCloseTimer]
  );

  const handleItemLeave = useCallback(() => {
    setIsHoveringNavItem(false);
    startCloseTimer();
  }, [startCloseTimer]);

  const handleDropdownEnter = useCallback(() => {
    setIsHoveringDropdown(true);
    clearCloseTimer();
  }, [clearCloseTimer]);

  const handleDropdownLeave = useCallback(() => {
    setIsHoveringDropdown(false);
    startCloseTimer();
  }, [startCloseTimer]);

  const closeDropdown = useCallback(
    (returnFocusToLabel) => {
      const currentDropdown = activeDropdown;
      if (!currentDropdown) return;

      setActiveDropdown("");

      if (returnFocusToLabel) {
        const triggerItem = desktopMenuItems.find(
          (item) =>
            item.label.toLowerCase() === returnFocusToLabel.toLowerCase()
        );

        if (triggerItem?.id) {
          setTimeout(
            () => document.getElementById(triggerItem.id)?.focus(),
            50
          );
        }
      }
    },
    [activeDropdown, desktopMenuItems]
  );

  const handleDesktopItemClick = useCallback(
    (item, event) => {
      const labelLower = item.label.toLowerCase();

      if (!item.hasDropdown) {
        closeDropdown();
        if (item.url && item.url !== "#") {
          router.push(item.url);
        }
      } else {
        event.preventDefault();
        const isCurrentlyOpen = activeDropdown === labelLower;
        setActiveDropdown(isCurrentlyOpen ? "" : labelLower);
        clearCloseTimer();

        if (!isCurrentlyOpen) {
          // Focus first item inside dropdown after opening
          setTimeout(() => {
            focusFirstItem(document.getElementById(getDropdownId(item.label)));
          }, 50);
        }
      }
    },
    [activeDropdown, closeDropdown, clearCloseTimer, getDropdownId, router]
  );

  const handleDropdownItemClick = useCallback(
    (item) => {
      closeDropdown(activeDropdown);
      if (item.url && item.url !== "#") {
        setTimeout(() => router.push(item.url), 100);
      }
    },
    [activeDropdown, closeDropdown, router]
  );

  // Keyboard navigation
  const handleItemKeyDown = useCallback(
    (item, event) => {
      const lowerLabel = item.label.toLowerCase();
      const currentIndex = desktopMenuItems.findIndex((i) => i.id === item.id);

      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          handleDesktopItemClick(item, event);
          break;
        case "ArrowDown":
          if (item.hasDropdown) {
            event.preventDefault();
            setActiveDropdown(lowerLabel);
            clearCloseTimer();
            setTimeout(() => {
              focusFirstItem(
                document.getElementById(getDropdownId(item.label))
              );
            }, 50);
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          const prevIndex =
            (currentIndex - 1 + desktopMenuItems.length) %
            desktopMenuItems.length;
          itemRefs.current[prevIndex]?.focus();
          if (activeDropdown) setActiveDropdown("");
          break;
        case "ArrowRight":
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % desktopMenuItems.length;
          itemRefs.current[nextIndex]?.focus();
          if (activeDropdown) setActiveDropdown("");
          break;
        case "Escape":
          if (activeDropdown) {
            event.preventDefault();
            closeDropdown(item.label);
          }
          break;
      }
    },
    [
      activeDropdown,
      clearCloseTimer,
      closeDropdown,
      desktopMenuItems,
      getDropdownId,
      handleDesktopItemClick,
    ]
  );

  const handleDropdownKeyDown = useCallback(
    (event) => {
      if (!activeDropdown) return;

      const dropdownElement = event.currentTarget;
      const focusableItems = Array.from(
        dropdownElement.querySelectorAll('a[role="menuitem"]:not([disabled])')
      );

      if (focusableItems.length === 0) return;

      const currentFocusedIndex = focusableItems.findIndex(
        (el) => el === document.activeElement
      );

      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          let nextIndex = currentFocusedIndex + direction;
          if (nextIndex < 0) nextIndex = focusableItems.length - 1;
          if (nextIndex >= focusableItems.length) nextIndex = 0;
          focusableItems[nextIndex].focus();
          break;
        case "Escape":
        case "Tab":
          event.preventDefault();
          closeDropdown(activeDropdown);
          break;
      }
    },
    [activeDropdown, closeDropdown]
  );

  // Click outside effect
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

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimeout(mouseLeaveTimeoutRef.current);
  }, []);

  // Dropdown mapping
  const dropdownMap = {
    motorbikes: { type: "motorbikes", items: motorbikesDropdownItems },
    scooter: { type: "scooters", items: scootersDropdownItems },
    more: { type: "more", items: moreDropdownItems },
  };

  // Process menu items to ensure IDs
  const processedItems = desktopMenuItems.map((item, index) => ({
    ...item,
    id: item.id || getNavItemId(item.label) || `nav-item-${index}`,
  }));

  // Find the active item for the active dropdown
  const activeItem = activeDropdown
    ? processedItems.find((item) => item.label.toLowerCase() === activeDropdown)
    : null;

  return (
    <div
      ref={navRef}
      className="w-full relative z-50 hidden lg:block"
      onMouseLeave={handleItemLeave}
    >
      <NavBar
        isMobile={false}
        logoColorClass={logoColorClass}
        logoHoverColorClass={logoHoverColorClass}
        navItems={processedItems}
        activeDropdownLabel={activeDropdown}
        getDropdownId={getDropdownId}
        onItemHover={handleItemHover}
        onItemLeave={handleItemLeave}
        onItemClick={handleDesktopItemClick}
        onItemKeyDown={handleItemKeyDown}
        navItemRefs={itemRefs}
      />

      <AnimatePresence>
        {activeDropdown &&
          activeItem?.hasDropdown &&
          dropdownMap[activeDropdown] && (
            <DesktopDropdown
              key={activeDropdown}
              id={getDropdownId(activeDropdown)}
              triggerId={activeItem.id}
              type={dropdownMap[activeDropdown].type}
              items={dropdownMap[activeDropdown].items}
              onItemClick={handleDropdownItemClick}
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
              onKeyDown={handleDropdownKeyDown}
            />
          )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopNavigation;
