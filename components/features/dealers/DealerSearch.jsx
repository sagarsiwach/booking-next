// components/features/dealers/DealerSearch.jsx
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon, LocateFixedIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DealerSearch = ({
  onSearch,
  onGeolocate,
  isSearching,
  initialQuery = "",
}) => {
  const [query, setQuery] = useState(initialQuery);

  // Sync input value if initialQuery changes externally (e.g., clear on geolocate)
  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    // Optionally trigger search on empty input immediately if desired
    // if (e.target.value === '') {
    //     onSearch('');
    // }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Allow searching even if query is empty, to reset to all dealers
    if (!isSearching) {
      onSearch(query.trim());
    }
  };

  const handleGeolocateClick = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    if (isSearching) return; // Prevent clicking while already searching/locating

    // Let the parent component handle the loading state via `isSearching` prop
    onGeolocate(); // Parent should set loading state true
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="flex flex-col sm:flex-row items-center gap-3 mb-4"
    >
      <div className="relative flex-grow w-full">
        <Input
          type="search" // Use type="search" for potential browser clear button
          placeholder="Enter Pincode, City, or Area"
          value={query}
          onChange={handleInputChange}
          disabled={isSearching}
          className="pr-10" // Space for the search icon inside
          aria-label="Search for dealers"
        />
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          type="submit"
          disabled={isSearching} // Disable only during any search/locate operation
          className="flex-1 sm:flex-initial"
          aria-label="Search Dealers"
        >
          {isSearching ? (
            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SearchIcon className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
        {onGeolocate && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGeolocateClick}
            disabled={isSearching} // Disable only during any search/locate operation
            className="flex-1 sm:flex-initial"
            title="Use my current location"
            aria-label="Find dealers near me"
          >
            {isSearching ? (
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LocateFixedIcon className="mr-2 h-4 w-4" />
            )}
            Near Me
          </Button>
        )}
      </div>
    </form>
  );
};

export default DealerSearch;
