// app/dealers/page.jsx
import React from "react";
import DealerLocatorClient from "./DealerLocatorClient"; // Import the client component

// Define metadata here (Server Component)
export const metadata = {
  title: "Dealer Locator | Kabira Mobility",
  description: "Find Kabira Mobility showrooms and service centers near you.",
};

// This is the Server Component for the /dealers route
export default function DealerLocatorPage() {
  // This component can fetch server-side data if needed in the future,
  // but for now, it just renders the client component.
  return <DealerLocatorClient />;
}
