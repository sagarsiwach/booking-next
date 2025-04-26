// hooks/useFormValidation.js
import { useState, useCallback } from "react";

/**
 * Custom hook for form validation and state management.
 * @param {object} options - Configuration options.
 * @param {object} options.initialValues - Initial form values.
 * @param {function} [options.validationSchema] - Function that validates the form data and returns an errors object.
 * @param {function} options.onSubmit - Callback function executed on successful form submission.
 * @returns {object} Form state and utility functions.
 */
export default function useFormValidation({
    initialValues,
    validationSchema,
    onSubmit,
}) {
    const [values, setValues] = useState(initialValues || {});
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived state: check if the form is valid based on current errors
    const isValid = Object.keys(errors).filter(key => errors[key]).length === 0;

    // --- Core Validation Logic ---

    /** Validates a single field based on the schema */
    const validateSingleField = useCallback(
        (name, currentValue) => {
            if (!validationSchema) return null;
            const fieldData = { ...values, [name]: currentValue };
            const fieldErrors = validationSchema(fieldData);
            return fieldErrors[name] || null;
        },
        [validationSchema, values]
    );

    /** Validates the entire form based on the schema */
    const validateForm = useCallback(() => {
        if (!validationSchema) {
            setErrors({});
            return true;
        }
        const formErrors = validationSchema(values);
        const currentErrors = {};
        let formIsValid = true;
        Object.keys(formErrors).forEach(key => {
            if(formErrors[key]) { // Only count actual error messages
                currentErrors[key] = formErrors[key];
                formIsValid = false;
            }
        });

        setErrors(currentErrors);


        // Mark all fields with errors as touched
        if (!formIsValid) {
            const newTouched = { ...touched };
            Object.keys(currentErrors).forEach((key) => {
                newTouched[key] = true;
            });
            setTouched(newTouched);
        }

        return formIsValid;
    }, [validationSchema, values, touched]);

    // --- Event Handlers ---

    /** General handler to set a field's value directly */
    const handleChange = useCallback((name, value) => {
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Optionally clear error on change
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: null, // Clear the specific error
            }));
        }
        // Mark field as touched on change
        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));
    }, [errors]);

    /** Handler for standard HTML input/textarea/select elements */
    const handleInputChange = useCallback(
        (event) => {
            const { name, value, type, checked } = event.target;
            const newValue = type === 'checkbox' ? checked : value;
            handleChange(name, newValue);
        },
        [handleChange]
    );

     /** Handler for input blur event - triggers validation for the field */
     const handleBlur = useCallback(
         (event) => {
             const { name } = event.target;
             // Mark field as touched
             setTouched((prev) => ({
                 ...prev,
                 [name]: true,
             }));
             // Validate the field that lost focus
             const error = validateSingleField(name, values[name]);
             setErrors((prev) => ({
                 ...prev,
                 [name]: error, // Update error state for this field
             }));
         },
         [validateSingleField, values]
     );

    /** Validates a specific field manually */
    const validateField = useCallback((name) => {
        const error = validateSingleField(name, values[name]);
        setErrors((prev) => ({ ...prev, [name]: error }));
        // Optionally mark as touched when manually validating
        setTouched((prev) => ({ ...prev, [name]: true }));
    }, [validateSingleField, values]);


    /** Handler for form submission */
    const handleSubmit = useCallback(
        async (event) => {
            if (event) {
                event.preventDefault(); // Prevent default form submission
            }

            setIsSubmitting(true);
            const isFormValid = validateForm(); // Validate all fields

            if (isFormValid) {
                try {
                    await onSubmit(values); // Call the provided onSubmit callback
                } catch (submitError) {
                    console.error("Form submission error:", submitError);
                    // Optionally set a global form error state
                    // setErrors(prev => ({ ...prev, _form: 'Submission failed' }));
                } finally {
                     // Keep submitting false until async onSubmit finishes or errors
                     // setIsSubmitting(false); // Moved below
                }
            } else {
                console.log("Form validation failed", errors);
                 // Find the first field with an error and focus it (optional UX enhancement)
                const firstErrorField = Object.keys(errors).find(key => errors[key]);
                if (firstErrorField && event?.target) {
                    const fieldElement = event.target.elements[firstErrorField];
                    fieldElement?.focus();
                }
            }
             // Always set submitting to false after attempt, regardless of success/fail/error
             setIsSubmitting(false);

        },
        [validateForm, onSubmit, values, errors]
    );

    // --- Utility Functions ---

    /** Resets the form to its initial state */
    const resetForm = useCallback(() => {
        setValues(initialValues || {});
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    /** Manually sets the value of a specific field */
    const setFieldValue = useCallback((name, value) => {
        // Use the main handleChange logic for consistency
        handleChange(name, value);
    }, [handleChange]);

     // Allow setting multiple values at once
     const setFormValues = useCallback((newValues) => {
         setValues(prev => ({ ...prev, ...newValues }));
         // Optionally mark all changed fields as touched and clear errors
         const newTouched = { ...touched };
         const newErrors = { ...errors };
         Object.keys(newValues).forEach(key => {
             newTouched[key] = true;
             if (newErrors[key]) {
                 newErrors[key] = null;
             }
         });
         setTouched(newTouched);
         setErrors(newErrors);
     }, [touched, errors]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        handleChange, // General value setter
        handleInputChange, // Specific for input events
        handleBlur,
        handleSubmit,
        resetForm,
        setFieldValue,
        setValues: setFormValues, // Expose setting multiple values
        setErrors, // Allow manually setting errors
        setTouched, // Allow manually setting touched
        validateField, // Expose single field validation
        validateForm, // Expose full form validation
    };
}