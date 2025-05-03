// lib/geo.js

/**
 * Calculates the great-circle distance between two points
 * on the Earth (specified in decimal degrees) using the Haversine formula.
 *
 * @param {number | null | undefined} lat1 Latitude of the first point
 * @param {number | null | undefined} lon1 Longitude of the first point
 * @param {number | null | undefined} lat2 Latitude of the second point
 * @param {number | null | undefined} lon2 Longitude of the second point
 * @returns {number | undefined} Distance in kilometers, or undefined if inputs are invalid.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    // Check for valid number inputs
    if (
        typeof lat1 !== 'number' || isNaN(lat1) ||
        typeof lon1 !== 'number' || isNaN(lon1) ||
        typeof lat2 !== 'number' || isNaN(lat2) ||
        typeof lon2 !== 'number' || isNaN(lon2)
    ) {
        // console.warn("Invalid coordinates provided to calculateDistance", {lat1, lon1, lat2, lon2});
        return undefined; // Return undefined for invalid inputs
    }

     // Additional check for valid ranges (optional but good practice)
     if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
         console.warn("Coordinates out of range in calculateDistance");
         return undefined;
     }


    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Check if distance calculation resulted in NaN (e.g., identical points causing issues)
    if (isNaN(distance)) {
        return 0; // Return 0 for identical points or if calculation fails
    }

    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}