// components/features/booking/steps/FailureState.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Error Icon (replace with lucide-react or similar)
const ErrorIcon = ({ className }) => (
     <svg
         xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="currentColor"
         className={cn("w-12 h-12 text-destructive", className)} // Destructive color for error
     >
         <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
     </svg>
);


/**
 * Failure State Component
 * Displays when a booking or payment attempt fails.
 *
 * @param {object} props - Component props.
 * @param {string} [props.errorMessage="An error occurred"] - Main error message.
 * @param {string} [props.errorCode] - Optional error code to display.
 * @param {function} [props.onTryAgain] - Handler for the try again button.
 * @param {function} [props.onContactSupport] - Handler for contact support button.
 * @param {function} [props.onStartOver] - Handler to reset the form.
 */
const FailureState = ({
    errorMessage = "Your booking could not be completed.",
    errorCode,
    onTryAgain,
    onContactSupport,
    onStartOver,
}) => {
    return (
        <div className="flex flex-col items-center text-center py-8 px-4">
            <ErrorIcon className="mb-6" />

            <h2 className="text-2xl font-bold text-destructive mb-2">Booking Failed</h2>
             <p className="text-lg text-muted-foreground mb-4 max-w-md">
                 {errorMessage}
             </p>
             {errorCode && (
                 <p className="text-sm text-muted-foreground font-mono mb-8">
                     Error Code: {errorCode}
                 </p>
             )}

            {/* Optional Troubleshooting Card */}
            {/* <Card className="w-full max-w-md text-left mb-8 shadow-sm bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="text-base">Troubleshooting Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                     <p>1. Check your payment details and try again.</p>
                     <p>2. Ensure your payment method has sufficient funds.</p>
                     <p>3. Contact support if the problem persists.</p>
                 </CardContent>
            </Card> */}


            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                 {onTryAgain && (
                     <Button className="flex-1" onClick={onTryAgain}>
                         Try Again
                     </Button>
                 )}
                 {onContactSupport && (
                     <Button variant="outline" className="flex-1" onClick={onContactSupport}>
                         Contact Support
                     </Button>
                 )}
                 {onStartOver && (
                      <Button variant="ghost" className="flex-1" onClick={onStartOver}>
                          Start Over
                      </Button>
                  )}
            </div>
        </div>
    );
};

export default FailureState;