// components/features/products/turntable/ConfiguratorSection.jsx
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
import { Checkmark, Information } from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Leva, useControls, folder } from "leva";

import { useProgressiveImageLoader } from "@/hooks/useProgressiveImageLoader";
import { useTurntableControls as useTurntableControlsGSAP } from "@/hooks/useTurntableControls";
import { useTurntableControlsFramer } from "@/hooks/useTurntableControlsFramer";
import { useCanvasRenderer } from "@/hooks/useCanvasRenderer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(InertiaPlugin);
}

const DEBUG_COMPONENT = true;

const PHYSICS_PRESETS_GSAP = {
  default: {
    dragSensitivity: 1.8,
    flickBoost: 2.5,
    inertiaResistance: 180,
  },
};
const ACTIVE_GSAP_PHYSICS_PRESET = PHYSICS_PRESETS_GSAP.default;
const FRAMES_TO_USE = 360;

const POPMOTION_DEFAULTS = {
  dragFactor: 15,
  flickBoost: 1,
  decayPower: 0.4,
  decayTimeConstant: 520,
  decayRestDelta: 0.5,
};

export default function ConfiguratorSection({ block, productContext }) {
  const {
    modelCode,
    colors: colorsFromBlock = [],
    sectionTitle: blockSectionTitle,
    sectionSubtitle: blockSectionSubtitle,
    className,
    backgroundColor = "bg-white dark:bg-neutral-950",
    imageFit = "cover",
    initialFrameOverride = block?.initialFrameOverride ?? 0,
  } = block || {};

  const frameCount = FRAMES_TO_USE || block?.frameCount || 72;

  const {
    animationLibrary,
    gsapDragSensitivity,
    gsapFlickBoost,
    gsapInertiaResistance,
    popmotionDragFactor,
    popmotionFlickBoost,
    decayPower,
    decayTimeConstant,
    decayRestDelta,
    showLevaControls,
  } = useControls(
    "Turntable Physics",
    {
      showLevaControls: {
        value: process.env.NODE_ENV === "development",
        label: "Show Dev Controls",
      },
      animationLibrary: {
        value: "POPMOTION",
        options: ["POPMOTION", "GSAP"],
        label: "Animation Library",
        render: (get) => get("Turntable Physics.showLevaControls"),
      },
      GSAP: folder(
        {
          gsapDragSensitivity: {
            value: ACTIVE_GSAP_PHYSICS_PRESET.dragSensitivity,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: "Drag Sensitivity",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "GSAP" &&
              get("Turntable Physics.showLevaControls"),
          },
          gsapFlickBoost: {
            value: ACTIVE_GSAP_PHYSICS_PRESET.flickBoost,
            min: 0.1,
            max: 10,
            step: 0.1,
            label: "Flick Boost",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "GSAP" &&
              get("Turntable Physics.showLevaControls"),
          },
          gsapInertiaResistance: {
            value: ACTIVE_GSAP_PHYSICS_PRESET.inertiaResistance,
            min: 10,
            max: 500,
            step: 10,
            label: "Inertia Resistance",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "GSAP" &&
              get("Turntable Physics.showLevaControls"),
          },
        },
        {
          collapsed: true, // Start GSAP folder collapsed
          render: (get) =>
            get("Turntable Physics.animationLibrary") === "GSAP" &&
            get("Turntable Physics.showLevaControls"),
        }
      ),
      Popmotion: folder(
        {
          popmotionDragFactor: {
            value: POPMOTION_DEFAULTS.dragFactor,
            min: 0.5,
            max: 20,
            step: 0.1,
            label: "Drag Factor (Higher=Less Sens)",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "POPMOTION" &&
              get("Turntable Physics.showLevaControls"),
          },
          popmotionFlickBoost: {
            value: POPMOTION_DEFAULTS.flickBoost,
            min: 1,
            max: 100,
            step: 1,
            label: "Flick Boost",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "POPMOTION" &&
              get("Turntable Physics.showLevaControls"),
          },
          decayPower: {
            value: POPMOTION_DEFAULTS.decayPower,
            min: 0.1,
            max: 1,
            step: 0.05,
            label: "Decay Power",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "POPMOTION" &&
              get("Turntable Physics.showLevaControls"),
          },
          decayTimeConstant: {
            value: POPMOTION_DEFAULTS.decayTimeConstant,
            min: 50,
            max: 1000,
            step: 10,
            label: "Decay Time Constant",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "POPMOTION" &&
              get("Turntable Physics.showLevaControls"),
          },
          decayRestDelta: {
            value: POPMOTION_DEFAULTS.decayRestDelta,
            min: 0.01,
            max: 2,
            step: 0.01,
            label: "Decay Rest Delta",
            render: (get) =>
              get("Turntable Physics.animationLibrary") === "POPMOTION" &&
              get("Turntable Physics.showLevaControls"),
          },
        },
        {
          collapsed: false, // Start Popmotion folder open
          render: (get) =>
            get("Turntable Physics.animationLibrary") === "POPMOTION" &&
            get("Turntable Physics.showLevaControls"),
        }
      ),
    },
    {
      collapsed: process.env.NODE_ENV === "production", // Main panel collapsed in prod
      render: (get) => get("Turntable Physics.showLevaControls"),
    }
  );

  const log = useCallback((...args) => {
    if (DEBUG_COMPONENT) console.log("[ConfiguratorComp]", ...args);
  }, []);

  const generateImageUrls = useCallback(
    (count, size, currentModelCode, colorSlug) => {
      if (!currentModelCode || !colorSlug || !size || !count || count <= 0)
        return [];
      const urls = [];
      const baseUrl = `https://images.kabiramobility.com/processed_images/${currentModelCode}/${colorSlug}/${size}/`;
      const prefix = `${currentModelCode}_${colorSlug}_`;
      const suffix = `_${size}.avif`;
      for (let i = 1; i <= count; i++) {
        urls.push(`${baseUrl}${prefix}${String(i).padStart(3, "0")}${suffix}`);
      }
      return urls;
    },
    []
  );

  const getSlugString = useCallback((colorObj) => {
    if (!colorObj) return undefined;
    if (typeof colorObj.slug === "string") return colorObj.slug;
    return colorObj.slug?.current;
  }, []);

  const defaultColor = useMemo(
    () => colorsFromBlock.find((c) => c.isDefault) || colorsFromBlock[0],
    [colorsFromBlock]
  );

  const initialColorSlug = useMemo(() => {
    if (defaultColor) {
      const slugStr = getSlugString(defaultColor);
      if (slugStr) return slugStr;
    }
    if (colorsFromBlock.length > 0 && colorsFromBlock[0]) {
      const slugStr = getSlugString(colorsFromBlock[0]);
      if (slugStr) return slugStr;
    }
    return undefined;
  }, [colorsFromBlock, defaultColor, getSlugString]);

  const safeInitialFrame = useMemo(
    () => (initialFrameOverride + frameCount) % frameCount,
    [initialFrameOverride, frameCount]
  );

  const isLgScreen = useMediaQuery("(min-width: 1024px)");
  const isTabletScreen = useMediaQuery("(min-width: 768px)");
  const is2xl = useMediaQuery("(min-width: 1536px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isMd = useMediaQuery("(min-width: 768px)");

  const currentSizeLabel = useMemo(() => {
    if (is2xl) return "lg";
    if (isXl) return "md";
    if (isMd) return "tablet";
    return "phone";
  }, [is2xl, isXl, isMd]);

  const [currentColorSlug, setCurrentColorSlug] = useState(initialColorSlug);
  const [visualFrame, setVisualFrame] = useState(safeInitialFrame);
  const [isTurntableInteracting, setIsTurntableInteracting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [showDragHintElement, setShowDragHintElement] = useState(true);
  const [dragHintPosition, setDragHintPosition] = useState({ x: 0, y: 0 });
  const [isMouseOverTurntableArea, setIsMouseOverTurntableArea] =
    useState(false);
  const [isMouseOverColorSelector, setIsMouseOverColorSelector] =
    useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const colorSelectorContainerRef = useRef(null);

  const imageUrls = useMemo(() => {
    if (
      !modelCode ||
      !currentColorSlug ||
      !currentSizeLabel ||
      frameCount <= 0
    ) {
      return [];
    }
    return generateImageUrls(
      frameCount,
      currentSizeLabel,
      modelCode,
      currentColorSlug
    );
  }, [
    modelCode,
    currentColorSlug,
    currentSizeLabel,
    frameCount,
    generateImageUrls,
  ]);

  const {
    imageElementsRef,
    imageStatusRef,
    isLoadingInitial,
    isLoadingKeyframes,
    isFullyLoaded,
    loadedAndVisibleKeyframes,
    loadingProgress,
    loadingError,
    prioritizeLoad,
    loadPhase,
  } = useProgressiveImageLoader(imageUrls, frameCount, safeInitialFrame);
  const initialFrameActuallyLoaded = !isLoadingInitial;

  useEffect(() => {
    const currentPhysics =
      animationLibrary === "GSAP"
        ? {
            dragSensitivity: gsapDragSensitivity,
            flickBoost: gsapFlickBoost,
            inertiaResistance: gsapInertiaResistance,
          }
        : {
            dragFactor: popmotionDragFactor,
            flickBoost: popmotionFlickBoost,
            decayPower,
            decayTimeConstant,
            decayRestDelta,
          };

    log("Effective Config:", {
      modelCode,
      frameCount,
      initialColorSlug,
      safeInitialFrame,
      animationLibrary,
      ...currentPhysics,
    });
    log(
      `Image Loader: isLoadingInitial=${isLoadingInitial}, initialFrameActuallyLoaded=${initialFrameActuallyLoaded}, isLoadingKeyframes=${isLoadingKeyframes}, loadPhase=${loadPhase}, progress=${loadingProgress}%`
    );
  }, [
    modelCode,
    frameCount,
    initialColorSlug,
    safeInitialFrame,
    animationLibrary,
    gsapDragSensitivity,
    gsapFlickBoost,
    gsapInertiaResistance,
    popmotionDragFactor,
    popmotionFlickBoost,
    decayPower,
    decayTimeConstant,
    decayRestDelta,
    log,
    isLoadingInitial,
    initialFrameActuallyLoaded,
    isLoadingKeyframes,
    loadPhase,
    loadingProgress,
  ]);

  const commonTurntableOptions = useMemo(
    () => ({
      initialFrame: safeInitialFrame,
      enabled: initialFrameActuallyLoaded,
      onFrameChange: (targetPreciseFrame, isCurrentlyAnimating) => {
        setIsAnimating(isCurrentlyAnimating);
        let frameToDisplay =
          (Math.round(targetPreciseFrame % frameCount) + frameCount) %
          frameCount;
        if (
          !isCurrentlyAnimating &&
          (loadPhase === "keyframes" || loadPhase === "interactive") &&
          loadedAndVisibleKeyframes?.size > 0 &&
          !isFullyLoaded
        ) {
          let nearestKf = -1;
          let minDist = Infinity;
          loadedAndVisibleKeyframes.forEach((kfIndex) => {
            const diff = Math.abs(frameToDisplay - kfIndex);
            const dist = Math.min(diff, frameCount - diff);
            if (dist < minDist) {
              minDist = dist;
              nearestKf = kfIndex;
            }
          });
          if (nearestKf !== -1) frameToDisplay = nearestKf;
        }
        setVisualFrame(frameToDisplay);
        prioritizeLoad(
          isCurrentlyAnimating ? targetPreciseFrame : frameToDisplay,
          { isAnticipated: isCurrentlyAnimating }
        );
      },
      onInteractionStart: () => {
        setIsTurntableInteracting(true);
        setShowDragHintElement(false);
      },
      onInteractionEnd: (completed) => {
        setIsTurntableInteracting(false);
        if (!completed) setIsAnimating(false);
      },
    }),
    [
      safeInitialFrame,
      initialFrameActuallyLoaded,
      frameCount,
      loadPhase,
      loadedAndVisibleKeyframes,
      isFullyLoaded,
      prioritizeLoad,
    ]
  );

  const gsapTurntableOptions = useMemo(
    () => ({
      ...commonTurntableOptions,
      dragSensitivity: gsapDragSensitivity,
      flickBoost: gsapFlickBoost,
      inertiaResistance: gsapInertiaResistance,
    }),
    [
      commonTurntableOptions,
      gsapDragSensitivity,
      gsapFlickBoost,
      gsapInertiaResistance,
    ]
  );

  const framerPopmotionTurntableOptions = useMemo(
    () => ({
      // Renamed for clarity
      ...commonTurntableOptions,
      dragFactor: popmotionDragFactor,
      flickBoost: popmotionFlickBoost,
      decayOptions: {
        power: decayPower,
        timeConstant: decayTimeConstant,
        restDelta: decayRestDelta,
      },
    }),
    [
      commonTurntableOptions,
      popmotionDragFactor,
      popmotionFlickBoost,
      decayPower,
      decayTimeConstant,
      decayRestDelta,
    ]
  );

  const gsapControls = useTurntableControlsGSAP(
    containerRef,
    frameCount,
    gsapTurntableOptions
  );
  const framerPopmotionControls = useTurntableControlsFramer(
    containerRef,
    frameCount,
    framerPopmotionTurntableOptions
  );

  const activeControls =
    animationLibrary === "GSAP" ? gsapControls : framerPopmotionControls;
  const { setFrame: setTurntableFrame, bindGestures } = activeControls;

  useCanvasRenderer(
    canvasRef,
    imageElementsRef.current,
    imageStatusRef.current,
    visualFrame,
    frameCount,
    canvasSize,
    devicePixelRatio,
    imageFit,
    initialFrameActuallyLoaded,
    safeInitialFrame
  );

  useEffect(() => {
    const checkContainerWidth = () => {
      if (containerRef.current) {
        log(`Container Width Check: ${containerRef.current.clientWidth}px`);
      } else {
        log("Container Width Check: containerRef.current is null");
      }
    };
    checkContainerWidth();
    const timeoutId = setTimeout(checkContainerWidth, 300);
    return () => clearTimeout(timeoutId);
  }, [log]);

  useEffect(() => {
    if (!showDragHintElement || isLoadingInitial) return;
    const updateMousePosition = (event) =>
      setDragHintPosition({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [showDragHintElement, isLoadingInitial]);

  useEffect(() => {
    setDevicePixelRatio(window.devicePixelRatio || 1);
    const cont = containerRef.current;
    if (!cont) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height }); // Update state with new dimensions
      }
    });
    // Set initial size correctly based on clientWidth/Height
    setCanvasSize({ width: cont.clientWidth, height: cont.clientHeight });
    observer.observe(cont);
    const dprUpdateHandler = () =>
      setDevicePixelRatio(window.devicePixelRatio || 1);
    const dprMediaQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );

    try {
      dprMediaQuery.addEventListener("change", dprUpdateHandler);
    } catch (e) {
      dprMediaQuery.addListener(dprUpdateHandler);
    } // Fallback
    return () => {
      if (cont) observer.unobserve(cont);
      observer.disconnect();
      try {
        dprMediaQuery.removeEventListener("change", dprUpdateHandler);
      } catch (e) {
        dprMediaQuery.removeListener(dprUpdateHandler);
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  useEffect(() => {
    if (initialColorSlug && initialColorSlug !== currentColorSlug) {
      setCurrentColorSlug(initialColorSlug);
      if (setTurntableFrame) setTurntableFrame(safeInitialFrame, true);
    }
  }, [initialColorSlug, currentColorSlug, safeInitialFrame, setTurntableFrame]);

  const handleColorChange = useCallback(
    (newColorSlug) => {
      if (newColorSlug === currentColorSlug || isLoadingInitial) return;
      setShowDragHintElement(true);
      if (setTurntableFrame) setTurntableFrame(safeInitialFrame, true);
      setCurrentColorSlug(newColorSlug);
    },
    [currentColorSlug, isLoadingInitial, safeInitialFrame, setTurntableFrame]
  );

  const finalSectionTitle = blockSectionTitle || "Vehicle Overview";
  const finalSectionSubtitle = blockSectionSubtitle || "Drag to Explore";

  const dragHintOpacity = useMemo(() => {
    if (!showDragHintElement || isLoadingInitial || isMouseOverColorSelector)
      return 0;
    return isMouseOverTurntableArea ? 1 : 0;
  }, [
    showDragHintElement,
    isLoadingInitial,
    isMouseOverTurntableArea,
    isMouseOverColorSelector,
  ]);

  const mainContainerCursor = useMemo(() => {
    if (isLoadingInitial) return "wait";
    if (dragHintOpacity > 0) return "none";
    if (isTurntableInteracting || isAnimating) return "grabbing";
    return "grab";
  }, [isLoadingInitial, dragHintOpacity, isTurntableInteracting, isAnimating]);

  const renderColorSelector = () => {
    if (!colorsFromBlock || colorsFromBlock.length === 0) return null;
    const currentSelectedColorObj = colorsFromBlock.find(
      (c) => getSlugString(c) === currentColorSlug
    );
    const currentSelectedColorName =
      currentSelectedColorObj?.name || currentColorSlug;

    return (
      <div
        ref={colorSelectorContainerRef}
        onMouseEnter={() => setIsMouseOverColorSelector(true)}
        onMouseLeave={() => setIsMouseOverColorSelector(false)}
        className={cn(
          "absolute z-50 flex items-center gap-2.5",
          "bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-10 md:left-8 lg:left-16 xl:left-[64px] 2xl:left-[160px]"
        )}
      >
        <div className="p-1.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-lg shadow-xl flex items-center gap-2">
          {colorsFromBlock.map((color) => {
            const slugValue = getSlugString(color);
            if (!slugValue) return null;
            const isSelected = currentColorSlug === slugValue;
            return (
              <button
                key={color._key || slugValue}
                title={color.name || slugValue}
                onClick={() => handleColorChange(slugValue)}
                disabled={isLoadingInitial && !isSelected}
                className={cn(
                  "w-10 h-10 md:w-11 md:h-11 relative rounded-md transition-all duration-150 ease-in-out overflow-hidden",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black",
                  isSelected
                    ? "ring-2 ring-primary dark:ring-primary ring-offset-1 ring-offset-white dark:ring-offset-black shadow-md scale-110"
                    : "ring-1 ring-neutral-400 dark:ring-neutral-600 hover:ring-primary dark:hover:ring-primary hover:scale-105",
                  "disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                )}
                style={{ backgroundColor: color.colorValue || "#CCC" }}
                aria-label={`Select color ${color.name || slugValue}`}
                aria-pressed={isSelected}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Checkmark
                        size={isTabletScreen ? 20 : 18}
                        className="text-white filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
        {isLgScreen && currentSelectedColorName && (
          <div className="p-2.5 md:p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-lg shadow-xl flex justify-start items-center overflow-hidden">
            <div className="text-neutral-700 dark:text-neutral-200 text-lg md:text-xl font-medium tracking-tight">
              {currentSelectedColorName}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!modelCode || !initialColorSlug || frameCount <= 0) {
    return (
      <section
        className={cn(
          "relative w-full min-h-dvh h-dvh flex items-center justify-center p-4",
          backgroundColor,
          className
        )}
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Configurator Unavailable
          </h2>
          <p className="text-muted-foreground">
            Essential configuration data is missing.
          </p>
          {!modelCode && (
            <p className="text-xs text-destructive-foreground">
              Missing: Model Code
            </p>
          )}
          {!initialColorSlug && (
            <p className="text-xs text-destructive-foreground">
              Missing: Initial Color
            </p>
          )}
          {frameCount <= 0 && (
            <p className="text-xs text-destructive-foreground">
              Invalid: Frame Count
            </p>
          )}
        </div>
      </section>
    );
  }

  const gestureHandlers =
    typeof bindGestures === "function" ? bindGestures() : {};

  return (
    <>
      <Leva
        hidden={!showLevaControls}
        titleBar={{ title: "Turntable Controls", filter: false, drag: true }}
        collapsed={process.env.NODE_ENV === "production"}
        oneLineLabels // Makes Leva panel more compact
      />
      <section
        className={cn(
          "relative w-full min-h-dvh h-dvh overflow-hidden font-sans",
          backgroundColor,
          className
        )}
      >
        <div
          ref={containerRef}
          className="absolute inset-0 z-10" // This div is the target for @use-gesture/react
          style={{
            cursor: mainContainerCursor,
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "pan-y",
          }}
          {...gestureHandlers}
          role="img"
          aria-label={`3D Turntable Viewer for ${
            productContext?.title || modelCode
          }. Current color: ${currentColorSlug}. Drag horizontally to rotate.`}
          aria-busy={isLoadingInitial}
          tabIndex={0}
          onMouseEnter={() => setIsMouseOverTurntableArea(true)}
          onMouseLeave={() => setIsMouseOverTurntableArea(false)}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
            style={{ pointerEvents: "none" }}
          />
        </div>

        {showDragHintElement && (
          <motion.div
            animate={{ opacity: dragHintOpacity }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={cn(
              "fixed z-[9999] pointer-events-none",
              "w-20 h-20 md:w-24 md:h-24 bg-neutral-900/80 dark:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl"
            )}
            style={{
              left: dragHintPosition.x,
              top: dragHintPosition.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-white text-lg md:text-xl font-medium">
              Drag
            </span>
          </motion.div>
        )}

        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-white via-white/0 to-white dark:from-neutral-950 dark:via-neutral-950/0 dark:to-neutral-950 opacity-50" />

        <div
          className={cn(
            "absolute z-30 pointer-events-none",
            "px-4 top-[40px] w-full text-center md:text-left",
            "md:top-[80px] md:px-8 lg:px-16",
            "xl:left-[64px] xl:w-auto xl:max-w-[640px]",
            "2xl:left-[160px]"
          )}
        >
          <h2
            className={cn(
              "font-semibold text-neutral-900 dark:text-white",
              "text-4xl md:text-6xl",
              "tracking-[-0.03em] md:tracking-[-0.04em]"
            )}
          >
            {finalSectionTitle}
          </h2>
          <p
            className={cn(
              "font-medium text-neutral-800 dark:text-neutral-300 mt-1 md:mt-2.5",
              "text-xl md:text-3xl",
              "tracking-[-0.02em]"
            )}
          >
            {finalSectionSubtitle}
          </p>
        </div>

        {renderColorSelector()}

        <AnimatePresence>
          {isLoadingInitial && (
            <motion.div
              key="initialLoader"
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 dark:bg-neutral-950/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-sm font-medium text-neutral-300 dark:text-neutral-400 mb-2">
                Loading 360° View... {loadingProgress}%
              </div>
              <div className="w-48 h-2 bg-neutral-700 dark:bg-neutral-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary dark:bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              {loadingError &&
                !loadingError.includes("incomplete") &&
                !loadingError.startsWith("Critical") && (
                  <p className="text-destructive-foreground bg-destructive p-1 rounded text-xs mt-3 text-center px-4 max-w-sm">
                    A problem occurred loading images.
                  </p>
                )}
              {loadingError && loadingError.startsWith("Critical") && (
                <p className="text-destructive-foreground bg-destructive p-1 rounded text-xs mt-3 text-center px-4 max-w-sm">
                  {loadingError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {!isLoadingInitial && isLoadingKeyframes && !isFullyLoaded && (
          <div className="absolute top-4 right-4 z-50 p-2 bg-black/50 dark:bg-neutral-800/70 text-white dark:text-neutral-300 text-xs rounded-md shadow-lg flex items-center gap-1.5 pointer-events-none">
            <Information size={16} />
            <span>Optimizing view...</span>
          </div>
        )}
        {!isLoadingInitial &&
          loadingError &&
          !loadingError.startsWith("Critical") && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-destructive/90 text-destructive-foreground rounded shadow-md text-center text-xs pointer-events-none w-auto max-w-md">
              <p>{loadingError}</p>
            </div>
          )}
      </section>
    </>
  );
}

ConfiguratorSection.propTypes = {
  block: PropTypes.shape({
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
    modelCode: PropTypes.string.isRequired,
    frameCount: PropTypes.number,
    colors: PropTypes.arrayOf(
      PropTypes.shape({
        _key: PropTypes.string,
        name: PropTypes.string,
        slug: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({ current: PropTypes.string }),
        ]),
        colorValue: PropTypes.string,
        isDefault: PropTypes.bool,
      })
    ),
    sectionTitle: PropTypes.string,
    sectionSubtitle: PropTypes.string,
    className: PropTypes.string,
    backgroundColor: PropTypes.string,
    imageFit: PropTypes.oneOf(["contain", "cover"]),
    dragSensitivity: PropTypes.number,
    flickBoost: PropTypes.number,
    inertiaResistance: PropTypes.number,
    initialFrameOverride: PropTypes.number,
  }).isRequired,
  productContext: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
  }),
};
