// lib/formatting.js

/**
 * Format price for display
 * @param {number} price - The price to format
 * @param {boolean} [showDecimal=false] - Whether to show decimal places
 * @param {string} [prefix="₹"] - Currency prefix
 * @returns {string} Formatted price string
 */
export const formatPrice = (
    price,
    showDecimal = false,
    prefix = "₹"
) => {
    if (typeof price !== "number" || isNaN(price)) {
        return `${prefix}0`; // Return default for invalid input
    }

    try {
        if (showDecimal) {
            return `${prefix}${price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }

        return `${prefix}${price.toLocaleString("en-IN")}`;
    } catch (error) {
        console.error("Error formatting price:", error);
        return `${prefix}${price}`; // Fallback to unformatted number
    }
};

/**
 * Format phone number for display (India specific)
 * @param {string} phone - Phone number to format
 * @param {string} [countryCode="+91"] - Country code
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, countryCode = "+91") => {
    if (!phone) return "";

    // Clean the phone number to contain only digits
    const cleaned = String(phone).replace(/\D/g, "");

    if (cleaned.length === 10) {
        // Standard 10-digit number format
        return `${countryCode} ${cleaned.substring(0, 5)} ${cleaned.substring(
            5
        )}`;
    }

    // Return with country code if not 10 digits (or handle other lengths if needed)
    return `${countryCode} ${cleaned}`;
};

/**
 * Format date for display
 * @param {Date|string|number} date - Date to format
 * @param {'short' | 'medium' | 'long'} [format='medium'] - Format type
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "medium") => {
    let dateObj;
    try {
        dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new Error("Invalid date value");
        }
    } catch (error) {
        console.error("Error creating date object:", error);
        return "Invalid date";
    }

    const options = {
        short: { day: "numeric", month: "short", year: "numeric" },
        medium: { day: "numeric", month: "long", year: "numeric" }, // Default
        long: {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        },
    };

    try {
        return dateObj.toLocaleDateString(
            "en-IN",
            options[format] || options.medium
        );
    } catch (error) {
        console.error("Error formatting date:", error);
        return dateObj.toDateString(); // Fallback to basic format
    }
};

/**
 * Helper Function to Format Location String (copied from Framer hook)
 * @param {object} feature - Location feature object (Mapbox-like structure assumed)
 * @returns {string} Formatted location string
 */
export const formatLocationString = (feature) => {
     if (!feature) return "";

     let pincode = "";
     let city = "";
     let state = "";
     const country = "India";

     // Attempt to parse context if it exists
     if (feature.context && Array.isArray(feature.context)) {
         feature.context.forEach((item) => {
             if (!item || typeof item.id !== "string") return;
             const type = item.id.split(".")[0];
             switch (type) {
                 case "postcode":
                     pincode = item.text;
                     break;
                 case "locality": // Often used for neighborhoods, fallback for city
                     if (!city) city = item.text;
                     break;
                 case "place": // Often used for city
                     city = item.text;
                     break;
                 case "region": // Often used for state/province
                     state = item.text;
                     break;
                 default:
                     break;
             }
         });
     }

     // If city wasn't found in context, check the main feature's text/place_type
     if (!city && feature.place_type?.includes("place") && feature.text) {
         city = feature.text;
     }

     // Check if the main feature text itself is the pincode if not found in context
     if (!pincode && feature.text && /^\d{6}$/.test(feature.text)) {
         pincode = feature.text;
     }

     // Build the string from parts found
     const parts = [pincode, city, state].filter(Boolean); // Filter out empty strings
     let formatted = parts.join(", ");

     // Ensure pincode from main text is prioritized if context didn't provide one and parts are empty
     if (pincode && !parts.includes(pincode)) {
         // If pincode was found in feature.text but not context
         formatted = `${pincode}${parts.length > 0 ? ", " + parts.join(", ") : ""}`;
     }

     // Add country if we have some parts, otherwise use place_name or just country
     if (formatted) {
         formatted += `, ${country}`;
     } else if (feature.place_name) {
         // Fallback to place_name if formatting failed
         formatted = feature.place_name.toLowerCase().includes("india")
             ? feature.place_name
             : `${feature.place_name}, ${country}`;
     } else {
         formatted = country; // Absolute fallback
     }

     // Simple cleanup for potential formatting artifacts
     formatted = formatted
         .replace(/, ,/g, ",") // Remove double commas
         .replace(/^, |, $/g, "") // Remove leading/trailing commas and spaces
         .trim();

     return formatted;
 };