// components/features/navigation/MobileNavigation.jsx
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "./components/NavBar";
import MobileMenu from "./components/MobileMenu";

export const MobileNavigation = ({
  logoColorClass,
  logoHoverColorClass,
  mobileMenuItems = [],
  motorbikesDropdownItems = [],
  scootersDropdownItems = [],
  moreDropdownItems = [],
}) => {
  const router = useRouter();

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState("");
  const [currentMenuItems, setCurrentMenuItems] = useState(mobileMenuItems);
  const [historyStack, setHistoryStack] = useState([]);

  // Submenu generation
  const getSubmenuItemsForCategory = useCallback(
    (categoryLabel) => {
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

      // Map model/type items
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

  // Event handlers
  const handleMenuToggle = useCallback(() => {
    const isOpening = !mobileMenuOpen;
    setMobileMenuOpen(isOpening);

    if (!isOpening) {
      // Reset state after close animation finishes
      setTimeout(() => {
        setActiveSubmenu("");
        setCurrentMenuItems(mobileMenuItems);
        setHistoryStack([]);
      }, 350);
    }
  }, [mobileMenuOpen, mobileMenuItems]);

  const handleMobileItemClick = useCallback(
    (item) => {
      if (item.back) {
        if (historyStack.length > 0) {
          const previousState = historyStack[historyStack.length - 1];
          setActiveSubmenu(previousState.label);
          setCurrentMenuItems(previousState.items);
          setHistoryStack((prev) => prev.slice(0, -1));
        } else {
          setActiveSubmenu("");
          setCurrentMenuItems(mobileMenuItems);
        }
        return;
      }

      if (item.hasChildren) {
        // Push current state to history stack
        setHistoryStack((prev) => [
          ...prev,
          { label: activeSubmenu, items: currentMenuItems },
        ]);

        // Set new submenu
        const newSubmenuItems = getSubmenuItemsForCategory(item.label);
        setActiveSubmenu(item.label);
        setCurrentMenuItems(newSubmenuItems);
      } else {
        // Navigate to URL
        handleMenuToggle();
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
      mobileMenuItems,
      router,
    ]
  );

  return (
    <div className="w-full block lg:hidden">
      <NavBar
        isMobile={true}
        logoColorClass={logoColorClass}
        logoHoverColorClass={logoHoverColorClass}
        onMenuToggle={handleMenuToggle}
        navItems={[]} // Not needed for mobile
      />

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMenuToggle}
        navItems={currentMenuItems}
        activeSubmenu={activeSubmenu}
        onItemClick={handleMobileItemClick}
      />
    </div>
  );
};

export default MobileNavigation;
