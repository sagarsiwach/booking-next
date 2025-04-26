// components/features/booking/LocationSearch.jsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
// Removed Command imports
import { Popover, PopoverContent } from "@/components/ui/popover"; // Keep Popover
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatLocationString } from "@/lib/formatting";
import { toast } from "sonner";

// --- Icons (Ensure these are correct or replace with Lucide) ---
const LocationPinIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={cn("w-5 h-5", className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.757.433.576.576 0 00.28.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
      clipRule="evenodd"
    />
  </svg>
);
const LoaderIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("w-4 h-4 animate-spin", className)}
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
// --- End Icons ---

// --- Mapbox Config ---
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1Ijoic2FnYXJzaXdhY2giLCJhIjoiY205MzY4dmxjMGdndjJrc2NrZnZpM2FkbSJ9.ZeZW7bToRYitGJQKaCvGlA";
const FORWARD_GEOCODING_ENDPOINT =
  "https://api.mapbox.com/geocoding/v5/mapbox.places/";
const REVERSE_GEOCODING_ENDPOINT =
  "https://api.mapbox.com/geocoding/v5/mapbox.places/";

/**
 * Robust Location Search with Mapbox Geocoding & Browser Geolocation.
 * Uses Popover + Custom List for results.
 */
const LocationSearch = ({
  value, // Controlled formatted value from parent
  onChange, // Updates parent's formatted value
  onLocationDetailsChange, // Updates parent's {pincode, city, state}
  enableLocationServices = true,
  label = "Location",
  placeholder = "Area / Pincode / City",
  error,
  disabled = false,
  required = false,
  className,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || ""); // Internal state for typing
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, searching, geocoding, error, success
  const [activeIndex, setActiveIndex] = useState(-1); // For keyboard nav in results list
  const inputRef = useRef(null);
  const listRef = useRef(null); // Ref for the results list UL element
  const popoverContentRef = useRef(null); // Ref for popover content itself
  const isSelectionInProgress = useRef(false); // Prevent blur closing during selection
  const searchAbortController = useRef(null);

  // --- Sync internal input when external value changes ---
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || "");
      if (!value) {
        setStatus("idle");
        setResults([]);
        setPopoverOpen(false);
      } else if (value.includes(",")) {
        setStatus("success");
      }
    }
  }, [value, inputValue]); // React only on external `value` or internal `inputValue` change (though latter is less likely needed here)

  // --- Helper: Extract Details ---
  const extractLocationDetails = useCallback((feature) => {
    let pincode = null;
    let city = null;
    let state = null;
    if (feature?.text && /^\d{6}$/.test(feature.text)) pincode = feature.text;
    feature?.context?.forEach((ctx) => {
      const type = ctx.id?.split(".")[0];
      if (type === "postcode") pincode = pincode || ctx.text;
      if (type === "place") city = city || ctx.text;
      if (type === "locality" && !city) city = ctx.text;
      if (type === "region") state = state || ctx.text;
    });
    if (!city && feature?.properties?.place) city = feature.properties.place;
    if (!state && feature?.properties?.region)
      state = feature.properties.region;
    return { pincode, city, state };
  }, []);

  // --- Mapbox Autocomplete Fetch ---
  const fetchAutocompleteResults = useCallback(async (query) => {
    if (searchAbortController.current) searchAbortController.current.abort();
    searchAbortController.current = new AbortController();
    const signal = searchAbortController.current.signal;
    setStatus("searching");
    setPopoverOpen(true); // Ensure popover is open when searching starts
    const params = new URLSearchParams({
      access_token: MAPBOX_ACCESS_TOKEN,
      country: "IN",
      autocomplete: "true",
      types: "postcode,place,locality,district,region",
      limit: 5,
    });
    const url = `${FORWARD_GEOCODING_ENDPOINT}${encodeURIComponent(
      query
    )}.json?${params.toString()}`;
    try {
      const response = await fetch(url, { signal });
      if (signal.aborted) return;
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      if (signal.aborted) return;
      const features = data.features || [];
      setResults(features);
      setStatus(features.length > 0 ? "idle" : "error");
      setPopoverOpen(true); // Explicitly keep open
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Mapbox Autocomplete failed:", err);
        setStatus("error");
        setResults([]);
        setPopoverOpen(true);
      } else {
        setStatus("idle");
      }
    }
  }, []);

  // --- Debounced Autocomplete Trigger ---
  useEffect(() => {
    if (inputValue === value && status === "success") return;
    if (isSelectionInProgress.current) return;
    if (inputValue.length < 3) {
      setResults([]);
      /* Don't close popover here */ return;
    }
    const handler = setTimeout(() => {
      fetchAutocompleteResults(inputValue);
    }, 350);
    return () => clearTimeout(handler);
  }, [inputValue, value, status, fetchAutocompleteResults]); // Re-check dependencies

  // --- Reverse Geocoding ---
  const fetchReverseGeocode = useCallback(
    async (longitude, latitude) => {
      setStatus("geocoding");
      setPopoverOpen(false);
      setResults([]);
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        types: "postcode,place,locality,region",
        limit: 1,
      });
      const url = `${REVERSE_GEOCODING_ENDPOINT}${longitude},${latitude}.json?${params.toString()}`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        if (data.features?.length > 0) {
          const bestResult = data.features[0];
          const formatted = formatLocationString(bestResult);
          const details = extractLocationDetails(bestResult);
          onChange(formatted);
          if (onLocationDetailsChange) onLocationDetailsChange(details);
          setInputValue(formatted);
          setStatus("success");
          toast.success("Location updated!");
        } else {
          throw new Error("No address details found.");
        }
      } catch (err) {
        console.error("Reverse Geocoding failed:", err);
        setStatus("error");
        toast.error("Could not determine address.");
      }
    },
    [onChange, onLocationDetailsChange, extractLocationDetails]
  );

  // --- Get Current Location Handler ---
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    if (
      disabled ||
      !enableLocationServices ||
      status === "searching" ||
      status === "geocoding"
    )
      return;
    setStatus("searching");
    toast.info("Getting current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchReverseGeocode(
          position.coords.longitude,
          position.coords.latitude
        );
      },
      (error) => {
        setStatus("error");
        let msg = "Could not get location.";
        if (error.code === 1) msg = "Permission denied.";
        else if (error.code === 2) msg = "Location unavailable.";
        else if (error.code === 3) msg = "Request timed out.";
        toast.error(msg);
      },
      { timeout: 10000 }
    );
  };

  // --- Input/Selection/Focus/Blur Handlers ---
  const handleSelect = (result) => {
    isSelectionInProgress.current = true;
    const formatted = formatLocationString(result);
    const details = extractLocationDetails(result);
    onChange(formatted);
    if (onLocationDetailsChange) onLocationDetailsChange(details);
    setInputValue(formatted);
    setStatus("success");
    setPopoverOpen(false);
    setResults([]);
    setActiveIndex(-1);
    // inputRef.current?.blur(); // Blurring might cause issues if focus needs to move elsewhere
    setTimeout(() => {
      isSelectionInProgress.current = false;
    }, 50);
  };

  const handleInputChange = (e) => {
    const currentInput = e.target.value;
    setInputValue(currentInput);
    onChange(currentInput); // Update raw value up immediately
    setStatus("idle");
    setActiveIndex(-1);
    // Open popover if typing starts and length is sufficient
    if (currentInput.length >= 1 && !popoverOpen) setPopoverOpen(true);
    // Close popover ONLY if input becomes empty (allow keeping open otherwise)
    else if (currentInput.length === 0) setPopoverOpen(false);
    // Debounce handles clearing results for short queries
  };

  const handleInputFocus = () => {
    // Always try to open on focus if there's text or results pending
    if (inputValue.length > 0 || results.length > 0) {
      setPopoverOpen(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay closing to allow clicks on the popover content
    setTimeout(() => {
      // Check if focus moved *inside* the popover content
      if (!popoverContentRef.current?.contains(document.activeElement)) {
        setPopoverOpen(false);
      }
    }, 150); // Adjust delay if needed
  };

  // Scroll active item into view effect
  useEffect(() => {
    if (popoverOpen && activeIndex >= 0 && listRef.current) {
      const activeItemElement = listRef.current.children[activeIndex];
      activeItemElement?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, popoverOpen]);

  // Keyboard Navigation Handler for Input
  const handleInputKeyDown = (e) => {
    // Only handle keyboard nav if popover is open and results exist
    if (!popoverOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        // Check if an item is highlighted before preventing default
        if (activeIndex >= 0 && activeIndex < results.length) {
          e.preventDefault();
          handleSelect(results[activeIndex]);
        }
        // If no item highlighted, allow default Enter behavior (e.g., form submit)
        break;
      case "Escape":
        e.preventDefault();
        setPopoverOpen(false);
        setActiveIndex(-1);
        setResults([]); // Optionally clear results on escape
        break;
      default:
        break;
    }
  };

  // --- Render ---
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor="location-input-field"
          className={error ? "text-destructive" : ""}
        >
          {" "}
          {label} {required && <span className="text-destructive">*</span>}{" "}
        </Label>
      )}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        {/* Use a div as the anchor for positioning */}
        <div className="relative" data-slot="popover-anchor">
          <Input
            ref={inputRef}
            id="location-input-field"
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown} // Handle keyboard nav
            disabled={
              disabled || status === "searching" || status === "geocoding"
            }
            className={cn(
              "pr-10",
              error ? "border-destructive focus-visible:ring-destructive" : ""
            )}
            role="combobox"
            aria-expanded={popoverOpen}
            aria-controls="location-results-list"
            aria-label={label || "Location Search"}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `location-result-${activeIndex}` : undefined
            }
            autoComplete="off"
          />
          {/* Icon Container */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {(status === "searching" || status === "geocoding") && (
              <LoaderIcon className="text-muted-foreground" />
            )}
            {enableLocationServices &&
              status !== "searching" &&
              status !== "geocoding" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleGetCurrentLocation}
                  disabled={disabled}
                  title="Use current location"
                  aria-label="Use current location"
                >
                  {" "}
                  <LocationPinIcon
                    className={
                      status === "success"
                        ? "text-green-600"
                        : status === "error"
                        ? "text-destructive"
                        : ""
                    }
                  />{" "}
                </Button>
              )}
            {!enableLocationServices &&
              status !== "searching" &&
              status !== "geocoding" && (
                <LocationPinIcon
                  className="text-muted-foreground opacity-50"
                  title="Location disabled"
                />
              )}
          </div>
        </div>

        <PopoverContent
          ref={popoverContentRef} // Add ref to content
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          // Prevent focus from leaving input when popover opens
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Let blur handler manage closing, don't auto-close on outside click
          onInteractOutside={(e) => {
            // If the click is back on the input, don't close
            if (inputRef.current?.contains(e.target)) {
              e.preventDefault();
            }
          }}
        >
          {/* Custom list rendering, no Command needed */}
          <div
            ref={listRef}
            role="listbox"
            id="location-results-list"
            className="max-h-[240px] overflow-y-auto p-1"
            tabIndex={-1}
          >
            {/* Loading/Empty/Error State */}
            {(status === "searching" || status === "geocoding") &&
              !results.length && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}
            {status === "error" && !results.length && (
              <div className="p-2 text-center text-sm text-destructive">
                No results found.
              </div>
            )}
            {status !== "searching" &&
              status !== "geocoding" &&
              inputValue.length < 3 &&
              !results.length && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Type 3+ characters...
                </div>
              )}

            {/* Results List */}
            {results.length > 0 &&
              results.map((result, index) => (
                <div
                  key={result.id}
                  id={`location-result-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "p-2 text-sm rounded-sm cursor-pointer select-none", // Prevent text selection
                    "hover:bg-accent hover:text-accent-foreground",
                    activeIndex === index && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(result)}
                  // Prevent blur on mouse down to allow click
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isSelectionInProgress.current = true;
                  }}
                  onMouseUp={() => {
                    setTimeout(() => {
                      isSelectionInProgress.current = false;
                    }, 50);
                  }} // Reset flag after click
                >
                  {result.place_name}
                </div>
              ))}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
};

export default LocationSearch;
