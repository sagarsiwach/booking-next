// components/features/dealers/DealerList.jsx
import React, { useMemo } from "react";
import DealerCard from "./DealerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPinOffIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Import motion
import { cn } from "@/lib/utils";

/**
 * @typedef {import('@/lib/constants').Dealer} Dealer
 */

// Animation variants for list items
const listItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    // Custom function for stagger
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05, // Stagger delay based on index
      duration: 0.3,
      ease: "easeOut",
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const DealerList = ({
  dealers = [],
  isLoading,
  error,
  searchedTerm,
  onSelectDealer,
  selectedDealerId,
}) => {
  // Memoize the content based on dealers and loading state to optimize AnimatePresence
  const listContent = useMemo(() => {
    if (isLoading && dealers.length === 0) {
      return (
        <div className="space-y-2 p-3">
          {" "}
          {/* Condensed space/padding */}
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={`skel-${i}`}
              className="h-[100px] w-full rounded-lg"
            /> // Slightly smaller skeleton
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-3">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!isLoading && dealers.length === 0) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          <MapPinOffIcon className="mx-auto h-8 w-8 mb-2 text-muted-foreground/40" />
          <p className="text-sm">
            {searchedTerm ? (
              <>No dealers found matching "{searchedTerm}".</>
            ) : (
              <>Enter a location or use "Near Me" to find dealers.</>
            )}
          </p>
        </div>
      );
    }

    return (
      // Use motion.div for the container to manage AnimatePresence children
      <motion.div
        layout // Animate layout changes smoothly
        className="space-y-2 p-3" // Condensed space/padding
      >
        <AnimatePresence mode="popLayout">
          {" "}
          {/* Animate items in/out */}
          {dealers.map((dealer, index) => (
            <motion.div
              key={dealer.id} // Use dealer ID as key
              custom={index} // Pass index for stagger delay
              variants={listItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout // Animate position changes
              // Add data-dealer-id here if needed by parent scrollIntoView
              data-dealer-id={dealer.id}
            >
              <DealerCard
                dealer={dealer}
                isSelected={selectedDealerId === dealer.id}
                onSelect={() => onSelectDealer(dealer)}
                // distanceUnit passed from parent page
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }, [
    dealers,
    isLoading,
    error,
    searchedTerm,
    selectedDealerId,
    onSelectDealer,
  ]); // Dependencies for memoization

  return listContent; // Render the memoized content
};

export default DealerList;
