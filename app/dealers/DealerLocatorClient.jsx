// app/dealers/DealerLocatorClient.jsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import mapboxgl from "mapbox-gl";

// Libs & Constants
import { fetchDealerData, searchDealers } from "@/lib/api";
import { calculateDistance } from "@/lib/geo";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  RESULTS_PER_PAGE,
  DEBOUNCE_DELAY,
  DEALER_DETAIL_ZOOM,
  USER_LOC_ZOOM,
} from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Hooks
import useDebounce from "@/hooks/useDebounce";
import { useGeolocation } from "@/hooks/useGeolocation"; // Corrected import path case

// Components
import DealerSearch from "@/components/features/dealers/DealerSearch";
import DealerList from "@/components/features/dealers/DealerList";
import DealerDetailSheet from "@/components/features/dealers/DealerDetailSheet";
import DealerMap from "@/components/features/dealers/DealerMap";
import MapPlaceholder from "@/components/features/dealers/MapPlaceholder";
import Pagination from "@/components/features/dealers/Pagination";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @typedef {import('@/lib/constants').Dealer} Dealer
 * @typedef {import('@/lib/constants').Coordinates} Coordinates
 */

// --- Helper to check if viewport is mobile ---
const useIsMobile = () => {
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobileView;
};

export default function DealerLocatorClient() {
  // Name matches filename
  const isMobile = useIsMobile();

  // --- State ---
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY);
  const [currentPage, setCurrentPage] = useState(1);
  const listContainerRef = useRef(null);
  const {
    userLocation,
    isLocating,
    locationError,
    getUserLocation,
    clearUserLocation,
  } = useGeolocation();
  const [mapFlyTo, setMapFlyTo] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // --- Data Fetching and Processing ---
  const loadAndFilterDealers = useCallback(async (params = {}) => {
    if (!params.query && !params.coords) setIsLoading(true);
    else setIsSearching(true);
    setError(null);
    setSelectedDealer(null);
    setIsDetailSheetOpen(false);
    if (params.query !== undefined || params.coords) setCurrentPage(1);

    try {
      const results = await searchDealers(params);
      setFilteredDealers(results);

      if (params.coords)
        setMapFlyTo({
          center: params.coords,
          zoom: USER_LOC_ZOOM,
          type: "fly",
        });
      else if (params.query && results.length > 0 && results[0].coordinates)
        setMapFlyTo({
          center: results[0].coordinates,
          zoom: DEALER_DETAIL_ZOOM - 1,
          type: "fly",
        });
      else if (!params.query && !params.coords)
        setMapFlyTo({
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
          type: "jump",
        });
    } catch (err) {
      console.error("Dealer search/load failed:", err);
      setError(err.message || "Failed to load or search for dealers.");
      setFilteredDealers([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    loadAndFilterDealers();
  }, [loadAndFilterDealers]);

  useEffect(() => {
    if (debouncedSearchQuery === "" && searchQuery !== "") return;
    if (userLocation) return;
    loadAndFilterDealers({ query: debouncedSearchQuery });
  }, [debouncedSearchQuery, searchQuery, userLocation, loadAndFilterDealers]);

  useEffect(() => {
    if (userLocation) {
      setSearchQuery("");
      loadAndFilterDealers({ coords: userLocation });
    }
  }, [userLocation, loadAndFilterDealers]);

  // --- Event Handlers ---
  const handleSearchInputChange = useCallback(
    (query) => {
      setSearchQuery(query);
      if (query === "" && userLocation) clearUserLocation();
      else if (query === "") loadAndFilterDealers({ query: "" });
    },
    [userLocation, clearUserLocation, loadAndFilterDealers]
  );

  const handleSearchSubmit = useCallback(
    (query) => {
      clearUserLocation();
      loadAndFilterDealers({ query: query });
    },
    [loadAndFilterDealers, clearUserLocation]
  );

  const handleGeolocate = useCallback(() => {
    if (!isLocating) {
      setSelectedDealer(null);
      setIsDetailSheetOpen(false);
      setSearchQuery("");
      getUserLocation();
    }
  }, [isLocating, getUserLocation]);

  const handleSelectDealer = useCallback((dealer) => {
    if (!dealer || !dealer.coordinates) return;
    setSelectedDealer(dealer);
    setIsDetailSheetOpen(true);
    setMapFlyTo({
      center: dealer.coordinates,
      zoom: DEALER_DETAIL_ZOOM,
      type: "fly",
    });
    requestAnimationFrame(() => {
      const cardElement = listContainerRef.current?.querySelector(
        `[data-dealer-id="${dealer.id}"]`
      );
      cardElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailSheetOpen(false);
  }, []);
  const handleMapClick = useCallback(() => {
    setSelectedDealer(null);
    setIsDetailSheetOpen(false);
  }, []);
  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // --- Derived State for Rendering ---
  const dealersToShow = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredDealers.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  }, [filteredDealers, currentPage]);
  const totalPages = useMemo(
    () => Math.ceil(filteredDealers.length / RESULTS_PER_PAGE),
    [filteredDealers]
  );
  const showMap = !!mapboxAccessToken;
  const currentLoadingState = isLoading || isSearching || isLocating;

  // --- Render ---
  return (
    <>
      <main
        className={cn(
          "flex flex-col md:flex-row w-full h-screen max-h-screen overflow-hidden",
          "bg-background text-foreground"
        )}
      >
        {/* Sidebar */}
        <div
          className={cn(
            "flex flex-col",
            isMobile
              ? "order-2 h-[55%]"
              : "order-1 md:w-[400px] lg:w-[450px] border-r",
            "bg-background flex-shrink-0 overflow-hidden"
          )}
        >
          {/* Search Area */}
          <div className="p-4 border-b flex-shrink-0 space-y-3">
            <div>
              <h1 className="text-xl font-semibold mb-0.5">Find a Dealer</h1>
              <p className="text-sm text-muted-foreground">
                Search by Pincode, City, or use your location.
              </p>
            </div>
            <DealerSearch
              onSearch={handleSearchSubmit}
              onGeolocate={handleGeolocate}
              isSearching={currentLoadingState}
              initialQuery={searchQuery}
            />
            <div className="text-xs h-4 text-muted-foreground">
              {isLocating && <span>Getting location...</span>}
              {isSearching && !isLocating && <span>Searching...</span>}
              {locationError && (
                <span className="text-destructive">{locationError}</span>
              )}
            </div>
          </div>
          {/* List Area */}
          <div ref={listContainerRef} className="flex-1 overflow-y-auto">
            {isLoading && filteredDealers.length === 0 ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-[110px] w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <DealerList
                dealers={dealersToShow}
                isLoading={isSearching || isLocating}
                error={error}
                searchedTerm={
                  searchQuery || (userLocation ? "your location" : "")
                }
                onSelectDealer={handleSelectDealer}
                selectedDealerId={selectedDealer?.id}
              />
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="flex-shrink-0"
            />
          )}
        </div>
        {/* Map Area */}
        <div
          className={cn(
            "flex-1 relative",
            isMobile ? "order-1 h-[45%]" : "order-2"
          )}
        >
          {showMap ? (
            <DealerMap
              accessToken={mapboxAccessToken}
              initialCenter={DEFAULT_MAP_CENTER}
              initialZoom={DEFAULT_MAP_ZOOM}
              dealers={filteredDealers}
              selectedDealer={selectedDealer}
              userLocation={userLocation}
              flyToState={mapFlyTo}
              onMapLoad={handleMapLoad}
              onMarkerClick={handleSelectDealer}
              onMapClick={handleMapClick}
              className="absolute inset-0"
            />
          ) : (
            <MapPlaceholder
              message="Map requires configuration"
              subtext="Missing Mapbox Access Token."
            />
          )}
          {isLoading && !isMapLoaded && showMap && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
              <svg
                className="animate-spin h-10 w-10 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </main>
      {/* Detail Sheet */}
      <DealerDetailSheet
        dealer={selectedDealer}
        isOpen={isDetailSheetOpen}
        onClose={handleCloseDetail}
        isMobile={isMobile}
        distanceUnit="km"
      />
      {/* Toaster */}
      <Toaster position="top-right" richColors closeButton theme="light" />
    </>
  );
}
