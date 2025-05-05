// lib/api.js
import { sanityClient } from "./sanityClient"; // Import the configured client
import { calculateDistance } from "./geo";
import staticVehicleData from "./vehicle-data"; // Keep for static vehicle data if needed by BookingContext etc.

// --- Vehicle Data & Booking Functions (Static/Mock for now) ---

// Fetches static vehicle data (variants, colors, components, pricing)
// Used by BookingContext, potentially others. Keep unless BookingContext is refactored.
export async function fetchVehicleData() {
  console.log(
    "DEV MODE: Returning static vehicle data from lib/vehicle-data.js"
  );
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Basic validation of the static data structure
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

// Searches locations locally within the static pricing data
// Used by useLocationSearch hook for the booking form.
export function searchLocationFromPricing(query, vehicleData) {
  if (!query || !vehicleData || !vehicleData.pricing) return [];

  const cleanedQuery = query.trim();
  const results = [];

  try {
    // Check if query is a 6-digit pincode
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
              .replace(/ ,/g, ",") // Clean up potential double commas
              .trim()
              .replace(/^,|,$/g, ""), // Remove leading/trailing commas
            place_type: ["postcode"],
            context: [
              { id: `postcode.${p.id}`, text: cleanedQuery },
              { id: `place.${p.id}`, text: p.city || "" },
              { id: `region.${p.id}`, text: p.state || "" },
            ].filter((ctx) => ctx.text), // Only include context with text
            text: cleanedQuery,
          });
        }
      });
    } else if (cleanedQuery.length >= 3) {
      // Search by city or state name (case-insensitive)
      const lowerCaseQuery = cleanedQuery.toLowerCase();
      const addedCities = new Set(); // Avoid duplicate city/state entries

      vehicleData.pricing.forEach((p) => {
        const cityMatch =
          p.city && p.city.toLowerCase().includes(lowerCaseQuery);
        const stateMatch =
          p.state && p.state.toLowerCase().includes(lowerCaseQuery);

        if (cityMatch || stateMatch) {
          // Create a unique identifier for the city-state combination
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
              place_type: ["place"], // Treat as 'place' for simplicity
              context: [
                { id: `place.${p.id}`, text: p.city || "" },
                { id: `region.${p.id}`, text: p.state || "" },
              ].filter((ctx) => ctx.text),
              text: cityMatch ? p.city : p.state, // Use the matched text
            });
            addedCities.add(placeIdentifier); // Mark this combination as added
          }
        }
      });
    }
    return results;
  } catch (error) {
    console.error("Error searching location within pricing data:", error);
    return []; // Return empty array on error
  }
}

// Mock function for submitting booking data
export async function submitBooking(formData) {
  console.log("MOCK API: Submitting booking form data:", formData);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  // Simulate success response
  const bookingId = `KM-${Math.floor(Math.random() * 9000000) + 1000000}`;
  const estimatedDelivery = "15 Jul, 2025"; // Example date
  console.log("MOCK API: Booking successful", { bookingId, estimatedDelivery });
  return { status: "success", bookingId, estimatedDelivery };
  // Simulate failure response (uncomment to test)
  // console.error("MOCK API: Booking failed");
  // return { status: "error", message: "MOCK: Failed to create booking." };
}

// Mock function for sending OTP
export async function sendOTP(phone, email, useEmail = false) {
  const destination = useEmail ? email : `+91 ${phone}`;
  console.log(
    `MOCK API: Sending OTP to ${destination} via ${useEmail ? "email" : "SMS"}`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("MOCK API: OTP Sent");
  return { status: "success", message: `MOCK: OTP sent to ${destination}` };
}

// Mock function for verifying OTP
export async function verifyOTP(otp, phoneOrEmail) {
  console.log(`MOCK API: Verifying OTP "${otp}" for ${phoneOrEmail}`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (otp === "123456") {
    // Hardcoded OTP for testing
    console.log("MOCK API: OTP Verified Successfully");
    return { status: "success", verified: true };
  } else {
    console.log("MOCK API: Invalid OTP");
    return { status: "error", verified: false, message: "Invalid OTP code" };
  }
}

// Mock function for processing payment
export async function processPayment(paymentDetails) {
  console.log("MOCK API: Processing payment with details:", paymentDetails);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // Simulate success/failure (e.g., 80% success rate)
  const success = paymentDetails?.mockSuccess ?? Math.random() > 0.2;

  if (success) {
    // If payment succeeds, also simulate booking submission internally
    const bookingResult = await submitBooking(paymentDetails.customer);
    console.log("MOCK API: Payment processed successfully.");
    return {
      status: "success",
      transactionId: `TX-${Date.now()}-${Math.round(Math.random() * 1000000)}`,
      message: "MOCK: Payment processed successfully",
      bookingId: bookingResult.bookingId, // Include booking ID from simulated submission
      estimatedDelivery: bookingResult.estimatedDelivery,
    };
  } else {
    console.error("MOCK API: Payment failed.");
    return {
      status: "error",
      message: "MOCK: Payment failed.",
      errorCode: "PAY-FAIL-MOCK",
    };
  }
}

// --- Sanity Fetch Functions ---

/**
 * Fetches a single productItem document by its slug.
 * Used for the /products/[slug] page.
 * @param {string} slug - The slug of the product item.
 * @returns {Promise<object | null>} The product item data, or null if not found or not active.
 */
export async function fetchProductItemBySlug(slug) {
  if (!slug) {
    console.error("API Error: fetchProductItemBySlug requires a slug.");
    return null;
  }
  console.log(`API: Fetching active productItem data for slug: ${slug}`);

  // GROQ query to fetch the active productItem by slug
  // Project only the basic fields needed initially
  const query = `*[_type == "productItem" && slug.current == $slug && active == true][0] {
        _id,
        title,
        "slug": slug.current, // Project slug string directly
        description,
        mainImage { // Project main image URL and required alt text
            alt,
            "asset": asset->{
                url,
                metadata { dimensions, lqip } // Include metadata like dimensions and low-quality placeholder
            }
        },
        // price, // Uncomment if needed
        // active, // Already filtered by active == true
        // linkedVehicleData->{ _id, name } // Uncomment if you add the reference later
    }`;

  try {
    const productItemData = await sanityClient.fetch(query, { slug });
    if (productItemData) {
      console.log(
        `API: Found active productItem data for slug: ${slug}`,
        productItemData
      );
    } else {
      console.warn(`API: No active productItem found for slug: ${slug}`);
    }
    return productItemData; // Returns the document object or null
  } catch (error) {
    console.error(
      `API Error: Failed to fetch productItem data for slug "${slug}":`,
      error
    );
    // Check for configuration errors specifically
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to fetch productItem: Sanity client is not configured correctly. Check environment variables.`
      );
    }
    // Return null for other fetch errors to allow graceful page handling (e.g., 404)
    return null;
  }
}

/**
 * Fetch ALL *active* dealers with *valid coordinates* from Sanity.
 * Used by the Dealer Locator page.
 * @returns {Promise<Array<object>>} Array of dealer objects.
 */
export async function fetchDealerData() {
  console.log("API: Fetching active dealers from Sanity");
  // GROQ Query to fetch necessary fields for active dealers with coordinates
  const query = `*[_type == "dealer" && active == true && defined(coordinates)] {
        "id": _id, // Use Sanity's _id as the primary identifier
        name,
        dealerCode, // Include if used
        address, // Include the full address object
        coordinates, // Include the geopoint object
        contact, // Include the contact object
        hours, // Include the array of hours objects
        services, // Include the array of service strings
        featured, // Include boolean flag
        // Fetch image URL and alt text
        "imageUrl": image.asset->url,
        "imageAlt": image.alt,
        // You can add more fields here if needed by DealerCard/DealerDetailSheet
    }`;

  try {
    // Added explicit type casting for better DX if using TypeScript later
    /** @type {import('@/lib/constants').Dealer[]} */
    const dealers = await sanityClient.fetch(query);
    console.log(
      `API: Received ${dealers.length} active dealers with coordinates from Sanity.`
    );

    // Optional: Client-side validation of coordinates (sanity already checks defined())
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
        "API: Filtered out dealers with invalid coordinate values post-fetch. Check Sanity data."
      );
    }
    return validatedDealers;
  } catch (error) {
    console.error("API Error: Failed to fetch dealers from Sanity:", error);
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to fetch dealers: Sanity client is not configured correctly. Check environment variables.`
      );
    }
    throw new Error(`Failed to fetch dealers: ${error.message}`); // Rethrow other errors
  }
}

/**
 * Search dealers from Sanity based on query or coordinates.
 * Fetches data using GROQ filters where possible, applies client-side filtering/sorting for distance.
 * Used by the Dealer Locator page search functionality.
 *
 * @param {object} params
 * @param {string} [params.query] - Search query (pincode, city, state, name).
 * @param {object} [params.coords] - User's coordinates { latitude: number, longitude: number }.
 * @param {number} [params.radiusKm=50] - Search radius in KM (client-side filtering only).
 * @returns {Promise<Array<import('@/lib/constants').Dealer>>} Array of matching dealer objects with optional distance.
 */
export async function searchDealers({ query, coords, radiusKm = 50 }) {
  console.log("API Search: Searching dealers with:", {
    query,
    coords,
    radiusKm,
  });

  try {
    const groqParams = {};
    // Base filter: always active dealers with defined coordinates
    let baseFilter = `_type == "dealer" && active == true && defined(coordinates)`;
    let queryFilter = "";
    let fetchAllForCoordFilter = false; // Flag to indicate if filtering/sorting by distance is primary

    if (query) {
      // Prepare query for GROQ text search (case-insensitive prefix matching)
      const cleanedQuery = query.trim().toLowerCase();
      groqParams.queryLower = `${cleanedQuery}*`; // For `match` operator
      groqParams.queryExact = query.trim(); // For exact pincode match

      // Construct the query filter part
      const filters = [
        `name match $queryLower`,
        `address.city match $queryLower`,
        `address.state match $queryLower`,
        `address.pincode == $queryExact`,
        // `dealerCode match $queryLower` // Uncomment if searching by dealer code needed
      ];
      queryFilter = `&& (${filters.join(" || ")})`;
      console.log("API Search: Using GROQ text filter:", queryFilter);
    } else if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      // If searching by coordinates, we fetch all and filter/sort locally
      console.log(
        "API Search: Coordinate search detected - fetching all active/valid dealers for client-side processing."
      );
      fetchAllForCoordFilter = true;
      // No additional GROQ filter needed here, baseFilter is sufficient
    } else {
      // No query and no coordinates, fetch all active/valid dealers
      console.log(
        "API Search: No query/coords provided, fetching all active/valid dealers."
      );
      // No additional GROQ filter needed
    }

    // Define the fields to return (projection)
    const projection = `{
        "id": _id,
        name,
        dealerCode,
        address,
        coordinates,
        contact,
        hours,
        services,
        featured,
        "imageUrl": image.asset->url,
        "imageAlt": image.alt
    }`;

    // Combine filters and projection into the final query
    const fullGroqQuery = `*[${baseFilter} ${queryFilter}] ${projection}`;

    /** @type {import('@/lib/constants').Dealer[]} */
    const fetchedDealers = await sanityClient.fetch(fullGroqQuery, groqParams);
    console.log(
      `API Search: GROQ fetch returned ${fetchedDealers.length} dealers.`
    );

    let results = fetchedDealers;

    // --- Client-side Processing (Distance Calculation & Filtering/Sorting) ---
    if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      console.log("API Search: Calculating distances from user location...");
      results = results.map((dealer) => {
        let distance = undefined;
        if (dealer.coordinates) {
          // Calculate distance using the helper function
          distance = calculateDistance(
            coords.latitude,
            coords.longitude,
            dealer.coordinates.lat,
            dealer.coordinates.lng
          );
        }
        // Round distance to one decimal place if valid
        const roundedDistance =
          distance !== undefined && isFinite(distance)
            ? Math.round(distance * 10) / 10
            : undefined;

        return { ...dealer, distance: roundedDistance }; // Add distance property
      });

      // If the primary search was by coordinates, filter by radius and sort by distance
      if (fetchAllForCoordFilter) {
        console.log(
          `API Search: Filtering ${results.length} dealers by radius (${radiusKm}km)...`
        );
        results = results
          .filter(
            (dealer) =>
              dealer.distance !== undefined && dealer.distance <= radiusKm
          )
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)); // Sort by distance ascending
        console.log(`API Search: ${results.length} dealers within radius.`);
      }
    }

    // --- Default Sorting ---
    // If not sorted by distance, sort alphabetically by name as a fallback
    if (!fetchAllForCoordFilter || !(coords?.latitude && coords?.longitude)) {
      console.log("API Search: Sorting results alphabetically by name.");
      results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    console.log(
      `API Search: Final results count after processing: ${results.length}.`
    );
    return results;
  } catch (error) {
    console.error(
      "API Search Error: Failed during dealer search or processing:",
      error
    );
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to search dealers: Sanity client is not configured correctly. Check environment variables.`
      );
    }
    // Rethrow other errors or return empty array
    // throw new Error(`Failed to search dealers: ${error.message}`);
    return []; // Return empty array on error
  }
}
