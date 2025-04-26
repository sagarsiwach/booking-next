// components/features/booking/BookingContainer.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import useStepNavigation from "@/hooks/useStepNavigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import Image from "next/image";
import { cn } from "@/lib/utils";

// Step Components
import VehicleConfiguration from "./steps/VehicleConfiguration";
import UserInformation from "./steps/UserInformation";
import OTPVerification from "./steps/OTPVerification";
import PaymentOverlay from "./steps/PaymentOverlay";
import SuccessState from "./steps/SuccessState";
import FailureState from "./steps/FailureState";
import VehicleSummary from "./VehicleSummary";

// --- Reusable Loaders/Error Displays (Keep definitions) ---
const LoadingIndicator = ({ text = "Loading..." }) => ( <div className="flex flex-col items-center justify-center p-10 text-center min-h-[300px]"> <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <p className="text-muted-foreground">{text}</p> </div> );
const ErrorDisplay = ({ error, onRetry }) => ( <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30"> <p className="font-medium mb-2">Error</p> <p className="text-sm mb-3">{error || "An unexpected error occurred."}</p> {onRetry && <Button variant="destructive" size="sm" onClick={onRetry}>Retry</Button>} </div> );


// --- Main Container Logic ---
function BookingFormContent({
    initialStep = 1,
    headingText = "Book your Ride",
    productImage = "/default-vehicle.png",
    enableDebug = false,
    onStepChange: notifyStepChange,
    onFormSubmit,
}) {
    // --- Hooks (Keep as before) ---
    const contentRef = useRef(null);
    const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const context = useBooking();

    const { formData, updateFormData, vehicleData, loading: contextLoading, apiError, setErrors, errors, debug: contextDebug } = context || { formData: {}, updateFormData: () => {}, vehicleData: null, loading: true, apiError: null, setErrors: () => {}, errors: {}, debug: false, };
    const effectiveDebug = enableDebug || contextDebug;
    const debugLog = useCallback((...args) => { if (effectiveDebug) console.log("BookingForm:", ...args); }, [effectiveDebug]);
    const { currentStep, nextStep, prevStep, goToStep, resetSteps, isFirstStep } = useStepNavigation({ initialStep: initialStep, totalSteps: 5, onStepChange: (step) => { debugLog("Step changed to:", step); if (notifyStepChange) notifyStepChange(step); contentRef.current?.scrollTo(0, 0); } });

    useEffect(() => { setIsClient(true) }, []);

    // --- Conditional Logic & Early Returns (Keep as before) ---
    if (!isClient || !context) { return <div className="flex items-center justify-center min-h-screen"><LoadingIndicator text="Initializing..." /></div>; }
    const showInitialLoading = contextLoading && !vehicleData;
    const showInitialError = apiError && !vehicleData;
    if (showInitialLoading) { return <div className="flex items-center justify-center min-h-screen"><LoadingIndicator text="Loading vehicle data..." /></div>; }
    if (showInitialError) { return <div className="flex items-center justify-center min-h-screen p-4"><ErrorDisplay error={apiError} onRetry={() => window.location.reload()} /></div>; }

    // --- Handlers & Step Details (Keep as before) ---
    const getStepDetails = () => { /* ... */ switch (currentStep) { case 1: return { title: "Configure your Vehicle", desc: "Select your preferred model, variant, color, and options." }; case 2: return { title: "Your Information", desc: "Provide your details for delivery and communication." }; case 3: return { title: "Verification", desc: "Verify your contact number to proceed." }; case 4: return { title: "Booking Confirmed", desc: "Your vehicle booking is complete!" }; case 5: return { title: "Booking Failed", desc: "There was an issue with your booking." }; default: return { title: "Book your Ride", desc: "" }; } };
    const { title: stepTitle, desc: stepDescription } = getStepDetails();
    const handlePaymentSuccess = (details) => { /* ... */ setShowPaymentOverlay(false); setPaymentResult(details); goToStep(4); debugLog("Payment success", details); if (onFormSubmit) onFormSubmit(formData); toast.success("Payment Successful!"); };
    const handlePaymentFailure = (details) => { /* ... */ setShowPaymentOverlay(false); setPaymentResult(details); goToStep(5); debugLog("Payment failure", details); toast.error(details?.message || "Payment Failed."); };
    const handlePaymentCancel = () => { /* ... */ setShowPaymentOverlay(false); debugLog("Payment cancelled."); };
    const handleOtpSubmit = () => { /* ... */ debugLog("OTP Verified, showing payment"); setShowPaymentOverlay(true); };
    const handleOtpFailure = (errorMsg) => { /* ... */ debugLog("OTP Failed:", errorMsg); setErrors({ otp: errorMsg || "Invalid OTP code." }); toast.error(errorMsg || "Invalid OTP code."); };
    const canProceedFromConfig = formData.location && formData.selectedVehicle && formData.selectedVariant && formData.selectedColor;

    // --- Main Render ---
    return (
        // Use block layout for mobile (default), grid for desktop (md breakpoint and up)
        <div className="w-full h-screen max-h-screen overflow-hidden grid md:grid-cols-10 bg-neutral-100 font-sans">

            {/* === Left Side: Image (Spans 3 columns on desktop) === */}
            {/* Ensure full height is maintained in the grid cell */}
            <div className="relative md:col-span-7 h-[25vh] md:h-screen bg-neutral-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                    src={formData?.vehicleImage || productImage}
                    alt={formData?.vehicleName || "Selected Vehicle"}
                    layout="fill"
                    objectFit="contain"
                    priority
                    unoptimized={!(formData?.vehicleImage || productImage)?.includes('cloudinary')}
                 />
            </div>

            {/* === Right Side: Form Content (Spans 1 column on desktop) === */}
             {/* Ensure full height and internal scrolling */}
            <div className="md:col-span-3 flex flex-col h-full max-h-screen overflow-hidden bg-background">
                {/* Header */}
                <div className="p-4 md:p-6 lg:p-8 border-b border-border flex-shrink-0 space-y-1"> {/* Adjusted padding slightly */}
                    <p className="text-sm text-muted-foreground tracking-tight">{headingText}</p>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tighter">{stepTitle}</h1> {/* Adjusted size */}
                    {stepDescription && <p className="text-sm text-muted-foreground tracking-tight pt-1">{stepDescription}</p>} {/* Adjusted size */}
                </div>

                {/* Scrollable Content Area */}
                 {/* Adjusted padding */}
                <div ref={contentRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-40 relative">
                     {vehicleData && (
                         <>
                            {currentStep === 1 && <VehicleConfiguration />}
                            {currentStep === 2 && <UserInformation />}
                            {currentStep === 3 && <OTPVerification phoneNumber={formData.phone} email={formData.email} onVerificationSuccess={handleOtpSubmit} onVerificationFailure={handleOtpFailure} errors={errors} />}
                            {currentStep === 4 && paymentResult && <SuccessState bookingId={paymentResult?.bookingId} customerName={formData.fullName} vehicleName={formData.vehicleName} estimatedDelivery={paymentResult?.estimatedDelivery} onStartOver={resetSteps} />}
                            {currentStep === 5 && <FailureState errorMessage={paymentResult?.message} errorCode={paymentResult?.errorCode} onTryAgain={() => setShowPaymentOverlay(true)} onStartOver={resetSteps} />}
                         </>
                     )}
                     {!vehicleData && !contextLoading && !apiError && (
                         <ErrorDisplay error="Vehicle data could not be loaded." onRetry={() => window.location.reload()} />
                     )}
                </div>

                {/* Fixed Footer */}
                {vehicleData && currentStep < 4 && (
                    <div className="mt-auto border-t border-border bg-background p-4 md:p-4 lg:p-4 flex-shrink-0 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]">
                         {formData.selectedVehicle && (
                             <div className="mb-2">
                                 <VehicleSummary vehicleName={formData.vehicleName} vehicleCode={formData.vehicleCode} location={formData.location} totalPrice={formData.totalPrice} />
                                 <Separator className="my-4"/>
                             </div>
                         )}
                         <div className="flex gap-3 justify-between items-center">
                            <div className="flex-1 flex-grow">
                                {currentStep > 1 && <Button variant="outline" onClick={prevStep} className="w-full md:w-full tracking-tight">Back</Button>}
                            </div>
                            <div className="flex-1 w-full text-right">
                                {currentStep === 1 && <Button onClick={nextStep} disabled={!canProceedFromConfig || contextLoading} className="w-full tracking-tight">Continue</Button>}
                                {currentStep === 2 && <Button onClick={nextStep} /* disabled={!userInfoValid} */ className="w-full tracking-tight">Continue</Button>}
                                {currentStep === 3 && <Button onClick={handleOtpSubmit} /* disabled={!otpValid} */ className="w-full tracking-tight">Verify & Proceed</Button>}
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* Payment Overlay */}
            {showPaymentOverlay && <PaymentOverlay totalAmount={formData.totalPrice} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure} onCancel={handlePaymentCancel} customer={{ name: formData.fullName, email: formData.email, phone: formData.phone }} />}
            <Toaster position="top-right" richColors closeButton/>
        </div>
    );
}


// --- Wrapper Component ---
export default function BookingContainerWrapper(props) {
    return ( <BookingProvider debug={props.enableDebug}> <BookingFormContent {...props} /> </BookingProvider> );
}