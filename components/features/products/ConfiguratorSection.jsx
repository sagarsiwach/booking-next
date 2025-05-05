// components/features/products/ConfiguratorSection.jsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDrag } from "@use-gesture/react"; // Only importing useDrag for now
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { InertiaPlugin } from "gsap/InertiaPlugin";

// --- Register GSAP Plugin (Run Once) ---
if (typeof window !== "undefined") {
  gsap.registerPlugin(InertiaPlugin);
  // If using @gsap/react hook for the inertia tween, explicit global registration might not be strictly necessary,
  // but it's generally safer and clearer, especially if GSAP is used elsewhere.
}

// --- Constants & Defaults ---
const MIN_VELOCITY_THRESHOLD = 0.01;
const PRELOAD_WINDOW = 5;
const FRAME_COUNT_DEFAULT = 360; // Ensure this is overridden by Sanity data

// --- Helper Functions ---
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const slugify = (text) =>
  text
    ? text
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
    : "";

// Dynamic URL Generation (Matches your R2 structure)
const generateImageUrls = (count, size, modelSlug, colorSlug) => {
  // Basic validation
  if (!modelSlug || !colorSlug || !size || !count || count <= 0) {
    console.warn("generateImageUrls missing required parameters:", {
      count,
      size,
      modelSlug,
      colorSlug,
    });
    return [];
  }
  const urls = [];
  const baseUrl = `https://images.kabiramobility.com/processed_images/${modelSlug}/${colorSlug}/${size}/`;
  const prefix = `${modelSlug}_${colorSlug}_`;
  const suffix = `_${size}.avif`;
  for (let i = 1; i <= count; i++) {
    urls.push(`${baseUrl}${prefix}${String(i).padStart(3, "0")}${suffix}`);
  }
  return urls;
};

// ========================
//      MAIN COMPONENT
// ========================
export default function ConfiguratorSection({ block, productContext }) {
  // --- Props Destructuring ---
  const {
    sectionTitleOverride,
    sectionSubtitleOverride,
    initialFrameOverride,
    autoRotateOverride,
    className, // Allow passing className for section styling
  } = block || {};

  const { relatedVehicle } = productContext || {};
  const modelSlug = relatedVehicle?.slug;
  const colors = relatedVehicle?.colors || [];
  const frameCount = relatedVehicle?.frameCount || FRAME_COUNT_DEFAULT; // ** CRUCIAL: Get from Sanity **

  // Determine initial color
  const defaultColor = useMemo(
    () => colors.find((c) => c.isDefault) || colors[0],
    [colors]
  );
  const initialColorSlug = useMemo(
    () => slugify(defaultColor?.name),
    [defaultColor]
  );

  // Component Config (Defaults overridden by block props if provided)
  const initialFrame = initialFrameOverride ?? 0;
  const backgroundColor = block?.backgroundColor ?? "transparent"; // Example: Allow overriding bg
  const imageFit = block?.imageFit ?? "contain";
  const dragSensitivity = block?.dragSensitivity ?? 1.2;
  const allowZoom = block?.allowZoom ?? false; // Keeping zoom disabled for simplicity now
  const minZoom = block?.minZoom ?? 1;
  const maxZoom = block?.maxZoom ?? 1; // Effectively disabled
  // const zoomSensitivity = block?.zoomSensitivity ?? 0.004;
  const resetDoubleClickDelay = block?.resetDoubleClickDelay ?? 300;
  const autoRotate = autoRotateOverride ?? block?.autoRotate ?? false;
  const autoRotateSpeed = block?.autoRotateSpeed ?? 0.3;
  const autoRotateDirection = block?.autoRotateDirection ?? "clockwise";
  const loadingTimeout = block?.loadingTimeout ?? 45000;
  const useCustomCursor = block?.useCustomCursor ?? true;
  const cursorSize = block?.cursorSize ?? 60;
  const cursorBgColor = block?.cursorBgColor ?? "rgba(50, 50, 50, 0.9)";
  const cursorTextColor = block?.cursorTextColor ?? "#FFFFFF";
  const cursorText = block?.cursorText ?? "DRAG";
  const cursorFont = block?.cursorFont ?? "600 12px 'Geist', sans-serif";
  const debugMode = block?.debugMode ?? false;

  // --- Responsive Image Size ---
  const isLg = useMediaQuery("(min-width: 1601px)");
  const isMd = useMediaQuery("(min-width: 1025px) and (max-width: 1600px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const currentSizeLabel = useMemo(() => {
    if (isLg) return "lg";
    if (isMd) return "md";
    if (isTablet) return "tablet";
    return "phone";
  }, [isLg, isMd, isTablet]);

  // --- State ---
  const [currentVisualFrame, setCurrentVisualFrame] = useState(0);
  const [zoomState, setZoomState] = useState(minZoom);
  const [panOffsetState, setPanOffsetState] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false); // For cursor/auto-rotate logic
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [devicePixelRatioState, setDevicePixelRatioState] = useState(1);
  const [currentColorSlug, setCurrentColorSlug] = useState(initialColorSlug);

  // --- Refs ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Ref for the main container div for gestures
  const customCursorRef = useRef(null);
  const imageElementsRef = useRef([]);
  const imageLoadingStatusRef = useRef({});
  const imageUrlsRef = useRef([]);
  const autoRotateIntervalRef = useRef(null); // Still useful for interval-based rotation if GSAP approach changes
  const lastClickTimeRef = useRef(0);
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(false);
  const targetFrameRef = useRef(initialFrame); // Precise frame for GSAP/physics
  const gsapAnimationRef = useRef(null); // Store GSAP tween

  // --- GSAP Context ---
  // useGSAP provides automatic cleanup for animations created within its scope
  const { contextSafe } = useGSAP(
    () => {
      // We can define GSAP-related functions here if needed,
      // but the main inertia tween is created within the useDrag handler.
    },
    { scope: containerRef }
  ); // Scope animations to the container element

  // --- Logging ---
  const log = useCallback(
    (...args) => {
      if (debugMode) console.log("[Configurator]", ...args);
    },
    [debugMode]
  );

  // --- Image Loading (Callback) ---
  const updateLoadingProgress = useCallback(() => {
    if (!isMountedRef.current) return;
    const total = imageUrlsRef.current.length;
    if (total === 0) {
      setIsLoading(false);
      setLoadingProgress(100);
      return;
    }
    const loaded = Object.values(imageLoadingStatusRef.current).filter(
      (s) => s === "loaded"
    ).length;
    const errored = Object.values(imageLoadingStatusRef.current).filter(
      (s) => s === "error"
    ).length;
    const progress = Math.round(((loaded + errored) / total) * 100);
    setLoadingProgress(progress);
    if (loaded + errored === total) {
      log(`All images processed (${loaded} loaded, ${errored} errors)`);
      setIsLoading(false);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (errored > 0 && !loadingError) {
        setLoadingError(`Failed to load ${errored} image(s).`);
      }
    }
  }, [log, loadingError]); // Removed autoRotate dependencies here

  const loadImage = useCallback(
    (index) => {
      if (
        !isMountedRef.current ||
        index < 0 ||
        index >= frameCount ||
        !imageUrlsRef.current[index]
      )
        return;
      const status = imageLoadingStatusRef.current[index];
      if (status === "loaded" || status === "loading") return;

      imageLoadingStatusRef.current[index] = "loading";
      const url = imageUrlsRef.current[index];
      const img = new window.Image();

      img.onload = () => {
        if (
          !isMountedRef.current ||
          imageLoadingStatusRef.current[index] !== "loading"
        )
          return;
        imageElementsRef.current[index] = img;
        imageLoadingStatusRef.current[index] = "loaded";
        updateLoadingProgress();
      };
      img.onerror = () => {
        if (
          !isMountedRef.current ||
          imageLoadingStatusRef.current[index] !== "loading"
        )
          return;
        imageLoadingStatusRef.current[index] = "error";
        log(`Error loading frame ${index}: ${url}`);
        setLoadingError((prev) => prev || `Error loading image ${index}.`);
        updateLoadingProgress();
      };
      img.src = url;
    },
    [frameCount, log, updateLoadingProgress]
  );

  const preloadNeighbors = useCallback(
    (frame) => {
      const frameIndex = Math.round(frame);
      for (let i = 1; i <= PRELOAD_WINDOW; i++) {
        loadImage((frameIndex + i + frameCount) % frameCount);
        loadImage((frameIndex - i + frameCount) % frameCount);
      }
    },
    [frameCount, loadImage]
  );

  // --- Drawing Logic (Callback) ---
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (
      !ctx ||
      canvasSize.width === 0 ||
      canvasSize.height === 0 ||
      frameCount <= 0
    )
      return;

    const dpr = devicePixelRatioState;
    const canvasWidth = canvasSize.width * dpr;
    const canvasHeight = canvasSize.height * dpr;

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${canvasSize.width}px`;
      canvas.style.height = `${canvasSize.height}px`;
    }

    const displayFrameIndex = (currentVisualFrame + frameCount) % frameCount;
    const img = imageElementsRef.current[displayFrameIndex];

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspect = imgWidth / imgHeight;
      const canvasAspect = canvasWidth / canvasHeight;
      let drawWidth,
        drawHeight,
        drawX = 0,
        drawY = 0;

      // Calculate 'contain' dimensions
      if (imgAspect > canvasAspect) {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imgAspect;
        drawY = (canvasHeight - drawHeight) / 2;
      } else {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvasWidth - drawWidth) / 2;
      }
      // Apply pan/zoom (keeping it simple for now - centered zoom)
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.scale(zoomState, zoomState);
      ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
      // Pan is applied relative to the zoomed/centered view
      ctx.translate(panOffsetState.x * dpr, panOffsetState.y * dpr);

      ctx.drawImage(
        img,
        0,
        0,
        imgWidth,
        imgHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    } else if (!isLoading) {
      // Draw loading/error state if not loading but image unavailable
      ctx.fillStyle = "rgba(200, 200, 200, 0.8)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "#555";
      ctx.font = `${14 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      const statusText =
        imageLoadingStatusRef.current[displayFrameIndex] === "error"
          ? `Image ${displayFrameIndex} Error`
          : `Image ${displayFrameIndex} Loading...`;
      ctx.fillText(statusText, canvasWidth / 2, canvasHeight / 2);
    }
  }, [
    canvasSize,
    devicePixelRatioState,
    currentVisualFrame,
    frameCount,
    imageFit,
    zoomState,
    panOffsetState,
    isLoading,
  ]); // Removed log

  // --- Interaction Logic Callbacks ---
  const stopAutoRotate = useCallback(() => {
    if (gsapAnimationRef.current) {
      gsapAnimationRef.current.kill();
      gsapAnimationRef.current = null;
      log("Stopped GSAP auto-rotate");
    }
    setIsInteracting(false); // Ensure interaction state is reset
  }, [log]);

  const startAutoRotate = useCallback(() => {
    // Prevent starting if already rotating, loading, interacting, or zoomed
    if (
      !autoRotate ||
      gsapAnimationRef.current ||
      isLoading ||
      isInteracting ||
      zoomState > minZoom
    ) {
      stopAutoRotate();
      return;
    }
    log("Starting GSAP auto-rotate");
    stopAutoRotate(); // Ensure previous is stopped

    const frameStep = autoRotateDirection === "clockwise" ? 1 : -1;
    // Calculate speed relative to frame count
    const rotationSpeedFactor = Math.max(0.1, autoRotateSpeed);
    const durationPerRevolution = frameCount / (rotationSpeedFactor * 10); // Adjust multiplier for speed feel

    gsapAnimationRef.current = gsap.to(targetFrameRef, {
      current: `+=${frameStep * frameCount}`, // Rotate a full circle
      duration: durationPerRevolution,
      ease: "none",
      repeat: -1,
      overwrite: true,
      onUpdate: contextSafe(() => {
        // Use contextSafe for updates within GSAP callback
        if (!isMountedRef.current) return; // Check mount status

        const visualFrame =
          (Math.round(targetFrameRef.current % frameCount) + frameCount) %
          frameCount;
        // Check if the visual frame actually needs changing AND image is loaded
        if (
          visualFrame !== currentVisualFrame &&
          imageLoadingStatusRef.current[visualFrame] === "loaded"
        ) {
          setCurrentVisualFrame(visualFrame); // Update React state
          preloadNeighbors(visualFrame);
        } else if (
          imageLoadingStatusRef.current[visualFrame] !== "loaded" &&
          imageLoadingStatusRef.current[visualFrame] !== "loading"
        ) {
          // If not loaded, attempt to load it
          loadImage(visualFrame);
          preloadNeighbors(visualFrame);
        }
        // Draw is handled by the state update effect
      }),
      onInterrupt: () => {
        log("GSAP Auto-rotate interrupted");
        gsapAnimationRef.current = null; // Clear the ref on interrupt
        // Don't set isInteracting false here, the interrupting action will handle it
      },
      onComplete: () => {
        // Should not be reached with repeat -1
        gsapAnimationRef.current = null;
        setIsInteracting(false);
      },
    });
  }, [
    autoRotate,
    isLoading,
    isInteracting,
    zoomState,
    minZoom,
    autoRotateDirection,
    autoRotateSpeed,
    frameCount,
    stopAutoRotate,
    log,
    currentVisualFrame,
    loadImage,
    preloadNeighbors,
    contextSafe,
  ]);

  const resetView = useCallback(() => {
    log("Resetting view");
    stopAutoRotate(); // Kills GSAP tween too

    const initialVisual =
      (Math.round(initialFrame % frameCount) + frameCount) % frameCount;
    targetFrameRef.current = initialFrame;
    setCurrentVisualFrame(initialVisual);
    setZoomState(minZoom);
    setPanOffsetState({ x: 0, y: 0 });
    setIsInteracting(false);

    requestAnimationFrame(drawCanvas);
    if (autoRotate && !isLoading && minZoom === 1)
      setTimeout(startAutoRotate, 100);
  }, [
    initialFrame,
    frameCount,
    minZoom,
    autoRotate,
    log,
    stopAutoRotate,
    drawCanvas,
    startAutoRotate,
    isLoading,
  ]);

  // --- Gesture Binding (using useDrag) ---
  const bindGestures = useDrag(
    contextSafe(
      ({ event, first, last, movement: [mx], velocity: [vx], memo }) => {
        // contextSafe ensures GSAP/React state updates inside are safe
        // event.preventDefault(); // Prevent default only if necessary, might block scroll sometimes

        if (isLoading || !canvasRef.current) return;

        if (first) {
          stopAutoRotate(); // Stop rotation on drag start
          setIsInteracting(true);
          memo = targetFrameRef.current; // Store initial precise frame
          log("Drag Start");
        }

        // Calculate new target frame based on drag movement
        const sensitivityFactor = Math.max(
          1,
          canvasSize.width > 0 ? canvasSize.width / 10 : 50
        );
        const frameDelta =
          (mx / sensitivityFactor) * dragSensitivity * frameCount;
        const newTargetFrame = memo - frameDelta; // Calculate based on initial + movement

        // Update precise frame continuously
        targetFrameRef.current = newTargetFrame;

        // Update visual frame immediately during drag (if loaded)
        const newVisualFrame =
          (Math.round(newTargetFrame % frameCount) + frameCount) % frameCount;
        if (newVisualFrame !== currentVisualFrame) {
          if (
            imageLoadingStatusRef.current[newVisualFrame] !== "loaded" &&
            imageLoadingStatusRef.current[newVisualFrame] !== "loading"
          ) {
            loadImage(newVisualFrame);
          }
          if (imageLoadingStatusRef.current[newVisualFrame] === "loaded") {
            setCurrentVisualFrame(newVisualFrame); // Update visual state
          }
          preloadNeighbors(newVisualFrame);
        }
        requestAnimationFrame(drawCanvas); // Ensure canvas redraws during drag

        if (last) {
          // Drag ended
          log("Drag End - Initiating GSAP Inertia", { velocity: vx });
          // Kill any existing inertia tween before starting a new one
          if (gsapAnimationRef.current) gsapAnimationRef.current.kill();

          // Map drag velocity (vx, pixels/ms from use-gesture) to GSAP's expected frame velocity
          // This requires tuning: velocity sign might need flipping, magnitude needs scaling
          const inertiaVelocity = -vx * dragSensitivity * 25; // ** EXPERIMENT with this multiplier **

          gsapAnimationRef.current = gsap.to(targetFrameRef, {
            current: targetFrameRef.current, // Start from the ref's current value
            duration: 2.5, // Max duration of inertia (GSAP will stop sooner if velocity decays)
            ease: "power1.out", // A standard deceleration ease
            inertia: {
              current: {
                // Target the 'current' property of the ref
                velocity: inertiaVelocity,
                // Adjust resistance if needed (higher = stops faster)
                // resistance: 300
              },
            },
            onUpdate: () => {
              // Must use contextSafe here too if it wasn't global
              if (!isMountedRef.current) return;
              setIsInteracting(true); // Ensure interacting during inertia
              const visualFrame =
                (Math.round(targetFrameRef.current % frameCount) + frameCount) %
                frameCount;
              if (
                visualFrame !== currentVisualFrame &&
                imageLoadingStatusRef.current[visualFrame] === "loaded"
              ) {
                setCurrentVisualFrame(visualFrame);
                preloadNeighbors(visualFrame);
              } else if (
                imageLoadingStatusRef.current[visualFrame] !== "loaded" &&
                imageLoadingStatusRef.current[visualFrame] !== "loading"
              ) {
                loadImage(visualFrame); // Keep trying to load during inertia
              }
              requestAnimationFrame(drawCanvas); // Redraw on each update
            },
            onComplete: () => {
              log("GSAP Inertia Complete");
              if (isMountedRef.current) setIsInteracting(false);
              gsapAnimationRef.current = null;
              if (autoRotate && !isLoading && zoomState <= minZoom)
                startAutoRotate();
            },
            onInterrupt: () => {
              log("GSAP Inertia Interrupted");
              if (isMountedRef.current) setIsInteracting(true); // Assume interrupted by new interaction
              gsapAnimationRef.current = null;
            },
          });
        }
        return memo;
      }
    ),
    {
      target: containerRef,
      axis: "x",
      filterTaps: true,
      preventDefault: true, // Prevent default to avoid image ghosting/selection
      // threshold: 5, // Optional drag threshold
    }
  );

  // --- Keyboard handler (Callback) ---
  const handleKeyDown = useCallback(
    (e) => {
      if (isLoading || frameCount === 0) return;
      let frameChange = 0;
      if (e.key === "ArrowLeft") frameChange = -1;
      else if (e.key === "ArrowRight") frameChange = 1;
      else if (e.key === "Home") frameChange = -targetFrameRef.current;
      else if (e.key === "End")
        frameChange = frameCount - 1 - targetFrameRef.current;

      if (frameChange !== 0) {
        e.preventDefault();
        stopAutoRotate(); // Stops GSAP rotation too
        setIsInteracting(false); // Ensure interaction state is false

        targetFrameRef.current += frameChange; // Update precise target
        const nextVisualFrame =
          (Math.round(targetFrameRef.current % frameCount) + frameCount) %
          frameCount;

        if (
          imageLoadingStatusRef.current[nextVisualFrame] !== "loaded" &&
          imageLoadingStatusRef.current[nextVisualFrame] !== "loading"
        ) {
          loadImage(nextVisualFrame);
        }
        if (imageLoadingStatusRef.current[nextVisualFrame] === "loaded") {
          setCurrentVisualFrame(nextVisualFrame); // Update visual state
        }
        preloadNeighbors(nextVisualFrame);
        log("Keyboard Interaction", {
          key: e.key,
          target: targetFrameRef.current,
          visual: nextVisualFrame,
        });
        requestAnimationFrame(drawCanvas);
        // Restart auto-rotate after a delay
        if (autoRotate && zoomState <= minZoom && !isLoading)
          setTimeout(startAutoRotate, 150);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetView();
      }
    },
    [
      isLoading,
      frameCount,
      stopAutoRotate,
      loadImage,
      preloadNeighbors,
      log,
      drawCanvas,
      autoRotate,
      zoomState,
      minZoom,
      startAutoRotate,
      resetView,
      currentVisualFrame,
    ]
  );

  // --- Cursor Handlers (Callbacks) ---
  const handleMouseMoveForCursor = useCallback(
    (e) => {
      if (useCustomCursor && containerRef.current && customCursorRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        customCursorRef.current.style.transform = `translate(${x}px, ${y}px) translateZ(0)`;
      }
    },
    [useCustomCursor]
  );

  const handleMouseEnter = useCallback(() => {
    if (useCustomCursor && !isLoading) setIsCursorVisible(true);
  }, [useCustomCursor, isLoading]);

  const handleMouseLeave = useCallback(() => {
    if (useCustomCursor) setIsCursorVisible(false);
    // We use the `bindGestures` `last` property now, so less need for this,
    // but keep it as a safety net if mouse leaves window unexpectedly mid-drag.
    // Consider if needed based on testing.
    // if (interactionStateRef.current.isDragging) {
    //     handleInteractionEnd();
    // }
  }, [useCustomCursor /*, handleInteractionEnd */]);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true;
    log("Component Mounted");
    setDevicePixelRatioState(window.devicePixelRatio || 1); // Initial DPR
    return () => {
      isMountedRef.current = false;
      log("Component Unmounting");
      stopAutoRotate();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (gsapAnimationRef.current) gsapAnimationRef.current.kill();
    };
  }, [log, stopAutoRotate]); // Include stable callbacks

  useEffect(() => {
    // Image Loading Trigger Effect
    if (
      !modelSlug ||
      !currentColorSlug ||
      !currentSizeLabel ||
      frameCount <= 0
    ) {
      setIsLoading(true);
      setLoadingError("Missing model, color, size, or frameCount.");
      return;
    }
    log(
      `Load Trigger: ${modelSlug}, ${currentColorSlug}, ${currentSizeLabel}, ${frameCount}`
    );

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingError(null);
    imageElementsRef.current = new Array(frameCount).fill(null);
    imageLoadingStatusRef.current = {};

    const urls = generateImageUrls(
      frameCount,
      currentSizeLabel,
      modelSlug,
      currentColorSlug
    );
    imageUrlsRef.current = urls;

    if (urls.length === 0) {
      setLoadingError("Generated 0 image URLs.");
      setIsLoading(false);
      return;
    }

    const initialVisualFrame =
      (Math.round(initialFrame % frameCount) + frameCount) % frameCount;
    targetFrameRef.current = initialFrame;
    setCurrentVisualFrame(initialVisualFrame);

    // Load initial batch
    const indicesToLoad = [initialVisualFrame];
    const numToLoad = Math.min(10, frameCount);
    for (let i = 1; indicesToLoad.length < numToLoad; i++) {
      const nextI = (initialVisualFrame + i + frameCount) % frameCount;
      const prevI = (initialVisualFrame - i + frameCount) % frameCount;
      if (!indicesToLoad.includes(nextI)) indicesToLoad.push(nextI);
      if (indicesToLoad.length < numToLoad && !indicesToLoad.includes(prevI))
        indicesToLoad.push(prevI);
    }
    log("Loading initial batch:", indicesToLoad);
    indicesToLoad.forEach(loadImage);

    // Start Timeout
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        setLoadingError(`Loading timeout (${loadingProgress}% loaded)`);
        setIsLoading(false);
        log("Loading Timeout!");
      }
    }, loadingTimeout);

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [
    modelSlug,
    currentColorSlug,
    currentSizeLabel,
    frameCount,
    initialFrame,
    loadImage,
    log,
    loadingTimeout,
  ]); // Re-run if these change

  useEffect(() => {
    // Canvas Size Observer
    const cont = containerRef.current;
    const observer = new ResizeObserver(() => {
      if (cont && isMountedRef.current) {
        setCanvasSize({ width: cont.clientWidth, height: cont.clientHeight });
      }
    });
    if (cont) {
      setCanvasSize({ width: cont.clientWidth, height: cont.clientHeight }); // Initial size
      observer.observe(cont);
    }
    return () => {
      if (cont) observer.unobserve(cont);
      observer.disconnect();
    };
  }, []); // Run once

  useEffect(() => {
    // DPR Change Listener
    const updateDpr = () => {
      if (isMountedRef.current)
        setDevicePixelRatioState(window.devicePixelRatio || 1);
    };
    const mediaMatcher = window.matchMedia(
      `(resolution: ${devicePixelRatioState}dppx)`
    );
    mediaMatcher.addEventListener("change", updateDpr);
    updateDpr(); // Initial check
    return () => mediaMatcher.removeEventListener("change", updateDpr);
  }, [devicePixelRatioState]);

  useEffect(() => {
    // Drawing Effect - triggered by state changes
    if (!isLoading) {
      requestAnimationFrame(drawCanvas); // Use requestAnimationFrame for smoother rendering
    }
  }, [
    currentVisualFrame,
    zoomState,
    panOffsetState,
    canvasSize,
    devicePixelRatioState,
    isLoading,
    drawCanvas,
  ]);

  useEffect(() => {
    // Keyboard Listener
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    // Custom Cursor Listeners
    const cont = containerRef.current;
    if (useCustomCursor && cont) {
      cont.addEventListener("mouseenter", handleMouseEnter);
      cont.addEventListener("mouseleave", handleMouseLeave);
      cont.addEventListener("mousemove", handleMouseMoveForCursor);
      return () => {
        cont.removeEventListener("mouseenter", handleMouseEnter);
        cont.removeEventListener("mouseleave", handleMouseLeave);
        cont.removeEventListener("mousemove", handleMouseMoveForCursor);
      };
    }
  }, [
    useCustomCursor,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMoveForCursor,
  ]);

  useEffect(() => {
    // Auto-Rotate Control Effect
    if (autoRotate && !isLoading && !isInteracting && zoomState <= minZoom) {
      startAutoRotate();
    } else {
      stopAutoRotate();
    }
    // Cleanup is handled by stopAutoRotate or main unmount effect
  }, [
    autoRotate,
    isLoading,
    isInteracting,
    zoomState,
    minZoom,
    startAutoRotate,
    stopAutoRotate,
  ]);

  // --- Styles (Memoized) ---
  const containerComputedStyle = useMemo(
    () => ({
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      backgroundColor,
      cursor: useCustomCursor
        ? "none"
        : isLoading
        ? "wait"
        : isInteracting
        ? "grabbing"
        : "grab",
      touchAction: "pan-y",
      userSelect: "none",
      WebkitUserSelect: "none",
    }),
    [backgroundColor, useCustomCursor, isLoading, isInteracting]
  );

  const canvasComputedStyle = useMemo(
    () => ({
      display: "block",
      width: "100%",
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 1,
      filter:
        isLoading && loadingProgress < 100 ? "blur(4px) opacity(0.7)" : "none",
      transition: "filter 0.4s ease-out",
      willChange: "transform, filter",
    }),
    [isLoading, loadingProgress]
  );

  const loadingOverlayStyle = useMemo(
    () => ({
      /* ... as before ... */
    }),
    [isLoading]
  );
  const progressTextStyle = useMemo(
    () => ({
      /* ... as before ... */
    }),
    []
  );
  const progressBarContainerStyle = useMemo(
    () => ({
      /* ... as before ... */
    }),
    []
  );
  const progressBarStyle = useMemo(
    () => ({
      /* ... as before ... */
    }),
    [loadingProgress]
  );
  const errorOverlayStyle = useMemo(
    () => ({
      /* ... as before ... */
    }),
    []
  );
  const customCursorComputedStyle = useMemo(
    () => ({
      /* ... as before ... */
    }),
    [cursorSize, cursorBgColor, cursorTextColor, cursorFont, isCursorVisible]
  );

  // --- Render ---
  const sectionTitleText = sectionTitleOverride || "Vehicle Overview";
  const sectionSubtitleText = sectionSubtitleOverride || "Drag to Interact";

  // Add a check for essential data needed to render the turntable
  if (!modelSlug || !initialColorSlug || frameCount <= 0) {
    return (
      <section
        className={cn(
          "relative py-16 md:py-24 bg-gray-100 dark:bg-neutral-900 text-foreground",
          className
        )}
      >
        <div className="container mx-auto px-4 h-[60vh] flex items-center justify-center text-center">
          <p className="text-destructive font-semibold">
            Configurator cannot be displayed. <br />
            Missing essential vehicle data (model, color, or frame count).{" "}
            <br />
            Please check Sanity configuration for Product ID:{" "}
            {productContext?.id}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative py-16 md:py-24 bg-gray-100 dark:bg-neutral-900 text-foreground",
        className
      )}
    >
      {(sectionTitleText || sectionSubtitleText) && (
        <div className="absolute inset-x-0 top-16 md:top-24 z-10 pointer-events-none">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              {sectionTitleText && (
                <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 text-foreground">
                  {sectionTitleText}
                </h2>
              )}
              {sectionSubtitleText && (
                <p className="text-lg md:text-xl text-muted-foreground">
                  {sectionSubtitleText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={containerComputedStyle}
        className="w-full h-[60vh] md:h-[80vh] lg:h-[70vh] min-h-[400px] md:min-h-[500px] relative" // Use Tailwind for sizing
        {...bindGestures()} // Spread gesture handlers
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={useCustomCursor ? handleMouseMoveForCursor : undefined}
        // Add wheel handler if needed: onWheel={allowZoom && !isLoading ? handleWheel : undefined}
        role="img"
        aria-label="3D Turntable Viewer"
        aria-busy={isLoading}
        tabIndex={0} // Make focusable
      >
        <canvas ref={canvasRef} style={canvasComputedStyle} />

        {useCustomCursor && (
          <motion.div
            ref={customCursorRef}
            style={customCursorComputedStyle}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isCursorVisible ? 1 : 0,
              opacity: isCursorVisible ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {cursorText}
          </motion.div>
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loader"
              style={loadingOverlayStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={progressTextStyle}>Loading {loadingProgress}%</div>
              <div style={progressBarContainerStyle}>
                <div style={progressBarStyle}></div>
              </div>
              {loadingError && (
                <p
                  style={{
                    color: "#cc0000",
                    marginTop: "10px",
                    fontSize: "12px",
                  }}
                >
                  {loadingError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && loadingError && (
          <div style={errorOverlayStyle}>
            <p>{loadingError}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// --- PropTypes ---
ConfiguratorSection.propTypes = {
  block: PropTypes.shape({
    // Optional override fields from the Sanity block
    sectionTitleOverride: PropTypes.string,
    sectionSubtitleOverride: PropTypes.string,
    initialFrameOverride: PropTypes.number,
    autoRotateOverride: PropTypes.bool,
    backgroundColor: PropTypes.string,
    imageFit: PropTypes.oneOf(["contain", "fill"]),
    dragSensitivity: PropTypes.number,
    allowZoom: PropTypes.bool,
    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,
    zoomSensitivity: PropTypes.number,
    resetDoubleClickDelay: PropTypes.number,
    autoRotate: PropTypes.bool,
    autoRotateSpeed: PropTypes.number,
    autoRotateDirection: PropTypes.oneOf(["clockwise", "counterclockwise"]),
    loadingTimeout: PropTypes.number,
    useCustomCursor: PropTypes.bool,
    cursorSize: PropTypes.number,
    cursorBgColor: PropTypes.string,
    cursorTextColor: PropTypes.string,
    cursorText: PropTypes.string,
    cursorFont: PropTypes.string,
    debugMode: PropTypes.bool,
    className: PropTypes.string, // Allow passing className
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }), // Block itself can be optional if defaults are sufficient
  productContext: PropTypes.shape({
    relatedVehicle: PropTypes.shape({
      slug: PropTypes.string, // Expecting model slug (e.g., "km3000")
      colors: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string, // e.g., "Glossy Red"
          isDefault: PropTypes.bool,
        })
      ),
      frameCount: PropTypes.number, // ** Required **
    }),
  }).isRequired,
};
