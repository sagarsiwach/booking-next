// components/features/booking/steps/UserInformation.jsx
"use client";

import React, { useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import useFormValidation from "@/hooks/useFormValidation";
import { validateUserInfo } from "@/lib/validation"; // Using schema (needs update if address removed)
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PhoneInput from "../PhoneInput"; // Custom component
import SectionTitle from "../SectionTitle"; // Shared component
import { cn } from "@/lib/utils"; // Import cn utility

// Adjust validation schema if address is truly removed
// const validateUserInfoMinimal = (formData) => { /* ... schema without address ... */ };
const schemaToUse = validateUserInfo; // Use appropriate schema

const UserInformation = () => {
  // Get data and updater from context
  const { formData, updateFormData } = useBooking();

  // Initialize local form state and validation using context data
  const {
    values, // Local state for editable fields
    errors, // Local validation errors for this step
    touched, // Local touched state for fields
    handleChange, // Hook's function to update local state
    handleBlur, // Hook's function to mark touched and potentially validate
    // validateForm, // Can be used by parent if needed
  } = useFormValidation({
    initialValues: {
      fullName: formData?.fullName || "", // Safe access with default
      email: formData?.email || "",
      phone: formData?.phone || "",
      // Address field removed from initial values
      city: formData?.city || "", // Read-only fields still need initial values for the hook if validated
      state: formData?.state || "",
      pincode: formData?.pincode || "",
      termsAccepted: formData?.termsAccepted || false,
    },
    validationSchema: schemaToUse,
    onSubmit: () => {
      // This function might not be directly used if parent controls submission,
      // but it ensures updateFormData is called upon successful internal validation if needed.
      console.log(
        "User Info submitting internally (usually triggered by parent)"
      );
      updateFormData(values); // Update context on successful validation
    },
  });

  // Update central context for *editable* fields whenever local 'values' change
  useEffect(() => {
    // Avoid infinite loops by checking if data actually changed if necessary,
    // but usually direct update is fine if dependencies are correct.
    updateFormData({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      termsAccepted: values.termsAccepted,
      // Do NOT update city/state/pincode here as they come from Location step's context update
    });
  }, [
    values.fullName,
    values.email,
    values.phone,
    values.termsAccepted,
    updateFormData, // Include updateFormData in dependency array
  ]);

  // --- Render ---
  return (
    <div className="space-y-8 md:space-y-10">
      {/* === Personal Information Section === */}
      <div>
        <SectionTitle title="Personal Information" />
        <div className="space-y-4">
          {/* Full Name Input */}
          <div>
            <Label
              htmlFor="fullName"
              className={
                errors.fullName && touched.fullName ? "text-destructive" : ""
              }
            >
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Enter your first and last name"
              value={values.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={handleBlur}
              className={cn(
                errors.fullName && touched.fullName ? "border-destructive" : ""
              )}
              aria-invalid={!!(errors.fullName && touched.fullName)}
              aria-describedby="fullName-error"
            />
            {errors.fullName && touched.fullName && (
              <p id="fullName-error" className="text-sm text-destructive mt-1">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <Label
              htmlFor="email"
              className={
                errors.email && touched.email ? "text-destructive" : ""
              }
            >
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={handleBlur}
              className={cn(
                errors.email && touched.email ? "border-destructive" : ""
              )}
              aria-invalid={!!(errors.email && touched.email)}
              aria-describedby="email-error"
            />
            {errors.email && touched.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <PhoneInput
            label="Mobile Number"
            id="phone"
            name="phone"
            value={values.phone} // Use local state value
            onChange={(val) => handleChange("phone", val)} // Update local state
            onBlur={handleBlur}
            error={errors.phone && touched.phone ? errors.phone : ""}
            required={true}
          />
        </div>
      </div>

      {/* === Delivery Location Details Section (Readonly) === */}
      <div>
        <SectionTitle title="Delivery Location Details" />
        <div className="space-y-4">
          {/* Pincode (Read-only from CONTEXT) */}
          <div>
            <Label htmlFor="pincode-display"> Pincode </Label>
            {/* Display value directly from formData context */}
            <Input
              id="pincode-display"
              value={formData?.pincode || "-"}
              readOnly
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            {/* Display validation error for pincode if schema requires it */}
            {errors.pincode && touched.pincode && (
              <p className="text-sm text-destructive mt-1">{errors.pincode}</p>
            )}
          </div>
          {/* City (Read-only from CONTEXT) */}
          <div>
            <Label htmlFor="city-display"> City </Label>
            <Input
              id="city-display"
              value={formData?.city || "-"}
              readOnly
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            {errors.city && touched.city && (
              <p className="text-sm text-destructive mt-1">{errors.city}</p>
            )}
          </div>
          {/* State (Read-only from CONTEXT) */}
          <div>
            <Label htmlFor="state-display"> State </Label>
            <Input
              id="state-display"
              value={formData?.state || "-"}
              readOnly
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            {errors.state && touched.state && (
              <p className="text-sm text-destructive mt-1">{errors.state}</p>
            )}
          </div>
        </div>
      </div>

      {/* === Terms and Conditions Section === */}
      <div>
        <div className="flex items-start space-x-3">
          <Checkbox
            id="termsAccepted"
            name="termsAccepted"
            checked={values.termsAccepted} // Use local state value
            onCheckedChange={(checked) =>
              handleChange("termsAccepted", checked)
            } // Update local state
            onBlur={handleBlur} // Allow validation on blur
            className={cn(
              errors.termsAccepted && touched.termsAccepted
                ? "border-destructive ring-destructive"
                : ""
            )}
            aria-invalid={!!(errors.termsAccepted && touched.termsAccepted)}
            aria-describedby="terms-error"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="termsAccepted"
              className={cn(
                "font-normal cursor-pointer",
                errors.termsAccepted && touched.termsAccepted
                  ? "text-destructive"
                  : ""
              )}
            >
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Privacy Policy
              </a>
              . <span className="text-destructive">*</span>
            </Label>
          </div>
        </div>
        {/* Error message for terms */}
        {errors.termsAccepted && touched.termsAccepted && (
          <p
            id="terms-error"
            className="text-sm text-destructive mt-1 pl-[calc(1rem+0.75rem)]"
          >
            {" "}
            {/* Indent error */}
            {errors.termsAccepted}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserInformation;
