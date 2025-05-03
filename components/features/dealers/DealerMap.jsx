// components/features/dealers/DealerMap.jsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";
import {
  MAPBOX_MARKER_SVG_BASE,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MIN_MAP_ZOOM,
  MAX_MAP_ZOOM,
} from "@/lib/constants";
import { getMarkerColor } from "@/lib/theme"; // Assuming getMarkerColor moved to theme utils

// Load Mapbox CSS globally (e.g., in layout.js or via import)
// import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * @typedef {import('@/lib/constants').Dealer} Dealer
 * @typedef {import('@/lib/constants').Coordinates} Coordinates
 */

/**
 * Generates SVG string for a map marker.
 * @param {Dealer} dealer
 * @param {boolean} isSelected
 * @returns {string} SVG string
 */
const getMarkerSvg = (dealer, isSelected) => {
  // Simplified theme access for this example - pass theme colors as props ideally
  const markerColor = getMarkerColor(dealer, isSelected, {
    primary: "#111827",
    sales: "#0284C7",
    service: "#DC2626",
    accent: "#22C55E",
    neutral: { 700: "#4B5563" },
  });
  const scale = isSelected ? 1.25 : 1;
  const shadow = isSelected
    ? `drop-shadow(0 4px 6px rgba(0,0,0,0.25))`
    : `drop-shadow(0 1px 2px rgba(0,0,0,0.15))`;
  // Using template literal for clarity
  return `
    <div style="cursor: pointer; width: 32px; height: 32px; display: flex; justify-content: center; align-items: flex-end; transform: scale(${scale}); transform-origin: center bottom; transition: transform 0.15s ease-out, filter 0.15s ease-out; filter: ${shadow};">
      <div style="color: ${markerColor}; width: 100%; height: 100%; position: relative;">
        ${MAPBOX_MARKER_SVG_BASE}
      </div>
    </div>
  `;
};

/**
 * Renders the Mapbox map and manages markers.
 * @param {object} props
 * @param {string} props.accessToken - Mapbox Access Token.
 * @param {string} [props.mapStyle="mapbox://styles/mapbox/streets-v12"] - Map style URL.
 * @param {Coordinates} props.initialCenter - Initial map center.
 * @param {number} props.initialZoom - Initial map zoom.
 * @param {Dealer[]} props.dealers - Array of dealers to display.
 * @param {Dealer | null} props.selectedDealer - Currently selected dealer.
 * @param {Coordinates | null} props.userLocation - User's current location.
 * @param {object | null} props.flyToState - State object to trigger map movement { center, zoom, type: 'fly' | 'jump' }.
 * @param {() => void} props.onMapLoad - Callback when map finishes loading initially.
 * @param {(dealer: Dealer) => void} props.onMarkerClick - Callback when a dealer marker is clicked.
 * @param {() => void} props.onMapClick - Callback when the map background is clicked.
 * @param {string} [props.className] - Additional CSS classes.
 */
const DealerMap = ({
  accessToken,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
  dealers = [],
  selectedDealer = null,
  userLocation = null,
  flyToState = null, // { center, zoom, type }
  onMapLoad,
  onMarkerClick,
  onMapClick,
  className,
}) => {
  const mapContainerRef = useRef(null);
  /** @type {React.MutableRefObject<mapboxgl.Map | null>} */
  const mapRef = useRef(null);
  /** @type {React.MutableRefObject<Record<string, mapboxgl.Marker>>} */
  const markersRef = useRef({});
  /** @type {React.MutableRefObject<mapboxgl.Marker | null>} */
  const userMarkerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const mapLoadedCallback = useCallback(() => {
    setIsLoaded(true);
    if (onMapLoad) onMapLoad();
    console.log("Mapbox Map Loaded");
  }, [onMapLoad]);

  const handleMapInteraction = useCallback((eventType) => {
    isAnimatingRef.current = eventType === "start";
  }, []);

  const handleMapClickInternal = useCallback(
    (e) => {
      // Only trigger if the click is directly on the map canvas, not a marker
      if (e.originalEvent.target === mapRef.current?.getCanvas()) {
        console.log("Map background clicked");
        if (onMapClick) onMapClick();
      }
    },
    [onMapClick]
  );

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || !accessToken) return; // Initialize only once

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: MAX_MAP_ZOOM,
      attributionControl: false, // Optional: Hide default attribution
      logoPosition: "bottom-right", // Optional: Move logo
    });

    mapRef.current = map;

    map.on("load", mapLoadedCallback);
    map.on("movestart", () => handleMapInteraction("start"));
    map.on("moveend", () => handleMapInteraction("end"));
    map.on("zoomstart", () => handleMapInteraction("start"));
    map.on("zoomend", () => handleMapInteraction("end"));
    map.on("click", handleMapClickInternal);

    // Add zoom and rotation controls
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    return () => {
      console.log("Cleaning up Mapbox map");
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
      markersRef.current = {};
      userMarkerRef.current = null;
    };
  }, [
    accessToken,
    mapStyle,
    initialCenter,
    initialZoom,
    mapLoadedCallback,
    handleMapClickInternal,
    handleMapInteraction,
  ]); // Dependencies for init

  // Update Markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const currentMarkers = markersRef.current;
    const newMarkers = {};
    const dealerIdsOnMap = new Set();

    dealers.forEach((dealer) => {
      if (dealer && dealer.id && dealer.coordinates) {
        const dealerId = String(dealer.id);
        dealerIdsOnMap.add(dealerId);
        const isSelected = selectedDealer?.id === dealer.id;
        const lngLat = [dealer.coordinates.lng, dealer.coordinates.lat];

        if (currentMarkers[dealerId]) {
          // Update existing marker
          try {
            const marker = currentMarkers[dealerId];
            // Check if position changed significantly before setting
            const currentLngLat = marker.getLngLat();
            if (
              Math.abs(currentLngLat.lng - lngLat[0]) > 1e-6 ||
              Math.abs(currentLngLat.lat - lngLat[1]) > 1e-6
            ) {
              marker.setLngLat(lngLat);
            }
            // Update appearance (SVG content)
            const el = marker.getElement();
            el.innerHTML = getMarkerSvg(dealer, isSelected);
            el.style.zIndex = isSelected ? "10" : "5"; // Ensure selected is on top
            newMarkers[dealerId] = marker; // Keep the marker
          } catch (e) {
            console.error(`Error updating marker ${dealerId}:`, e);
            // Attempt to remove potentially broken marker
            try {
              currentMarkers[dealerId].remove();
            } catch {}
          }
        } else {
          // Create new marker
          try {
            const el = document.createElement("div");
            el.innerHTML = getMarkerSvg(dealer, isSelected);
            el.addEventListener("click", (e) => {
              e.stopPropagation(); // Prevent map click event
              if (onMarkerClick) onMarkerClick(dealer);
            });
            el.style.zIndex = isSelected ? "10" : "5";

            const marker = new mapboxgl.Marker({
              element: el,
              anchor: "bottom",
            })
              .setLngLat(lngLat)
              .addTo(map);
            newMarkers[dealerId] = marker;
          } catch (e) {
            console.error(`Error creating marker ${dealerId}:`, e);
          }
        }
      }
    });

    // Remove markers for dealers no longer in the list
    Object.keys(currentMarkers).forEach((id) => {
      if (!dealerIdsOnMap.has(id)) {
        try {
          currentMarkers[id].remove();
        } catch (e) {
          console.warn(`Failed to remove stale marker ${id}:`, e);
        }
      }
    });

    markersRef.current = newMarkers;
  }, [isLoaded, dealers, selectedDealer, onMarkerClick]); // Dependencies for marker updates

  // Update User Location Marker
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // Remove existing user marker if it exists
    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.remove();
      } catch (e) {}
      userMarkerRef.current = null;
    }

    // Add new user marker if location is valid
    if (
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number"
    ) {
      try {
        const el = document.createElement("div");
        // Simple blue dot style for user location
        el.style.cssText = `
                    width: 14px; height: 14px;
                    background-color: #3b82f6; /* blue-500 */
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
                    cursor: default;
                `;
        // Optional: Add ripple effect via CSS animation (needs keyframes defined globally)
        // el.style.animation = 'ripple 1.5s infinite ease-out';

        userMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      } catch (e) {
        console.error("Error creating user location marker:", e);
      }
    }
  }, [isLoaded, userLocation]);

  // Fly To / Jump To Effect
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !flyToState || isAnimatingRef.current)
      return;
    const map = mapRef.current;
    const { center, zoom, type } = flyToState;

    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lng === "number"
    ) {
      const flyOptions = {
        center: [center.lng, center.lat],
        zoom: zoom ?? map.getZoom(), // Use provided zoom or current zoom
        duration: type === "fly" ? 1200 : 0,
        essential: true, // Ensures animation happens even if potentially prefers-reduced-motion
      };

      console.log(`Map action: ${type}-ing to`, flyOptions);
      isAnimatingRef.current = true; // Set flag before starting animation
      if (type === "fly") {
        map.flyTo(flyOptions);
      } else {
        map.jumpTo(flyOptions);
      }
      // Note: moveend/zoomend event will reset isAnimatingRef.current
    } else {
      console.warn("Invalid center provided for flyToState:", center);
    }
  }, [isLoaded, flyToState]); // Dependency on flyToState object

  return (
    <div
      ref={mapContainerRef}
      className={cn("w-full h-full bg-muted relative", className)}
    />
    // {!isLoaded && <MapPlaceholder message="Initializing map..." />} // Optional placeholder during init
  );
};

export default React.memo(DealerMap); // Memoize to prevent unnecessary re-renders
