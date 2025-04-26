// context/BookingContext.jsx
"use client"; // This context needs to be client-side

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { fetchVehicleData } from "@/lib/api"; // Use alias for lib

// Create context
const BookingContext = createContext(null);

// Context provider component
export function BookingProvider({ children, debug = false }) {
    // Note: apiBaseUrl prop from Framer isn't needed as fetchVehicleData uses internal base URL
    const enableLogging = debug || false;

    const debugLog = useCallback(
        (...args) => {
            if (enableLogging) {
                console.log("BookingContext:", ...args);
            }
        },
        [enableLogging]
    );

    // --- State Definitions ---
    const [formData, setFormData] = useState({
        // Vehicle Configuration
        location: "",
        selectedVehicle: null, // Store ID
        selectedVariant: null, // Store ID
        selectedColor: null, // Store ID
        optionalComponents: [], // Store array of IDs

        // User information
        fullName: "",
        email: "",
        phone: "", // Store only digits
        address: "",
        city: "",
        state: "",
        pincode: "",
        termsAccepted: false,

        // Vehicle summary data (derived or set during selection)
        totalPrice: 0,
        vehicleName: "",
        vehicleCode: "",
    });

    const [errors, setErrors] = useState({}); // Form validation errors
    const [vehicleData, setVehicleData] = useState(null); // API data
    const [loading, setLoading] = useState(true); // API loading state
    const [apiError, setApiError] = useState(null); // API fetch error

    // --- Data Fetching ---
    useEffect(() => {
        debugLog("Context mounted, fetching vehicle data...");
        let isMounted = true;

        const loadVehicleData = async () => {
            setLoading(true);
            setApiError(null);

            try {
                const result = await fetchVehicleData();
                debugLog("API response received in context:", result);

                if (isMounted) {
                    if (result && typeof result === 'object') {
                        setVehicleData(result);
                        debugLog("Vehicle data state updated.");

                        // Initialize default selections *after* data is set
                        if (result.models && result.models.length > 0) {
                            const firstVehicle = result.models[0];
                            debugLog("Attempting to initialize with first vehicle:", firstVehicle);

                            const initialUpdates = {
                                selectedVehicle: firstVehicle.id,
                                vehicleName: firstVehicle.name || "",
                                vehicleCode: firstVehicle.model_code || "",
                            };

                            // Auto-select default variant if available
                            const variantsForFirst = result.variants?.filter(v => String(v.model_id) === String(firstVehicle.id)) || [];
                            const defaultVariant = variantsForFirst.find(v => v.is_default) || (variantsForFirst.length > 0 ? variantsForFirst[0] : null);
                            if (defaultVariant) {
                                initialUpdates.selectedVariant = defaultVariant.id;
                                debugLog("Auto-selected default/first variant:", defaultVariant.id);
                            }

                            // Auto-select default color if available
                            const colorsForFirst = result.colors?.filter(c => String(c.model_id) === String(firstVehicle.id)) || [];
                            const defaultColor = colorsForFirst.find(c => c.is_default) || (colorsForFirst.length > 0 ? colorsForFirst[0] : null);
                            if (defaultColor) {
                                initialUpdates.selectedColor = defaultColor.id;
                                debugLog("Auto-selected default/first color:", defaultColor.id);
                            }

                            // Auto-select required components
                            const componentsForFirst = result.components?.filter(comp => String(comp.model_id) === String(firstVehicle.id)) || [];
                            const requiredComponents = componentsForFirst
                                .filter(comp => comp.is_required)
                                .map(comp => comp.id);
                            if (requiredComponents.length > 0) {
                                initialUpdates.optionalComponents = [...requiredComponents];
                                debugLog("Auto-selected required components:", requiredComponents);
                            }


                            // Use updateFormData to merge initial selections
                            // Need to calculate initial price based on these defaults
                            let initialPrice = 0;
                            const vehiclePricing = result.pricing?.find(p => String(p.model_id) === String(firstVehicle.id));
                            if(vehiclePricing) initialPrice += vehiclePricing.base_price || 0;
                            if(defaultVariant) initialPrice += defaultVariant.price_addition || 0;
                            requiredComponents.forEach(compId => {
                                const comp = componentsForFirst.find(c => c.id === compId);
                                if (comp) initialPrice += comp.price || 0;
                            });
                            initialUpdates.totalPrice = initialPrice; // Set initial price

                            setFormData(prevData => ({ ...prevData, ...initialUpdates }));
                            debugLog("Initial formData set with defaults:", initialUpdates);

                        } else {
                            debugLog("No models found in API data to initialize.");
                        }
                        setApiError(null); // Clear error on success
                    } else {
                         throw new Error("Invalid data format received from API.");
                    }
                }
            } catch (err) {
                debugLog("Error during data fetch or initialization:", err);
                if (isMounted) {
                    setApiError(`Failed to load vehicle data: ${err.message || String(err)}`);
                    setVehicleData(null); // Clear potentially partial data on error
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    debugLog("loadVehicleData finished.");
                }
            }
        };

        loadVehicleData();

        return () => {
            isMounted = false; // Cleanup function to prevent state updates
            debugLog("Context unmounted or dependency changed.");
        };
    }, [debugLog]); // Run only on mount

    // --- Update Form Data ---
    const updateFormData = useCallback(
        (data) => {
            debugLog("updateFormData called with:", data);

            setFormData((prevData) => {
                const newState = { ...prevData, ...data };
                 // --- Recalculate Price whenever relevant data changes ---
                 if (vehicleData) {
                     let total = 0;
                     const vehiclePricing = vehicleData.pricing?.find(p => String(p.model_id) === String(newState.selectedVehicle));
                     if(vehiclePricing) total += vehiclePricing.base_price || 0;

                     const selectedVariantData = vehicleData.variants?.find(v => v.id === newState.selectedVariant);
                     if (selectedVariantData) total += selectedVariantData.price_addition || 0;

                     newState.optionalComponents.forEach(compId => {
                         const component = vehicleData.components?.find(c => c.id === compId);
                         if (component) total += component.price || 0;
                     });
                     newState.totalPrice = total;
                     debugLog("Recalculated total price:", total);
                 } else {
                     debugLog("Cannot calculate price, vehicleData not loaded.");
                 }
                 // --- End Price Calculation ---

                debugLog("Updated formData state:", newState);
                return newState;
            });

            // Clear related errors when data changes
            const fieldsToClearErrors = Object.keys(data);
            if (fieldsToClearErrors.length > 0) {
                setErrors((prevErrors) => {
                    const clearedErrors = { ...prevErrors };
                    let errorsWereCleared = false;
                    fieldsToClearErrors.forEach((key) => {
                        if (clearedErrors[key]) {
                            delete clearedErrors[key];
                            errorsWereCleared = true;
                        }
                    });
                    if (errorsWereCleared) {
                         debugLog("Errors cleared for fields:", fieldsToClearErrors);
                         return clearedErrors;
                    }
                    return prevErrors;
                });
            }
        },
        [debugLog, vehicleData] // Depend on vehicleData for price calculation
    );


    // --- Context Value ---
    // Use useMemo to prevent unnecessary re-renders of consumers
    const contextValue = useMemo(
        () => ({
            formData,
            updateFormData,
            errors,
            setErrors, // Expose setErrors for validation hooks/components
            vehicleData,
            loading,
            apiError,
            debug: enableLogging,
            // No need for calculateTotalPrice here, it's done internally in updateFormData
        }),
        [
            formData,
            updateFormData,
            errors,
            setErrors,
            vehicleData,
            loading,
            apiError,
            enableLogging,
        ]
    );

    debugLog("Providing context value:", contextValue);

    return (
        <BookingContext.Provider value={contextValue}>
            {children}
        </BookingContext.Provider>
    );
}

// Custom hook to use the booking context
export function useBooking() {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error("useBooking must be used within a BookingProvider");
    }
    return context;
}