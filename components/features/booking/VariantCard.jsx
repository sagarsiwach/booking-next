// components/features/booking/VariantCard.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice } from '@/lib/formatting'; // Import if needed within this component

const VariantCard = ({
    title = "Variant Title",
    subtitle,
    description,
    price = "", // This comes from API (string or number)
    includedText = "Included",
    isSelected = false,
    onClick,
    isMandatory = false, // Destructure custom prop
    is_default,        // Destructure custom prop (even if not directly used in logic)
    className,
    ...props // Remaining props (like data-testid) that ARE valid DOM attributes
}) => {
    const isClickable = onClick && !isMandatory;
    const cardClasses = cn( /* ... keep classes ... */
        "transition-all mb-2 border bg-background py-0",
        "hover:border-foreground/30",
        isSelected ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-border",
        isClickable ? "cursor-pointer" : "cursor-default",
        isMandatory && "opacity-70",
        className
    );

    const handleKeyDown = (e) => { if (isClickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e); } };

    // Use is_default here if needed, e.g. to modify includedText
    const actualIncludedText = price ? "" : (is_default && !isMandatory ? "Standard" : includedText);

    const priceOrStatusText = price ? price : (isMandatory ? "Mandatory" : actualIncludedText);
    const priceOrStatusClass = price
        ? (isSelected ? "text-foreground font-semibold" : "text-muted-foreground")
        : (isMandatory ? "text-muted-foreground font-medium" : "text-foreground font-medium");

    return (
        // Spread only the valid remaining ...props
        <Card
            className={cardClasses}
            onClick={isClickable ? onClick : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={handleKeyDown}
            aria-pressed={isClickable ? isSelected : undefined}
            {...props}
        >
            <CardContent className="flex justify-between items-center p-4 md:p-5">
                {/* ... card content ... */}
                <div className="flex-1 space-y-1 mr-4">
                     <CardTitle className={cn("text-lg md:text-xl font-semibold leading-tight tracking-tighter", isSelected ? "text-foreground" : "text-foreground")}>
                         {title}
                     </CardTitle>
                     {subtitle && <p className="text-sm text-muted-foreground tracking-tight">{subtitle}</p>}
                     {description && <CardDescription className="text-xs tracking-tight !mt-1">{description}</CardDescription>}
                </div>
                <div className={cn("text-sm md:text-base text-right flex-shrink-0 tracking-tight", priceOrStatusClass)}>
                     {priceOrStatusText}
                </div>
            </CardContent>
        </Card>
    );
};

export default VariantCard;