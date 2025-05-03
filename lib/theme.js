// lib/theme.js
// Ideally, define your theme structure here or import it

/**
 * @typedef {import('./constants').Dealer} Dealer
 */

/**
 * Determines the color for a dealer marker based on services and selection state.
 * @param {Dealer} dealer
 * @param {boolean} isSelected
 * @param {object} themeColors - Object containing theme colors (e.g., { primary, sales, service, accent, neutral: { 700: '...' } }).
 * @returns {string} Hex or CSS color string.
 */
export const getMarkerColor = (dealer, isSelected, themeColors = {}) => {
  const services = dealer?.services?.map((s) => s.toLowerCase()) || [];
  const hasStore = services.includes("sales") || services.includes("store");
  const hasService =
    services.includes("service") || services.includes("repair");
  const hasCharging = services.includes("charging");

  // Provide safe fallbacks
  const salesColor = themeColors.sales || "#0284C7"; // Example: Blue for Sales
  const serviceColor = themeColors.service || "#DC2626"; // Example: Red for Service
  const chargingColor = themeColors.accent || "#22C55E"; // Example: Green for Charging
  const defaultColor = themeColors.neutral?.[700] || "#4B5563"; // Example: Dark Gray default
  const selectedColor = themeColors.primary || "#111827"; // Example: Black for Selected

  if (isSelected) return selectedColor;
  if (hasStore) return salesColor;
  if (hasService) return serviceColor;
  if (hasCharging) return chargingColor;
  return defaultColor;
};
