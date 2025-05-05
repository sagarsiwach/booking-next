// booking-next/components/features/navigation/components/NavBar.jsx
"use client";

import React, { useState, useRef } from "react"; // Added useRef
import Link from "next/link";
// Import Carbon icons
import { Menu, ChevronDown } from "@carbon/icons-react"; // Use Carbon icons
import { KMFullLogo } from "./NavLogo";
import { cn } from "@/lib/utils";

export const NavBar = React.forwardRef(
  (
    {
      isMobile,
      logoColorClass = "text-neutral-700 dark:text-neutral-200",
      logoHoverColorClass = "hover:text-neutral-900 dark:hover:text-neutral-50",
      navItems = [],
      onMenuToggle,
      onItemHover,
      onItemLeave,
      onItemFocus,
      onItemBlur,
      onItemClick,
      onItemKeyDown,
      activeDropdownLabel = "",
      getDropdownId,
      navItemRefs, // Make sure this prop is passed down correctly
    },
    ref
  ) => {
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const finalLogoColorClass = isLogoHovered
      ? logoHoverColorClass
      : logoColorClass;

    // Ensure navItemRefs is initialized if not passed (though parent should handle it)
    if (!navItemRefs) {
      navItemRefs = useRef([]);
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full bg-white dark:bg-neutral-950",
          "border-b border-neutral-300 dark:border-neutral-700",
          "px-4 lg:px-16 py-5",
          "flex justify-between items-center relative z-50",
          "antialiased"
        )}
        onMouseLeave={onItemLeave} // Handle leave on the container
      >
        {/* Logo */}
        <div className="w-[177px] h-[40px] flex-shrink-0">
          <Link
            href="/"
            aria-label="Homepage"
            className={cn(
              "block h-full transition-colors duration-150 ease-out",
              finalLogoColorClass,
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-blue-500" // Added ring offset for visibility
            )}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <KMFullLogo className="block w-full h-full" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav
            aria-label="Main Navigation"
            role="menubar"
            className="flex justify-end items-center gap-5 relative flex-grow" // Aligned right
          >
            {navItems.map((item, index) => (
              <Link
                ref={(el) => {
                  if (navItemRefs.current) {
                    // Check if ref is available
                    navItemRefs.current[index] = el;
                  }
                }}
                key={item.id}
                id={item.id}
                href={item.url || "#"}
                role="menuitem"
                aria-haspopup={item.hasDropdown ? "menu" : undefined}
                aria-expanded={
                  item.hasDropdown
                    ? activeDropdownLabel === item.label.toLowerCase()
                    : undefined
                }
                aria-controls={
                  item.hasDropdown ? getDropdownId?.(item.label) : undefined
                }
                onClick={(e) => onItemClick?.(item, e)}
                onMouseEnter={() => onItemHover?.(item)}
                // onMouseLeave handled by parent div
                onFocus={() => onItemFocus?.(item)}
                onBlur={onItemBlur}
                onKeyDown={(e) => onItemKeyDown?.(item, e)}
                className={cn(
                  "flex items-center justify-center cursor-pointer relative",
                  "text-base tracking-[-0.04em] font-medium", // 16px font, -4% tracking
                  "px-3 py-1.5", // Padding around text
                  "transition-colors duration-150 ease-out",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-neutral-500", // Added ring offset
                  // Style for active/hovered state
                  activeDropdownLabel === item.label.toLowerCase()
                    ? "text-neutral-900 dark:text-neutral-50 bg-neutral-100 dark:bg-neutral-800" // Indicate active state better
                    : "text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <span>{item.label}</span>
                {item.hasDropdown && (
                  // Replace inline SVG with Carbon ChevronDown
                  <ChevronDown
                    size={16} // Carbon icons use size prop (adjust as needed)
                    className={cn(
                      "ml-1 transform transition-transform duration-200",
                      activeDropdownLabel === item.label.toLowerCase()
                        ? "rotate-180"
                        : "rotate-0" // Explicitly set rotate-0 for clarity
                    )}
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <button
            type="button"
            aria-label="Open main menu"
            onClick={onMenuToggle}
            className={cn(
              "h-9 w-9 flex items-center justify-center",
              "text-neutral-900 dark:text-neutral-100",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-blue-500" // Added ring offset
            )}
          >
            {/* Replace Lucide Menu with Carbon Menu */}
            <Menu size={24} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

NavBar.displayName = "NavBar";

export default NavBar;
