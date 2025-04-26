// app/book/page.jsx
import BookingContainerWrapper from '@/components/features/booking/BookingContainer'; // Use alias
import React from 'react';

export const metadata = {
  title: 'Book Your Vehicle | Kabira Mobility',
  description: 'Configure and book your Kabira Mobility electric vehicle online.',
};

export default function BookingPage() {
  // You can fetch any initial necessary props here if needed (e.g., from URL params)
  // const searchParams = useSearchParams(); // If using client component
  // const initialStepParam = searchParams.get('step');

  return (
    <main>
        {/* Pass any initial props needed by BookingContainerWrapper */}
        {/* Example: setting initial step or enabling debug */}
        <BookingContainerWrapper
            initialStep={1}
            enableDebug={process.env.NODE_ENV === 'development'} // Enable debug only in dev
            // Add other props like productImage, headingText if they need customization per page
            productImage="https://res.cloudinary.com/kabira-mobility/image/upload/v1744812227/Booking%20Engine/KM4000_fk2pkn.png"
            headingText="Reserve Your Kabira EV"
        />
    </main>
  );
}