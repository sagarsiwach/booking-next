// components/features/navigation/NavigationContainer.jsx
"use client";

import React, { useState, useEffect } from "react";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
// Import static data - ENSURE THIS PATH IS CORRECT
import {
  desktopMenuItems,
  mobileMenuItems,
  motorbikesDropdownItems,
  scootersDropdownItems,
  moreDropdownItems,
} from "../../../lib/navigation-data.js"; // Adjust path as necessary
import PropTypes from "prop-types"; // Import prop-types

// Hook for Responsive Check (JavaScript version)
const useMediaQuery = (query) => {
  // Removed type annotations
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQueryList = window.matchMedia(query);
      const listener = (event) => setMatches(event.matches); // Removed type annotation

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
  logoColorClass,
  logoHoverColorClass,
}) => {
  // Breakpoint matches Tailwind's lg (1024px)
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder matching NavBar height to prevent layout shift
    return (
      <div className="h-[81px] w-full bg-background border-b border-border"></div>
    );
  }

  return (
    <div className="w-full sticky top-0 left-0 bg-background z-50">
      {isMobile ? (
        <MobileNavigation
          logoColorClass={logoColorClass}
          // Pass static data from imports
          mobileMenuItems={mobileMenuItems}
          motorbikesDropdownItems={motorbikesDropdownItems}
          scootersDropdownItems={scootersDropdownItems}
          moreDropdownItems={moreDropdownItems}
        />
      ) : (
        <DesktopNavigation
          logoColorClass={logoColorClass}
          logoHoverColorClass={logoHoverColorClass}
          // Pass static data from imports
          desktopMenuItems={desktopMenuItems}
          motorbikesDropdownItems={motorbikesDropdownItems}
          scootersDropdownItems={scootersDropdownItems}
          moreDropdownItems={moreDropdownItems}
        />
      )}
    </div>
  );
};

NavigationContainer.propTypes = {
  logoColorClass: PropTypes.string,
  logoHoverColorClass: PropTypes.string,
};

export default NavigationContainer;
