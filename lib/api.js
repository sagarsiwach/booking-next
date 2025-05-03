// lib/api.js
import { sanityClient } from "./sanityClient"; // Import the configured client
import { calculateDistance } from "./geo";
import staticVehicleData from "./vehicle-data"; // Keep for vehicle data

// --- Constants ---
// Removed DEALER_API_ENDPOINT and cache variables

// --- Vehicle Data & Booking Functions (Keep As Is) ---
export async function fetchVehicleData() {
  console.log(
    "DEV MODE: Returning static vehicle data from lib/vehicle-data.js"
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (staticVehicleData.status === "success" && staticVehicleData.data) {
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
    return staticVehicleData.data;
  } else {
    console.error(
      "Static vehicle data file does not have 'status: success' or is missing 'data' field."
    );
    throw new Error(
      `Static data has status '${staticVehicleData.status}' or missing data.`
    );
  }
}
export function searchLocationFromPricing(query, vehicleData) {
  if (!query || !vehicleData || !vehicleData.pricing) return [];
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
            place_name: `${cleanedQuery}, ${p.city || ""}, ${
              p.state || ""
            }, India`
              .replace(/ ,/g, ",")
              .trim()
              .replace(/^,|,$/g, ""),
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
        const cityMatch =
          p.city && p.city.toLowerCase().includes(lowerCaseQuery);
        const stateMatch =
          p.state && p.state.toLowerCase().includes(lowerCaseQuery);
        if (cityMatch || stateMatch) {
          const placeIdentifier = `${p.city || ""}-${
            p.state || ""
          }`.toLowerCase();
          if (!addedCities.has(placeIdentifier)) {
            results.push({
              id: `loc-text-${p.id}`,
              place_name: `${p.city || ""}, ${p.state || ""}, India`
                .replace(/ ,/g, ",")
                .trim()
                .replace(/^,|,$/g, ""),
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
export async function submitBooking(formData) {
  console.log("MOCK: Submitting booking form:", formData);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const bookingId = `KM-${Math.floor(Math.random() * 9000000) + 1000000}`;
  return { status: "success", bookingId, estimatedDelivery: "15 May, 2025" };
}
export async function sendOTP(phone, email, useEmail = false) {
  const destination = useEmail ? email : `+91 ${phone}`;
  console.log(
    `MOCK: Sending OTP to ${destination} via ${useEmail ? "email" : "SMS"}`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { status: "success", message: `MOCK: OTP sent to ${destination}` };
}
export async function verifyOTP(otp, phoneOrEmail) {
  console.log(`MOCK: Verifying OTP ${otp} for ${phoneOrEmail}`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (otp === "123456") return { status: "success", verified: true };
  else return { status: "error", verified: false, message: "Invalid OTP code" };
}
export async function processPayment(paymentDetails) {
  console.log("MOCK: Processing payment:", paymentDetails);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const success = paymentDetails?.mockSuccess ?? Math.random() > 0.2;
  if (success) {
    const bookingResult = await submitBooking(paymentDetails.customer);
    return {
      status: "success",
      transactionId: `TX-${Date.now()}-${Math.round(Math.random() * 1000000)}`,
      message: "MOCK: Payment processed successfully",
      bookingId: bookingResult.bookingId,
      estimatedDelivery: bookingResult.estimatedDelivery,
    };
  } else {
    return {
      status: "error",
      message: "MOCK: Payment failed.",
      errorCode: "PAY-FAIL-MOCK",
    };
  }
}
// --- End Vehicle/Booking Functions ---

// --- Dealer Data Functions (Sanity) ---

/**
 * Fetch ALL *active* dealers with *valid coordinates* from Sanity.
 * @returns {Promise<Array<object>>} Array of dealer objects matching the Dealer type.
 */
export async function fetchDealerData() {
  console.log("API: Fetching active dealers from Sanity");
  // GROQ Query to fetch necessary fields for active dealers with coordinates
  // Match this projection closely to the fields needed by your components.
  const query = `*[_type == "dealer" && active == true && defined(coordinates)] {
        "id": _id, // Use Sanity's _id
        name,
        address,
        coordinates,
        contact,
        hours,
        services,
        featured,
        imageUrl, // Assuming 'imageUrl' is type 'url' in Sanity
        // "imageUrl": image.asset->url, // Use this if 'image' is type 'image'
        dealerCode // Include if needed
    }`;

  try {
    // Added explicit type casting for better DX if using TypeScript later
    /** @type {import('@/lib/constants').Dealer[]} */
    const dealers = await sanityClient.fetch(query);
    console.log(
      `API: Received ${dealers.length} active dealers with coordinates from Sanity.`
    );
    // Double-check coordinate validity client-side
    const validatedDealers = dealers.filter(
      (d) =>
        d.coordinates &&
        typeof d.coordinates.lat === "number" &&
        !isNaN(d.coordinates.lat) &&
        typeof d.coordinates.lng === "number" &&
        !isNaN(d.coordinates.lng)
    );
    if (validatedDealers.length !== dealers.length) {
      console.warn(
        "API: Filtered out dealers with invalid coordinates post-fetch. Check Sanity data or GROQ query (`defined(coordinates)`)."
      );
    }
    return validatedDealers;
  } catch (error) {
    console.error("API Error: Failed to fetch dealers from Sanity:", error);
    // Check if the error is due to missing config
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to fetch dealers: Sanity client is not configured correctly. Check environment variables.`
      );
    }
    throw new Error(`Failed to fetch dealers: ${error.message}`);
  }
}

/**
 * Search dealers from Sanity based on query or coordinates.
 * Fetches data using GROQ filters where possible, applies client-side filtering/sorting for distance.
 *
 * @param {object} params
 * @param {string} [params.query] - Search query (pincode, city, state, name).
 * @param {object} [params.coords] - User's coordinates { latitude: number, longitude: number }.
 * @param {number} [params.radiusKm=50] - Search radius in KM (client-side only).
 * @returns {Promise<Array<import('@/lib/constants').Dealer>>} Array of matching dealer objects.
 */
export async function searchDealers({ query, coords, radiusKm = 50 }) {
  console.log("Sanity Search: Searching dealers with:", {
    query,
    coords,
    radiusKm,
  });

  try {
    const groqParams = {};
    let baseFilter = `_type == "dealer" && active == true && defined(coordinates)`;
    let queryFilter = "";
    let fetchAllForCoordFilter = false;

    if (query) {
      const cleanedQuery = query.trim().toLowerCase();
      groqParams.queryLower = `${cleanedQuery}*`;
      groqParams.queryExact = query.trim(); // Keep exact for pincode
      const filters = [
        `name match $queryLower`,
        `address.city match $queryLower`,
        `address.state match $queryLower`,
        `address.pincode == $queryExact`,
        `address.formatted match $queryLower`,
      ];
      queryFilter = `&& (${filters.join(" || ")})`;
      console.log("Sanity Search: Using GROQ text filter:", queryFilter);
    } else if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      console.log(
        "Sanity Search: Coordinate search detected, will fetch all active/valid dealers for client-side distance filtering."
      );
      fetchAllForCoordFilter = true;
    } else {
      console.log(
        "Sanity Search: No query/coords, fetching all active/valid dealers."
      );
    }

    const projection = `{ "id": _id, name, address, coordinates, contact, hours, services, featured, imageUrl, dealerCode }`;
    const fullGroqQuery = `*[${baseFilter} ${queryFilter}] ${projection}`;

    /** @type {import('@/lib/constants').Dealer[]} */
    const fetchedDealers = await sanityClient.fetch(fullGroqQuery, groqParams);
    console.log(
      `Sanity Search: GROQ fetch returned ${fetchedDealers.length} dealers.`
    );

    let results = fetchedDealers;

    // Calculate distances regardless of search type IF coords are available
    if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      console.log("Sanity Search: Calculating distances...");
      results = results.map((dealer) => {
        const distance = calculateDistance(
          coords.latitude,
          coords.longitude,
          dealer.coordinates.lat,
          dealer.coordinates.lng
        );
        const roundedDistance =
          distance !== undefined && isFinite(distance)
            ? Math.round(distance * 10) / 10
            : undefined;
        return { ...dealer, distance: roundedDistance };
      });

      // IF the *primary* search method was coordinates, filter by radius and sort
      if (fetchAllForCoordFilter) {
        console.log(
          `Sanity Search: Filtering ${results.length} dealers by radius (${radiusKm}km)...`
        );
        results = results
          .filter(
            (dealer) =>
              dealer.distance !== undefined && dealer.distance <= radiusKm
          )
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      }
    }

    // Final sort (if no distance sort applied or as fallback) - by name
    if (!fetchAllForCoordFilter || !(coords?.latitude && coords?.longitude)) {
      results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    console.log(
      `Sanity Search: Final results count after client-side processing: ${results.length}.`
    );
    return results;
  } catch (error) {
    console.error("Sanity Search/Processing Error:", error);
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to search dealers: Sanity client is not configured correctly. Check environment variables.`
      );
    }
    throw new Error(`Failed to search dealers: ${error.message}`);
  }
}
