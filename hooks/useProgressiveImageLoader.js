// hooks/useProgressiveImageLoader.js
import { useState, useEffect, useRef, useCallback } from "react";

const DEBUG_LOADER = true;
const LOG_LEVEL = { VERBOSE: 3, INFO: 2, ERROR: 1, NONE: 0 };
const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO;

const KEYFRAME_DENSITY_DIVISOR = 10;
const NEIGHBOR_WINDOW_CURRENT = 3;
const NEIGHBOR_WINDOW_ANTICIPATED = 5;
const MAX_CONCURRENT_LOADS = 6;
const RETRY_LIMIT = 1;

export function useProgressiveImageLoader(
  imageUrls = [],
  frameCount = 0,
  initialFrameIndex = 0
) {
  const log = useCallback((messageLevel, ...args) => {
    // ... (log function - no change)
    if (DEBUG_LOADER && messageLevel <= CURRENT_LOG_LEVEL) {
      const prefix =
        messageLevel === LOG_LEVEL.ERROR
          ? "[ImageLoader ERROR]"
          : "[ImageLoader]";
      console.log(prefix, ...args);
    }
  }, []);

  // State initializations (no change from previous correct version)
  const [imageElements, setImageElements] = useState(() =>
    new Array(frameCount).fill(null)
  );
  const [imageStatuses, setImageStatuses] = useState(() => {
    const initial = {};
    for (let i = 0; i < frameCount; i++) initial[i] = "idle";
    return initial;
  });
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

  // processQueuesRef will hold the function responsible for processing queues.
  // It's defined in an effect to capture the latest state.
  const processQueuesRef = useRef(null);

  // Function to schedule processQueuesRef.current to run
  // This is the ONLY way processQueuesRef.current should be invoked from callbacks
  const scheduleQueueProcessing = useCallback(() => {
    if (
      isMountedRef.current &&
      processQueuesTimeoutRef.current === null &&
      processQueuesRef.current
    ) {
      processQueuesTimeoutRef.current = setTimeout(() => {
        processQueuesTimeoutRef.current = null;
        if (isMountedRef.current && processQueuesRef.current) {
          log(LOG_LEVEL.VERBOSE, "Scheduled queue processing running.");
          processQueuesRef.current();
        }
      }, 0); // Process on next tick
    }
  }, [log]); // log is stable

  // Initialization and URL Change Effect
  useEffect(() => {
    // ... (Initialization logic - no change from previous correct version)
    isMountedRef.current = true;
    log(
      LOG_LEVEL.INFO,
      `Init/URLs Changed. New frameCount: ${frameCount}, New imageUrls length: ${imageUrls.length}`
    );
    if (
      frameCount === currentImageUrlsRef.current?.length &&
      imageUrls === currentImageUrlsRef.current &&
      loadPhase !== "idle" &&
      loadPhase !== "error"
    ) {
      log(
        LOG_LEVEL.INFO,
        "Image URLs and frameCount appear unchanged, skipping full re-initialization."
      );
      return;
    }
    currentImageUrlsRef.current = imageUrls;
    log(
      LOG_LEVEL.INFO,
      "Performing full reset of loader state due to changed inputs."
    );
    if (processQueuesTimeoutRef.current)
      clearTimeout(processQueuesTimeoutRef.current);
    processQueuesTimeoutRef.current = null;
    activeLoadSlots.current = 0;
    retryCounts.current = {};
    setImageElements(new Array(frameCount).fill(null));
    const initialStatusesReset = {};
    for (let i = 0; i < frameCount; i++) initialStatusesReset[i] = "idle";
    setImageStatuses(initialStatusesReset);
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
      processQueuesTimeoutRef.current = null;
      log(LOG_LEVEL.INFO, "Loader Unmounting / Full Re-init Cleanup");
    };
  }, [imageUrls, frameCount, initialFrameIndex, log]);

  // createImageLoad function
  const createImageLoad = useCallback(
    (frameIndexToLoad) => {
      if (
        !isMountedRef.current ||
        !imageUrls[frameIndexToLoad] ||
        typeof window === "undefined"
      )
        return;
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
        if (calculatedKeyframes.current.has(frameIndexToLoad))
          loadedAndVisibleKeyframes.current.add(frameIndexToLoad);
        const safeInitial = (initialFrameIndex + frameCount) % frameCount;
        if (frameIndexToLoad === safeInitial && !initialFrameLoaded) {
          setInitialFrameLoaded(true); // This state change will trigger effects that depend on it
          log(LOG_LEVEL.INFO, `>>> Initial frame ${frameIndexToLoad} LOADED!`);
        }
        scheduleQueueProcessing(); // Use the scheduler
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
          setImageStatuses((prev) => ({ ...prev, [frameIndexToLoad]: "idle" }));
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
          const safeInitial = (initialFrameIndex + frameCount) % frameCount;
          if (frameIndexToLoad === safeInitial && !initialFrameLoaded) {
            setLoadingError(
              `Critical: Initial frame (${safeInitial}) failed to load.`
            );
            setInitialFrameLoaded(true);
            setLoadPhase("error");
          }
        }
        scheduleQueueProcessing(); // Use the scheduler
      };
      img.src = imageUrls[frameIndexToLoad];
    },
    [
      frameCount,
      imageUrls,
      initialFrameIndex,
      initialFrameLoaded,
      log,
      scheduleQueueProcessing,
      setInitialFrameLoaded,
      setLoadPhase,
      setLoadingError,
    ]
  ); // Added setters to deps

  // useEffect to DEFINE processQueuesRef.current
  useEffect(() => {
    processQueuesRef.current = () => {
      // ... (processQueues logic - no change from previous correct version)
      if (
        !isMountedRef.current ||
        ["complete", "error", "idle"].includes(loadPhase)
      )
        return;
      let imagesAttemptedThisCycle = 0;
      const currentQueues = queuesRef.current;
      const currentImageStatuses = imageStatuses;
      const tryLoadFromQueue = (queue, frameIndex) => {
        if (
          frameIndex === undefined ||
          (currentImageStatuses[frameIndex] !== "idle" &&
            (currentImageStatuses[frameIndex] !== "error" ||
              (retryCounts.current[frameIndex] || 0) >= RETRY_LIMIT))
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
        if (currentImageStatuses[i] === "loaded") localProcessedCount++;
        else if (currentImageStatuses[i] === "error") {
          localProcessedCount++;
          localErrorCount++;
        }
      }
      const currentProgress =
        frameCount > 0
          ? Math.round((localProcessedCount / frameCount) * 100)
          : 0;
      if (
        currentProgress !== loadingProgress &&
        (currentProgress % 5 === 0 ||
          currentProgress >= 98 ||
          currentProgress === 0 ||
          localProcessedCount === frameCount)
      ) {
        setLoadingProgress(currentProgress);
        log(
          LOG_LEVEL.INFO,
          `Progress: ${currentProgress}% (${localProcessedCount}/${frameCount})`
        );
      }
      let nextPhase = loadPhase;
      if (loadPhase === "initial" && initialFrameLoaded)
        nextPhase = "keyframes";
      else if (
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
      )
        nextPhase = "background";
      if (nextPhase !== loadPhase) {
        log(LOG_LEVEL.INFO, `Phase transition: ${loadPhase} -> ${nextPhase}`);
        setLoadPhase(nextPhase);
      } else if (localProcessedCount === frameCount && frameCount > 0) {
        if (loadPhase !== "complete") {
          log(LOG_LEVEL.INFO, "All images processed. Load phase: complete.");
          setLoadPhase("complete");
          if (loadingProgress !== 100) setLoadingProgress(100);
          if (localErrorCount > 0 && !loadingError?.startsWith("Critical")) {
            const errorMsg = `${localErrorCount} image(s) failed to load after retries.`;
            setLoadingError(errorMsg);
            log(LOG_LEVEL.ERROR, errorMsg);
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
            if (isMountedRef.current && processQueuesRef.current)
              processQueuesRef.current();
          }, 30);
        }
      }
    };
  }, [
    loadPhase,
    imageStatuses,
    frameCount,
    createImageLoad,
    log,
    loadingProgress,
    setLoadingProgress,
    loadingError,
    setLoadingError,
    initialFrameLoaded,
    setInitialFrameLoaded,
    allKeyframesAttempted,
    setAllKeyframesAttempted,
    // scheduleQueueProcessing // Not needed as a dep for defining processQueuesRef, but used by createImageLoad
  ]);

  // useEffect to INITIATE queue processing when loadPhase changes
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
      scheduleQueueProcessing(); // Use the scheduler
    }
    // Cleanup for THIS effect, not for the scheduled timeout itself,
    // as scheduleQueueProcessing manages its own timeout ref.
    // If loadPhase changes rapidly, scheduleQueueProcessing has its own guards.
  }, [loadPhase, log, scheduleQueueProcessing]);

  // prioritizeLoad function
  const prioritizeLoad = useCallback(
    (targetFrameIndex, { isAnticipated = false } = {}) => {
      // ... (prioritizeLoad logic - use currentImageStatuses from state, scheduleQueueProcessing)
      if (!isMountedRef.current || !initialFrameLoaded || frameCount <= 0)
        return;
      const currentImageStatusesSnapshot = imageStatuses;
      const centerFrame =
        (Math.round(targetFrameIndex % frameCount) + frameCount) % frameCount;
      const windowSize = isAnticipated
        ? NEIGHBOR_WINDOW_ANTICIPATED
        : NEIGHBOR_WINDOW_CURRENT;
      let qRef = queuesRef.current;
      let addedToPriority = false;
      for (let i = -windowSize; i <= windowSize; i++) {
        const frameToPrioritize = (centerFrame + i + frameCount) % frameCount;
        const status = currentImageStatusesSnapshot[frameToPrioritize];
        if (
          status === "idle" ||
          (status === "error" &&
            (retryCounts.current[frameToPrioritize] || 0) < RETRY_LIMIT)
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
          `Prioritized frames around ${centerFrame}. Priority Q size: ${qRef.priority.size}. Scheduling queue processing.`
        );
        scheduleQueueProcessing(); // Use the scheduler
      }
    },
    [
      initialFrameLoaded,
      frameCount,
      imageStatuses,
      log,
      scheduleQueueProcessing,
    ]
  ); // imageStatuses and scheduleQueueProcessing are dependencies

  return {
    /* ... return object - no change ... */
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
