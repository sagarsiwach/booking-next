// components/features/navigation/NavigationContainer.jsx
"use client"; // This component uses hooks and client-side logic

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; // To determine active item based on URL
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";

// Import static data - ENSURE THIS PATH IS CORRECT relative to this file
import {
  desktopMenuItems,
  mobileMenuItems,
  motorbikesDropdownItems,
  scootersDropdownItems,
  moreDropdownItems,
} from "../../../lib/navigation-data.js"
// Hook for Responsive Check
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== "undefined") {
      const mediaQueryList = window.matchMedia(query);
      const listener = (event) => setMatches(event.matches);
      setMatches(mediaQueryList.matches);
      mediaQueryList.addEventListener("change", listener);
      return () => mediaQueryList.removeEventListener("change", listener);
    }
  }, [query]);

  return matches;
};

export const NavigationContainer = ({
  logoColor = "text-neutral-900 dark:text-neutral-100", // Default logo color
}) => {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 1023px)"); // lg breakpoint

  const getInitialActiveItem = () => {
    const matchedItem = [...desktopMenuItems]
      .sort((a, b) => (b.url?.length || 0) - (a.url?.length || 0))
      .find(
        (item) => item.url && item.url !== "#" && pathname?.startsWith(item.url)
      );
    return matchedItem?.label || "";
  };

  const initialActiveItem = getInitialActiveItem();

  return (
    <div className="w-full sticky top-0 left-0 bg-background z-[50]">
      {" "}
      {/* Adjusted z-index */}
      {isMobile ? (
        <MobileNavigation
          logoColorClass={logoColor}
          mobileMenuItems={mobileMenuItems}
          motorbikesDropdownItems={motorbikesDropdownItems}
          scootersDropdownItems={scootersDropdownItems}
          moreDropdownItems={moreDropdownItems}
        />
      ) : (
        <DesktopNavigation
          logoColorClass={logoColor}
          initialActiveItem={initialActiveItem}
          desktopMenuItems={desktopMenuItems}
          motorbikesDropdownItems={motorbikesDropdownItems}
          scootersDropdownItems={scootersDropdownItems}
          moreDropdownItems={moreDropdownItems}
        />
      )}
    </div>
  );
};

export default NavigationContainer;
