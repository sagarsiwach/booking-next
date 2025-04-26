// hooks/useLocationSearch.js
import { useState, useRef, useCallback } from "react";
import { searchLocationFromPricing } from "@/lib/api"; // Use alias
import { formatLocationString } from "@/lib/formatting"; // Use alias

/**
 * Custom hook for location search functionality using local data filtering.
 * @param {object | null} vehicleData - Vehicle data containing pricing info for local search.
 * @returns {object} Location search methods and state.
 */
export default function useLocationSearch(vehicleData) {
    const [location, setLocation] = useState("");
    const [locationStatus, setLocationStatus] = useState("idle"); // idle, searching, success, error
    const [locationResults, setLocationResults] = useState([]);
    const [showLocationResults, setShowLocationResults] = useState(false);

    const inputRef = useRef(null); // Ref for the input element

    // Search location by query using the local filtering function
    const searchLocation = useCallback(
        async (query) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery || trimmedQuery.length < 3) {
                setLocationResults([]);
                setShowLocationResults(false);
                setLocationStatus("idle");
                return [];
            }

            setLocationStatus("searching");

            try {
                // Use local search function from lib/api.js
                const results = searchLocationFromPricing(trimmedQuery, vehicleData);

                setLocationResults(results);
                setShowLocationResults(results.length > 0);
                setLocationStatus(results.length > 0 ? "idle" : "error");

                return results; // Return the results
            } catch (error) {
                console.error("Error searching location:", error);
                setLocationStatus("error");
                setLocationResults([]);
                setShowLocationResults(false);
                return [];
            }
        },
        [vehicleData] // Dependency on vehicleData
    );

    // Handle location selection from dropdown
    const handleLocationSelect = useCallback((feature) => {
        const formattedLocation = formatLocationString(feature); // Use formatter from lib/formatting.js
        setLocation(formattedLocation);
        setLocationResults([]); // Clear results
        setShowLocationResults(false); // Hide dropdown
        setLocationStatus("success");
        // Optionally focus the input after selection
        // inputRef.current?.focus();
        return formattedLocation; // Return the selected value
    }, []);

    // Handle getting current location (MOCK IMPLEMENTATION)
    const getCurrentLocation = useCallback(() => {
        setLocationStatus("searching");
        setLocationResults([]);
        setShowLocationResults(false);

        console.log("MOCK: Attempting to get current location...");
        setTimeout(() => {
            // Mock success with a predefined location
            const mockLocation = "110001, Delhi, Delhi, India";
            setLocation(mockLocation);
            setLocationStatus("success");
            console.log("MOCK: Set location to", mockLocation);
            setLocationResults([]);
            setShowLocationResults(false);
        }, 1500);
    }, []);

    return {
        location,
        setLocation,
        locationStatus,
        setLocationStatus,
        locationResults,
        setLocationResults,
        showLocationResults,
        setShowLocationResults,
        searchLocation,
        handleLocationSelect,
        getCurrentLocation,
        inputRef, // Expose the ref
    };
}