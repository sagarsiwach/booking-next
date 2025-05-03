// components/features/navigation/MobileNavigation.jsx
"use client"; // This component uses hooks

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import MobileMenu from "./components/MobileMenu"; // Default import should work now
import { KMFullLogo } from "./components/NavLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MobileNavigation = ({
  logoColorClass = "text-neutral-900 dark:text-neutral-100",
  mobileMenuItems = [], // Root items
  motorbikesDropdownItems = [],
  scootersDropdownItems = [],
  moreDropdownItems = [],
  onNavigate: navigateAction, // Optional override
}) => {
  const router = useRouter();
  const onNavigate = navigateAction || router.push;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState("");
  const [submenuItems, setSubmenuItems] = useState([]);
  const [historyStack, setHistoryStack] = useState([]); // [{ label: string, items: MobileNavItemData[] }]

  // --- Callbacks ---
  const getSubmenuItemsForCategory = useCallback(
    (categoryLabel) => {
      const categoryLower = categoryLabel.toLowerCase();
      let sourceItems = [];

      // Map labels to the correct data source
      if (categoryLower === "motorbikes") sourceItems = motorbikesDropdownItems;
      else if (categoryLower === "scooters")
        sourceItems = scootersDropdownItems; // Fixed key check
      else if (categoryLower === "more") {
        // Map 'more' items structure
        return (moreDropdownItems || []).map((item) => ({
          label: item.label,
          hasChildren: false,
          icon: "topRight",
          variant: "mobileChild",
          url: item.url,
        }));
      } else return [];

      // Map motorbike/scooter items structure
      return (sourceItems || []).map((item) => ({
        label: item.label,
        hasChildren: false,
        icon: item.type === "model" ? "right" : "topRight",
        variant: item.type === "model" ? "mobileChild" : "mobileSubItem",
        url: item.url,
      }));
    },
    [motorbikesDropdownItems, scootersDropdownItems, moreDropdownItems]
  ); // Dependencies

  const handleMenuToggle = useCallback(() => {
    const closing = mobileMenuOpen;
    setMobileMenuOpen((prev) => !prev);
    if (closing) {
      // Delay reset to allow Sheet animation
      setTimeout(() => {
        setActiveSubmenu("");
        setSubmenuItems([]);
        setHistoryStack([]); // Clear history on close
      }, 300); // Match Sheet animation duration
    }
  }, [mobileMenuOpen]);

  const handleMobileItemClick = useCallback(
    (item) => {
      if (item.back) {
        // Go back in history
        if (historyStack.length > 0) {
          const previousState = historyStack[historyStack.length - 1];
          setActiveSubmenu(previousState.label);
          setSubmenuItems(previousState.items);
          setHistoryStack((prev) => prev.slice(0, -1));
        } else {
          // Back to main menu
          setActiveSubmenu("");
          // No need to set items, derived state will handle it
        }
        return;
      }

      if (item.hasChildren) {
        const newSubmenuItems = getSubmenuItemsForCategory(item.label);
        // Push current state to history
        setHistoryStack((prev) => [
          ...prev,
          {
            label: activeSubmenu,
            items: activeSubmenu ? submenuItems : mobileMenuItems,
          },
        ]);
        setActiveSubmenu(item.label);
        setSubmenuItems(newSubmenuItems);
      } else {
        handleMenuToggle(); // Close menu (handles state reset after delay)
        if (item.url && item.url !== "#") {
          onNavigate(item.url);
        }
      }
    },
    [
      activeSubmenu,
      getSubmenuItemsForCategory,
      handleMenuToggle,
      historyStack,
      mobileMenuItems,
      onNavigate,
      submenuItems,
    ]
  );

  // Derived state for current items
  const currentMobileNavItems = useMemo(() => {
    return activeSubmenu ? submenuItems : mobileMenuItems;
  }, [activeSubmenu, submenuItems, mobileMenuItems]);

  return (
    <div className="w-full relative z-[100] block lg:hidden">
      {" "}
      {/* Hide on lg screens */}
      {/* Simplified Nav Bar for Mobile */}
      <div
        className={cn(
          "w-full bg-background border-b border-border",
          "px-4 py-3", // Mobile padding
          "flex justify-between items-center"
        )}
      >
        {/* Logo */}
        <div className="w-[160px] h-[36px] flex-shrink-0">
          <Link
            href="/"
            aria-label="Homepage"
            className={cn(
              logoColorClass,
              "hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            )}
          >
            <KMFullLogo className="block" />
          </Link>
        </div>
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleMenuToggle}
          aria-label="Open main menu"
          aria-expanded={mobileMenuOpen}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>
      {/* Mobile Menu Component */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMenuToggle}
        navItems={currentMobileNavItems}
        activeSubmenu={activeSubmenu}
        onItemClick={handleMobileItemClick}
      />
    </div>
  );
};

export default MobileNavigation;
