// components/features/dealers/Pagination.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Pagination = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    // Condensed padding
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2 px-3 border-t bg-background",
        className
      )}
    >
      <Button
        variant="outline"
        size="sm" // Keep size small
        className="h-7 px-2.5" // More condensed padding
        onClick={handlePrev}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />{" "}
        {/* Slightly smaller icon */}
      </Button>
      <span className="text-xs text-muted-foreground">
        {" "}
        {/* Smaller text */}
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5" // More condensed padding
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRightIcon className="h-3.5 w-3.5" />{" "}
        {/* Slightly smaller icon */}
      </Button>
    </div>
  );
};

export default Pagination;
