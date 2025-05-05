// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import NavigationContainer from "@/components/features/navigation/NavigationContainer";
import { cn } from "@/lib/utils";

// Define the fonts correctly
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Kabira Mobility",
  description: "Booking Electric Vehicles and Finding Dealers",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable)}
    >
      <head></head>
      <body className={cn("antialiased flex flex-col min-h-screen font-sans")}>
        <NavigationContainer />
        <div className="flex-grow">{children}</div>
      </body>
    </html>
  );
}
