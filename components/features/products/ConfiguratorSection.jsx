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
import { useDrag } from "@use-gesture/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { InertiaPlugin } from "gsap/InertiaPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(InertiaPlugin);
}

const MIN_VELOCITY_THRESHOLD = 0.01;
const PRELOAD_WINDOW = 5; // Number of images to preload on either side of current
const FRAME_COUNT_DEFAULT = 72; // A more common default for turntables

const slugify = (
  text // Already present in your code
) =>
  text
    ? text
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
    : "";

const generateImageUrls = (count, size, modelSlug, colorSlug) => {
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
  const prefix = `${modelSlug}_${colorSlug}_`; // Assuming this prefix convention
  const suffix = `_${size}.avif`;
  for (let i = 1; i <= count; i++) {
    urls.push(`${baseUrl}${prefix}${String(i).padStart(3, "0")}${suffix}`);
  }
  return urls;
};

export default function ConfiguratorSection({ block, productContext }) {
  const {
    modelCode, // From block
    frameCount: frameCountFromBlock, // From block
    colors: colorsFromBlock = [], // From block
    sectionTitle: blockSectionTitle, // From block (was sectionTitleOverride)
    sectionSubtitle: blockSectionSubtitle, // From block (was sectionSubtitleOverride)
    initialFrameOverride, // Optional override from block props
    autoRotateOverride, // Optional override
    className, // For section styling
    // Other potential block-specific display props
    backgroundColor = "transparent",
    imageFit = "contain",
    dragSensitivity = 1.2,
    resetDoubleClickDelay = 300,
    autoRotate: autoRotateFromBlock = false, // autoRotate setting from block itself
    autoRotateSpeed = 0.3,
    autoRotateDirection = "clockwise",
    loadingTimeout = 45000,
    useCustomCursor = true,
    cursorSize = 60,
    cursorBgColor = "rgba(50, 50, 50, 0.9)",
    cursorTextColor = "#FFFFFF",
    cursorText = "DRAG",
    cursorFont = "600 12px 'Geist', sans-serif", // Ensure Geist is loaded or use system
    debugMode = false,
  } = block || {};

  const frameCount = frameCountFromBlock || FRAME_COUNT_DEFAULT;
  const autoRotate = autoRotateOverride ?? autoRotateFromBlock; // Prioritize override

  const defaultColorFromBlock = useMemo(
    () => colorsFromBlock.find((c) => c.isDefault) || colorsFromBlock[0],
    [colorsFromBlock]
  );

  // `defaultColorFromBlock.slug` should already be the resolved string from GROQ
  const initialColorSlug = useMemo(
    () => defaultColorFromBlock?.slug,
    [defaultColorFromBlock]
  );

  const isLg = useMediaQuery("(min-width: 1601px)");
  const isMd = useMediaQuery("(min-width: 1025px) and (max-width: 1600px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const currentSizeLabel = useMemo(() => {
    if (isLg) return "lg";
    if (isMd) return "md";
    if (isTablet) return "tablet";
    return "phone";
  }, [isLg, isMd, isTablet]);

  const [currentVisualFrame, setCurrentVisualFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [devicePixelRatioState, setDevicePixelRatioState] = useState(1);
  const [currentColorSlug, setCurrentColorSlug] = useState(initialColorSlug); // Initialized with resolved slug

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const customCursorRef = useRef(null);
  const imageElementsRef = useRef([]);
  const imageLoadingStatusRef = useRef({});
  const imageUrlsRef = useRef([]);
  const lastClickTimeRef = useRef(0);
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(false);
  const targetFrameRef = useRef(initialFrameOverride ?? 0);
  const gsapAnimationRef = useRef(null);

  const { contextSafe } = useGSAP(() => {}, { scope: containerRef });

  const log = useCallback(
    (...args) => {
      if (debugMode) console.log("[Configurator]", ...args);
    },
    [debugMode]
  );

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
        // Do not set error here if some images loaded, allow user to interact
        // setLoadingError(`Failed to load ${errored} image(s).`);
      }
    }
  }, [log, loadingError]); // Removed frameCount from deps

  const loadImage = useCallback(
    (index) => {
      if (
        !isMountedRef.current ||
        index < 0 ||
        index >= frameCount || // Use the actual frameCount
        !imageUrlsRef.current[index]
      ) {
        return;
      }
      const status = imageLoadingStatusRef.current[index];
      if (status === "loaded" || status === "loading") {
        return;
      }

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
        // Don't set global error if only a few frames fail.
        // setLoadingError((prev) => prev || `Error loading image ${index}.`);
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

      if (imageFit === "contain") {
        if (imgAspect > canvasAspect) {
          drawWidth = canvasWidth;
          drawHeight = drawWidth / imgAspect;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvasWidth - drawWidth) / 2;
        }
      } else {
        // imageFit === 'cover' or default
        if (imgAspect < canvasAspect) {
          drawWidth = canvasWidth;
          drawHeight = drawWidth / imgAspect;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvasWidth - drawWidth) / 2;
        }
      }
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
      if (
        imageLoadingStatusRef.current[displayFrameIndex] !== "loaded" &&
        imageLoadingStatusRef.current[displayFrameIndex] !== "loading"
      ) {
        loadImage(displayFrameIndex); // Attempt to load if missing
      }
    }
  }, [
    canvasSize,
    devicePixelRatioState,
    currentVisualFrame,
    frameCount,
    imageFit,
    isLoading,
    loadImage,
  ]);

  const stopAutoRotate = useCallback(() => {
    if (gsapAnimationRef.current) {
      gsapAnimationRef.current.kill();
      gsapAnimationRef.current = null;
      log("Stopped GSAP auto-rotate");
    }
    setIsInteracting(false);
  }, [log]);

  const startAutoRotate = useCallback(
    contextSafe(() => {
      if (
        !autoRotate ||
        gsapAnimationRef.current ||
        isLoading ||
        isInteracting
      ) {
        stopAutoRotate();
        return;
      }
      log("Starting GSAP auto-rotate");
      stopAutoRotate();

      const frameStep = autoRotateDirection === "clockwise" ? 1 : -1;
      const rotationSpeedFactor = Math.max(0.1, autoRotateSpeed);
      const durationPerRevolution = frameCount / (rotationSpeedFactor * 10);

      gsapAnimationRef.current = gsap.to(targetFrameRef, {
        current: `+=${frameStep * frameCount}`,
        duration: durationPerRevolution,
        ease: "none",
        repeat: -1,
        overwrite: true,
        onUpdate: () => {
          if (!isMountedRef.current) return;
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
            loadImage(visualFrame);
          }
        },
        onInterrupt: () => {
          log("GSAP Auto-rotate interrupted");
          gsapAnimationRef.current = null;
        },
        onComplete: () => {
          gsapAnimationRef.current = null;
          if (isMountedRef.current) setIsInteracting(false);
        },
      });
    }),
    [
      autoRotate,
      isLoading,
      isInteracting,
      frameCount,
      autoRotateDirection,
      autoRotateSpeed,
      stopAutoRotate,
      log,
      currentVisualFrame,
      loadImage,
      preloadNeighbors,
    ]
  );

  const resetView = useCallback(() => {
    log("Resetting view");
    stopAutoRotate();
    const initialVisual =
      (Math.round((initialFrameOverride ?? 0) % frameCount) + frameCount) %
      frameCount;
    targetFrameRef.current = initialFrameOverride ?? 0;
    setCurrentVisualFrame(initialVisual);
    setIsInteracting(false);
    requestAnimationFrame(drawCanvas);
    if (autoRotate && !isLoading) setTimeout(startAutoRotate, 100);
  }, [
    initialFrameOverride,
    frameCount,
    autoRotate,
    log,
    stopAutoRotate,
    drawCanvas,
    startAutoRotate,
    isLoading,
  ]);

  const bindGestures = useDrag(
    contextSafe(
      ({ event, first, last, movement: [mx], velocity: [vx], memo }) => {
        if (isLoading || !canvasRef.current || frameCount <= 0) return;
        if (first) {
          stopAutoRotate();
          setIsInteracting(true);
          memo = targetFrameRef.current;
          log("Drag Start");
        }
        const sensitivityFactor = Math.max(
          1,
          canvasSize.width > 0 ? canvasSize.width / 10 : 50
        );
        const frameDelta =
          (mx / sensitivityFactor) * dragSensitivity * frameCount;
        const newTargetFrame = memo - frameDelta;
        targetFrameRef.current = newTargetFrame;
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
            setCurrentVisualFrame(newVisualFrame);
          }
          preloadNeighbors(newVisualFrame);
        }
        requestAnimationFrame(drawCanvas);

        if (last) {
          log("Drag End - Initiating GSAP Inertia", { velocity: vx });
          if (gsapAnimationRef.current) gsapAnimationRef.current.kill();
          const inertiaVelocity = -vx * dragSensitivity * 25;
          gsapAnimationRef.current = gsap.to(targetFrameRef, {
            current: targetFrameRef.current,
            duration: 2.5,
            ease: "power1.out",
            inertia: { current: { velocity: inertiaVelocity } },
            onUpdate: () => {
              if (!isMountedRef.current) return;
              setIsInteracting(true);
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
                loadImage(visualFrame);
              }
              requestAnimationFrame(drawCanvas);
            },
            onComplete: () => {
              log("GSAP Inertia Complete");
              if (isMountedRef.current) setIsInteracting(false);
              gsapAnimationRef.current = null;
              if (autoRotate && !isLoading) startAutoRotate();
            },
            onInterrupt: () => {
              log("GSAP Inertia Interrupted");
              if (isMountedRef.current) setIsInteracting(true);
              gsapAnimationRef.current = null;
            },
          });
        }
        return memo;
      }
    ),
    { target: containerRef, axis: "x", filterTaps: true, preventDefault: true }
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (isLoading || frameCount === 0) return;
      let frameChange = 0;
      if (e.key === "ArrowLeft") frameChange = -1;
      else if (e.key === "ArrowRight") frameChange = 1;
      // Home and End keys can be tricky with precise frame counts, adjust if needed
      else if (e.key === "Home")
        frameChange = -Math.round(targetFrameRef.current % frameCount);
      else if (e.key === "End")
        frameChange =
          frameCount - 1 - Math.round(targetFrameRef.current % frameCount);

      if (frameChange !== 0) {
        e.preventDefault();
        stopAutoRotate();
        setIsInteracting(false);
        targetFrameRef.current += frameChange;
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
          setCurrentVisualFrame(nextVisualFrame);
        }
        preloadNeighbors(nextVisualFrame);
        log("Keyboard Interaction", {
          key: e.key,
          target: targetFrameRef.current,
          visual: nextVisualFrame,
        });
        requestAnimationFrame(drawCanvas);
        if (autoRotate && !isLoading) setTimeout(startAutoRotate, 150);
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
      startAutoRotate,
      resetView,
      currentVisualFrame,
    ]
  );

  const handleMouseMoveForCursor = useCallback(
    (e) => {
      if (useCustomCursor && containerRef.current && customCursorRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        customCursorRef.current.style.transform = `translate(${
          e.clientX - r.left
        }px, ${e.clientY - r.top}px) translateZ(0)`;
      }
    },
    [useCustomCursor]
  );
  const handleMouseEnter = useCallback(() => {
    if (useCustomCursor && !isLoading) setIsCursorVisible(true);
  }, [useCustomCursor, isLoading]);
  const handleMouseLeave = useCallback(() => {
    if (useCustomCursor) setIsCursorVisible(false);
  }, [useCustomCursor]);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true;
    log("Component Mounted");
    setDevicePixelRatioState(window.devicePixelRatio || 1);
    return () => {
      isMountedRef.current = false;
      log("Component Unmounting");
      stopAutoRotate();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (gsapAnimationRef.current) gsapAnimationRef.current.kill();
    };
  }, [log, stopAutoRotate]);

  useEffect(() => {
    if (
      !modelCode ||
      !currentColorSlug ||
      !currentSizeLabel ||
      frameCount <= 0
    ) {
      setIsLoading(true);
      const errorContextId =
        productContext?.id || block?._key || "current item";
      setLoadingError(
        `Configurator Error: Missing essential data (modelCode, colorSlug, sizeLabel, or frameCount). Product/Block ID: ${errorContextId}. Please check Sanity data. modelCode: ${modelCode}, currentColorSlug: ${currentColorSlug}, currentSizeLabel: ${currentSizeLabel}, frameCount: ${frameCount}`
      );
      return;
    }
    log(
      `Load Trigger: ${modelCode}, ${currentColorSlug}, ${currentSizeLabel}, ${frameCount}`
    );
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingError(null);
    imageElementsRef.current = new Array(frameCount).fill(null);
    imageLoadingStatusRef.current = {};
    const urls = generateImageUrls(
      frameCount,
      currentSizeLabel,
      modelCode,
      currentColorSlug
    );
    imageUrlsRef.current = urls;

    if (urls.length === 0 || urls.length !== frameCount) {
      setLoadingError(
        `Generated ${urls.length} image URLs, but expected ${frameCount}. Check modelCode ('${modelCode}'), colorSlug ('${currentColorSlug}'), and image storage.`
      );
      setIsLoading(false);
      return;
    }

    const effectiveInitialFrame = initialFrameOverride ?? 0;
    const initialVisualFrame =
      (Math.round(effectiveInitialFrame % frameCount) + frameCount) %
      frameCount;
    targetFrameRef.current = effectiveInitialFrame;
    setCurrentVisualFrame(initialVisualFrame);

    const indicesToLoad = [initialVisualFrame];
    const numToLoad = Math.min(10, frameCount);
    for (
      let i = 1;
      indicesToLoad.length < numToLoad && i < frameCount / 2;
      i++
    ) {
      const nextI = (initialVisualFrame + i + frameCount) % frameCount;
      const prevI = (initialVisualFrame - i + frameCount) % frameCount;
      if (!indicesToLoad.includes(nextI)) indicesToLoad.push(nextI);
      if (indicesToLoad.length < numToLoad && !indicesToLoad.includes(prevI))
        indicesToLoad.push(prevI);
    }
    log("Loading initial batch:", indicesToLoad);
    indicesToLoad.forEach(loadImage);

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
    modelCode,
    currentColorSlug,
    currentSizeLabel,
    frameCount,
    initialFrameOverride,
    loadImage,
    log,
    loadingTimeout,
    productContext?.id,
    block?._key,
  ]);

  useEffect(() => {
    const cont = containerRef.current;
    const observer = new ResizeObserver(() => {
      if (cont && isMountedRef.current)
        setCanvasSize({ width: cont.clientWidth, height: cont.clientHeight });
    });
    if (cont) {
      setCanvasSize({ width: cont.clientWidth, height: cont.clientHeight });
      observer.observe(cont);
    }
    return () => {
      if (cont) observer.unobserve(cont);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateDpr = () => {
      if (isMountedRef.current)
        setDevicePixelRatioState(window.devicePixelRatio || 1);
    };
    const mediaMatcher = window.matchMedia(
      `(resolution: ${devicePixelRatioState}dppx)`
    );
    mediaMatcher.addEventListener("change", updateDpr);
    updateDpr();
    return () => mediaMatcher.removeEventListener("change", updateDpr);
  }, [devicePixelRatioState]);

  useEffect(() => {
    if (!isLoading) requestAnimationFrame(drawCanvas);
  }, [
    currentVisualFrame,
    canvasSize,
    devicePixelRatioState,
    isLoading,
    drawCanvas,
  ]);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  useEffect(() => {
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
    if (autoRotate && !isLoading && !isInteracting) {
      startAutoRotate();
    } else {
      stopAutoRotate();
    }
  }, [autoRotate, isLoading, isInteracting, startAutoRotate, stopAutoRotate]);

  // --- Styles (Memoized or Inline) ---
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

  const sectionTitleText = blockSectionTitle || "360° View";
  const sectionSubtitleText =
    blockSectionSubtitle || "Drag to explore the vehicle";

  // --- Color Selector UI (Example) ---
  const renderColorSelector = () => {
    if (!colorsFromBlock || colorsFromBlock.length <= 1) return null;
    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2 p-2 bg-neutral-800/70 dark:bg-black/70 backdrop-blur-sm rounded-full shadow-lg">
        {colorsFromBlock.map((color) => (
          <button
            key={color._key || color.slug}
            title={color.name || color.slug}
            onClick={() => {
              if (color.slug && color.slug !== currentColorSlug) {
                log(`Color changed to: ${color.slug}`);
                setCurrentColorSlug(color.slug);
                // Reset frame to initial or 0 when color changes
                targetFrameRef.current = initialFrameOverride ?? 0;
                setCurrentVisualFrame(
                  (Math.round(targetFrameRef.current % frameCount) +
                    frameCount) %
                    frameCount
                );
                // Image loading will be triggered by useEffect watching currentColorSlug
              }
            }}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800",
              currentColorSlug === color.slug
                ? "border-white ring-2 ring-primary"
                : "border-transparent hover:border-neutral-400"
            )}
            style={{ backgroundColor: color.colorValue || "#ccc" }} // Use resolved hex color
            aria-label={`Select color ${color.name || color.slug}`}
            aria-pressed={currentColorSlug === color.slug}
          >
            {/* Optional: Inner contrasting dot for visibility */}
            {/* {currentColorSlug === color.slug && <span className="block w-2 h-2 rounded-full bg-white/70 m-auto"></span>} */}
          </button>
        ))}
      </div>
    );
  };

  if (!modelCode || !initialColorSlug || frameCount <= 0) {
    const errorContextId = productContext?.id || block?._key || "current item";
    return (
      <section
        className={cn(
          "relative py-16 md:py-24 bg-gray-100 dark:bg-neutral-900 text-foreground",
          className
        )}
      >
        <div className="container mx-auto px-4 h-[60vh] flex items-center justify-center text-center">
          <div>
            <p className="text-destructive font-semibold text-lg mb-2">
              Configurator Error
            </p>
            <p className="text-muted-foreground">
              Cannot display the 360° view for "
              {productContext?.title || "this product"}".
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Missing essential configuration data. Please verify settings in
              Sanity for product/block ID: {errorContextId}.<br />
              Needed: Model Code, Initial Color Slug, Frame Count.
              <br />
              Current: MC: '{modelCode || "N/A"}', ICS: '
              {initialColorSlug || "N/A"}', FC: '{frameCount || "N/A"}'
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative py-12 md:py-20 bg-neutral-100 dark:bg-neutral-900 text-foreground overflow-hidden",
        className
      )}
    >
      {(sectionTitleText || sectionSubtitleText) && (
        <div className="container mx-auto px-4 text-center mb-8 md:mb-12">
          {sectionTitleText && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-2">
              {sectionTitleText}
            </h2>
          )}
          {sectionSubtitleText && (
            <p className="text-md md:text-lg text-muted-foreground max-w-xl mx-auto">
              {sectionSubtitleText}
            </p>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        style={containerComputedStyle}
        className="w-full h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-[80vh] xl:h-[calc(100vh-200px)] max-h-[800px] min-h-[350px] md:min-h-[450px] relative mx-auto" // Sizing classes
        {...bindGestures()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={useCustomCursor ? handleMouseMoveForCursor : undefined}
        role="img"
        aria-label="3D Turntable Viewer"
        aria-busy={isLoading}
        tabIndex={0}
      >
        <canvas ref={canvasRef} style={canvasComputedStyle} />

        {useCustomCursor && (
          <motion.div
            ref={customCursorRef}
            className="fixed top-0 left-0 pointer-events-none z-50 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              width: cursorSize,
              height: cursorSize,
              backgroundColor: cursorBgColor,
              color: cursorTextColor,
              font: cursorFont,
              translateX: "-50%",
              translateY: "-50%", // Center cursor on mouse
            }}
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
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-100/80 dark:bg-neutral-900/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Loading {loadingProgress}%
              </div>
              <div className="w-40 h-2 bg-neutral-300 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              {loadingError && (
                <p className="text-destructive text-xs mt-3 text-center px-4">
                  {loadingError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && loadingError && (
          // Show persistent error if loading finished but errors occurred (e.g., some images failed)
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-destructive/10 p-4 text-center">
            <p className="text-destructive-foreground font-medium">
              Display issues encountered
            </p>
            <p className="text-destructive-foreground/80 text-sm">
              {loadingError}
            </p>
          </div>
        )}
        {renderColorSelector()}
      </div>
    </section>
  );
}

ConfiguratorSection.propTypes = {
  block: PropTypes.shape({
    modelCode: PropTypes.string.isRequired,
    frameCount: PropTypes.number, // Not strictly required if default used
    colors: PropTypes.arrayOf(
      PropTypes.shape({
        _key: PropTypes.string,
        name: PropTypes.string,
        slug: PropTypes.string.isRequired,
        colorValue: PropTypes.string,
        isDefault: PropTypes.bool,
      })
    ),
    sectionTitle: PropTypes.string,
    sectionSubtitle: PropTypes.string,
    initialFrameOverride: PropTypes.number,
    autoRotateOverride: PropTypes.bool,
    autoRotate: PropTypes.bool, // Added to block schema
    // ... other props
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
    className: PropTypes.string,
  }).isRequired,
  productContext: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    slug: PropTypes.string,
  }),
};
