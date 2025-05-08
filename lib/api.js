// lib/api.js
import { sanityClient } from "./sanityClient"; // Import the configured client
import { calculateDistance } from "./geo";
import staticVehicleData from "./vehicle-data"; // Keep for static vehicle data if needed by BookingContext etc.

// --- Vehicle Data & Booking Functions (Static/Mock for now) ---
// ... (Your existing mock functions: fetchVehicleData, searchLocationFromPricing, submitBooking, sendOTP, verifyOTP, processPayment remain unchanged) ...
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
  console.log("MOCK API: Submitting booking form data:", formData);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const bookingId = `KM-${Math.floor(Math.random() * 9000000) + 1000000}`;
  const estimatedDelivery = "15 Jul, 2025";
  console.log("MOCK API: Booking successful", { bookingId, estimatedDelivery });
  return { status: "success", bookingId, estimatedDelivery };
}
export async function sendOTP(phone, email, useEmail = false) {
  const destination = useEmail ? email : `+91 ${phone}`;
  console.log(
    `MOCK API: Sending OTP to ${destination} via ${useEmail ? "email" : "SMS"}`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("MOCK API: OTP Sent");
  return { status: "success", message: `MOCK: OTP sent to ${destination}` };
}
export async function verifyOTP(otp, phoneOrEmail) {
  console.log(`MOCK API: Verifying OTP "${otp}" for ${phoneOrEmail}`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (otp === "123456") {
    console.log("MOCK API: OTP Verified Successfully");
    return { status: "success", verified: true };
  } else {
    console.log("MOCK API: Invalid OTP");
    return { status: "error", verified: false, message: "Invalid OTP code" };
  }
}
export async function processPayment(paymentDetails) {
  console.log("MOCK API: Processing payment with details:", paymentDetails);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const success = paymentDetails?.mockSuccess ?? Math.random() > 0.2;
  if (success) {
    const bookingResult = await submitBooking(paymentDetails.customer);
    console.log("MOCK API: Payment processed successfully.");
    return {
      status: "success",
      transactionId: `TX-${Date.now()}-${Math.round(Math.random() * 1000000)}`,
      message: "MOCK: Payment processed successfully",
      bookingId: bookingResult.bookingId,
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
 * Fetches a single productItem document by its slug, including its pageBuilder content.
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
  // This query now expands the pageBuilder and its specific block types
  const query = `*[_type == "productItem" && slug.current == $slug && active == true][0]{
    _id,
    title,
    "slug": slug.current,
    // Optional: Fetch SEO fields if needed for direct use on the page,
    // though generateMetadata is usually preferred for this.
    // seo {
    //   metaTitle,
    //   metaDescription,
    //   "ogImage": ogImage.asset->{ url, "alt": alt }
    // },
    pageBuilder[]{ // Fetch the pageBuilder array
      _key,
      _type,
      // --- Hero Section Block Specific Fields ---
      _type == "heroSectionBlock" => {
        title, // Hero title (can be an override)
        subtitle,
        "image": image{ // Expand the image field
          alt, // Alt text for the hero image
          "asset": asset->{ // Get asset details
            _id,
            url,
            "metadata": metadata{ // Include metadata for dimensions, lqip etc.
              dimensions,
              lqip
            }
          }
        },
        keySpecs[]{ // Array of key specifications
          _key,
          name,
          value,
          unit
        },
        // Fetch button data (adjust based on your 'ctaBlock' or 'link' object schema)
        // This example assumes simple string links for primaryButtonLink and secondaryButtonLink.
        // If they are complex 'link' objects, you'll need to project them accordingly.
        // e.g., "primaryButtonLink": primaryButtonLink{ linkType, externalUrl, "internalSlug": internalReference->slug.current }
        primaryButtonLabel,
        primaryButtonLink, // Assuming string for now
        secondaryButtonLabel,
        secondaryButtonLink, // Assuming string
        optionalButtonLabel,
        optionalButtonLink, // Assuming string
        // If you use the 'cta' field (of type ctaBlock) in heroSectionBlock:
        cta { // Example if cta is of type ctaBlock which itself has a link object
          _key,
          _type,
          title,
          text,
          buttonLabel,
          link { // Assuming 'link' is a reusable link object
            _type,
            linkType,
            externalUrl,
            path
            // If internalLink uses a reference:
            // "internalPage": internalPage->{_type, "slug": slug.current}
          }
        }
      },
      // --- Configurator Section Block Specific Fields ---
      _type == "configuratorSectionBlock" => {
        modelCode,
        frameCount,
        colors[]{ // Array of color objects within the configurator block
          _key,
          name,
          "slug": slug.current, // Resolve the slug string
          "colorValue": colorValue.hex, // Get the hex value of the color
          isDefault
        },
        sectionTitle, // Was sectionTitleOverride, ensure schema name matches
        sectionSubtitle // Was sectionSubtitleOverride
      },
      // --- FAQ Section Block Specific Fields ---
      _type == "faqBlock" => {
        titleOverride, // Or sectionTitle if you renamed it
        // Referenced FAQs need to be expanded
        "referencedFaqs": referencedFaqs[]->{
          _id,
          _type,
          question,
          answer // Assuming answer is simple text or pre-formatted. If blockContent, fetch that.
          // If answer is blockContent: "answer": answer[]{...}
        },
        allowMultipleOpen,
        initialOpenIndex
      }
      // --- ADD OTHER BLOCK TYPES AND THEIR FIELDS HERE ---
      // Example for textWithImageBlock:
      // _type == "textWithImageBlock" => {
      //   title,
      //   text[]{...}, // If text is blockContent
      //   "image": image{ alt, "asset": asset->{url, metadata{lqip, dimensions}}},
      //   imagePosition,
      //   cta { buttonLabel, link{...} }
      // },
      // Example for videoSection:
      // _type == "videoSection" => {
      //   title,
      //   description,
      //   "videoFile": videoFile.asset->{url, mimeType},
      //   "posterImage": posterImage{alt, "asset": asset->{url, metadata{lqip, dimensions}}},
      //   youtubeLink,
      //   aspectRatio
      // }
    }
  }`;

  try {
    const productItemData = await sanityClient.fetch(query, { slug });
    if (productItemData) {
      console.log(
        `API: Fetched productItemData with pageBuilder for slug "${slug}"`
        // Use JSON.stringify for large objects to avoid excessive console output
        // JSON.stringify(productItemData, null, 2)
      );
    } else {
      console.warn(`API: No active productItem found for slug "${slug}"`);
    }
    return productItemData;
  } catch (error) {
    console.error(
      `API Error: Failed to fetch productItem data (with pageBuilder) for slug "${slug}":`,
      error
    );
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to fetch productItem: Sanity client is not configured correctly. Check environment variables.`
      );
    }
    return null;
  }
}

/**
 * Fetches all active productItem slugs for static generation.
 * @returns {Promise<Array<{slug: string}>>}
 */
export async function fetchActiveProductSlugs() {
  const query = `*[_type == "productItem" && defined(slug.current) && active == true]{ "slug": slug.current }`;
  try {
    const slugsObjects = await sanityClient.fetch(query);
    // Ensure it returns an array of objects like [{ slug: '...' }, ...]
    const validSlugs = slugsObjects.filter(
      (item) => typeof item.slug === "string" && item.slug.length > 0
    );
    console.log(
      `API: Fetched ${validSlugs.length} active product slugs for generateStaticParams.`
    );
    return validSlugs;
  } catch (error) {
    console.error(
      "API Error: Failed to fetch active product slugs for generateStaticParams:",
      error
    );
    return []; // Return empty array on error
  }
}

// --- Dealer Data Functions --- (Your existing fetchDealerData and searchDealers)
/**
 * Fetch ALL *active* dealers with *valid coordinates* from Sanity.
 * Used by the Dealer Locator page.
 * @returns {Promise<Array<object>>} Array of dealer objects.
 */
export async function fetchAllDealerData() {
  // Renamed to avoid conflict if you have a different fetchDealerData
  console.log("API: Fetching active dealers from Sanity");
  const query = `*[_type == "dealer" && active == true && defined(coordinates)] {
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
        "imageAlt": image.alt,
    }`;

  try {
    const dealers = await sanityClient.fetch(query);
    console.log(
      `API: Received ${dealers.length} active dealers with coordinates from Sanity.`
    );
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
    throw new Error(`Failed to fetch dealers: ${error.message}`);
  }
}

export async function searchDealers({ query, coords, radiusKm = 50 }) {
  console.log("API Search: Searching dealers with:", {
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
      groqParams.queryExact = query.trim();
      const filters = [
        `name match $queryLower`,
        `address.city match $queryLower`,
        `address.state match $queryLower`,
        `address.pincode == $queryExact`,
      ];
      queryFilter = `&& (${filters.join(" || ")})`;
      console.log("API Search: Using GROQ text filter:", queryFilter);
    } else if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      console.log(
        "API Search: Coordinate search detected - fetching all active/valid dealers for client-side processing."
      );
      fetchAllForCoordFilter = true;
    } else {
      console.log(
        "API Search: No query/coords provided, fetching all active/valid dealers."
      );
    }

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
    const fullGroqQuery = `*[${baseFilter} ${queryFilter}] ${projection}`;
    const fetchedDealers = await sanityClient.fetch(fullGroqQuery, groqParams);
    console.log(
      `API Search: GROQ fetch returned ${fetchedDealers.length} dealers.`
    );
    let results = fetchedDealers;

    if (
      coords &&
      typeof coords.latitude === "number" &&
      typeof coords.longitude === "number"
    ) {
      console.log("API Search: Calculating distances from user location...");
      results = results.map((dealer) => {
        let distance = undefined;
        if (dealer.coordinates) {
          distance = calculateDistance(
            coords.latitude,
            coords.longitude,
            dealer.coordinates.lat,
            dealer.coordinates.lng
          );
        }
        const roundedDistance =
          distance !== undefined && isFinite(distance)
            ? Math.round(distance * 10) / 10
            : undefined;
        return { ...dealer, distance: roundedDistance };
      });
      if (fetchAllForCoordFilter) {
        console.log(
          `API Search: Filtering ${results.length} dealers by radius (${radiusKm}km)...`
        );
        results = results
          .filter(
            (dealer) =>
              dealer.distance !== undefined && dealer.distance <= radiusKm
          )
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        console.log(`API Search: ${results.length} dealers within radius.`);
      }
    }
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
    return [];
  }
}
