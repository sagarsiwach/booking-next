// components/features/navigation/components/DesktopDropdownContent.jsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";

// Subcomponent for a single item within the dropdown (either model or link)
const DropdownItem = React.forwardRef(({ item, className, ...props }, ref) => {
  const isModel = item.type === "model";

  return (
    <NavigationMenu.Link asChild>
      <Link
        ref={ref}
        href={item.url || "#"}
        className={cn(
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-accent", // Focus style
          "block select-none space-y-1 p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground", // Base styles from Shadcn example
          // Custom styles to match layout
          isModel
            ? "flex flex-col group rounded-none border-b border-border last:border-b-0 md:border-b-0 md:border md:rounded-lg md:overflow-hidden"
            : "rounded-md", // Model-specific layout
          className
        )}
        {...props}
        prefetch={false}
      >
        {isModel && item.image && (
          <div className="w-full aspect-[16/9] relative overflow-hidden bg-muted mb-2">
            <Image
              src={item.image}
              alt={item.label}
              layout="fill"
              objectFit="contain"
              className="p-2"
              loading="lazy"
              unoptimized={!item.image?.includes("cloudinary")}
            />
          </div>
        )}
        <div
          className={cn(
            "flex items-center justify-between",
            isModel && "p-3 pt-0 md:p-3" // Adjust padding for model card text
          )}
        >
          <div
            className={cn(
              "text-sm font-medium leading-none",
              isModel
                ? "text-base text-foreground group-hover:text-accent-foreground"
                : "text-muted-foreground group-hover:text-accent-foreground" // Different text styles
            )}
          >
            {item.label}
          </div>
          {isModel ? (
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-accent-foreground transition-colors" />
          )}
        </div>
        {/* Optional description for non-model links */}
        {/* {!isModel && item.description && (
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {item.description}
                    </p>
                )} */}
      </Link>
    </NavigationMenu.Link>
  );
});
DropdownItem.displayName = "DropdownItem";

// Main content renderer based on type
export const DesktopDropdownContent = ({ type, items = [] }) => {
  switch (type) {
    case "motorbikes":
    case "scooters":
      const models = items.filter((item) => item.type === "model");
      const links = items.filter((item) => item.type === "link");

      if (models.length === 0 && links.length === 0) {
        return (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No items available.
          </div>
        );
      }

      return (
        // Use ul for semantic list structure
        // Adjust max-width, padding, etc. as needed
        <ul className="flex flex-col md:flex-row gap-4 p-4 md:w-[--radix-navigation-menu-viewport-width] max-w-6xl mx-auto">
          {/* Models Section - Use grid for layout */}
          <li className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-auto">
            {models.map((item) => (
              <DropdownItem key={item.label} item={item} />
            ))}
          </li>
          {/* Links Section - Use flex column */}
          {links.length > 0 && (
            <li className="w-full md:w-56 flex-shrink-0 flex flex-col gap-1 md:border-l md:pl-4">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider px-3 pt-1 pb-2 hidden md:block">
                Explore
              </h4>
              {links.map((item) => (
                <DropdownItem key={item.label} item={item} />
              ))}
            </li>
          )}
        </ul>
      );

    case "more":
      const moreItems = items.filter((item) => item.type === "link");
      // Grouping logic from Framer code (if needed, otherwise render flat)
      const groupedItems = moreItems.reduce((acc, item) => {
        const groupKey = item.group ?? 0; // Default to group 0 if not specified
        acc[groupKey] = acc[groupKey] || [];
        acc[groupKey].push(item);
        return acc;
      }, {});
      const groupKeys = Object.keys(groupedItems).map(Number).sort();

      if (moreItems.length === 0) {
        return (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No items available.
          </div>
        );
      }

      return (
        // Use grid for 'more' links, allowing columns
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 p-4 md:w-[600px] lg:w-[700px]">
          {groupKeys.map((groupIndex) => (
            // Render each group (could add headers later if needed)
            <React.Fragment key={`more-group-${groupIndex}`}>
              {groupedItems[groupIndex].map((item) => (
                <DropdownItem
                  key={item.label}
                  item={{ ...item, type: "link" }}
                /> // Ensure type is link
              ))}
            </React.Fragment>
          ))}
        </ul>
      );

    default:
      return (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Invalid dropdown type.
        </div>
      );
  }
};

export default DesktopDropdownContent;
