// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import NavigationContainer from "@/components/features/navigation/NavigationContainer";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Kabira Mobility",
  description: "Booking Electric Vehicles and Finding Dealers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* Material Icons link REMOVED */}</head>
      <body
        // Apply the font variables to the body tag
        className={cn(
          "antialiased flex flex-col min-h-screen",
          geistSans.variable, // Add variable class name
          geistMono.variable // Add variable class name
          // font-sans class will be applied via globals.css body rule
        )}
      >
        <NavigationContainer />
        <div className="flex-grow">{children}</div>
      </body>
    </html>
  );
}
