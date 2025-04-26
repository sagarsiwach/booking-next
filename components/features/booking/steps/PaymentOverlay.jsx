// components/features/booking/steps/PaymentOverlay.jsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'; // Use Sheet
import { formatPrice } from '@/lib/formatting'; // Assuming you have this
import { processPayment } from '@/lib/api'; // Mock API call

/**
 * Payment Overlay Component (using Shadcn Sheet)
 * Simulates a payment gateway interaction.
 *
 * @param {object} props - Component props.
 * @param {number} props.totalAmount - The amount to be "paid".
 * @param {function} props.onPaymentSuccess - Callback on successful payment simulation. Signature: `(details: object) => void`
 * @param {function} props.onPaymentFailure - Callback on failed payment simulation. Signature: `(details: object) => void`
 * @param {function} props.onCancel - Callback when the overlay is closed without payment attempt.
 * @param {object} [props.customer] - Optional customer details (name, email, phone).
 */
const PaymentOverlay = ({
    totalAmount = 0,
    onPaymentSuccess,
    onPaymentFailure,
    onCancel,
    customer, // Optional customer details
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(true); // Control Sheet visibility

    const handlePaymentAttempt = async (shouldSucceed) => {
        setIsProcessing(true);
        try {
            // In a real app, pass relevant details (amount, customer info, etc.)
            const paymentDetails = {
                amount: totalAmount,
                currency: 'INR',
                customer: customer,
                mockSuccess: shouldSucceed, // Tell mock API how to behave
            };
            const result = await processPayment(paymentDetails); // Use mock API

            if (result.status === 'success') {
                onPaymentSuccess(result);
            } else {
                onPaymentFailure(result);
            }
        } catch (error) {
            console.error("Payment processing error:", error);
            onPaymentFailure({ status: 'error', message: 'An unexpected error occurred during payment.' });
        } finally {
            setIsProcessing(false);
            setIsOpen(false); // Close sheet after attempt
        }
    };

    const handleSheetClose = (openState) => {
        if (!openState && !isProcessing) {
            // If closed manually (not via button click after processing)
            if (onCancel) {
                onCancel();
            }
        }
        setIsOpen(openState);
    };


    return (
        <Sheet open={isOpen} onOpenChange={handleSheetClose}>
            <SheetContent side="bottom" className="p-6 rounded-t-lg max-h-[90vh] overflow-y-auto">
                <SheetHeader className="text-center mb-6">
                    <SheetTitle className="text-xl font-bold">Complete Your Payment</SheetTitle>
                    <SheetDescription>
                        This is a simulated payment screen. Use the buttons below to test success or failure.
                    </SheetDescription>
                </SheetHeader>

                <div className="text-center mb-8">
                     <p className="text-sm text-muted-foreground mb-1">Total Amount Due</p>
                     <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
                </div>

                {/* Placeholder for actual payment methods */}
                {/* <div className="my-6 border rounded-md p-4 bg-muted/30 text-center text-muted-foreground">
                    [Payment Gateway Integration Would Go Here]
                    <br />
                    (e.g., Razorpay, Stripe Elements)
                </div> */}

                <SheetFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                    {/* Close button uses SheetClose for accessibility */}
                    <SheetClose asChild>
                         <Button variant="outline" disabled={isProcessing}>Cancel</Button>
                    </SheetClose>
                     <Button
                         onClick={() => handlePaymentAttempt(false)} // Simulate Failure
                         variant="destructive"
                         disabled={isProcessing}
                         className="flex-1"
                     >
                         {isProcessing ? "Processing..." : "Simulate Failure"}
                     </Button>
                    <Button
                        onClick={() => handlePaymentAttempt(true)} // Simulate Success
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700" // Success button style
                    >
                        {isProcessing ? "Processing..." : "Simulate Success"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default PaymentOverlay;