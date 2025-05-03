// components/features/navigation/MobileNavigation.jsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import NavBar from "./components/NavBar";
import MobileMenu from "./components/MobileMenu";
import {
  mobileMenuItems as defaultMobileMenuItems,
  motorbikesDropdownItems as defaultMotorbikesData,
  scootersDropdownItems as defaultScootersData,
  moreDropdownItems as defaultMoreData,
} from "../../../lib/navigation-data.js";
import PropTypes from "prop-types"; // Import prop-types

export const MobileNavigation = ({
  logoColorClass,
  mobileMenuItems = defaultMobileMenuItems,
  motorbikesDropdownItems = defaultMotorbikesData,
  scootersDropdownItems = defaultScootersData,
  moreDropdownItems = defaultMoreData,
  ...rest
}) => {
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState("");
  // Initialize state with default data passed as props
  const [currentMenuItems, setCurrentMenuItems] = useState(mobileMenuItems);
  const [historyStack, setHistoryStack] = useState([]);

  // Data Transformation (Memoized)
  const getSubmenuItemsForCategory = useCallback(
    (categoryLabel) => {
      // Removed type annotation
      const categoryLower = categoryLabel.toLowerCase();
      let sourceItems = [];

      switch (categoryLower) {
        case "motorbikes":
          sourceItems = motorbikesDropdownItems;
          break;
        case "scooters":
          sourceItems = scootersDropdownItems;
          break;
        case "more":
          return moreDropdownItems.map((item) => ({
            label: item.label,
            hasChildren: false,
            icon: "topRight",
            variant: "mobileSubItem",
            url: item.url,
          }));
        default:
          return [];
      }

      // Map motorbike/scooter items
      return sourceItems.map((item) => ({
        label: item.label,
        hasChildren: false,
        icon: item.type === "model" ? "right" : "topRight",
        variant: item.type === "model" ? "mobileChild" : "mobileSubItem",
        url: item.url,
      }));
    },
    [motorbikesDropdownItems, scootersDropdownItems, moreDropdownItems]
  );

  // --- Event Handlers ---
  const handleMenuToggle = useCallback(() => {
    const isOpening = !mobileMenuOpen;
    setMobileMenuOpen(isOpening);

    if (!isOpening) {
      // Reset state *after* close animation
      setTimeout(() => {
        setActiveSubmenu("");
        setCurrentMenuItems(mobileMenuItems);
        setHistoryStack([]);
      }, 350); // Adjust based on MobileMenu animation
    }
  }, [mobileMenuOpen, mobileMenuItems]); // Include mobileMenuItems dependency

  const handleMobileItemClick = useCallback(
    (item) => {
      // Removed type annotation
      if (item.back) {
        if (historyStack.length > 0) {
          const previousState = historyStack[historyStack.length - 1];
          setActiveSubmenu(previousState.label);
          setCurrentMenuItems(previousState.items);
          setHistoryStack((prev) => prev.slice(0, -1));
        } else {
          setActiveSubmenu("");
          setCurrentMenuItems(mobileMenuItems); // Use prop directly
        }
        return;
      }

      if (item.hasChildren) {
        setHistoryStack((prev) => [
          ...prev,
          { label: activeSubmenu, items: currentMenuItems },
        ]);
        const newSubmenuItems = getSubmenuItemsForCategory(item.label);
        setActiveSubmenu(item.label);
        setCurrentMenuItems(newSubmenuItems);
      } else {
        handleMenuToggle(); // Close menu
        if (item.url && item.url !== "#") {
          router.push(item.url);
        }
      }
    },
    [
      activeSubmenu,
      currentMenuItems,
      getSubmenuItemsForCategory,
      handleMenuToggle,
      historyStack,
      mobileMenuItems, // Use prop directly
      router,
    ]
  );

  return (
    <div className="w-full block lg:hidden" {...rest}>
      {" "}
      {/* Show only on mobile/tablet */}
      <NavBar
        isMobile={true}
        logoColorClass={logoColorClass}
        onMenuToggle={handleMenuToggle}
        // Pass empty/dummy props for desktop-specific handlers
        navItems={[]} // Desktop nav items not needed here
        onItemHover={() => {}}
        onItemLeave={() => {}}
        onItemFocus={() => {}}
        onItemBlur={() => {}}
        navItemRefs={{ current: [] }} // Provide dummy ref object
      />
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMenuToggle}
        navItems={currentMenuItems}
        activeSubmenu={activeSubmenu}
        onItemClick={handleMobileItemClick}
        // Pass animation/style props down if they were received
      />
    </div>
  );
};

MobileNavigation.propTypes = {
  logoColorClass: PropTypes.string,
  mobileMenuItems: PropTypes.array,
  motorbikesDropdownItems: PropTypes.array,
  scootersDropdownItems: PropTypes.array,
  moreDropdownItems: PropTypes.array,
  // Define animationConfig and styleProps if they are expected props
  // animationConfig: PropTypes.object,
  // styleProps: PropTypes.object,
};

export default MobileNavigation;
