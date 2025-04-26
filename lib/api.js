// lib/api.js
import staticVehicleData from './vehicle-data'; // Import the static data

/**
 * Base API URL - Not used when returning static data
 */
// const API_BASE_URL = "https://booking-engine.sagarsiwach.workers.dev/";

/**
 * Generic fetch function - Kept for potential future use but not called by fetchVehicleData below
 */
async function fetchApi(endpoint = "", options = {}) {
    // ... (keep the original fetchApi implementation if you might switch back)
    console.warn("fetchApi called, but using static data for fetchVehicleData in development.");
    // Simulate network error for testing other functions if needed
    // throw new Error("Simulated network error");
    return {}; // Return empty object or simulate error
}

/**
 * Fetch vehicle data - MODIFIED FOR DEVELOPMENT
 * Returns static data from vehicle-data.js after a short delay.
 * @returns {Promise<object>} Vehicle data object from the static file's 'data' field
 */
export async function fetchVehicleData() {
    console.log("DEV MODE: Returning static vehicle data from lib/vehicle-data.js");
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay

    if (staticVehicleData.status === "success" && staticVehicleData.data) {
        // Basic validation could be added here
        if (
            !staticVehicleData.data.models ||
            !staticVehicleData.data.variants ||
            !staticVehicleData.data.colors ||
            !staticVehicleData.data.components ||
            !staticVehicleData.data.pricing
        ) {
            console.error("Static vehicle data is missing required fields!");
            throw new Error("Static vehicle data structure is invalid.");
        }
        return staticVehicleData.data; // Return the nested 'data' object
    } else {
        console.error("Static vehicle data file does not have 'status: success' or is missing 'data' field.");
        throw new Error(
            `Static data has status '${staticVehicleData.status}' or missing data.`
        );
    }
}


/**
 * Search location data by query (pincode or city name) using local pricing data.
 * (Works with static or fetched data)
 * @param {string} query - Search query (pincode or text)
 * @param {object | null} vehicleData - The vehicle data object containing pricing info
 * @returns {Array<object>} An array of location results formatted like Mapbox features
 */
export function searchLocationFromPricing(query, vehicleData) {
     // This function implementation remains the same as before,
     // it filters the pricing array within the passed vehicleData object.
     if (!query || !vehicleData || !vehicleData.pricing) {
         return [];
     }

     const cleanedQuery = query.trim();
     const results = [];

     try {
         if (/^\d{6}$/.test(cleanedQuery)) {
             const pincodeNum = parseInt(cleanedQuery, 10);
             vehicleData.pricing.forEach((p) => {
                 if (
                     p.pincode_start !== undefined &&
                     p.pincode_end !== undefined &&
                     p.pincode_start <= pincodeNum &&
                     p.pincode_end >= pincodeNum
                 ) {
                     results.push({
                         id: `loc-pincode-${p.id}`,
                         place_name: `${cleanedQuery}, ${p.city || ""}, ${p.state || ""}, India`.replace(/ ,/g, ","),
                         place_type: ["postcode"],
                         context: [
                             { id: `postcode.${p.id}`, text: cleanedQuery },
                             { id: `place.${p.id}`, text: p.city || "" },
                             { id: `region.${p.id}`, text: p.state || "" },
                         ].filter((ctx) => ctx.text),
                         text: cleanedQuery,
                     });
                 }
             });
         } else if (cleanedQuery.length >= 3) {
             const lowerCaseQuery = cleanedQuery.toLowerCase();
             const addedCities = new Set();
             vehicleData.pricing.forEach((p) => {
                 const cityMatch = p.city && p.city.toLowerCase().includes(lowerCaseQuery);
                 const stateMatch = p.state && p.state.toLowerCase().includes(lowerCaseQuery);
                 if (cityMatch || stateMatch) {
                     const placeIdentifier = `${p.city || ""}-${p.state || ""}`.toLowerCase();
                     if (!addedCities.has(placeIdentifier)) {
                         results.push({
                             id: `loc-text-${p.id}`,
                             place_name: `${p.city || ""}, ${p.state || ""}, India`.replace(/ ,/g, ","),
                             place_type: ["place"],
                             context: [
                                 { id: `place.${p.id}`, text: p.city || "" },
                                 { id: `region.${p.id}`, text: p.state || "" },
                             ].filter((ctx) => ctx.text),
                             text: cityMatch ? p.city : p.state,
                         });
                         addedCities.add(placeIdentifier);
                     }
                 }
             });
         }
         return results;
     } catch (error) {
         console.error("Error searching location within pricing data:", error);
         return [];
     }
 }


// --- Mock/Simulated API Functions ---
// These remain unchanged as they were already mocks

/**
 * Submit booking form data (MOCK IMPLEMENTATION)
 * @param {object} formData - Booking form data
 * @returns {Promise<object>} Submission result
 */
export async function submitBooking(formData) {
    console.log("MOCK: Submitting booking form:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const bookingId = `KM-${Math.floor(Math.random() * 9000000) + 1000000}`;
    return {
        status: "success",
        bookingId,
        estimatedDelivery: "15 May, 2025",
    };
}

/**
 * Send OTP (MOCK IMPLEMENTATION)
 * @param {string} phone
 * @param {string} email
 * @param {boolean} [useEmail=false]
 * @returns {Promise<object>}
 */
export async function sendOTP(phone, email, useEmail = false) {
    const destination = useEmail ? email : `+91 ${phone}`;
    console.log(`MOCK: Sending OTP to ${destination} via ${useEmail ? "email" : "SMS"}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
        status: "success",
        message: `MOCK: OTP sent to ${destination}`,
    };
}

/**
 * Verify OTP code (MOCK IMPLEMENTATION)
 * @param {string} otp
 * @param {string} phoneOrEmail
 * @returns {Promise<object>}
 */
export async function verifyOTP(otp, phoneOrEmail) {
    console.log(`MOCK: Verifying OTP ${otp} for ${phoneOrEmail}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (otp === "123456") {
        return { status: "success", verified: true };
    } else {
        return { status: "error", verified: false, message: "Invalid OTP code" };
    }
}

/**
 * Process payment (MOCK IMPLEMENTATION)
 * @param {any} paymentDetails
 * @returns {Promise<object>}
 */
export async function processPayment(paymentDetails) {
    console.log("MOCK: Processing payment:", paymentDetails);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const success = paymentDetails?.mockSuccess ?? Math.random() > 0.2; // Allow forcing success/failure
    if (success) {
        return {
            status: "success",
            transactionId: `TX-${Date.now()}-${Math.round(Math.random() * 1000000)}`,
            message: "MOCK: Payment processed successfully",
        };
    } else {
        return { status: "error", message: "MOCK: Payment failed." };
    }
}