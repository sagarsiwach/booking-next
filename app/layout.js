// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css"; // Import Mapbox CSS

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Default metadata - can be overridden by pages
export const metadata = {
  title: "Kabira Mobility",
  description: "Booking Electric Vehicles and Finding Dealers",
};

export default function RootLayout({ children }) {
  return (
    // NO WHITESPACE OR COMMENTS BETWEEN <html...> and <head>
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add Material Symbols Font */}
        {/* Using rel="stylesheet" is standard for CSS */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* NO WHITESPACE OR COMMENTS before </head> */}
      </head>
      {/* NO WHITESPACE OR COMMENTS BETWEEN </head> and <body...> */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* NO WHITESPACE OR COMMENTS before </body> */}
      </body>
      {/* NO WHITESPACE OR COMMENTS before </html> */}
    </html>
    // NO WHITESPACE OR COMMENTS after </html>
  );
}