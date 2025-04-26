// components/features/booking/steps/OTPVerification.jsx
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useBooking } from '@/context/BookingContext';
import { sendOTP, verifyOTP } from '@/lib/api'; // Mock API calls
import { isValidOTP } from '@/lib/validation';
// --- Import Shadcn InputOTP components ---
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
// --- End Import ---
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const OTPVerification = ({
    phoneNumber, // Expecting digits only now ideally
    email,
    onVerificationSuccess,
    onVerificationFailure,
    errors,
}) => {
    const { setErrors } = useBooking();
    const [otp, setOtp] = useState(""); // InputOTP handles internal state, this tracks the complete value
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [resendCountdown, setResendCountdown] = useState(30);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    // --- Resend Timer Logic (Keep as before) ---
    useEffect(() => { /* ... timer logic ... */ }, [resendCountdown, resendDisabled]);
    useEffect(() => { /* ... initial timer start ... */ }, []);

    // --- OTP Change Handler (Simplified) ---
    // InputOTP's `onChange` provides the complete string
    const handleOTPChange = (newOtpValue) => {
        setOtp(newOtpValue);
        // Clear context error when user types
        if (errors?.otp) {
             setErrors(prev => ({...prev, otp: null}));
        }
    };

    // --- Resend Handler (Keep as before) ---
    const handleResendOTP = useCallback(async () => { /* ... keep logic ... */ }, [phoneNumber, email, setErrors]);

    // --- Verify Handler (Keep as before) ---
    const handleVerify = useCallback(async () => { /* ... keep logic ... */ }, [otp, phoneNumber, onVerificationSuccess, onVerificationFailure, setErrors]);

    // --- Submit on Enter (Keep as before) ---
    useEffect(() => { /* ... enter key logic ... */ }, [otp, isVerifying, handleVerify]);

    return (
        <div className="flex flex-col items-center text-center space-y-6">
            {/* Use Shadcn InputOTP */}
            <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOTPChange} // Use the simplified handler
                disabled={isVerifying || isSendingOtp}
                aria-label="One-Time Password"
            >
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                </InputOTPGroup>
                {/* Optional: Add separator for visual grouping */}
                {/* <InputOTPSeparator /> */}
                <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>

            {/* Display Error Below OTP Input */}
            {errors?.otp && (
                 <p className="text-sm text-destructive">{errors.otp}</p>
            )}

            {/* Resend Link (Keep as before) */}
            <div className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <Button variant="link" className="p-0 h-auto disabled:opacity-50" onClick={handleResendOTP} disabled={resendDisabled || isSendingOtp} size="sm" >
                    {isSendingOtp ? "Sending..." : resendDisabled ? `Resend in ${resendCountdown}s` : "Resend code"}
                </Button>
            </div>

             {/* Test Info Box (Keep as before) */}
             <div className="!mt-8 p-3 bg-muted/50 border border-dashed rounded-md text-xs text-muted-foreground text-left w-full max-w-xs">
                 <p className="font-medium mb-1">Testing Information:</p>
                 <p>Use OTP <code className="font-mono bg-muted px-1 py-0.5 rounded">123456</code> for successful verification.</p>
                 <p>Any other 6-digit code will result in failure.</p>
             </div>

             {/* The main "Verify & Proceed" button is likely in BookingContainer's footer */}
        </div>
    );
};

export default OTPVerification;