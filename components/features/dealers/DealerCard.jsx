// components/features/dealers/DealerCard.jsx
import React from "react";
// Removed Shadcn Card imports as we are styling div directly
import { Badge } from "@/components/ui/badge";
import { MapPinIcon, StoreIcon, SettingsIcon, BoltIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/lib/formatting";

/**
 * @typedef {import('@/lib/constants').Dealer} Dealer
 */

const DealerCard = ({ dealer, isSelected, onSelect, distanceUnit = "km" }) => {
  // --- Add Null Check for dealer ---
  if (!dealer) {
    console.warn("DealerCard received null or undefined dealer prop.");
    return null; // Don't render anything if dealer data is missing
  }
  // --- End Null Check ---

  const { id, name, address, services = [], distance } = dealer; // Default services to empty array

  // --- Safely access services ---
  const safeServices = Array.isArray(services) ? services : []; // Ensure it's an array
  const hasSales = safeServices.some(
    (s) => s && (s.toLowerCase() === "sales" || s.toLowerCase() === "store")
  );
  const hasService = safeServices.some(
    (s) => s && (s.toLowerCase() === "service" || s.toLowerCase() === "repair")
  );
  const hasCharging = safeServices.some(
    (s) => s && s.toLowerCase() === "charging"
  );
  // --- End Safe Access ---

  const fullAddress = formatAddress(address);

  const cardClasses = cn(
    "w-full overflow-hidden transition-all duration-200 cursor-pointer",
    "flex flex-col",
    "rounded-lg border",
    "bg-background",
    isSelected
      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
      : "border-border hover:border-muted-foreground/30",
    "shadow-none hover:shadow-sm"
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(); // onSelect should already have dealer context from parent
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      data-dealer-id={id}
    >
      {/* Header Section */}
      <div className="px-3 pt-3 pb-1.5">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className="text-sm font-semibold leading-tight">
            {name || "Unnamed Dealer"}
          </h3>{" "}
          {/* Add fallback for name */}
          {distance !== undefined && distance !== Infinity && (
            <Badge
              variant="secondary"
              className="flex-shrink-0 text-[10px] px-1.5 py-0 h-4 whitespace-nowrap"
            >
              ~{distance.toFixed(1)} {distanceUnit}
            </Badge>
          )}
        </div>
        <p className="flex items-start text-xs text-muted-foreground pt-0">
          <MapPinIcon className="w-3 h-3 mr-1 mt-[1px] flex-shrink-0" />
          <span className="line-clamp-2 leading-snug">{fullAddress}</span>
        </p>
      </div>

      {/* Footer Section */}
      <div className="px-3 pt-1 pb-2.5 mt-auto">
        <div className="flex flex-wrap gap-1">
          {hasSales && (
            <Badge
              variant="outline"
              className="font-normal text-[10px] py-0 px-1.5 border-blue-400/40 text-blue-700 bg-blue-50"
            >
              <StoreIcon className="w-2.5 h-2.5 mr-0.5" /> Sales
            </Badge>
          )}
          {hasService && (
            <Badge
              variant="outline"
              className="font-normal text-[10px] py-0 px-1.5 border-red-400/40 text-red-700 bg-red-50"
            >
              <SettingsIcon className="w-2.5 h-2.5 mr-0.5" /> Service
            </Badge>
          )}
          {hasCharging && (
            <Badge
              variant="outline"
              className="font-normal text-[10px] py-0 px-1.5 border-green-400/40 text-green-700 bg-green-50"
            >
              <BoltIcon className="w-2.5 h-2.5 mr-0.5" /> Charging
            </Badge>
          )}
          {/* Render placeholder if no services? Optional */}
          {/* {!hasSales && !hasService && !hasCharging && (
                        <span className="text-[10px] text-muted-foreground italic">No services listed</span>
                    )} */}
        </div>
      </div>
    </div>
  );
};

export default DealerCard;
