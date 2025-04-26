// components/features/booking/steps/VehicleConfiguration.jsx
"use client";

import React, { useMemo, useCallback } from "react";
import { useBooking } from "@/context/BookingContext"; // Use alias
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatting"; // Formatting for component price

// Import Shared & Feature Components
import SectionTitle from "../SectionTitle"; // Import the separate component
import LocationSearch from "../LocationSearch"; // Using the updated version
import VehicleCard from "../VehicleCard";
import VariantCard from "../VariantCard";
import ColorSelector from "../ColorSelector";
import ComponentCard from "../ComponentCard"; // Use the dedicated component card

const VehicleConfiguration = () => {
  // Get state and setters from context
  const { formData, updateFormData, vehicleData, errors, setErrors } =
    useBooking();

  // --- Memoized Derived Data ---
  // Provides default empty arrays if vehicleData or its properties are null/undefined
  const vehicles = useMemo(
    () => vehicleData?.models || [],
    [vehicleData?.models]
  );
  const selectedVehicleId = formData?.selectedVehicle; // Safe access

  // Find the full data for the selected vehicle
  const selectedVehicleData = useMemo(() => {
    if (!Array.isArray(vehicles)) return null;
    return vehicles.find(
      (v) => v && String(v.id) === String(selectedVehicleId)
    );
  }, [vehicles, selectedVehicleId]);

  // Filter variants for the selected vehicle
  const selectedVehicleVariants = useMemo(() => {
    if (
      !vehicleData?.variants ||
      !Array.isArray(vehicleData.variants) ||
      !selectedVehicleId
    )
      return [];
    return vehicleData.variants.filter(
      (v) => v && String(v.model_id) === String(selectedVehicleId)
    );
  }, [vehicleData?.variants, selectedVehicleId]);

  // Filter colors for the selected vehicle
  const selectedVehicleColors = useMemo(() => {
    if (
      !vehicleData?.colors ||
      !Array.isArray(vehicleData.colors) ||
      !selectedVehicleId
    )
      return [];
    return vehicleData.colors.filter(
      (c) => c && String(c.model_id) === String(selectedVehicleId)
    );
  }, [vehicleData?.colors, selectedVehicleId]);

  // Filter components for the selected vehicle
  const selectedVehicleComponents = useMemo(() => {
    if (
      !vehicleData?.components ||
      !Array.isArray(vehicleData.components) ||
      !selectedVehicleId
    )
      return [];
    return vehicleData.components.filter(
      (c) => c && String(c.model_id) === String(selectedVehicleId)
    );
  }, [vehicleData?.components, selectedVehicleId]);

  // Group components by type for rendering sections
  const groupedComponents = useMemo(() => {
    if (!selectedVehicleComponents || selectedVehicleComponents.length === 0) {
      return {}; // Return empty object if no components
    }
    if (!Array.isArray(selectedVehicleComponents)) return {}; // Ensure it's an array

    return selectedVehicleComponents.reduce((acc, component) => {
      if (!component) return acc; // Skip invalid component data
      const type = component.component_type || "ACCESSORY";
      // Format type name nicely
      let typeName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      if (typeName === "Accessory") typeName = "Accessories";
      if (typeName === "Package") typeName = "Packages";
      if (typeName === "Warranty") typeName = "Warranty Options";
      if (typeName === "Service") typeName = "Service Plans";

      if (!acc[typeName]) acc[typeName] = [];
      acc[typeName].push(component);
      return acc;
    }, {});
  }, [selectedVehicleComponents]);

  // --- Handlers ---
  // Updates the formatted location string in the context
  const handleLocationChange = (value) => {
    updateFormData({ location: value });
    if (errors?.location) {
      setErrors((prev) => ({ ...prev, location: null }));
    }
    // Clear specific details if user starts typing raw input after selecting
    if (typeof value === "string" && !value.includes(",")) {
      updateFormData({ city: "", state: "", pincode: "" });
    }
  };

  // Updates the structured city/state/pincode in the context
  const handleLocationDetailsUpdate = useCallback(
    (details) => {
      console.log("Received location details in VehicleConfig:", details);
      updateFormData({
        city: details?.city || formData?.city || "", // Keep existing if detail missing
        state: details?.state || formData?.state || "",
        pincode: details?.pincode || formData?.pincode || "",
      });
      // Clear general location error when details are confirmed
      if (errors?.location) setErrors((prev) => ({ ...prev, location: null }));
    },
    [
      updateFormData,
      errors?.location,
      setErrors,
      formData?.city,
      formData?.state,
      formData?.pincode,
    ]
  ); // Safe access formData

  // Handle vehicle selection, reset dependent fields, auto-select defaults
  const handleVehicleSelect = (id) => {
    const selected = vehicles.find((v) => v && v.id === id);
    if (!selected) return;

    // Prepare updates, including resetting dependent selections & setting vehicle image
    const updates = {
      selectedVehicle: id,
      vehicleName: selected.name || "",
      vehicleCode: selected.model_code || "",
      vehicleImage: selected.image_url || "/default-vehicle.png", // Update image in context
      selectedVariant: null,
      selectedColor: null,
      optionalComponents: [], // Reset components
    };

    // Auto-select defaults for the newly selected vehicle
    const variantsForNew = (vehicleData?.variants || []).filter(
      (v) => v && String(v.model_id) === String(id)
    );
    const defaultVariant =
      variantsForNew.find((v) => v?.is_default) ||
      (variantsForNew.length > 0 ? variantsForNew[0] : null);
    if (defaultVariant) updates.selectedVariant = defaultVariant.id;

    const colorsForNew = (vehicleData?.colors || []).filter(
      (c) => c && String(c.model_id) === String(id)
    );
    const defaultColor =
      colorsForNew.find((c) => c?.is_default) ||
      (colorsForNew.length > 0 ? colorsForNew[0] : null);
    if (defaultColor) updates.selectedColor = defaultColor.id;

    const componentsForNew = (vehicleData?.components || []).filter(
      (comp) => comp && String(comp.model_id) === String(id)
    );
    const requiredComponents = componentsForNew
      .filter((comp) => comp?.is_required)
      .map((comp) => comp.id);
    updates.optionalComponents = [...requiredComponents]; // Initialize with required components

    // Apply all updates to the context
    updateFormData(updates);

    // Clear errors related to configuration steps that were reset
    const clearErrors = {};
    if (errors?.selectedVehicle) clearErrors.selectedVehicle = null;
    if (errors?.selectedVariant) clearErrors.selectedVariant = null;
    if (errors?.selectedColor) clearErrors.selectedColor = null;
    if (Object.keys(clearErrors).length > 0)
      setErrors((prev) => ({ ...prev, ...clearErrors }));
  };

  // Handle variant selection
  const handleVariantSelect = (id) => {
    updateFormData({ selectedVariant: id });
    if (errors?.selectedVariant)
      setErrors((prev) => ({ ...prev, selectedVariant: null }));
  };

  // Handle color selection
  const handleColorSelect = (id) => {
    updateFormData({ selectedColor: id });
    if (errors?.selectedColor)
      setErrors((prev) => ({ ...prev, selectedColor: null }));
  };

  // Handle component selection via clickable card
  const handleComponentCardClick = (component) => {
    if (!component || component.is_required) return; // Prevent toggling mandatory items
    const currentComponents = formData?.optionalComponents || []; // Safe access
    const isCurrentlySelected = currentComponents.includes(component.id);
    const newComponents = isCurrentlySelected
      ? currentComponents.filter((cId) => cId !== component.id)
      : [...currentComponents, component.id];
    updateFormData({ optionalComponents: newComponents });
  };

  // --- Render ---
  return (
    // Increased vertical spacing between configuration sections
    <div className="space-y-8 md:space-y-10 lg:space-y-12">
      {/* === Location Section === */}
      <div>
        <SectionTitle title="Select Delivery Location" />
        <LocationSearch
          value={formData?.location} // Safe access
          onChange={handleLocationChange}
          onLocationDetailsChange={handleLocationDetailsUpdate}
          error={errors?.location}
          required={true}
          enableLocationServices={true} // Enable the current location feature
        />
      </div>

      {/* === Vehicle Selection Section === */}
      {/* Ensure vehicles is an array and has items before rendering */}
      {Array.isArray(vehicles) && vehicles.length > 0 && (
        <div>
          <SectionTitle title="Choose your Vehicle" />
          <div className="space-y-2">
            {vehicles.map(
              (vehicle) =>
                vehicle && ( // Check if vehicle object exists
                  <VehicleCard
                    key={vehicle.id}
                    vehicleName={vehicle.name}
                    vehicleImage={vehicle.image_url}
                    vehicleCode={vehicle.model_code}
                    isSelected={formData?.selectedVehicle === vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                  />
                )
            )}
          </div>
        </div>
      )}

      {/* === Variant Selection Section (Conditional) === */}
      {selectedVehicleId &&
        Array.isArray(selectedVehicleVariants) &&
        selectedVehicleVariants.length > 0 && (
          <div>
            <SectionTitle title="Choose Variant" />
            <div className="space-y-2">
              {selectedVehicleVariants.map(
                (variant) =>
                  variant && ( // Check variant validity
                    <VariantCard
                      key={variant.id}
                      title={variant.title}
                      subtitle={variant.subtitle}
                      description={variant.description}
                      price={
                        variant.price_addition > 0
                          ? formatPrice(variant.price_addition, false, "+")
                          : ""
                      }
                      is_default={variant.is_default} // Pass the flag
                      isSelected={formData?.selectedVariant === variant.id} // Safe access
                      onClick={() => handleVariantSelect(variant.id)}
                      includedText={
                        variant.price_addition <= 0 && !variant.is_default
                          ? "Included"
                          : ""
                      }
                    />
                  )
              )}
            </div>
          </div>
        )}

      {/* === Color Selection Section (Conditional) === */}
      {selectedVehicleId &&
        Array.isArray(selectedVehicleColors) &&
        selectedVehicleColors.length > 0 && (
          <div>
            <ColorSelector
              label="Finish"
              // Filter out potentially null/invalid color objects after mapping
              colors={selectedVehicleColors
                .map((c) => {
                  if (!c) return null;
                  let colorValue = "#737373",
                    endValue;
                  try {
                    if (c.color_value) {
                      const p = JSON.parse(c.color_value);
                      colorValue = p.colorStart || colorValue;
                      endValue = p.colorEnd;
                    }
                  } catch (e) {}
                  return {
                    id: c.id,
                    name: c.name,
                    value: colorValue,
                    endValue,
                  };
                })
                .filter(Boolean)} // filter(Boolean) removes nulls
              selectedColorId={formData?.selectedColor} // Safe access
              onChange={handleColorSelect}
            />
          </div>
        )}

      {/* === Components/Accessories Section (Conditional & Grouped) === */}
      {selectedVehicleId &&
        typeof groupedComponents === "object" &&
        groupedComponents !== null &&
        Object.keys(groupedComponents).length > 0 && (
          <div className="space-y-8 md:space-y-10">
            {Object.entries(groupedComponents).map(
              ([type, components]) =>
                // Check if components is a valid array before mapping
                Array.isArray(components) &&
                components.length > 0 && (
                  <div key={type}>
                    <SectionTitle title={type} />
                    <div className="space-y-3">
                      {components.map(
                        (component) =>
                          component && ( // Check component validity
                            <ComponentCard
                              key={component.id}
                              title={component.title}
                              subtitle={component.subtitle}
                              price={component.price}
                              is_required={component.is_required}
                              isSelected={formData?.optionalComponents?.includes(
                                component.id
                              )} // Safe access
                              onClick={() =>
                                handleComponentCardClick(component)
                              }
                            />
                          )
                      )}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      {/* Optional: Message if selected vehicle has no components */}
      {selectedVehicleId &&
        (!groupedComponents || Object.keys(groupedComponents).length === 0) && (
          <div>
            <SectionTitle title="Optional Components" />
            <p className="text-sm text-muted-foreground">
              No optional components available for this model.
            </p>
          </div>
        )}
    </div>
  );
};

export default VehicleConfiguration;
