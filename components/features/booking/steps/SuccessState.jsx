// components/features/booking/steps/SuccessState.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Checkmark Icon (replace with lucide-react or similar)
const CheckCircleIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn("w-12 h-12 text-green-500", className)} // Green color for success
    >
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);


/**
 * Success State Component
 * Displays after a successful booking and payment.
 *
 * @param {object} props - Component props.
 * @param {string} props.bookingId - The confirmed booking ID.
 * @param {string} props.customerName - Customer's name.
 * @param {string} props.vehicleName - Name of the booked vehicle.
 * @param {string} props.estimatedDelivery - Estimated delivery date string.
 * @param {function} [props.onViewBookingDetails] - Handler for view details button.
 * @param {function} [props.onTrackOrder] - Handler for track order button.
 * @param {function} [props.onStartOver] - Handler to reset the form.
 */
const SuccessState = ({
    bookingId = "KM-N/A",
    customerName = "Valued Customer",
    vehicleName = "Your Vehicle",
    estimatedDelivery = "Soon",
    onViewBookingDetails,
    onTrackOrder,
    onStartOver,
}) => {
    return (
        <div className="flex flex-col items-center text-center py-8 px-4">
            <CheckCircleIcon className="mb-6" />

            <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Thank you, {customerName}, for booking your {vehicleName} with Kabira Mobility.
            </p>

            <Card className="w-full max-w-md text-left mb-8 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Booking Summary</CardTitle>
                    <CardDescription>Your booking details are below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                     <Separator />
                     <div className="flex justify-between pt-3">
                         <span className="text-muted-foreground">Booking ID</span>
                         <span className="font-medium font-mono">{bookingId}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-muted-foreground">Vehicle</span>
                         <span className="font-medium">{vehicleName}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-muted-foreground">Estimated Delivery</span>
                         <span className="font-medium">{estimatedDelivery}</span>
                     </div>
                 </CardContent>
                 {/* Optional Footer for actions related to *this* booking */}
                 {/* <CardFooter className="flex justify-end gap-2 pt-4">
                    {onViewBookingDetails && <Button variant="outline" size="sm" onClick={onViewBookingDetails}>View Details</Button>}
                    {onTrackOrder && <Button size="sm" onClick={onTrackOrder}>Track Order</Button>}
                 </CardFooter> */}
            </Card>


            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                {/* Main actions after booking */}
                 {onViewBookingDetails && (
                     <Button variant="outline" className="flex-1" onClick={onViewBookingDetails}>
                         View Booking Details
                     </Button>
                 )}
                 {onTrackOrder && (
                      <Button className="flex-1" onClick={onTrackOrder}>
                          Track Order
                      </Button>
                  )}
                 {onStartOver && (
                     <Button variant="ghost" className="flex-1" onClick={onStartOver}>
                         Book Another Vehicle
                     </Button>
                 )}
            </div>
        </div>
    );
};

export default SuccessState;