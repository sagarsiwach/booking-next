// components/features/dealers/MapPlaceholder.jsx
import React from "react";
import { MapPinOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Placeholder component shown when the map cannot be loaded or initialized.
 * @param {object} props
 * @param {string} [props.message="Map unavailable"] - Main message to display.
 * @param {string} [props.subtext] - Optional smaller text below the main message.
 * @param {string} [props.className] - Additional Tailwind classes for the container.
 */
const MapPlaceholder = ({
  message = "Map unavailable",
  subtext,
  className,
}) => {
  return (
    <div
      className={cn(
        // Use absolute positioning to cover the map container area
        "absolute inset-0 flex flex-col items-center justify-center",
        // Styling for background and text
        "bg-muted/60 backdrop-blur-sm p-6 text-center z-10", // Slightly transparent muted background with blur
        className
      )}
    >
      <MapPinOffIcon
        className="w-10 h-10 text-muted-foreground/50 mb-3" // Adjusted size and margin
        strokeWidth={1.5}
      />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">
          {" "}
          {/* Max width for subtext */}
          {subtext}
        </p>
      )}
    </div>
  );
};

export default MapPlaceholder;
