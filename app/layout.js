// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import NavigationContainer from "@/components/features/navigation/NavigationContainer";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <NavigationContainer />
        <div className="flex-grow">{children}</div>
      </body>
    </html>
  );
}
