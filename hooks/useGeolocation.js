// hooks/useGeolocation.js
import { useState, useCallback } from 'react';

/**
 * @typedef {import('../lib/constants').Coordinates} Coordinates
 */

export function useGeolocation() {
    /** @type {[Coordinates | null, React.Dispatch<React.SetStateAction<Coordinates | null>>]} */
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const getUserLocation = useCallback(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            console.warn("Geolocation not supported or not in browser environment.");
            setIsLocating(false); // Ensure loading state is reset
            return;
        }

        setIsLocating(true);
        setLocationError(null);
        console.log("Attempting to get user location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                console.log("Geolocation successful:", coords);
                setUserLocation(coords);
                setIsLocating(false);
            },
            (error) => {
                let message = "Could not retrieve location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location permission denied.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out.";
                        break;
                    default:
                         message = `Unknown error (${error.code})`;
                         break;
                }
                console.error("Geolocation error:", message, error.code);
                setLocationError(message);
                setIsLocating(false);
                setUserLocation(null); // Clear location on error
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds timeout
                maximumAge: 60000, // Allow cached position up to 1 minute old
            }
        );
    }, []);

    // Function to clear the location and error state manually
    const clearUserLocation = useCallback(() => {
        setUserLocation(null);
        setLocationError(null);
        // Do not set isLocating here, only getUserLocation should manage that
    }, []);


    return { userLocation, isLocating, locationError, getUserLocation, clearUserLocation };
}