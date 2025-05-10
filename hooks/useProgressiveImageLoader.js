// hooks/useProgressiveImageLoader.js
import { useState, useEffect, useRef, useCallback } from "react";

const DEBUG_LOADER = true; // Keep true for now, but logs will be condensed
const LOG_LEVEL = {
  // Define log levels
  VERBOSE: 3, // All details, including individual frame loads
  INFO: 2, // Key events, phase changes, errors
  ERROR: 1, // Only errors
  NONE: 0, // No logs
};
const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO; // Set desired log level here

const KEYFRAME_DENSITY_DIVISOR = 10;
const NEIGHBOR_WINDOW_CURRENT = 3;
const NEIGHBOR_WINDOW_ANTICIPATED = 5;
const MAX_CONCURRENT_LOADS = 6;
const RETRY_LIMIT = 1;

/**
 * Custom hook for progressively loading a sequence of images.
 * Manages loading states, priorities, and provides image elements and statuses.
 * @param {string[]} [imageUrls=[]] - Array of image URLs for the sequence.
 * @param {number} [frameCount=0] - Total number of frames in the sequence.
 * @param {number} [initialFrameIndex=0] - The frame index to prioritize loading initially.
 * @returns {{
 *   imageElementsRef: React.RefObject<HTMLImageElement[]>,
 *   imageStatusRef: React.RefObject<Record<number, 'idle' | 'loading' | 'loaded' | 'error' | 'retrying'>>,
 *   isLoadingInitial: boolean,
 *   isLoadingKeyframes: boolean,
 *   isFullyLoaded: boolean,
 *   loadedAndVisibleKeyframes: Set<number>,
 *   loadingProgress: number,
 *   loadingError: string | null,
 *   prioritizeLoad: (targetFrameIndex: number, options?: { isAnticipated?: boolean }) => void,
 *   loadPhase: 'idle' | 'initial' | 'keyframes' | 'interactive' | 'background' | 'complete' | 'error'
 * }}
 * Hook return object.
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

  const [imageElements, setImageElements] = useState([]);
  const [imageStatuses, setImageStatuses] = useState({});
  const [loadPhase, setLoadPhase] = useState("idle");
  const [initialFrameLoaded, setInitialFrameLoaded] = useState(false);
  const [allKeyframesAttempted, setAllKeyframesAttempted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);

  const activeLoadSlots = useRef(0);
  const retryCounts = useRef({});
  const queuesRef = useRef({
    initial: new Set(),
    keyframes: new Set(),
    priority: new Set(),
    background: new Set(),
  });
  const calculatedKeyframes = useRef(new Set());
  const loadedAndVisibleKeyframes = useRef(new Set());
  const isMountedRef = useRef(false);
  const processQueuesTimeoutRef = useRef(null);
  const currentImageUrlsRef = useRef([]);

  useEffect(() => {
    isMountedRef.current = true;
    log(
      LOG_LEVEL.INFO,
      `Init/URLs Changed. Frames: ${frameCount}, Initial Hint: ${initialFrameIndex}, New URLs: ${imageUrls.length}`
    );

    let urlsHaveChanged =
      imageUrls.length !== currentImageUrlsRef.current.length;
    if (!urlsHaveChanged && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        if (imageUrls[i] !== currentImageUrlsRef.current[i]) {
          urlsHaveChanged = true;
          break;
        }
      }
    }

    if (!urlsHaveChanged && loadPhase !== "idle" && loadPhase !== "error") {
      log(
        LOG_LEVEL.INFO,
        "Image URLs are the same, skipping re-initialization."
      );
      return;
    }

    currentImageUrlsRef.current = [...imageUrls];

    if (processQueuesTimeoutRef.current)
      clearTimeout(processQueuesTimeoutRef.current);
    activeLoadSlots.current = 0;
    retryCounts.current = {};

    setImageElements(new Array(frameCount).fill(null));
    const initialStatuses = {};
    for (let i = 0; i < frameCount; i++) initialStatuses[i] = "idle";
    setImageStatuses(initialStatuses);

    setLoadPhase("idle");
    setInitialFrameLoaded(false);
    setAllKeyframesAttempted(false);
    setLoadingProgress(0);
    setLoadingError(null);

    queuesRef.current.initial.clear();
    queuesRef.current.keyframes.clear();
    queuesRef.current.priority.clear();
    queuesRef.current.background.clear();
    calculatedKeyframes.current.clear();
    loadedAndVisibleKeyframes.current.clear();

    if (frameCount > 0 && imageUrls.length === frameCount) {
      const safeInitial = (initialFrameIndex + frameCount) % frameCount;
      queuesRef.current.initial.add(safeInitial);
      log(LOG_LEVEL.INFO, `Initial frame to load: ${safeInitial}`);

      const density = Math.max(
        1,
        Math.floor(frameCount / Math.max(1, KEYFRAME_DENSITY_DIVISOR))
      );
      for (let i = 0; i < frameCount; i += density)
        calculatedKeyframes.current.add(i);
      calculatedKeyframes.current.add(frameCount - 1);
      calculatedKeyframes.current.add(safeInitial);
      log(
        LOG_LEVEL.INFO,
        `Calculated ${calculatedKeyframes.current.size} keyframes.`
      );

      for (let i = 0; i < frameCount; i++) {
        if (i === safeInitial) continue;
        if (calculatedKeyframes.current.has(i))
          queuesRef.current.keyframes.add(i);
        else queuesRef.current.background.add(i);
      }
      setLoadPhase("initial");
    } else if (imageUrls.length > 0 || frameCount > 0) {
      const errorMsg = `Initialization failed: Mismatch or invalid frameCount (${frameCount}) or imageUrls length (${imageUrls.length}).`;
      log(LOG_LEVEL.ERROR, errorMsg);
      setLoadingError(errorMsg);
      setLoadPhase("error");
    }

    return () => {
      isMountedRef.current = false;
      if (processQueuesTimeoutRef.current)
        clearTimeout(processQueuesTimeoutRef.current);
      log(LOG_LEVEL.INFO, "Loader Unmounting / Re-initializing Cleanup");
    };
  }, [imageUrls, frameCount, initialFrameIndex, log]);

  const createImageLoad = useCallback(
    (frameIndexToLoad) => {
      if (!isMountedRef.current || !imageUrls[frameIndexToLoad]) return;

      retryCounts.current[frameIndexToLoad] =
        retryCounts.current[frameIndexToLoad] || 0;
      log(
        LOG_LEVEL.VERBOSE, // More verbose log for individual frame
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

        if (calculatedKeyframes.current.has(frameIndexToLoad)) {
          loadedAndVisibleKeyframes.current.add(frameIndexToLoad);
        }

        const safeInitial = (initialFrameIndex + frameCount) % frameCount;
        if (frameIndexToLoad === safeInitial && !initialFrameLoaded) {
          setInitialFrameLoaded(true);
          log(LOG_LEVEL.INFO, `>>> Initial frame ${frameIndexToLoad} LOADED!`);
        }

        if (isMountedRef.current && processQueuesTimeoutRef.current === null) {
          processQueuesTimeoutRef.current = setTimeout(() => {
            processQueuesTimeoutRef.current = null;
            if (isMountedRef.current) processQueuesRef.current?.();
          }, 0);
        }
      };

      img.onerror = () => {
        if (!isMountedRef.current) return;
        activeLoadSlots.current--;
        retryCounts.current[frameIndexToLoad]++;

        if (retryCounts.current[frameIndexToLoad] <= RETRY_LIMIT) {
          log(
            LOG_LEVEL.INFO, // Downgrade retry log slightly
            `ERROR loading frame ${frameIndexToLoad}, will retry (Attempt ${retryCounts.current[frameIndexToLoad]}).`
          );
          setImageStatuses((prev) => ({ ...prev, [frameIndexToLoad]: "idle" }));
        } else {
          log(
            LOG_LEVEL.ERROR,
            `ERROR loading frame ${frameIndexToLoad} after ${
              RETRY_LIMIT + 1
            } attempts. Marking as error.`
          );
          setImageStatuses((prev) => ({
            ...prev,
            [frameIndexToLoad]: "error",
          }));
          const safeInitial = (initialFrameIndex + frameCount) % frameCount;
          if (frameIndexToLoad === safeInitial) {
            setLoadingError(
              `Critical: Initial frame (${safeInitial}) failed to load.`
            );
            if (!initialFrameLoaded) setInitialFrameLoaded(true);
            setLoadPhase("error");
          }
        }
        if (isMountedRef.current && processQueuesTimeoutRef.current === null) {
          processQueuesTimeoutRef.current = setTimeout(() => {
            processQueuesTimeoutRef.current = null;
            if (isMountedRef.current) processQueuesRef.current?.();
          }, 0);
        }
      };
      img.src = imageUrls[frameIndexToLoad];
    },
    [frameCount, imageUrls, initialFrameIndex, initialFrameLoaded, log]
  );

  const processQueuesRef = useRef();
  useEffect(() => {
    processQueuesRef.current = () => {
      if (
        !isMountedRef.current ||
        ["complete", "error", "idle"].includes(loadPhase)
      ) {
        return;
      }

      let imagesAttemptedThisCycle = 0;
      const currentQueues = queuesRef.current;

      const tryLoadFromQueue = (queue, frameIndex) => {
        if (
          frameIndex === undefined ||
          (imageStatuses[frameIndex] !== "idle" &&
            (imageStatuses[frameIndex] !== "error" ||
              retryCounts.current[frameIndex] >= RETRY_LIMIT))
        ) {
          if (frameIndex !== undefined) queue.delete(frameIndex);
          return false;
        }

        if (activeLoadSlots.current < MAX_CONCURRENT_LOADS) {
          activeLoadSlots.current++;
          createImageLoad(frameIndex);
          queue.delete(frameIndex);
          imagesAttemptedThisCycle++;
          return true;
        }
        return false;
      };

      while (
        activeLoadSlots.current < MAX_CONCURRENT_LOADS &&
        imagesAttemptedThisCycle < MAX_CONCURRENT_LOADS
      ) {
        let processedThisIteration = false;
        if (loadPhase === "initial" && currentQueues.initial.size > 0) {
          if (
            tryLoadFromQueue(
              currentQueues.initial,
              currentQueues.initial.values().next().value
            )
          )
            processedThisIteration = true;
        } else if (currentQueues.priority.size > 0) {
          if (
            tryLoadFromQueue(
              currentQueues.priority,
              currentQueues.priority.values().next().value
            )
          )
            processedThisIteration = true;
        } else if (
          loadPhase === "keyframes" &&
          currentQueues.keyframes.size > 0
        ) {
          if (
            tryLoadFromQueue(
              currentQueues.keyframes,
              currentQueues.keyframes.values().next().value
            )
          )
            processedThisIteration = true;
        } else if (
          ["interactive", "background"].includes(loadPhase) &&
          currentQueues.background.size > 0
        ) {
          if (
            tryLoadFromQueue(
              currentQueues.background,
              currentQueues.background.values().next().value
            )
          )
            processedThisIteration = true;
        }

        if (!processedThisIteration) break;
      }

      let localProcessedCount = 0;
      let localErrorCount = 0;
      for (let i = 0; i < frameCount; ++i) {
        if (imageStatuses[i] === "loaded") localProcessedCount++;
        else if (imageStatuses[i] === "error") {
          localProcessedCount++;
          localErrorCount++;
        }
      }
      const currentProgress =
        frameCount > 0
          ? Math.round((localProcessedCount / frameCount) * 100)
          : 0;

      // Only update progress state if it changed significantly or it's a key milestone
      if (
        currentProgress !== loadingProgress &&
        (currentProgress % 10 === 0 ||
          currentProgress === 100 ||
          currentProgress === 0)
      ) {
        setLoadingProgress(currentProgress);
        log(LOG_LEVEL.VERBOSE, `Progress: ${currentProgress}%`);
      }

      let nextPhase = loadPhase;
      if (loadPhase === "initial" && initialFrameLoaded) {
        nextPhase = "keyframes";
      } else if (
        loadPhase === "keyframes" &&
        initialFrameLoaded &&
        currentQueues.keyframes.size === 0
      ) {
        if (!allKeyframesAttempted) {
          setAllKeyframesAttempted(true);
          nextPhase = "interactive";
        }
      } else if (
        loadPhase === "interactive" &&
        currentQueues.priority.size === 0 &&
        currentQueues.background.size > 0 &&
        allKeyframesAttempted
      ) {
        nextPhase = "background";
      }

      if (nextPhase !== loadPhase) {
        log(LOG_LEVEL.INFO, `Phase transition: ${loadPhase} -> ${nextPhase}`);
        setLoadPhase(nextPhase);
      }

      if (localProcessedCount === frameCount && frameCount > 0) {
        if (loadPhase !== "complete") {
          log(LOG_LEVEL.INFO, "All images processed. Load phase: complete.");
          setLoadPhase("complete");
          setLoadingProgress(100); // Ensure 100%
          if (localErrorCount > 0 && !loadingError?.startsWith("Critical")) {
            setLoadingError(
              `${localErrorCount} image(s) failed to load after retries.`
            );
            log(
              LOG_LEVEL.ERROR,
              `${localErrorCount} image(s) failed to load after retries.`
            );
          }
        }
      } else if (loadPhase !== "complete" && loadPhase !== "error") {
        const hasPendingWork =
          currentQueues.initial.size > 0 ||
          currentQueues.priority.size > 0 ||
          currentQueues.keyframes.size > 0 ||
          currentQueues.background.size > 0;

        if (
          (imagesAttemptedThisCycle > 0 ||
            activeLoadSlots.current > 0 ||
            hasPendingWork) &&
          processQueuesTimeoutRef.current === null
        ) {
          processQueuesTimeoutRef.current = setTimeout(() => {
            processQueuesTimeoutRef.current = null;
            if (isMountedRef.current) processQueuesRef.current?.();
          }, 30);
        }
      }
    };
  }, [
    loadPhase,
    initialFrameLoaded,
    allKeyframesAttempted,
    frameCount,
    createImageLoad,
    imageStatuses,
    loadingError,
    log,
    loadingProgress, // Added loadingProgress
  ]);

  useEffect(() => {
    if (
      loadPhase !== "idle" &&
      loadPhase !== "complete" &&
      loadPhase !== "error"
    ) {
      log(
        LOG_LEVEL.INFO,
        `Load phase is ${loadPhase}. Triggering processQueues.`
      );
      if (processQueuesTimeoutRef.current === null) {
        processQueuesTimeoutRef.current = setTimeout(() => {
          processQueuesTimeoutRef.current = null;
          if (isMountedRef.current) processQueuesRef.current?.();
        }, 0);
      }
    }
    return () => {
      if (processQueuesTimeoutRef.current) {
        clearTimeout(processQueuesTimeoutRef.current);
        processQueuesTimeoutRef.current = null;
      }
    };
  }, [loadPhase, log]);

  const prioritizeLoad = useCallback(
    (targetFrameIndex, { isAnticipated = false } = {}) => {
      if (!isMountedRef.current || !initialFrameLoaded || frameCount <= 0)
        return;

      const centerFrame =
        (Math.round(targetFrameIndex % frameCount) + frameCount) % frameCount;
      const windowSize = isAnticipated
        ? NEIGHBOR_WINDOW_ANTICIPATED
        : NEIGHBOR_WINDOW_CURRENT;

      let qRef = queuesRef.current;
      let addedToPriority = false;

      for (let i = -windowSize; i <= windowSize; i++) {
        const frameToPrioritize = (centerFrame + i + frameCount) % frameCount;
        const status = imageStatuses[frameToPrioritize];

        if (
          status === "idle" ||
          (status === "error" &&
            (retryCounts.current[frameToPrioritize] || 0) <= RETRY_LIMIT)
        ) {
          if (qRef.keyframes.has(frameToPrioritize)) {
            qRef.keyframes.delete(frameToPrioritize);
            qRef.priority.add(frameToPrioritize);
            addedToPriority = true;
          } else if (qRef.background.has(frameToPrioritize)) {
            qRef.background.delete(frameToPrioritize);
            qRef.priority.add(frameToPrioritize);
            addedToPriority = true;
          } else if (
            !qRef.priority.has(frameToPrioritize) &&
            status !== "loaded" &&
            status !== "loading" &&
            status !== "retrying"
          ) {
            qRef.priority.add(frameToPrioritize);
            addedToPriority = true;
          }
        }
      }

      if (addedToPriority) {
        log(
          LOG_LEVEL.INFO,
          `Prioritized frames around ${centerFrame}. Priority Q size: ${qRef.priority.size}. Triggering processQueues.`
        );
        if (processQueuesTimeoutRef.current === null) {
          processQueuesTimeoutRef.current = setTimeout(() => {
            processQueuesTimeoutRef.current = null;
            if (isMountedRef.current) processQueuesRef.current?.();
          }, 0);
        }
      }
    },
    [initialFrameLoaded, frameCount, imageStatuses, log]
  );

  return {
    imageElementsRef: { current: imageElements },
    imageStatusRef: { current: imageStatuses },
    isLoadingInitial:
      !initialFrameLoaded && loadPhase !== "error" && loadPhase !== "idle",
    isLoadingKeyframes:
      initialFrameLoaded && !allKeyframesAttempted && loadPhase === "keyframes",
    isFullyLoaded: loadPhase === "complete",
    loadedAndVisibleKeyframes: loadedAndVisibleKeyframes.current,
    loadingProgress,
    loadingError,
    prioritizeLoad,
    loadPhase,
  };
}
