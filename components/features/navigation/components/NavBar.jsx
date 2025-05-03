// components/features/navigation/components/NavBar.jsx
import React, { useRef } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react"; // Use Lucide icon
import NavItem from "./NavItem"; // Import your NavItem
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Placeholder for Logo component - Replace with your actual logo import
const KMFullLogo = ({ className }) => (
  <svg
    className={cn("w-full h-full", className)}
    viewBox="0 0 177 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Add your actual SVG path data here */}
    <path d="M10 10 H 167 V 30 H 10 Z" />
    <text x="20" y="25" fontFamily="Arial" fontSize="16" fill="currentColor">
      Kabira Mobility
    </text>
  </svg>
);

// Interfaces for reference
// export interface DesktopNavItemData { ... }
// export interface NavBarProps { ... }

export const NavBar = ({
  isMobile = false,
  logoColorClass = "text-neutral-900 dark:text-neutral-100", // Use CSS vars or Tailwind classes
  navItems = [],
  activeItemLabel = "", // Currently focused/active item in NavBar itself
  onMenuToggle, // For mobile
  // Desktop handlers
  onItemHover = () => {},
  onItemLeave = () => {},
  onItemFocus = () => {},
  onItemBlur = () => {},
  onItemClick = () => {},
  onItemKeyDown = () => {},
  activeDropdownLabel = "", // Which dropdown is currently expanded
  getDropdownId = (label) => `dropdown-${label.toLowerCase()}`,
  navItemRefs, // Refs for desktop keyboard nav
}) => {
  const navContainerRef = useRef(null);

  return (
    <div
      className={cn(
        "w-full bg-background border-b border-border",
        "px-4 lg:px-8 py-3", // Adjust padding
        "flex justify-between items-center relative z-50"
      )}
    >
      {/* Logo */}
      <div className={`w-[160px] h-[36px] flex-shrink-0`}>
        {" "}
        {/* Slightly smaller logo */}
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

      {/* Desktop Navigation */}
      {!isMobile && (
        <nav
          ref={navContainerRef}
          aria-label="Main Navigation"
          role="menubar"
          className="hidden lg:flex justify-center items-center gap-1 relative"
        >
          {navItems.map((item, index) => (
            <NavItem
              ref={(el) => (navItemRefs.current[index] = el)}
              key={item.id}
              id={item.id}
              label={item.label}
              isActive={activeItemLabel === item.label} // Active based on direct focus/hover
              hasPopup={item.hasDropdown}
              isExpanded={
                item.hasDropdown &&
                activeDropdownLabel.toLowerCase() === item.label.toLowerCase()
              }
              controlsId={
                item.hasDropdown ? getDropdownId(item.label) : undefined
              }
              onClick={(e) => onItemClick(item, e)}
              onMouseEnter={() => onItemHover(item.label)} // Pass label
              onMouseLeave={onItemLeave}
              onFocus={() => onItemFocus(item.label)} // Pass label
              onBlur={onItemBlur}
              onKeyDown={(e) => onItemKeyDown(item, e)}
              href={item.url}
              role="menuitem"
            />
          ))}
        </nav>
      )}

      {/* Spacer for Desktop (optional, if logo isn't centered) */}
      {!isMobile && (
        <div className="w-[160px] flex-shrink-0 hidden lg:block"></div>
      )}

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onMenuToggle}
            aria-label="Open main menu"
            aria-expanded={false} // MobileMenu component should manage its own expanded state
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NavBar;
