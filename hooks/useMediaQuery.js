// hooks/useMediaQuery.js
import { useState, useEffect } from "react";

/**
 * Custom hook to track media query matches.
 * @param {string} query - The media query string (e.g., '(max-width: 768px)').
 * @returns {boolean} Whether the media query currently matches.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (for SSR/build)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    const listener = (event) => {
      setMatches(event.matches);
    };

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Add listener
    try {
      mediaQueryList.addEventListener("change", listener);
    } catch (e) {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }

    // Cleanup listener on unmount
    return () => {
      try {
        mediaQueryList.removeEventListener("change", listener);
      } catch (e) {
        // Fallback for older browsers
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]); // Re-run effect if query changes

  return matches;
}
