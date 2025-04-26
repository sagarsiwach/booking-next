// hooks/useStepNavigation.js
import { useState, useCallback } from "react";

/**
 * Custom hook for managing step navigation logic.
 * @param {object} options - Configuration options.
 * @param {number} [options.initialStep=1] - The starting step index.
 * @param {number} options.totalSteps - The total number of steps.
 * @param {function} [options.onStepChange] - Callback executed when the step changes.
 * @returns {object} Step navigation state and methods.
 */
export default function useStepNavigation({
    initialStep = 1,
    totalSteps,
    onStepChange,
}) {
    if (totalSteps <= 0) {
        throw new Error("useStepNavigation: totalSteps must be greater than 0");
    }
    if (initialStep < 1 || initialStep > totalSteps) {
        console.warn(
            `useStepNavigation: initialStep (${initialStep}) is outside the valid range (1-${totalSteps}). Defaulting to 1.`
        );
        initialStep = 1;
    }

    const [currentStep, setCurrentStep] = useState(initialStep);
    const [stepHistory, setStepHistory] = useState([initialStep]);

    /** Navigate to the next step if possible. */
    const nextStep = useCallback(() => {
        if (currentStep < totalSteps) {
            const nextStepValue = currentStep + 1;
            setCurrentStep(nextStepValue);
            setStepHistory((prev) => [...prev, nextStepValue]); // Add to history
            if (onStepChange) {
                onStepChange(nextStepValue);
            }
            return true;
        }
        return false;
    }, [currentStep, totalSteps, onStepChange]);

    /** Navigate to the previous step if possible using history. */
    const prevStep = useCallback(() => {
        if (stepHistory.length > 1) {
            const newHistory = stepHistory.slice(0, -1); // Remove current step
            const prevStepValue = newHistory[newHistory.length - 1]; // Get new last step
            setCurrentStep(prevStepValue);
            setStepHistory(newHistory);
            if (onStepChange) {
                onStepChange(prevStepValue);
            }
            return true;
        }
        return false;
    }, [stepHistory, onStepChange]);


    /** Navigate to a specific step if valid. Adjusts history accordingly. */
    const goToStep = useCallback(
        (step) => {
            if (step >= 1 && step <= totalSteps) {
                 // Prevent going to the same step
                 if (step === currentStep) return true;

                setCurrentStep(step);

                // If going back to a step already in history, truncate history
                const historyIndex = stepHistory.indexOf(step);
                if (historyIndex !== -1) {
                    setStepHistory(stepHistory.slice(0, historyIndex + 1));
                } else {
                    // Going to a new step not in history (forward or jump)
                    // Add it to the history
                    setStepHistory((prev) => [...prev, step]);
                }

                if (onStepChange) {
                    onStepChange(step);
                }
                return true;
            }
            return false;
        },
        [totalSteps, stepHistory, onStepChange, currentStep]
    );

    /** Reset navigation to the initial step. */
    const resetSteps = useCallback(() => {
        setCurrentStep(initialStep);
        setStepHistory([initialStep]); // Reset history
        if (onStepChange) {
            onStepChange(initialStep);
        }
    }, [initialStep, onStepChange]);

    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    // Calculate progress percentage (0% at step 1, 100% at last step)
    const progressPercentage =
        totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : (currentStep === 1 ? 100 : 0); // 100% if only 1 step

    return {
        currentStep,
        nextStep,
        prevStep,
        goToStep,
        resetSteps,
        isFirstStep,
        isLastStep,
        progressPercentage,
        stepHistory,
    };
}