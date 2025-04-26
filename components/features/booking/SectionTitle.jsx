// components/features/booking/SectionTitle.jsx
import React from 'react';
import { cn } from "@/lib/utils";

/**
 * Reusable Section Title Component for Booking Feature.
 * Displays a styled title, typically used to head sections.
 *
 * @param {object} props - Component props.
 * @param {string} props.title - The title text.
 * @param {string} [props.className] - Additional Tailwind classes.
 */
const SectionTitle = ({ title, className }) => {
    if (!title) return null; // Don't render if no title provided

    return (
        <h2 className={cn(
            "text-xs font-semibold text-muted-foreground uppercase tracking-wide", // Base styles
            "mb-3 mt-6 first:mt-0", // Default margins
            className // Allow overriding/extending
        )}>
            {title}
        </h2>
    );
};

export default SectionTitle;