// app/book/page.jsx
import BookingContainerWrapper from "@/components/features/booking/BookingContainer"; // Use alias
import React from "react";

export const metadata = {
  title: "Book Your Vehicle | Kabira Mobility",
  description:
    "Configure and book your Kabira Mobility electric vehicle online.",
};

export default function BookingPage() {
  // You can fetch any initial necessary props here if needed (e.g., from URL params)
  // const searchParams = useSearchParams(); // If using client component
  // const initialStepParam = searchParams.get('step');

  return (
    <main>
      {/* Pass any initial props needed by BookingContainerWrapper */}
      {/* Example: setting initial step or enabling debug */}
      Hello World
    </main>
  );
}
