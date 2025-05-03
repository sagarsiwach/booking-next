// lib/formatting.js

/**
 * Format price for display
 */
export const formatPrice = (price, showDecimal = false, prefix = "₹") => {
  if (typeof price !== "number" || isNaN(price)) return `${prefix}0`;
  try {
    return `${prefix}${price.toLocaleString("en-IN", {
      minimumFractionDigits: showDecimal ? 2 : 0,
      maximumFractionDigits: showDecimal ? 2 : 0,
    })}`;
  } catch (error) {
    console.error("Error formatting price:", error);
    return `${prefix}${price}`;
  }
};

/**
 * Format phone number (India specific)
 */
export const formatPhoneNumber = (phone, countryCode = "+91") => {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10)
    return `${countryCode} ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  return `${countryCode} ${cleaned}`;
};

/**
 * Format date
 */
export const formatDate = (date, format = "medium") => {
  let dateObj;
  try {
    dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error("Invalid date value");
  } catch (error) {
    console.error("Error creating date object:", error);
    return "Invalid date";
  }
  const options = {
    short: { day: "numeric", month: "short", year: "numeric" },
    medium: { day: "numeric", month: "long", year: "numeric" },
    long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  };
  try {
    return dateObj.toLocaleDateString(
      "en-IN",
      options[format] || options.medium
    );
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateObj.toDateString();
  }
};

/**
 * Format dealer address
 */
export const formatAddress = (address) => {
  if (!address) return "Address not available";
  if (typeof address === "string") return address; // Handle pre-formatted
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ];
  // Clean up extra commas and whitespace more robustly
  return (
    parts
      .filter(Boolean)
      .join(", ")
      .replace(/ , | ,|, /g, ", ")
      .trim()
      .replace(/^,|,$/g, "") || "Address not available"
  );
};

/**
 * Format phone number for tel: links (digits only)
 */
export const formatPhone = (phone) => {
  return phone?.replace(/\D/g, "") || "";
};

/**
 * Ensure URL starts with https://
 */
export const formatUrl = (url) => {
  if (!url) return "";
  if (!url.match(/^https?:\/\//i)) return `https://${url}`;
  return url;
};

/**
 * Get Google Maps directions URL
 */
export const getDirectionsUrl = (destination) => {
  const baseUrl = "https://www.google.com/maps/dir/?api=1&destination=";
  if (!destination) return "#";
  let destinationParam = "";
  const getCoordsString = (dest) => {
    let coordsToCheck = null;
    if (dest && typeof dest === "object") {
      if ("coordinates" in dest && dest.coordinates)
        coordsToCheck = dest.coordinates;
      else if ("lat" in dest && "lng" in dest) coordsToCheck = dest;
    }
    if (
      coordsToCheck &&
      typeof coordsToCheck.lat === "number" &&
      typeof coordsToCheck.lng === "number"
    ) {
      return `${coordsToCheck.lat},${coordsToCheck.lng}`;
    }
    return null;
  };
  if (typeof destination === "string")
    destinationParam = encodeURIComponent(destination);
  else if (typeof destination === "object" && destination !== null) {
    const coords = getCoordsString(destination);
    if (coords) destinationParam = coords;
    else if ("address" in destination && destination.address)
      destinationParam = encodeURIComponent(formatAddress(destination.address));
    else if ("name" in destination)
      destinationParam = encodeURIComponent(destination.name);
    else return "#";
  } else return "#";
  return `${baseUrl}${destinationParam}`;
};

/**
 * Decode HTML entities
 */
export const decodeHtmlEntities = (text) => {
  if (!text || typeof window === "undefined") return text || "";
  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  } catch (e) {
    console.error("Failed to decode HTML entities:", e);
    return text;
  }
};

/**
 * Format Mapbox geocoding result
 */
export const formatLocationString = (feature) => {
  if (!feature) return "";
  let pincode = "";
  let city = "";
  let state = "";
  const country = "India";
  if (feature.context && Array.isArray(feature.context)) {
    feature.context.forEach((item) => {
      if (!item || typeof item.id !== "string") return;
      const type = item.id.split(".")[0];
      switch (type) {
        case "postcode":
          pincode = item.text;
          break;
        case "locality":
          if (!city) city = item.text;
          break;
        case "place":
          city = item.text;
          break;
        case "region":
          state = item.text;
          break;
      }
    });
  }
  if (!city && feature.place_type?.includes("place") && feature.text)
    city = feature.text;
  if (!pincode && feature.text && /^\d{6}$/.test(feature.text))
    pincode = feature.text;
  const parts = [pincode, city, state].filter(Boolean);
  let formatted = parts.join(", ");
  if (pincode && !parts.includes(pincode))
    formatted = `${pincode}${parts.length > 0 ? ", " + parts.join(", ") : ""}`;
  if (formatted) formatted += `, ${country}`;
  else if (feature.place_name)
    formatted = feature.place_name.toLowerCase().includes("india")
      ? feature.place_name
      : `${feature.place_name}, ${country}`;
  else formatted = country;
  return formatted
    .replace(/, ,/g, ",")
    .replace(/^, |, $/g, "")
    .trim();
};
