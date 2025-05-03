// lib/constants.js

// Default map settings
export const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629 }; // Center of India
export const DEFAULT_MAP_ZOOM = 4;
export const DEALER_DETAIL_ZOOM = 14;
export const USER_LOC_ZOOM = 13;
export const MAX_MAP_ZOOM = 18;
export const MIN_MAP_ZOOM = 3;

// Search and list settings
export const DEFAULT_SEARCH_RADIUS_KM = 50;
export const RESULTS_PER_PAGE = 10; // Or adjust as needed
export const DEBOUNCE_DELAY = 400; // milliseconds

// Mapbox specific (if needed beyond token/style URL props)
export const MAPBOX_MARKER_SVG_BASE = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 2C9.92487 2 5 6.92487 5 13C5 21.5 16 30 16 30C16 30 27 21.5 27 13C27 6.92487 22.0751 2 16 2Z" fill="currentColor"/><circle cx="16" cy="13" r="4" fill="#FFFFFF"/></svg>`;

// Type definition for Dealer (can also live in types/index.d.ts)
/**
 * @typedef {object} Coordinates
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {object} Address
 * @property {string} [line1]
 * @property {string} [line2]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [pincode]
 * @property {string} [country]
 * @property {string} formatted // Should always have a formatted version
 */

/**
 * @typedef {object} Contact
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [website]
 */

/**
 * @typedef {object} Hours
 * @property {string} day
 * @property {string} open
 * @property {string} close
 */

/**
 * @typedef {object} Dealer
 * @property {string | number} id
 * @property {string} name
 * @property {Address} address
 * @property {Coordinates | null} coordinates
 * @property {Contact} [contact]
 * @property {Hours[]} [hours]
 * @property {string[]} [services]
 * @property {number} [rating]
 * @property {number} [distance] // Calculated property
 * @property {string} [imageUrl]
 * @property {boolean} [active]
 * @property {boolean} [featured]
 */
