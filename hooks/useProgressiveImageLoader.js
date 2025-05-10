// hooks/useProgressiveImageLoader.js
import { useState, useEffect, useRef, useCallback } from "react";

const DEBUG_LOADER = process.env.NODE_ENV === "development"; // Enable logs only in development
const LOG_LEVEL = { VERBOSE: 3, INFO: 2, ERROR: 1, NONE: 0 };
// In development, use INFO. In production, only show ERRORS or NONE.
const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === "development" ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;

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

  // Refs to store the props that, if changed, should trigger a full reset.
  // Initialized with a value that won't match initially to ensure first run.
  const prevImageUrlsRef = useRef(null);
  const prevFrameCountRef = useRef(-1);
  const prevInitialFrameIndexRef = useRef(-1);

  const processQueuesRef = useRef(null);

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
      }, 0);
    }
  }, [log]);

  useEffect(() => {
    isMountedRef.current = true;
    log(
      LOG_LEVEL.INFO,
      `Init/Effect. Current frameCount: ${prevFrameCountRef.current}, New frameCount: ${frameCount}. Initial frame hint: ${initialFrameIndex}`
    );

    if (
      frameCount !== prevFrameCountRef.current ||
      imageUrls !== prevImageUrlsRef.current ||
      initialFrameIndex !== prevInitialFrameIndexRef.current
    ) {
      log(
        LOG_LEVEL.INFO,
        "Performing full reset of loader state due to changed core props."
      );

      prevImageUrlsRef.current = imageUrls;
      prevFrameCountRef.current = frameCount;
      prevInitialFrameIndexRef.current = initialFrameIndex;

      if (processQueuesTimeoutRef.current)
        clearTimeout(processQueuesTimeoutRef.current);
      processQueuesTimeoutRef.current = null;
      activeLoadSlots.current = 0;
      retryCounts.current = {};

      setImageElements(new Array(frameCount).fill(null));
      const initialStatusesReset = {};
      for (let i = 0; i < frameCount; i++) initialStatusesReset[i] = "idle";
      setImageStatuses(initialStatusesReset);

      setLoadPhase("idle"); // Critical to reset phase to allow re-triggering
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
        log(
          LOG_LEVEL.INFO,
          `Queues populated. Initial frame to load: ${safeInitial}`
        );
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
        setLoadPhase("initial"); // Trigger processing via the loadPhase useEffect
      } else if (imageUrls.length > 0 || frameCount > 0) {
        const errorMsg = `Init failed: FrameCount (${frameCount}) vs ImageUrls length (${imageUrls.length}).`;
        log(LOG_LEVEL.ERROR, errorMsg);
        setLoadingError(errorMsg);
        setLoadPhase("error");
      }
    }

    return () => {
      isMountedRef.current = false;
      if (processQueuesTimeoutRef.current)
        clearTimeout(processQueuesTimeoutRef.current);
      processQueuesTimeoutRef.current = null;
      log(LOG_LEVEL.INFO, "Loader Unmounting/Cleanup");
    };
  }, [imageUrls, frameCount, initialFrameIndex, log]);

  const createImageLoad = useCallback(
    (frameIndexToLoad) => {
      if (
        !isMountedRef.current ||
        !prevImageUrlsRef.current[frameIndexToLoad] ||
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

        const currentSafeInitial =
          (prevInitialFrameIndexRef.current + prevFrameCountRef.current) %
          prevFrameCountRef.current;
        if (frameIndexToLoad === currentSafeInitial && !initialFrameLoaded) {
          // Use local initialFrameLoaded state
          setInitialFrameLoaded(true);
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
          const currentSafeInitial =
            (prevInitialFrameIndexRef.current + prevFrameCountRef.current) %
            prevFrameCountRef.current;
          if (frameIndexToLoad === currentSafeInitial && !initialFrameLoaded) {
            // Use local initialFrameLoaded state
            setLoadingError(
              `Critical: Initial frame (${currentSafeInitial}) failed to load.`
            );
            setInitialFrameLoaded(true);
            setLoadPhase("error"); // This will trigger effects depending on loadPhase
          }
        }
        scheduleQueueProcessing();
      };
      img.src = prevImageUrlsRef.current[frameIndexToLoad];
    },
    [
      log,
      scheduleQueueProcessing,
      initialFrameLoaded,
      setInitialFrameLoaded,
      setLoadingError,
      setLoadPhase,
    ]
  ); // initialFrameLoaded is a dep

  useEffect(() => {
    processQueuesRef.current = () => {
      if (
        !isMountedRef.current ||
        ["complete", "error", "idle"].includes(loadPhase)
      )
        return;
      let imagesAttemptedThisCycle = 0;
      const currentFC = prevFrameCountRef.current;
      const currentImageStatuses = imageStatuses; // Read fresh state

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
        if (loadPhase === "initial" && queuesRef.current.initial.size > 0) {
          if (
            tryLoadFromQueue(
              queuesRef.current.initial,
              queuesRef.current.initial.values().next().value
            )
          )
            processedThisIteration = true;
        } else if (queuesRef.current.priority.size > 0) {
          if (
            tryLoadFromQueue(
              queuesRef.current.priority,
              queuesRef.current.priority.values().next().value
            )
          )
            processedThisIteration = true;
        } else if (
          loadPhase === "keyframes" &&
          queuesRef.current.keyframes.size > 0
        ) {
          if (
            tryLoadFromQueue(
              queuesRef.current.keyframes,
              queuesRef.current.keyframes.values().next().value
            )
          )
            processedThisIteration = true;
        } else if (
          ["interactive", "background"].includes(loadPhase) &&
          queuesRef.current.background.size > 0
        ) {
          if (
            tryLoadFromQueue(
              queuesRef.current.background,
              queuesRef.current.background.values().next().value
            )
          )
            processedThisIteration = true;
        }
        if (!processedThisIteration) break;
      }
      let localProcessedCount = 0;
      let localErrorCount = 0;
      for (let i = 0; i < currentFC; ++i) {
        if (currentImageStatuses[i] === "loaded") localProcessedCount++;
        else if (currentImageStatuses[i] === "error") {
          localProcessedCount++;
          localErrorCount++;
        }
      }
      const currentProgress =
        currentFC > 0 ? Math.round((localProcessedCount / currentFC) * 100) : 0;
      if (
        currentProgress !== loadingProgress &&
        (currentProgress % 5 === 0 ||
          currentProgress >= 98 ||
          currentProgress === 0 ||
          localProcessedCount === currentFC)
      ) {
        setLoadingProgress(currentProgress);
        log(
          LOG_LEVEL.INFO,
          `Progress: ${currentProgress}% (${localProcessedCount}/${currentFC})`
        );
      }
      let nextPhase = loadPhase;
      if (loadPhase === "initial" && initialFrameLoaded)
        nextPhase = "keyframes";
      else if (
        loadPhase === "keyframes" &&
        initialFrameLoaded &&
        queuesRef.current.keyframes.size === 0
      ) {
        if (!allKeyframesAttempted) {
          setAllKeyframesAttempted(true);
          nextPhase = "interactive";
        }
      } else if (
        loadPhase === "interactive" &&
        queuesRef.current.priority.size === 0 &&
        queuesRef.current.background.size > 0 &&
        allKeyframesAttempted
      )
        nextPhase = "background";

      if (nextPhase !== loadPhase) {
        log(LOG_LEVEL.INFO, `Phase transition: ${loadPhase} -> ${nextPhase}`);
        setLoadPhase(nextPhase);
      } else if (localProcessedCount === currentFC && currentFC > 0) {
        if (loadPhase !== "complete") {
          log(LOG_LEVEL.INFO, "All images processed. Load phase: complete.");
          setLoadPhase("complete");
          if (loadingProgress !== 100) setLoadingProgress(100);
          if (
            localErrorCount > 0 &&
            (loadingError === null || !loadingError.startsWith("Critical"))
          ) {
            const errorMsg = `${localErrorCount} image(s) failed to load.`;
            setLoadingError(errorMsg);
            log(LOG_LEVEL.ERROR, errorMsg);
          }
        }
      } else if (loadPhase !== "complete" && loadPhase !== "error") {
        const hasPendingWork =
          queuesRef.current.initial.size > 0 ||
          queuesRef.current.priority.size > 0 ||
          queuesRef.current.keyframes.size > 0 ||
          queuesRef.current.background.size > 0;
        if (
          imagesAttemptedThisCycle > 0 ||
          activeLoadSlots.current > 0 ||
          hasPendingWork
        ) {
          scheduleQueueProcessing();
        }
      }
    };
    // Dependencies for re-defining processQueuesRef.current. These are state values it directly reads or sets.
  }, [
    loadPhase,
    imageStatuses,
    createImageLoad,
    log,
    loadingProgress,
    loadingError,
    initialFrameLoaded,
    allKeyframesAttempted,
    scheduleQueueProcessing,
    setLoadPhase,
    setLoadingProgress,
    setLoadingError,
    setInitialFrameLoaded,
    setAllKeyframesAttempted,
  ]);

  useEffect(() => {
    if (
      loadPhase !== "idle" &&
      loadPhase !== "complete" &&
      loadPhase !== "error"
    ) {
      log(
        LOG_LEVEL.INFO,
        `Load phase is ${loadPhase}. Scheduling initial queue processing.`
      );
      scheduleQueueProcessing();
    }
  }, [loadPhase, log, scheduleQueueProcessing]);

  const prioritizeLoad = useCallback(
    (targetFrameIndex, { isAnticipated = false } = {}) => {
      if (
        !isMountedRef.current ||
        !initialFrameLoaded ||
        prevFrameCountRef.current <= 0
      )
        return;
      const currentImageStatusesSnapshot = imageStatuses;
      const currentFC = prevFrameCountRef.current;
      const centerFrame =
        (Math.round(targetFrameIndex % currentFC) + currentFC) % currentFC;
      const windowSize = isAnticipated
        ? NEIGHBOR_WINDOW_ANTICIPATED
        : NEIGHBOR_WINDOW_CURRENT;
      let qRef = queuesRef.current;
      let addedToPriority = false;
      for (let i = -windowSize; i <= windowSize; i++) {
        const frameToPrioritize = (centerFrame + i + currentFC) % currentFC;
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
          `Prioritized frames around ${centerFrame}. Scheduling queue processing.`
        );
        scheduleQueueProcessing();
      }
    },
    [initialFrameLoaded, imageStatuses, log, scheduleQueueProcessing]
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
