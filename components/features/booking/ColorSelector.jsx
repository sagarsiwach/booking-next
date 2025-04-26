// components/features/booking/ColorSelector.jsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; // Use Label for accessibility

// Reusable SectionTitle (or import if moved)
const SectionTitle = ({ title, className }) => (
    <h2 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3", className)}>
        {title}
    </h2>
);

/**
 * Polestar-inspired Color Selector using RadioGroup.
 */
const ColorSelector = ({
    label = "Finish", // Default label from reference
    colors = [],
    selectedColorId = null,
    onChange,
    className,
}) => {
    const handleValueChange = (value) => {
        if (onChange) onChange(value);
    };

    const selectedColor = colors.find((c) => String(c.id) === String(selectedColorId));
    const selectedColorName = selectedColor?.name || "";

    return (
        <div className={cn("mb-6", className)}>
            {/* Section Title and Selected Color Name */}
            <div className="mb-4 space-y-1">
                 <SectionTitle title={label} className="mb-1"/>
                 {/* Match reference style: Larger text for selected name */}
                 <p className="text-2xl font-semibold tracking-tighter min-h-[1.4em]"> {/* Adjusted size/tracking */}
                     {selectedColorName}
                 </p>
            </div>

            {/* Radio Group for Color Swatches */}
            <RadioGroup
                value={selectedColorId !== null ? String(selectedColorId) : undefined}
                onValueChange={handleValueChange}
                className="flex flex-wrap gap-3" // Horizontal layout with gap
                aria-label={label || "Color Selection"}
            >
                {colors.map((color) => {
                    const backgroundStyle = color.endValue
                        ? `conic-gradient(from 174.33deg at 46.25% 0%, ${color.endValue} -179.01deg, ${color.value} 180deg, ${color.endValue} 180.99deg, ${color.value} 540deg)`
                        : color.value;
                    const isSelected = String(color.id) === String(selectedColorId);

                    return (
                        // Wrap RadioGroupItem with Label for clicking the swatch itself
                        <Label
                            key={color.id}
                            htmlFor={`color-${color.id}`}
                            className={cn(
                                "relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-lg cursor-pointer border-2 transition-all duration-200 ease-out", // Larger, slightly rounded square/rect as per ref style swatches
                                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", // Focus state on label
                                isSelected
                                    ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background" // Selected: primary border and ring
                                    : "border-transparent hover:border-muted-foreground/30" // Unselected: transparent border, subtle hover
                            )}
                            style={{ background: backgroundStyle }}
                            title={color.name}
                        >
                            <RadioGroupItem
                                value={String(color.id)}
                                id={`color-${color.id}`}
                                className="sr-only" // Visually hide the actual radio button
                                aria-label={color.name}
                            />
                            {/* No checkmark needed, selection is indicated by border/ring */}
                        </Label>
                    );
                })}
            </RadioGroup>

            {colors.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No colors available.</p>
            )}
        </div>
    );
};

export default ColorSelector;