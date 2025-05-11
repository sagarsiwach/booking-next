// hooks/useProgressiveImageLoader.js
import { useState, useEffect, useRef, useCallback } from "react";

const DEBUG_LOADER = process.env.NODE_ENV === "development";
const LOG_LEVEL = { VERBOSE: 3, INFO: 2, ERROR: 1, NONE: 0 };
const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === "development" ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;

// Configuration for multi-pass loading strategy
const PASS_CONFIGURATIONS = [
  { divisor: 32, name: "pass_0_coarse" }, // ~11-12 frames for 360
  { divisor: 16, name: "pass_1_medium" }, // ~22-23 frames
  { divisor: 8, name: "pass_2_fine" }, // ~45 frames
  { divisor: 4, name: "pass_3_finer" }, // ~90 frames
  { divisor: 2, name: "pass_4_half" }, // ~180 frames
];
// The final 'background_fill' phase will cover all remaining frames.

const NEIGHBOR_WINDOW_CURRENT = 3; // How many frames around current view to prioritize during interaction
const NEIGHBOR_WINDOW_ANTICIPATED = 5; // How many frames around anticipated target to prioritize during animation
const MAX_CONCURRENT_LOADS = 6;
const RETRY_LIMIT = 1;

/**
 * @typedef {'idle' | 'initial_frame_loading' | 'pass_0_coarse_loading' | 'pass_1_medium_loading' | 'pass_2_fine_loading' | 'pass_3_finer_loading' | 'pass_4_half_loading' | 'background_fill' | 'complete' | 'error'} LoadPhase
 */

/**
 * Custom hook for progressively loading a sequence of images for a 360° turntable.
 * Implements a multi-pass strategy to quickly load essential frames and then fill in details.
 *
 * @param {string[]} [imageUrls=[]] - Array of URLs for the image sequence.
 * @param {number} [frameCount=0] - Total number of frames in the sequence.
 * @param {number} [initialFrameIndex=0] - The frame index to load and display first.
 * @returns {{
 *  imageElementsRef: React.RefObject<HTMLImageElement[]>;
 *  imageStatusRef: React.RefObject<Record<number, 'idle' | 'loading' | 'loaded' | 'error'>>;
 *  isLoadingInitial: boolean;
 *  isLoadingStructuredPasses: boolean;
 *  isFullyLoaded: boolean;
 *  loadedAndVisibleKeyframes: Set<number>;
 *  loadingProgress: number;
 *  loadingError: string | null;
 *  prioritizeLoad: (targetFrameIndex: number, options?: { isAnticipated?: boolean }) => void;
 *  loadPhase: LoadPhase;
 * }} Object containing image elements, statuses, loading states, and control functions.
 */
export function useProgressiveImageLoader(
  imageUrls = [],
  frameCount = 0,
  initialFrameIndex = 0
) {
  const log = useCallback((messageLevel, ...args) => {
    if (DEBUG_LOADER && messageLevel <= CURRENT_LOG_LEVEL) {
      const prefix =
        messageLevel === LOG_LEVEL.ERROR
          ? "[ImageLoader ERROR]"
          : "[ImageLoader]";
      console.log(prefix, ...args);
    }
  }, []);

  const [imageElements, setImageElements] = useState(() =>
    new Array(frameCount).fill(null)
  );
  const [imageStatuses, setImageStatuses] = useState(() => {
    const initial = {};
    for (let i = 0; i < frameCount; i++) initial[i] = "idle";
    return initial;
  });

  /** @type {[LoadPhase, React.Dispatch<React.SetStateAction<LoadPhase>>]} */
  const [loadPhase, setLoadPhase] = useState("idle");
  const [initialFrameLoaded, setInitialFrameLoaded] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);

  const activeLoadSlots = useRef(0);
  const retryCounts = useRef({});
  const queuesRef = useRef({
    initial: new Set(), // For the very first frame
    priority: new Set(), // For user interaction-driven loads
    currentPass: new Set(), // For frames in the current structured pass
    background: new Set(), // For all remaining frames after structured passes
  });

  const currentPassIndexRef = useRef(-1); // -1 indicates initial_frame_loading phase
  const passesFrameSetsRef = useRef([]); // Array of Sets, each Set contains frame indices for a pass
  const initialFrameLoadAttemptedRef = useRef(false);

  const loadedAndVisibleKeyframes = useRef(new Set()); // All successfully loaded frames, for snapping
  const isMountedRef = useRef(false);
  const processQueuesTimeoutRef = useRef(null);

  const prevImageUrlsRef = useRef(null);
  const prevFrameCountRef = useRef(-1);
  const prevInitialFrameIndexRef = useRef(-1);

  const processQueuesRef = useRef(null); // Will hold the main processing function

  // Helper: Schedule queue processing using a timeout to batch operations
  const scheduleQueueProcessing = useCallback(() => {
    if (
      isMountedRef.current &&
      processQueuesTimeoutRef.current === null &&
      typeof processQueuesRef.current === "function"
    ) {
      processQueuesTimeoutRef.current = setTimeout(() => {
        processQueuesTimeoutRef.current = null;
        if (
          isMountedRef.current &&
          typeof processQueuesRef.current === "function"
        ) {
          log(LOG_LEVEL.VERBOSE, "Scheduled queue processing running.");
          processQueuesRef.current();
        }
      }, 0); // Process on next tick
    }
  }, [log]);

  // Effect for initialization and full reset on critical prop changes
  useEffect(() => {
    isMountedRef.current = true;
    log(
      LOG_LEVEL.INFO,
      `Init/Effect. Current frameCount: ${prevFrameCountRef.current}, New frameCount: ${frameCount}. Initial frame hint: ${initialFrameIndex}`
    );

    if (
      frameCount !== prevFrameCountRef.current ||
      imageUrls !== prevImageUrlsRef.current || // Simple ref check for imageUrls array
      initialFrameIndex !== prevInitialFrameIndexRef.current
    ) {
      log(
        LOG_LEVEL.INFO,
        "Loader State Reset: Core props (imageUrls, frameCount, or initialFrameIndex) changed."
      );

      // Store current props
      prevImageUrlsRef.current = imageUrls;
      prevFrameCountRef.current = frameCount;
      prevInitialFrameIndexRef.current = initialFrameIndex;

      // Clear any pending processing
      if (processQueuesTimeoutRef.current)
        clearTimeout(processQueuesTimeoutRef.current);
      processQueuesTimeoutRef.current = null;

      // Reset all state and refs
      activeLoadSlots.current = 0;
      retryCounts.current = {};
      initialFrameLoadAttemptedRef.current = false;
      currentPassIndexRef.current = -1; // Reset pass index

      setImageElements(new Array(frameCount).fill(null));
      const initialStatusesReset = {};
      for (let i = 0; i < frameCount; i++) initialStatusesReset[i] = "idle";
      setImageStatuses(initialStatusesReset);

      setInitialFrameLoaded(false);
      setLoadingProgress(0);
      setLoadingError(null);

      queuesRef.current.initial.clear();
      queuesRef.current.priority.clear();
      queuesRef.current.currentPass.clear();
      queuesRef.current.background.clear();

      loadedAndVisibleKeyframes.current.clear();
      passesFrameSetsRef.current = [];

      if (frameCount > 0 && imageUrls && imageUrls.length === frameCount) {
        const safeInitialFrame = (initialFrameIndex + frameCount) % frameCount;

        // Generate frame sets for each pass
        const tempPassesFrameSets = [];
        const allFramesInStructuredPasses = new Set();

        PASS_CONFIGURATIONS.forEach((passConfig) => {
          const passFrames = new Set();
          const step = Math.max(1, Math.floor(frameCount / passConfig.divisor));

          // Ensure initial frame is considered for the first pass
          if (
            passConfig.divisor === PASS_CONFIGURATIONS[0].divisor &&
            !allFramesInStructuredPasses.has(safeInitialFrame)
          ) {
            passFrames.add(safeInitialFrame);
          }

          for (let i = 0; i < frameCount; i += step) {
            // Distribute frames around the initial frame to cover the sequence
            const frameIndexForward =
              (safeInitialFrame + i + frameCount) % frameCount;
            if (!allFramesInStructuredPasses.has(frameIndexForward)) {
              passFrames.add(frameIndexForward);
            }
            const frameIndexBackward =
              (safeInitialFrame - i + frameCount * 2) % frameCount;
            if (!allFramesInStructuredPasses.has(frameIndexBackward)) {
              passFrames.add(frameIndexBackward);
            }
          }

          passFrames.forEach((f) => allFramesInStructuredPasses.add(f));
          tempPassesFrameSets.push(passFrames);
        });
        passesFrameSetsRef.current = tempPassesFrameSets;
        log(
          LOG_LEVEL.INFO,
          `Generated ${passesFrameSetsRef.current.length} structured passes. Total unique frames in structured passes: ${allFramesInStructuredPasses.size}`
        );

        // Setup initial queue
        queuesRef.current.initial.add(safeInitialFrame);
        setLoadPhase("initial_frame_loading"); // Trigger processing
      } else if ((imageUrls && imageUrls.length > 0) || frameCount > 0) {
        const errorMsg = `Init failed: FrameCount (${frameCount}) vs ImageUrls length (${imageUrls?.length}). Ensure they match and are > 0.`;
        log(LOG_LEVEL.ERROR, errorMsg);
        setLoadingError(errorMsg);
        setLoadPhase("error");
      } else {
        setLoadPhase("idle"); // No data to process
      }
    }

    return () => {
      isMountedRef.current = false;
      if (processQueuesTimeoutRef.current)
        clearTimeout(processQueuesTimeoutRef.current);
      processQueuesTimeoutRef.current = null;
      log(LOG_LEVEL.INFO, "Loader Unmounting/Cleanup");
    };
  }, [imageUrls, frameCount, initialFrameIndex, log, scheduleQueueProcessing]); // Added scheduleQueueProcessing

  // Function to create and manage an image load
  const createImageLoad = useCallback(
    (frameIndexToLoad) => {
      if (
        !isMountedRef.current ||
        !prevImageUrlsRef.current ||
        !prevImageUrlsRef.current[frameIndexToLoad] ||
        typeof window === "undefined"
      ) {
        log(
          LOG_LEVEL.VERBOSE,
          `Skipping load for frame ${frameIndexToLoad}: Not mounted, no URL, or not in browser.`
        );
        return;
      }

      retryCounts.current[frameIndexToLoad] =
        retryCounts.current[frameIndexToLoad] || 0;
      log(
        LOG_LEVEL.VERBOSE,
        `Requesting load for frame ${frameIndexToLoad} (Attempt ${
          retryCounts.current[frameIndexToLoad] + 1
        })`
      );

      setImageStatuses((prev) => ({ ...prev, [frameIndexToLoad]: "loading" }));

      const img = new window.Image();
      img.onload = () => {
        if (!isMountedRef.current) return;
        activeLoadSlots.current--;
        setImageElements((prevElements) => {
          const newElements = [...prevElements];
          newElements[frameIndexToLoad] = img;
          return newElements;
        });
        setImageStatuses((prev) => ({ ...prev, [frameIndexToLoad]: "loaded" }));
        loadedAndVisibleKeyframes.current.add(frameIndexToLoad); // Add to cumulative set

        const currentSafeInitial =
          (prevInitialFrameIndexRef.current + prevFrameCountRef.current) %
          prevFrameCountRef.current;
        if (
          frameIndexToLoad === currentSafeInitial &&
          !initialFrameLoadAttemptedRef.current
        ) {
          setInitialFrameLoaded(true);
          initialFrameLoadAttemptedRef.current = true; // Mark as attempted
          log(LOG_LEVEL.INFO, `>>> Initial frame ${frameIndexToLoad} LOADED!`);
        }
        scheduleQueueProcessing();
      };
      img.onerror = () => {
        if (!isMountedRef.current) return;
        activeLoadSlots.current--;
        retryCounts.current[frameIndexToLoad]++;
        if (retryCounts.current[frameIndexToLoad] <= RETRY_LIMIT) {
          log(
            LOG_LEVEL.INFO,
            `ERROR loading frame ${frameIndexToLoad}, will retry.`
          );
          setImageStatuses((prev) => ({ ...prev, [frameIndexToLoad]: "idle" })); // Set to idle for retry
        } else {
          log(
            LOG_LEVEL.ERROR,
            `ERROR loading frame ${frameIndexToLoad} after ${
              RETRY_LIMIT + 1
            } attempts.`
          );
          setImageStatuses((prev) => ({
            ...prev,
            [frameIndexToLoad]: "error",
          }));

          const currentSafeInitial =
            (prevInitialFrameIndexRef.current + prevFrameCountRef.current) %
            prevFrameCountRef.current;
          if (
            frameIndexToLoad === currentSafeInitial &&
            !initialFrameLoadAttemptedRef.current
          ) {
            setLoadingError(
              `Critical: Initial frame (${currentSafeInitial}) failed to load.`
            );
            setInitialFrameLoaded(true); // Still "loaded" in the sense that the attempt is over
            initialFrameLoadAttemptedRef.current = true;
            setLoadPhase("error");
          }
        }
        scheduleQueueProcessing();
      };
      img.src = prevImageUrlsRef.current[frameIndexToLoad];
    },
    [
      log,
      scheduleQueueProcessing,
      setInitialFrameLoaded,
      setLoadingError,
      setLoadPhase,
    ]
  );

  // Core queue processing logic
  useEffect(() => {
    processQueuesRef.current = () => {
      if (
        !isMountedRef.current ||
        ["complete", "error", "idle"].includes(loadPhase)
      )
        return;

      let imagesAttemptedThisCycle = 0;
      const currentFC = prevFrameCountRef.current;
      const currentImageStatuses = imageStatuses; // Snapshot for this run

      // Helper to attempt loading a frame from a specific queue
      const tryLoadFromQueue = (queue, frameIndex) => {
        if (frameIndex === undefined) return false;

        const status = currentImageStatuses[frameIndex];
        if (
          status !== "idle" &&
          (status !== "error" ||
            (retryCounts.current[frameIndex] || 0) >= RETRY_LIMIT)
        ) {
          queue.delete(frameIndex); // Remove if already processed or max retries
          return false;
        }

        if (activeLoadSlots.current < MAX_CONCURRENT_LOADS) {
          activeLoadSlots.current++;
          createImageLoad(frameIndex);
          queue.delete(frameIndex);
          imagesAttemptedThisCycle++;
          return true;
        }
        return false; // No slot available
      };

      // Helper to populate the currentPass queue
      const populateCurrentPassQueue = () => {
        queuesRef.current.currentPass.clear();
        const passIdx = currentPassIndexRef.current;
        if (passIdx >= 0 && passIdx < passesFrameSetsRef.current.length) {
          const framesForThisPass = passesFrameSetsRef.current[passIdx];
          framesForThisPass.forEach((frameIdx) => {
            const status = currentImageStatuses[frameIdx];
            // Add if idle, or error but retriable
            if (
              status === "idle" ||
              (status === "error" &&
                (retryCounts.current[frameIdx] || 0) < RETRY_LIMIT)
            ) {
              queuesRef.current.currentPass.add(frameIdx);
            }
          });
          log(
            LOG_LEVEL.INFO,
            `Populated currentPass queue for pass ${passIdx} (${PASS_CONFIGURATIONS[passIdx]?.name}) with ${queuesRef.current.currentPass.size} frames.`
          );
        }
      };

      // Helper to populate the background queue
      const populateBackgroundQueue = () => {
        queuesRef.current.background.clear();
        for (let i = 0; i < currentFC; i++) {
          const status = currentImageStatuses[i];
          if (
            status === "idle" ||
            (status === "error" && (retryCounts.current[i] || 0) < RETRY_LIMIT)
          ) {
            queuesRef.current.background.add(i);
          }
        }
        log(
          LOG_LEVEL.INFO,
          `Populated background queue with ${queuesRef.current.background.size} frames.`
        );
      };

      // Process queues based on loadPhase
      while (
        activeLoadSlots.current < MAX_CONCURRENT_LOADS &&
        imagesAttemptedThisCycle < MAX_CONCURRENT_LOADS
      ) {
        let processedThisIteration = false;

        // 1. Highest priority: Frames explicitly requested by user interaction
        if (queuesRef.current.priority.size > 0) {
          if (
            tryLoadFromQueue(
              queuesRef.current.priority,
              queuesRef.current.priority.values().next().value
            )
          ) {
            processedThisIteration = true;
          }
        }
        // 2. Initial frame loading
        else if (
          loadPhase === "initial_frame_loading" &&
          queuesRef.current.initial.size > 0
        ) {
          if (
            tryLoadFromQueue(
              queuesRef.current.initial,
              queuesRef.current.initial.values().next().value
            )
          ) {
            processedThisIteration = true;
          }
        }
        // 3. Current structured pass loading
        else if (
          loadPhase.startsWith("pass_") &&
          queuesRef.current.currentPass.size > 0
        ) {
          if (
            tryLoadFromQueue(
              queuesRef.current.currentPass,
              queuesRef.current.currentPass.values().next().value
            )
          ) {
            processedThisIteration = true;
          }
        }
        // 4. Background fill loading
        else if (
          loadPhase === "background_fill" &&
          queuesRef.current.background.size > 0
        ) {
          if (
            tryLoadFromQueue(
              queuesRef.current.background,
              queuesRef.current.background.values().next().value
            )
          ) {
            processedThisIteration = true;
          }
        }

        if (!processedThisIteration) break; // No frame could be processed in this iteration
      }

      // Update progress
      let localProcessedCount = 0;
      let localErrorCount = 0;
      for (let i = 0; i < currentFC; ++i) {
        if (currentImageStatuses[i] === "loaded") localProcessedCount++;
        else if (
          currentImageStatuses[i] === "error" &&
          (retryCounts.current[i] || 0) >= RETRY_LIMIT
        ) {
          localProcessedCount++; // Count max-errored as "processed" for progress
          localErrorCount++;
        }
      }
      const currentProgress =
        currentFC > 0 ? Math.round((localProcessedCount / currentFC) * 100) : 0;
      if (currentProgress !== loadingProgress) {
        setLoadingProgress(currentProgress);
        log(
          LOG_LEVEL.INFO,
          `Progress: ${currentProgress}% (${localProcessedCount}/${currentFC}) Errors: ${localErrorCount}`
        );
      }

      // Determine next load phase
      let nextPhase = loadPhase;
      if (
        loadPhase === "initial_frame_loading" &&
        initialFrameLoaded &&
        queuesRef.current.initial.size === 0
      ) {
        currentPassIndexRef.current = 0;
        nextPhase = PASS_CONFIGURATIONS[0]?.name + "_loading"; // e.g., 'pass_0_coarse_loading'
        populateCurrentPassQueue();
      } else if (
        loadPhase.startsWith("pass_") &&
        queuesRef.current.currentPass.size === 0
      ) {
        const currentPassDoneIdx = currentPassIndexRef.current;
        if (currentPassDoneIdx < PASS_CONFIGURATIONS.length - 1) {
          currentPassIndexRef.current++;
          nextPhase =
            PASS_CONFIGURATIONS[currentPassIndexRef.current]?.name + "_loading";
          populateCurrentPassQueue();
        } else {
          // All structured passes done
          nextPhase = "background_fill";
          populateBackgroundQueue();
        }
      }

      if (nextPhase !== loadPhase && nextPhase !== undefined) {
        log(LOG_LEVEL.INFO, `Phase transition: ${loadPhase} -> ${nextPhase}`);
        setLoadPhase(nextPhase);
      } else if (localProcessedCount === currentFC && currentFC > 0) {
        // All frames attempted (loaded or max error)
        if (loadPhase !== "complete" && loadPhase !== "error") {
          // Avoid re-setting if already in error state from initial load fail
          log(LOG_LEVEL.INFO, "All images processed. Load phase: complete.");
          setLoadPhase("complete");
          if (loadingProgress !== 100) setLoadingProgress(100);
          if (
            localErrorCount > 0 &&
            (loadingError === null || !loadingError.startsWith("Critical"))
          ) {
            const errorMsg = `${localErrorCount} image(s) failed to load. Turntable might be incomplete.`;
            setLoadingError(errorMsg);
            log(LOG_LEVEL.ERROR, errorMsg);
          }
        }
      } else if (loadPhase !== "complete" && loadPhase !== "error") {
        // If there's still work to do, schedule another processing cycle
        const hasPendingWorkInQueues =
          queuesRef.current.initial.size > 0 ||
          queuesRef.current.priority.size > 0 ||
          queuesRef.current.currentPass.size > 0 ||
          queuesRef.current.background.size > 0;

        if (
          imagesAttemptedThisCycle > 0 ||
          activeLoadSlots.current > 0 ||
          hasPendingWorkInQueues
        ) {
          scheduleQueueProcessing();
        }
      }
    };
  }, [
    loadPhase,
    imageStatuses,
    createImageLoad,
    log,
    loadingProgress,
    loadingError,
    initialFrameLoaded,
    scheduleQueueProcessing, // Keep all state setters
    setLoadPhase,
    setLoadingProgress,
    setLoadingError,
    setInitialFrameLoaded,
  ]);

  // Effect to trigger queue processing when loadPhase changes
  useEffect(() => {
    if (
      loadPhase !== "idle" &&
      loadPhase !== "complete" &&
      loadPhase !== "error"
    ) {
      log(
        LOG_LEVEL.INFO,
        `Load phase is ${loadPhase}. Scheduling queue processing.`
      );
      scheduleQueueProcessing();
    }
  }, [loadPhase, log, scheduleQueueProcessing]);

  // Function to prioritize loading frames around a target index
  const prioritizeLoad = useCallback(
    (targetFrameIndex, { isAnticipated = false } = {}) => {
      if (
        !isMountedRef.current ||
        !initialFrameLoaded ||
        prevFrameCountRef.current <= 0
      )
        return;

      const currentImageStatusesSnapshot = imageStatuses; // Use the state directly
      const currentFC = prevFrameCountRef.current;
      const centerFrame =
        (Math.round(targetFrameIndex % currentFC) + currentFC) % currentFC;
      const windowSize = isAnticipated
        ? NEIGHBOR_WINDOW_ANTICIPATED
        : NEIGHBOR_WINDOW_CURRENT;

      let addedToPriority = false;
      for (let i = -windowSize; i <= windowSize; i++) {
        const frameToPrioritize = (centerFrame + i + currentFC) % currentFC;
        const status = currentImageStatusesSnapshot[frameToPrioritize];

        if (
          status === "idle" ||
          (status === "error" &&
            (retryCounts.current[frameToPrioritize] || 0) < RETRY_LIMIT)
        ) {
          // Remove from other queues and add to priority
          if (queuesRef.current.currentPass.has(frameToPrioritize)) {
            queuesRef.current.currentPass.delete(frameToPrioritize);
            queuesRef.current.priority.add(frameToPrioritize);
            addedToPriority = true;
          } else if (queuesRef.current.background.has(frameToPrioritize)) {
            queuesRef.current.background.delete(frameToPrioritize);
            queuesRef.current.priority.add(frameToPrioritize);
            addedToPriority = true;
          } else if (
            // Also add if not in any other queue but is eligible
            !queuesRef.current.priority.has(frameToPrioritize) &&
            status !== "loaded" &&
            status !== "loading"
          ) {
            queuesRef.current.priority.add(frameToPrioritize);
            addedToPriority = true;
          }
        }
      }

      if (addedToPriority) {
        log(
          LOG_LEVEL.INFO,
          `Prioritized frames around ${centerFrame}. Total in priority queue: ${queuesRef.current.priority.size}. Scheduling queue processing.`
        );
        scheduleQueueProcessing();
      }
    },
    [initialFrameLoaded, imageStatuses, log, scheduleQueueProcessing]
  );

  const isLoadingStructuredPasses =
    initialFrameLoaded && loadPhase.startsWith("pass_");

  return {
    imageElementsRef: { current: imageElements },
    imageStatusRef: { current: imageStatuses },
    isLoadingInitial:
      !initialFrameLoaded &&
      loadPhase !== "error" &&
      loadPhase !== "idle" &&
      loadPhase !== "complete",
    isLoadingStructuredPasses,
    isFullyLoaded: loadPhase === "complete",
    loadedAndVisibleKeyframes: loadedAndVisibleKeyframes.current,
    loadingProgress,
    loadingError,
    prioritizeLoad,
    loadPhase,
  };
}
