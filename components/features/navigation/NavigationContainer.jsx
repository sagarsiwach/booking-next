// components/features/navigation/NavigationContainer.jsx
"use client";

import React, { useState, useEffect } from "react";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import {
  desktopMenuItems,
  mobileMenuItems,
  motorbikesDropdownItems,
  scootersDropdownItems,
  moreDropdownItems,
} from "@/lib/navigation-data";
import { cn } from "@/lib/utils";

// Hook for responsive detection
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQueryList = window.matchMedia(query);
      const listener = (event) => setMatches(event.matches);

      setMatches(mediaQueryList.matches);

      try {
        mediaQueryList.addEventListener("change", listener);
      } catch (e) {
        mediaQueryList.addListener(listener); // Fallback for older browsers
      }

      return () => {
        try {
          mediaQueryList.removeEventListener("change", listener);
        } catch (e) {
          mediaQueryList.removeListener(listener); // Fallback for older browsers
        }
      };
    }
  }, [query]);

  return matches;
};

export const NavigationContainer = ({
  logoColorClass = "text-neutral-700 dark:text-neutral-200",
  logoHoverColorClass = "hover:text-neutral-900 dark:hover:text-neutral-50",
}) => {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder to prevent layout shift
    return (
      <div className="h-[81px] w-full bg-background border-b border-neutral-300 dark:border-neutral-700"></div>
    );
  }

  return (
    <div
      className={cn(
        "w-full sticky top-0 left-0 z-50",
        "bg-white dark:bg-neutral-950"
      )}
    >
      {isMobile ? (
        <MobileNavigation
          logoColorClass={logoColorClass}
          logoHoverColorClass={logoHoverColorClass}
          mobileMenuItems={mobileMenuItems}
          motorbikesDropdownItems={motorbikesDropdownItems}
          scootersDropdownItems={scootersDropdownItems}
          moreDropdownItems={moreDropdownItems}
        />
      ) : (
        <DesktopNavigation
          logoColorClass={logoColorClass}
          logoHoverColorClass={logoHoverColorClass}
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
