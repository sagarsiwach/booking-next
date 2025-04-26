// components/features/booking/VehicleCard.jsx
import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Polestar-inspired Vehicle Card Component.
 * Uses aspect-ratio for the image container.
 */
const VehicleCard = ({
    vehicleName = "Vehicle Name",
    vehicleImage = "/default-vehicle.png",
    vehicleCode = "CODE",
    isSelected = false,
    onClick,
    className,
    ...props
}) => {
        const cardClasses = cn(
        "overflow-hidden transition-all mb-2 border bg-background py-0",
        "hover:border-foreground/30",
        isSelected
            ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
            : "border-border",
        onClick ? "cursor-pointer" : "cursor-default",
        className
    );

    const handleKeyDown = (e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e); } };

    return (
        <Card
            className={cardClasses}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={handleKeyDown}
            aria-pressed={onClick ? isSelected : undefined}
            {...props}
        >
            {/* p-0 remains on CardContent to allow image to touch edges */}
            <CardContent className="flex justify-between items-center p-0">

                {/* Image Container: Set width and aspect ratio, remove fixed height */}
                <div className={cn(
                    "relative flex-shrink-0 overflow-hidden",
                    "w-[160px] aspect-[4/3]", // Set width and 4:3 aspect ratio
                    "bg-neutral-100 dark:bg-neutral-800" // Background for placeholder
                    )}>
                    <Image
                        src={vehicleImage}
                        alt={vehicleName || "Vehicle"}
                        layout="fill"
                        objectFit="cover" // Change to cover to ensure it fills the 4:3 ratio box
                        className="block" // Removed padding class
                        unoptimized={!vehicleImage?.includes('cloudinary')}
                    />
                </div>

                {/* Content: Keep previous styling */}
                <div className="flex-1 flex flex-col items-end text-right p-4 md:p-5 space-y-0.5">
                     <h3 className={cn(
                        "text-2xl md:text-2xl font-medium leading-tight",
                        "tracking-tighter",
                        isSelected ? "text-foreground font-semibold" : "text-foreground"
                     )}>
                         {vehicleName}
                     </h3>
                     <p className="text-sm font-mono text-muted-foreground tracking-normal">
                         {vehicleCode}
                     </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default VehicleCard;