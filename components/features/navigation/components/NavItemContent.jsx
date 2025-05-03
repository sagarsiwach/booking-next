// components/features/navigation/components/NavItemContent.jsx
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react"; // Icon for dropdown trigger

/**
 * This component simply renders the label for a NavItem.
 * It's used inside Radix Triggers or Links to apply consistent styling.
 */
const NavItemContent = ({ label, hasPopup, isExpanded }) => {
  return (
    <>
      <span>{label}</span>
      {hasPopup && (
        <ChevronDown
          className={cn(
            "relative top-[1px] ml-1 h-3.5 w-3.5 transition duration-200",
            isExpanded && "rotate-180" // Rotate arrow when expanded
          )}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default NavItemContent;
