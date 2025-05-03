// components/features/navigation/components/NavBar.jsx
"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react"; // Renamed import
import { KMFullLogo } from "./NavLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import NavItemContent from "./NavItemContent"; // Renders label + chevron
import DesktopDropdownContent from "./DesktopDropdownContent"; // Content renderer
import PropTypes from "prop-types"; // Import prop-types

// Tailwind class mappings
const navBarBg = "bg-white dark:bg-neutral-950";
const navBarBorder = "border-b border-neutral-300 dark:border-neutral-700";
const logoDefaultColor = "text-neutral-700 dark:text-neutral-200";
const logoHoverColor = "hover:text-neutral-900 dark:hover:text-neutral-50";
const mobileButtonColor = "text-neutral-900 dark:text-neutral-100";
const focusRingClass =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-blue-500 rounded-sm"; // Example focus ring

export const NavBar = React.forwardRef((props, ref) => {
  const {
    isMobile,
    logoColorClass = logoDefaultColor,
    logoHoverColorClass = logoHoverColor,
    navItems = [],
    onMenuToggle,
    // Destructure other props if needed by parent container managing state
    // activeItemLabel, activeDropdownLabel, onItemHover, onItemLeave, etc.
    ...rest
  } = props;

  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const finalLogoColorClass = isLogoHovered
    ? logoHoverColorClass
    : logoColorClass;

  // State for Radix NavigationMenu value (controlling open dropdown)
  const [radixValue, setRadixValue] = useState("");

  return (
    <div
      ref={ref}
      className={cn(
        "w-full",
        navBarBg,
        navBarBorder,
        "px-4 lg:px-16 py-5",
        "flex justify-between items-center relative z-50",
        "antialiased"
      )}
      {...rest}
    >
      {/* Logo */}
      <div className="w-[177px] h-[40px] flex-shrink-0">
        <Link
          href="/"
          aria-label="Homepage"
          className={cn(
            "block h-full transition-colors duration-150 ease-out",
            finalLogoColorClass,
            focusRingClass
          )}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onFocus={() => setIsLogoHovered(true)} // Show hover state on focus too
          onBlur={() => setIsLogoHovered(false)}
        >
          <KMFullLogo className="block w-full h-full" color="currentColor" />
        </Link>
      </div>

      {/* Desktop Navigation using Radix UI */}
      {!isMobile && (
        <NavigationMenu.Root
          delayDuration={200}
          value={radixValue} // Controlled component
          onValueChange={setRadixValue} // Update state on change
          className="hidden lg:flex justify-center items-center flex-1"
        >
          <NavigationMenu.List className="flex gap-1">
            {navItems.map((item) => (
              <NavigationMenu.Item
                key={item.id}
                value={item.label.toLowerCase()}
              >
                {item.hasDropdown ? (
                  <>
                    <NavigationMenu.Trigger
                      className={cn(
                        "relative flex items-center justify-center",
                        "cursor-pointer whitespace-nowrap px-3 py-1.5",
                        "text-sm font-medium tracking-tight",
                        "transition-colors ease-out duration-150",
                        "focus:outline-none rounded-none",
                        "text-neutral-700 dark:text-neutral-200",
                        "data-[state=open]:text-neutral-900 data-[state=open]:dark:text-neutral-50",
                        "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50",
                        "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500",
                        "group"
                      )}
                    >
                      {/* Pass isExpanded based on controlled Radix state */}
                      <NavItemContent
                        label={item.label}
                        hasPopup={true}
                        isExpanded={radixValue === item.label.toLowerCase()}
                      />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content
                      // Force remount on open/close for Framer Motion animations inside if needed
                      // Or handle animations purely with Radix data attributes
                      forceMount={radixValue === item.label.toLowerCase()}
                      className={cn(
                        "absolute top-0 left-0 w-full",
                        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out",
                        "data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out",
                        "data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52",
                        "data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52",
                        "bg-white dark:bg-neutral-950",
                        "border-b border-neutral-300 dark:border-neutral-700",
                        "shadow-lg",
                        "mt-[1px]" // Adjust if needed based on border
                      )}
                    >
                      <DesktopDropdownContent
                        type={item.dropdownType || "more"}
                        items={item.dropdownItems || []}
                      />
                    </NavigationMenu.Content>
                  </>
                ) : (
                  <NavigationMenu.Link asChild>
                    <Link
                      href={item.url || "#"}
                      className={cn(
                        "relative flex items-center justify-center",
                        "cursor-pointer whitespace-nowrap px-3 py-1.5",
                        "text-sm font-medium tracking-tight",
                        "transition-colors ease-out duration-150",
                        "focus:outline-none rounded-none",
                        "text-neutral-700 dark:text-neutral-200",
                        "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50",
                        "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500"
                      )}
                      prefetch={false}
                    >
                      <NavItemContent
                        label={item.label}
                        hasPopup={false}
                        isExpanded={false}
                      />
                    </Link>
                  </NavigationMenu.Link>
                )}
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>

          {/* Radix Viewport Positioner */}
          <div className="absolute top-full left-0 flex justify-center w-full perspective-[2000px]">
            <NavigationMenu.Viewport
              className={cn(
                "origin-top-center relative mt-[1px]", // Matches content margin
                "h-[var(--radix-navigation-menu-viewport-height)] w-full", // Let Radix manage width based on content
                "max-w-[--radix-navigation-menu-viewport-width]", // Optional: constrain max width
                "overflow-hidden transition-[width,_height] duration-300 ease-in-out",
                "bg-white dark:bg-neutral-950 rounded-none shadow-lg",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90"
              )}
            />
          </div>
        </NavigationMenu.Root>
      )}

      {/* Spacer for Desktop */}
      {!isMobile && (
        <div
          className="w-[177px] flex-shrink-0 hidden lg:block"
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-md",
              mobileButtonColor,
              focusRingClass
            )}
            onClick={onMenuToggle}
            aria-label="Open main menu"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
});

NavBar.displayName = "NavBar";

NavBar.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  logoColorClass: PropTypes.string,
  logoHoverColorClass: PropTypes.string,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      hasDropdown: PropTypes.bool.isRequired,
      url: PropTypes.string,
      dropdownType: PropTypes.string, // Optional based on your data
      dropdownItems: PropTypes.array, // Optional based on your data
    })
  ),
  onMenuToggle: PropTypes.func, // Required if isMobile can be true
  // Add proptypes for other interaction handlers if passed from parent
};

export default NavBar;
