// hooks/useApiData.js
import { useState, useEffect, useCallback } from "react";
import { fetchVehicleData } from "@/lib/api"; // Use alias

/**
 * Custom hook to fetch and manage API data (VehicleData)
 * @param {string} [apiUrl] - Optional API URL override (currently unused)
 * @returns {object} API data state and utility functions
 */
export default function useApiData(apiUrl) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Fetch data function
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const vehicleData = await fetchVehicleData(); // Calls the function from lib/api.js
            setData(vehicleData);
            setError(null);
        } catch (err) {
            console.error("Error in useApiData hook:", err);
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred";
            setError(
                `Failed to load vehicle data. Please try again. (${errorMessage})`
            );
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [retryCount]); // Removed apiUrl dependency as it's not used in fetchVehicleData

    // Retry function
    const retry = useCallback(() => {
        console.log("Retrying data fetch...");
        setRetryCount((prev) => prev + 1);
    }, []);

    // Initial fetch and retry effect
    useEffect(() => {
        console.log(
            `Fetching data... (Retry count: ${retryCount})`
        );
        fetchData();
    }, [fetchData]); // Use fetchData directly

    // --- Utility Functions (derived from data) ---

    const getVehiclePrice = useCallback(
        (vehicleId) => {
            if (!data?.pricing) return 0;
            const vehicleIdStr = String(vehicleId);
            const pricing = data.pricing.find(
                (p) => String(p.model_id) === vehicleIdStr
            );
            return pricing?.base_price || 0;
        },
        [data]
    );

    const getVariantsForVehicle = useCallback(
        (vehicleId) => {
            if (!data?.variants) return [];
            const vehicleIdStr = String(vehicleId);
            return data.variants.filter(
                (v) => String(v.model_id) === vehicleIdStr
            );
        },
        [data]
    );

    const getColorsForVehicle = useCallback(
        (vehicleId) => {
            if (!data?.colors) return [];
            const vehicleIdStr = String(vehicleId);
            return data.colors.filter(
                (c) => String(c.model_id) === vehicleIdStr
            );
        },
        [data]
    );

    const getComponentsForVehicle = useCallback(
        (vehicleId) => {
            if (!data?.components) return [];
            const vehicleIdStr = String(vehicleId);
            return data.components.filter(
                (c) => String(c.model_id) === vehicleIdStr
            );
        },
        [data]
    );

    return {
        loading,
        error,
        data,
        retry,
        getVehiclePrice,
        getVariantsForVehicle,
        getColorsForVehicle,
        getComponentsForVehicle,
    };
}