// components/features/booking/PhoneInput.jsx
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input'; // Shadcn Input
import { Label } from '@/components/ui/label'; // Shadcn Label
import { cn } from '@/lib/utils';

/**
 * Phone Input Component with Country Code Prefix.
 *
 * @param {object} props - Component props.
 * @param {string} [props.label="Mobile Number"] - Input label.
 * @param {string} [props.countryCode="+91"] - Country code prefix.
 * @param {string} [props.value=""] - Controlled phone number value (digits only).
 * @param {(value: string) => void} [props.onChange] - Callback with digits only.
 * @param {string} [props.placeholder="Phone number"] - Placeholder text.
 * @param {string} [props.error] - Error message.
 * @param {boolean} [props.disabled=false] - Disable input.
 * @param {boolean} [props.required=false] - Mark as required.
 * @param {number} [props.maxLength=10] - Max length for the number part.
 * @param {string} [props.className] - Additional classes for the container.
 * @param {string} [props.id] - Base ID.
 * @param {string} [props.name] - Input name.
 */
const PhoneInput = React.forwardRef(({
    label = "Mobile Number",
    countryCode = "+91",
    value = "",
    onChange,
    placeholder = "Phone number",
    error,
    disabled = false,
    required = false,
    maxLength = 10,
    className,
    id,
    name,
    ...props // Pass rest props to the input element
}, ref) => {
    const componentId = React.useId();
    const uniqueId = id || `phone-${componentId}`;
    const hasError = !!error;

    const handleInputChange = (event) => {
        // Allow only digits and respect maxLength
        const digitsOnly = event.target.value.replace(/\D/g, "");
        const truncatedValue = digitsOnly.slice(0, maxLength);

        if (onChange) {
            onChange(truncatedValue);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <Label htmlFor={uniqueId} className={hasError ? "text-destructive" : ""}>
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            )}
            <div
                className={cn(
                    "flex items-center w-full rounded-md border border-input bg-background ring-offset-background", // Base wrapper style matching Input
                    "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", // Focus ring on wrapper
                    disabled ? "cursor-not-allowed opacity-50" : "",
                    hasError ? "border-destructive focus-within:ring-destructive" : ""
                )}
            >
                {countryCode && (
                    <div className="h-full flex items-center justify-center px-3 border-r border-input bg-muted text-muted-foreground text-sm font-medium select-none flex-shrink-0">
                        {countryCode}
                    </div>
                )}
                <Input
                    ref={ref}
                    id={uniqueId}
                    name={name || uniqueId}
                    type="tel" // Use tel type
                    inputMode="numeric" // Hint for mobile keyboard
                    pattern="[0-9]*"
                    placeholder={placeholder}
                    value={value} // Use the controlled value directly
                    onChange={handleInputChange}
                    disabled={disabled}
                    required={required}
                    maxLength={maxLength} // Apply maxLength directly
                    className={cn(
                        "flex-1 h-full px-3 py-2 text-sm", // Input specific style adjustments
                        "border-0 ring-0 shadow-none focus-visible:ring-0 focus-visible:shadow-none focus:outline-none", // Remove internal Input border/ring
                        "bg-transparent" // Make input background transparent
                    )}
                    aria-invalid={hasError}
                    aria-describedby={error ? `${uniqueId}-error` : undefined}
                    {...props} // Spread rest props
                />
            </div>
            {hasError && (
                <p id={`${uniqueId}-error`} className="text-sm text-destructive mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;