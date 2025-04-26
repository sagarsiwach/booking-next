// components/features/booking/VehicleSummary.jsx
import React from 'react';
import { cn } from "@/lib/utils";
import { formatPrice } from '@/lib/formatting';

/**
 * Polestar-inspired Vehicle Summary Component.
 */
const VehicleSummary = ({
    vehicleName = "Vehicle",
    vehicleCode,
    location,
    totalPrice = 0,
    // EMI info removed as per reference simplification
    className,
}) => {
    const formattedPrice = formatPrice(totalPrice);

    return (
        <div className={cn("text-sm tracking-tight", className)}> {/* Apply tracking */}
            {/* Header Row */}
            <div className="flex justify-between items-start mb-1">
                {/* Use larger, bolder font for name */}
                <h3 className="text-xl md:text-2xl font-semibold text-foreground leading-tight tracking-tighter">
                    {vehicleName}
                </h3>
                {vehicleCode && (
                     <p className="text-xs font-mono text-muted-foreground pt-1 flex-shrink-0 ml-2 tracking-normal"> {/* Normal tracking for mono */}
                        {vehicleCode}
                    </p>
                )}
            </div>

            {/* Content Row */}
            <div className="flex justify-between items-end mt-2"> {/* Add margin top */}
                {/* Location Info */}
                <div className="flex-1 mr-4 space-y-0.5"> {/* Reduce space */}
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivery Location</p> {/* Uppercase Label */}
                    <p className="text-base text-foreground font-normal truncate"> {/* Normal weight */}
                        {location || "Not selected"}
                    </p>
                </div>

                {/* Price Info */}
                <div className="text-right flex-shrink-0">
                    <p className="text-2xl md:text-3xl font-semibold text-foreground leading-tight tracking-tighter"> {/* Match name size/weight */}
                        {formattedPrice}
                    </p>
                    {/* EMI Info Removed */}
                </div>
            </div>
        </div>
    );
};

export default VehicleSummary;