// lib/api.js
// lib/api.js
import { sanityClient } from "./sanityClient";
import { calculateDistance } from "./geo";
import staticVehicleData from "./vehicle-data"; // Ensure this path is correct if used

// --- Vehicle Data & Booking Functions (Static/Mock for now) ---
export async function fetchVehicleData() {
  // console.log(
  //   "DEV MODE: Returning static vehicle data from lib/vehicle-data.js"
  // );
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
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
      // Pincode search
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
      // Text search (city/state)
      const lowerCaseQuery = cleanedQuery.toLowerCase();
      const addedCities = new Set(); // To avoid duplicate city/state entries
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
              place_type: ["place"], // Assuming city/state maps to 'place'
              context: [
                { id: `place.${p.id}`, text: p.city || "" },
                { id: `region.${p.id}`, text: p.state || "" },
              ].filter((ctx) => ctx.text),
              text: cityMatch ? p.city : p.state, // Prioritize city name if it matched
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
  const estimatedDelivery = "15 Jul, 2025"; // Example
  return { status: "success", bookingId, estimatedDelivery };
}

export async function sendOTP(phone, email, useEmail = false) {
  const destination = useEmail ? email : `+91 ${phone}`;
  console.log(
    `MOCK API: Sending OTP to ${destination} via ${useEmail ? "email" : "SMS"}`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { status: "success", message: `MOCK: OTP sent to ${destination}` };
}

export async function verifyOTP(otp, phoneOrEmail) {
  console.log(`MOCK API: Verifying OTP "${otp}" for ${phoneOrEmail}`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (otp === "123456") {
    // Mock OTP
    return { status: "success", verified: true };
  } else {
    return { status: "error", verified: false, message: "Invalid OTP code" };
  }
}

export async function processPayment(paymentDetails) {
  console.log("MOCK API: Processing payment with details:", paymentDetails);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const success = paymentDetails?.mockSuccess ?? Math.random() > 0.2; // 80% success rate
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
    console.error("MOCK API: Payment failed.");
    return {
      status: "error",
      message: "MOCK: Payment failed.",
      errorCode: "PAY-FAIL-MOCK",
    };
  }
}

// --- Sanity Fetch Functions ---
export async function fetchProductItemBySlug(slug) {
  if (!slug) {
    console.error("API Error: fetchProductItemBySlug requires a slug.");
    return null;
  }

  const query = `*[_type == "productItem" && slug.current == $slug && active == true][0]{
    _id,
    title,
    "slug": slug.current,
    seo,
    "relatedVehicleData": relatedVehicleData->{ name, "modelCode": modelCode.current },
    pageBuilder[]{ 
      _key,
      _type,

      _type == "heroSectionBlock" => {
        title, 
        subtitle,
        "image": image{ 
          alt, 
          "asset": asset->{ _id, url, "metadata": metadata{ dimensions, lqip }}
        },
        keySpecs[]{ _key, name, value, unit },
        primaryButtonLabel,
        primaryButtonLink, 
        secondaryButtonLabel,
        secondaryButtonLink, 
        optionalButtonLabel,
        optionalButtonLink,
      },

      _type == "configuratorSectionBlock" => {
        modelCode,
        "colors": colors[]{ 
          _key, name, "slug": slug.current, "colorValue": colorValue{hex, alpha}, isDefault 
        },
        sectionTitle, 
        sectionSubtitle,
        initialFrameOverride,
        "configuratorSetup": configuratorSetup{
          frameCount,
        }
      },

      _type == "featureCarouselBlock" => {
        sectionTitle,
        sectionSubtitle,
        slides[]{
          _key,
          title,
          subtitle,
          mediaType,
          "image": image{
            alt,
            "asset": asset->{ _id, url, "metadata": metadata{ dimensions, lqip }}
          },
          videoUrl,
          enablePopup,
          popupContent[]{ 
            ..., 
            _type == "image" => { 
              "asset": asset->{ _id, url, "metadata": metadata{ dimensions, lqip }},
              alt,
              caption 
            }
          } 
        }
      },

      _type == "faqBlock" => {
        titleOverride, 
        "referencedFaqs": referencedFaqs[]->{
          _id, _type, question, 
          answer // Assuming answer from FAQ item is simple text now
        },
        allowMultipleOpen,
        initialOpenIndex
      },

      _type == "textWithImageBlock" => {
        title,
        text[]{ ..., _type == "image" => { "asset": asset->{_id, url, metadata{lqip, dimensions}}, alt, caption }},
        "image": image{ alt, "asset": asset->{_id, url, metadata{lqip, dimensions}}},
        imagePosition,
        cta { buttonLabel, link } 
      },

      _type == "galleryBlock" => {
        sectionTitle,
        sectionSubtitle,
        images[]{
          _key,
          "image": image{
            alt,
            caption,
            "asset": asset->{_id, url, "metadata": metadata{dimensions, lqip}}
          },
          headline,
          subheadline
        },
        imageAspectRatio, // Keep this
        autoplay,
        autoplayDelay,
        showCarouselDots,
        showCarouselArrows
      },

      _type == "videoBlock" => {
        sectionTitle,
        sectionSubtitle,
        "videoFile": videoFile.asset->{url, mimeType}, 
        videoUrl,
        "posterImage": posterImage{
          alt, 
          "asset": asset->{_id, url, "metadata": metadata{lqip, dimensions}}
        },
        caption,
        aspectRatio,
        autoplay,
        loop,
        showControls
      },
      
      _type == "testimonialSection" => { 
        title, 
        description, 
        testimonials[]{
          _key, id, quote, authorName, 
          "authorImage": authorImage{ alt, "asset": asset->{_id, url, "metadata": metadata{lqip, dimensions}}},
          "backgroundImage": backgroundImage{ alt, "asset": asset->{_id, url, "metadata": metadata{lqip, dimensions}}}
        }
      },
      _type == "techSpecsSection" => {
        sectionTitle,
        sectionSubtitle,
        specGroups[]{
          _key, title,
          items[]{
            _key, _type, key, value, unit, name, color, altText, suffix, itemName
          }
        }
      },
      
      _type == "blockContent" => {
        ... // Fetch all fields of blockContent if used directly
      }
    }
  }`;

  try {
    const productItemData = await sanityClient.fetch(query, { slug });
    return productItemData;
  } catch (error) {
    console.error(
      `API Error: Failed to fetch productItem data for slug "${slug}":`,
      error
    );
    if (
      error.message.includes("projectId") ||
      error.message.includes("dataset")
    ) {
      throw new Error(
        `Failed to fetch productItem: Sanity client not configured correctly.`
      );
    }
    throw error; // Re-throw other errors
  }
}

export async function fetchActiveProductSlugs() {
  const query = `*[_type == "productItem" && defined(slug.current) && active == true]{ "slug": slug.current }`;
  try {
    const slugsObjects = await sanityClient.fetch(query);
    // Ensure returned objects are in the format { slug: string }
    return slugsObjects.filter(
      (item) => typeof item.slug === "string" && item.slug.length > 0
    );
  } catch (error) {
    console.error("API Error: Failed to fetch active product slugs:", error);
    return [];
  }
}

export async function fetchAllDealerData() {
  const query = `*[_type == "dealer" && active == true && defined(coordinates)] {
        "id": _id, name, dealerCode, address, coordinates, contact, hours, services, featured,
        "imageUrl": image.asset->url, "imageAlt": image.alt
    }`;
  try {
    const dealers = await sanityClient.fetch(query);
    // Filter for valid coordinates client-side after fetching
    return dealers.filter(
      (d) =>
        d.coordinates &&
        typeof d.coordinates.lat === "number" &&
        !isNaN(d.coordinates.lat) &&
        typeof d.coordinates.lng === "number" &&
        !isNaN(d.coordinates.lng)
    );
  } catch (error) {
    console.error("API Error: Failed to fetch dealers from Sanity:", error);
    throw new Error(`Failed to fetch dealers: ${error.message}`);
  }
}

export async function searchDealers({ query, coords, radiusKm = 50 }) {
  try {
    const groqParams = {};
    let baseFilter = `_type == "dealer" && active == true && defined(coordinates)`;
    let queryFilter = "";
    let fetchAllForCoordFilter = false;

    if (query) {
      const cleanedQuery = query.trim().toLowerCase();
      groqParams.queryLower = `${cleanedQuery}*`; // For partial matches on name, city, state
      groqParams.queryExact = query.trim(); // For exact matches on pincode
      queryFilter = `&& (name match $queryLower || address.city match $queryLower || address.state match $queryLower || address.pincode == $queryExact)`;
    } else if (coords?.latitude && coords?.longitude) {
      // If only coords are provided, we'll fetch all and filter by distance client-side
      fetchAllForCoordFilter = true;
    }

    const projection = `{
        "id": _id, name, dealerCode, address, coordinates, contact, hours, services, featured,
        "imageUrl": image.asset->url, "imageAlt": image.alt
    }`;
    const fullGroqQuery = `*[${baseFilter} ${queryFilter}] ${projection}`;
    const fetchedDealers = await sanityClient.fetch(fullGroqQuery, groqParams);

    let results = fetchedDealers;

    // If coordinates are provided, calculate distance and filter/sort
    if (coords?.latitude && coords?.longitude) {
      results = results.map((dealer) => {
        const distance = dealer.coordinates
          ? calculateDistance(
              coords.latitude,
              coords.longitude,
              dealer.coordinates.lat,
              dealer.coordinates.lng
            )
          : undefined;
        return {
          ...dealer,
          distance:
            distance !== undefined && isFinite(distance)
              ? Math.round(distance * 10) / 10 // Round to one decimal place
              : undefined,
        };
      });
      // Filter by radius and sort by distance only if it was a pure coordinate search
      // or if it was a text search that also needs distance filtering.
      results = results
        .filter(
          (dealer) =>
            dealer.distance !== undefined && dealer.distance <= radiusKm
        )
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (!fetchAllForCoordFilter) {
      // Only sort by name if not a coordinate search
      results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return results;
  } catch (error) {
    console.error(
      "API Search Error: Failed during dealer search or processing:",
      error
    );
    return []; // Return empty array on error
  }
}
