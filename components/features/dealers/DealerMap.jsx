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
import { getMarkerColor } from "@/lib/theme";

// --- Marker SVG Generation (Keep as before) ---
const getMarkerSvg = (dealer, isSelected) => {
  const markerColor = getMarkerColor(dealer, isSelected, {
    /* theme colors */
  });
  const scale = isSelected ? 1.25 : 1;
  const shadow = isSelected
    ? `drop-shadow(0 4px 6px rgba(0,0,0,0.25))`
    : `drop-shadow(0 1px 2px rgba(0,0,0,0.15))`;
  return `<div style="cursor: pointer; width: 32px; height: 32px; display: flex; justify-content: center; align-items: flex-end; transform: scale(${scale}); transform-origin: center bottom; transition: transform 0.15s ease-out, filter 0.15s ease-out; filter: ${shadow};"><div style="color: ${markerColor}; width: 100%; height: 100%; position: relative;">${MAPBOX_MARKER_SVG_BASE}</div></div>`;
};

// --- Component ---
const DealerMap = ({
  accessToken,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
  dealers = [],
  selectedDealer = null,
  userLocation = null,
  flyToState = null,
  onMapLoad,
  onMarkerClick,
  onMapClick,
  className,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const mapLoadedCallback = useCallback(() => {
    setIsLoaded(true);
    if (onMapLoad) onMapLoad();
    console.log("Mapbox Map Loaded");
    // --- FIX: Trigger resize shortly after load ---
    // Use setTimeout to allow the browser layout to settle
    setTimeout(() => {
      if (mapRef.current) {
        console.log("Mapbox: Resizing map shortly after load...");
        mapRef.current.resize();
      }
    }, 100); // Adjust delay if needed (e.g., 50-200ms)
    // --- END FIX ---
  }, [onMapLoad]);

  const handleMapInteraction = useCallback((eventType) => {
    isAnimatingRef.current = eventType === "start";
  }, []);
  const handleMapClickInternal = useCallback(
    (e) => {
      if (e.originalEvent.target === mapRef.current?.getCanvas()) {
        if (onMapClick) onMapClick();
      }
    },
    [onMapClick]
  );

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || !accessToken) return;
    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      /* ... map config ... */ container: mapContainerRef.current,
      style: mapStyle,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: MAX_MAP_ZOOM,
      attributionControl: false,
      logoPosition: "bottom-right",
    });
    mapRef.current = map;
    map.on("load", mapLoadedCallback);
    map.on("movestart", () => handleMapInteraction("start"));
    map.on("moveend", () => handleMapInteraction("end"));
    map.on("zoomstart", () => handleMapInteraction("start"));
    map.on("zoomend", () => handleMapInteraction("end"));
    map.on("click", handleMapClickInternal);
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    // --- FIX: Add Resize Observer ---
    let resizeObserver;
    const containerElement = mapContainerRef.current; // Capture ref value

    if (containerElement && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current && !isAnimatingRef.current) {
          console.log("Mapbox: Resizing map due to container observer...");
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(containerElement);
      console.log("Mapbox: ResizeObserver attached.");
    } else {
      console.warn(
        "Mapbox: ResizeObserver not available or container not ready."
      );
      // Fallback or alternative resize logic could go here if needed
    }
    // --- END FIX ---

    return () => {
      console.log("Cleaning up Mapbox map");
      // --- FIX: Disconnect Resize Observer ---
      if (resizeObserver && containerElement) {
        resizeObserver.unobserve(containerElement);
        console.log("Mapbox: ResizeObserver disconnected.");
      }
      // --- END FIX ---
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
  ]);

  // Update Markers Effect (Keep as before)
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
          try {
            const marker = currentMarkers[dealerId];
            const currentLngLat = marker.getLngLat();
            if (
              Math.abs(currentLngLat.lng - lngLat[0]) > 1e-6 ||
              Math.abs(currentLngLat.lat - lngLat[1]) > 1e-6
            )
              marker.setLngLat(lngLat);
            const el = marker.getElement();
            el.innerHTML = getMarkerSvg(dealer, isSelected);
            el.style.zIndex = isSelected ? "10" : "5";
            newMarkers[dealerId] = marker;
          } catch (e) {
            console.error(`Error updating marker ${dealerId}:`, e);
            try {
              currentMarkers[dealerId].remove();
            } catch {}
          }
        } else {
          try {
            const el = document.createElement("div");
            el.innerHTML = getMarkerSvg(dealer, isSelected);
            el.addEventListener("click", (e) => {
              e.stopPropagation();
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
  }, [isLoaded, dealers, selectedDealer, onMarkerClick]);

  // Update User Location Marker Effect (Keep as before)
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;
    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.remove();
      } catch (e) {}
      userMarkerRef.current = null;
    }
    if (
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number"
    ) {
      try {
        const el = document.createElement("div");
        el.style.cssText = `width: 14px; height: 14px; background-color: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); cursor: default;`;
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

  // Fly To / Jump To Effect (Keep as before)
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
        zoom: zoom ?? map.getZoom(),
        duration: type === "fly" ? 1200 : 0,
        essential: true,
      };
      console.log(`Map action: ${type}-ing to`, flyOptions);
      isAnimatingRef.current = true;
      if (type === "fly") map.flyTo(flyOptions);
      else map.jumpTo(flyOptions);
    } else {
      console.warn("Invalid center provided for flyToState:", center);
    }
  }, [isLoaded, flyToState]);

  return (
    <div
      ref={mapContainerRef}
      className={cn("w-full h-full bg-muted relative", className)}
    />
  );
};

export default React.memo(DealerMap);
