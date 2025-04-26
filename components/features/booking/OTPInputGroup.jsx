// components/features/booking/OTPInputGroup.jsx
"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input'; // Shadcn Input
import { Label } from '@/components/ui/label'; // Shadcn Label
import { cn } from '@/lib/utils';

/**
 * OTP Input Group Component using multiple Shadcn Inputs.
 *
 * @param {object} props - Component props.
 * @param {number} [props.length=6] - Number of OTP digits.
 * @param {string} [props.value=""] - Controlled OTP value.
 * @param {(otp: string) => void} [props.onChange] - Callback when OTP changes.
 * @param {string} [props.label] - Optional label for the group.
 * @param {string} [props.error] - Error message.
 * @param {boolean} [props.disabled=false] - Disable inputs.
 * @param {boolean} [props.autoFocus=false] - Focus first input on mount.
 * @param {string} [props.className] - Additional classes for the container.
 * @param {string} [props.id] - Base ID for inputs.
 */
const OTPInputGroup = ({
    length = 6,
    value = "",
    onChange,
    label,
    error,
    disabled = false,
    autoFocus = false,
    className,
    id,
}) => {
    const [otpValues, setOtpValues] = useState(() => Array(length).fill(""));
    const inputRefs = useRef([]);
    const componentId = React.useId();
    const baseId = id || `otp-${componentId}`;
    const hasError = !!error;

    // Sync state with prop
    useEffect(() => {
        const propValueArray = value.split("").slice(0, length);
        const newOtpValues = Array(length).fill("");
        propValueArray.forEach((char, index) => {
            if (/^\d$/.test(char)) {
                newOtpValues[index] = char;
            }
        });
        setOtpValues(newOtpValues);
    }, [value, length]);

    // Autofocus logic
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
            inputRefs.current[0].select();
        }
        // Ensure refs array has correct length
        inputRefs.current = inputRefs.current.slice(0, length);
     }, [autoFocus, length]);

    const focusInput = (index) => {
        if (index >= 0 && index < length) {
            inputRefs.current[index]?.focus();
            inputRefs.current[index]?.select();
        }
    };

    const handleChange = (index, inputValue) => {
        if (disabled) return;

        const digit = inputValue.match(/\d$/)?.[0] || ""; // Get last digit

        const newOtpValues = [...otpValues];
        newOtpValues[index] = digit;
        setOtpValues(newOtpValues);

        if (onChange) {
            onChange(newOtpValues.join(""));
        }

        // Auto-move focus to next input
        if (digit && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index, e) => {
        if (disabled) return;

        switch (e.key) {
            case "Backspace":
                e.preventDefault();
                if (otpValues[index]) {
                    const newOtpValues = [...otpValues];
                    newOtpValues[index] = "";
                    setOtpValues(newOtpValues);
                    if (onChange) onChange(newOtpValues.join(""));
                    // Optionally move focus back if desired after clearing,
                    // but standard behavior is often to stay put.
                    // focusInput(index - 1); // Uncomment to move back after clear
                } else {
                     // If already empty, move focus back
                     focusInput(index - 1);
                }
                break;
            case "Delete": // Handle delete similar to backspace but stay put
                 e.preventDefault();
                 if (otpValues[index]) {
                     const newOtpValues = [...otpValues];
                     newOtpValues[index] = "";
                     setOtpValues(newOtpValues);
                     if (onChange) onChange(newOtpValues.join(""));
                 }
                 break;
            case "ArrowLeft":
                e.preventDefault();
                focusInput(index - 1);
                break;
            case "ArrowRight":
                e.preventDefault();
                focusInput(index + 1);
                break;
             case "Home":
                 e.preventDefault();
                 focusInput(0);
                 break;
             case "End":
                 e.preventDefault();
                 focusInput(length - 1);
                 break;
            default:
                 // Allow digit entry (handled by onChange)
                 // Prevent non-digit characters if needed (though pattern helps)
                 if (!/^\d$/.test(e.key) && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
                     e.preventDefault();
                 }
                break;
        }
    };

    const handlePaste = (e) => {
        if (disabled) return;
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();
        const digits = pastedData.replace(/\D/g, '').split('');

        if (digits.length > 0) {
            const newOtpValues = [...otpValues];
            let currentInputIndex = 0; // Start pasting from the first input
            let digitsPasted = 0;

            while (currentInputIndex < length && digitsPasted < digits.length) {
                newOtpValues[currentInputIndex] = digits[digitsPasted];
                digitsPasted++;
                currentInputIndex++;
            }

            setOtpValues(newOtpValues);

            // Focus the next empty input or the last pasted input
            const focusIndex = Math.min(currentInputIndex, length - 1);
            focusInput(focusIndex);


            if (onChange) {
                onChange(newOtpValues.join(""));
            }
        }
    };


    return (
        <div className={cn("space-y-2", className)}>
             {label && (
                 <Label htmlFor={`${baseId}-0`} className={hasError ? "text-destructive" : ""}>
                     {label}
                 </Label>
             )}
            <div
                className="flex justify-center items-center gap-2"
                onPaste={handlePaste} // Handle paste on the container
            >
                {Array.from({ length }).map((_, index) => (
                    <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        id={`${baseId}-${index}`}
                        type="text" // Use text, pattern/inputMode handle numeric
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otpValues[index]}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={(e) => e.target.select()} // Select on focus
                        disabled={disabled}
                        className={cn(
                            "w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-medium rounded-md", // Responsive size
                            "border-2 focus:border-primary focus:ring-1 focus:ring-primary", // Basic styling
                            hasError ? "border-destructive focus:border-destructive focus:ring-destructive" : "border-input" // Error state
                        )}
                        aria-label={`OTP Digit ${index + 1}`}
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                    />
                ))}
            </div>
             {hasError && (
                 <p className="text-sm text-destructive text-center mt-1">{error}</p>
             )}
        </div>
    );
};

export default OTPInputGroup;