// components/features/booking/ComponentCard.jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Use CardContent for padding consistency
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatting';

const ComponentCard = ({
    title,
    subtitle,
    price = 0,
    isSelected = false,
    isMandatory = false, // Destructure custom prop
    is_required,       // Destructure custom prop (alias from API data)
    onClick,
    className,
    ...props // Remaining valid DOM props
}) => {
    // Use either isMandatory or is_required depending on what's passed
    const mandatory = isMandatory || is_required;
    const isClickable = onClick && !mandatory;

    const cardClasses = cn( /* ... keep classes ... */
        "flex items-center justify-between p-4 transition-all border rounded-lg py-0",
        "hover:border-foreground/30",
        isSelected ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background bg-muted/30" : "border-border bg-background",
        isClickable ? "cursor-pointer" : "cursor-default opacity-70",
        className
    );

    const handleKeyDown = (e) => { if (isClickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e); } };

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
            {/* Use CardContent to wrap internal elements if needed, or apply padding directly */}
            {/* Content: Title and Subtitle */}
             <div className="grid gap-0.5 leading-none mr-4 flex-1">
                 <span className={cn("font-medium tracking-tight", isSelected ? "text-foreground" : "text-foreground")}>
                     {title}
                     {mandatory && <span className="text-muted-foreground font-normal ml-1 text-xs">(Required)</span>}
                 </span>
                 {subtitle && (
                     <p className="text-xs text-muted-foreground tracking-tight">
                         {subtitle}
                     </p>
                 )}
             </div>
             {/* Price or Status */}
             <div className="text-sm font-medium text-right flex-shrink-0 tracking-tight ml-2">
                 {price > 0
                     ? formatPrice(price, false, "+")
                     : mandatory ? "" : "Included"}
             </div>
        </Card>
    );
};

export default ComponentCard;