// hooks/useTurntableControls.js
import { useRef, useCallback, useEffect } from "react";
import { useDrag } from "@use-gesture/react";
import { gsap } from "gsap";
// InertiaPlugin is registered in ConfiguratorSection.jsx

const DEBUG_CONTROLS = true;
const AXIS_LOCK_THRESHOLD = 1.5;

// Default physics values are now primarily applied by the parent component (ConfiguratorSection)
// These are fallback-fallbacks, but parent should ensure numbers are passed.
const FALLBACK_DRAG_SENSITIVITY = 1.8;
const FALLBACK_FLICK_BOOST = 2.5;
const FALLBACK_INERTIA_RESISTANCE = 180;

/** @typedef {import('@use-gesture/react').GestureState<"drag">} DragGestureState */

export function useTurntableControls(targetRef, frameCount, options = {}) {
  // Hook now expects these to be numbers. Parent (ConfiguratorSection) handles defaulting.
  const {
    dragSensitivity = FALLBACK_DRAG_SENSITIVITY, // Fallback if parent somehow fails
    inertiaResistance = FALLBACK_INERTIA_RESISTANCE,
    flickBoost = FALLBACK_FLICK_BOOST,
    onFrameChange,
    onInteractionStart,
    onInteractionEnd,
    initialFrame = 0,
    enabled = true,
  } = options;

  const log = useCallback((...args) => {
    if (DEBUG_CONTROLS) console.log("[TurntableControls]", ...args);
  }, []);

  // Log received physics parameters to confirm they are numbers
  useEffect(() => {
    log("Hook received options:", {
      dragSensitivity,
      inertiaResistance,
      flickBoost,
      frameCount,
    });
    if (
      typeof dragSensitivity !== "number" ||
      typeof inertiaResistance !== "number" ||
      typeof flickBoost !== "number"
    ) {
      log("ERROR: Physics parameters are not numbers!", {
        dragSensitivity,
        inertiaResistance,
        flickBoost,
      });
    }
    if (typeof frameCount !== "number" || frameCount <= 0) {
      log("ERROR: frameCount is invalid!", { frameCount });
    }
  }, [dragSensitivity, inertiaResistance, flickBoost, frameCount, log]);

  const preciseFrameRef = useRef(initialFrame);
  const gsapTweenRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const lockedAxisRef = useRef(null);

  const prevInitialFramePropRef = useRef(initialFrame);
  const prevEnabledPropRef = useRef(enabled);

  const gsapContextRef = useRef(null);

  useEffect(() => {
    // ... (GSAP context setup - no change)
    if (targetRef.current) {
      gsapContextRef.current = gsap.context(() => {}, targetRef.current);
    }
    return () => {
      gsapContextRef.current?.revert();
      gsapContextRef.current = null;
    };
  }, [targetRef]);

  const stableOnFrameChange = useCallback(
    (frame, isTweening) => {
      // ... (no change)
      onFrameChange?.(frame, isTweening);
    },
    [onFrameChange]
  );

  const stableOnInteractionStart = useCallback(() => {
    // ... (no change)
    onInteractionStart?.();
  }, [onInteractionStart]);

  const stableOnInteractionEnd = useCallback(
    (inertiaCompleted = true) => {
      // ... (no change)
      onInteractionEnd?.(inertiaCompleted);
    },
    [onInteractionEnd]
  );

  const killTween = useCallback(() => {
    // ... (no change)
    if (gsapTweenRef.current) {
      gsapTweenRef.current.kill();
      gsapTweenRef.current = null;
    }
  }, []);

  useEffect(() => {
    // ... (prop change effect - no change from previous version, should be fine now)
    log(
      `Prop Change Effect: initialFrame=${initialFrame} (prev: ${prevInitialFramePropRef.current}), enabled=${enabled} (prev: ${prevEnabledPropRef.current})`
    );

    let needsFrameUpdate = false;
    let newFrameToSet = preciseFrameRef.current;

    if (enabled !== prevEnabledPropRef.current) {
      log(
        `'enabled' prop changed from ${prevEnabledPropRef.current} to ${enabled}`
      );
      if (!enabled) {
        killTween();
        if (isInteractingRef.current) {
          isInteractingRef.current = false;
          isPointerDownRef.current = false;
          stableOnInteractionEnd(true);
          log("Controls disabled, interaction ended.");
        }
      } else {
        newFrameToSet = initialFrame;
        needsFrameUpdate = true;
        log(
          `Controls enabled. Frame will be set to initialFrame: ${initialFrame}`
        );
      }
      prevEnabledPropRef.current = enabled;
    }

    if (initialFrame !== prevInitialFramePropRef.current) {
      log(
        `'initialFrame' prop changed from ${prevInitialFramePropRef.current} to ${initialFrame}.`
      );
      if (enabled) {
        newFrameToSet = initialFrame;
        needsFrameUpdate = true;
        log(`Syncing to new initialFrame prop: ${initialFrame}`);
      }
      prevInitialFramePropRef.current = initialFrame;
    }

    if (needsFrameUpdate && enabled) {
      killTween();
      preciseFrameRef.current = newFrameToSet;
      stableOnFrameChange(newFrameToSet, false);
      log(`Frame explicitly set by prop change effect to: ${newFrameToSet}`);
    }
  }, [
    initialFrame,
    enabled,
    stableOnFrameChange,
    killTween,
    log,
    stableOnInteractionEnd,
  ]);

  const handlePointerDown = useCallback(() => {
    // ... (no change)
    if (!enabled) {
      log("Pointer Down ignored: controls disabled.");
      return;
    }
    log("Pointer Down");
    killTween();
    isInteractingRef.current = true;
    isPointerDownRef.current = true;
    lockedAxisRef.current = null;
    stableOnInteractionStart();
  }, [enabled, killTween, stableOnInteractionStart, log]);

  const handlePointerUp = useCallback(
    (velocity = 0) => {
      // ... (no change)
      log(`Pointer Up. Velocity: ${velocity.toFixed(2)}`);
      isPointerDownRef.current = false;

      if (!enabled) {
        if (isInteractingRef.current) {
          isInteractingRef.current = false;
          stableOnInteractionEnd(true);
          log("Controls disabled, interaction ended on pointer up.");
        }
        return;
      }

      const wasYLocked = lockedAxisRef.current === "y";
      lockedAxisRef.current = null;

      if (frameCount <= 0 || Math.abs(velocity) < 0.01 || wasYLocked) {
        log("No inertia or Y-locked. Ending interaction.", {
          velocity: velocity.toFixed(2),
          wasYLocked,
        });
        if (!gsapTweenRef.current) {
          isInteractingRef.current = false;
        }
        stableOnFrameChange(preciseFrameRef.current, false);
        stableOnInteractionEnd(true);
        return;
      }

      if (gsapContextRef.current && gsap.plugins.inertia) {
        log(
          `Starting GSAP inertia. Velocity: ${velocity.toFixed(
            2
          )}, Boost: ${flickBoost}, Resistance: ${inertiaResistance}`
        );
        isInteractingRef.current = true;
        const boostedVelocity = velocity * flickBoost;
        const inertiaBaseMultiplier = 60;
        const inertiaVelocity = -boostedVelocity * inertiaBaseMultiplier;

        gsapTweenRef.current = gsap.to(preciseFrameRef, {
          /* ... GSAP tween logic ... */
        }); // Rest of GSAP tween is okay
        if (gsapTweenRef.current) {
          gsapContextRef.current.add(gsapTweenRef.current);
        }
      } else {
        log(
          "GSAP context or InertiaPlugin not available. Ending interaction without inertia."
        );
        isInteractingRef.current = false;
        stableOnFrameChange(preciseFrameRef.current, false);
        stableOnInteractionEnd(true);
      }
    },
    [
      enabled,
      frameCount,
      flickBoost,
      inertiaResistance,
      killTween,
      stableOnFrameChange,
      stableOnInteractionEnd,
      log,
    ]
  );

  const dragHandler = useCallback(
    /** @param {DragGestureState} gestureState */
    (gestureState) => {
      // ... (no change to destructuring, it was fixed)
      log("Raw gestureState:", gestureState);
      const {
        first = false,
        last = false,
        movement = [0, 0],
        velocity = [0, 0],
        dragging = false,
        tap = false,
        memo,
        event,
        touches = 0,
      } = gestureState;

      const [mx, my] = Array.isArray(movement) ? movement : [0, 0];
      const [vx] = Array.isArray(velocity) ? velocity : [0];

      if (!enabled || tap || frameCount <= 0) {
        // ... (logging for ignored drag - no change)
        return memo;
      }

      let startFrame = memo;

      if (first) {
        // ... (drag start logic - no change)
        log("Drag Start (first=true)", {
          mx: mx.toFixed(2),
          my: my.toFixed(2),
          eventTarget: event?.target,
          touches,
        });
        handlePointerDown();
        startFrame = preciseFrameRef.current;
        if (touches > 0) {
          if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 5)
            lockedAxisRef.current = "y";
          else if (Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 5)
            lockedAxisRef.current = "x";
        } else {
          lockedAxisRef.current = "x";
        }
        log("Drag Start memoized frame:", startFrame);
        return startFrame;
      }

      if (dragging) {
        // ... (axis lock logic - no change)
        if (lockedAxisRef.current === null) {
          if (Math.abs(my) > Math.abs(mx) * AXIS_LOCK_THRESHOLD) {
            lockedAxisRef.current = "y";
          } else {
            lockedAxisRef.current = "x";
          }
        }

        if (lockedAxisRef.current === "y") {
          return startFrame;
        }

        if (lockedAxisRef.current === "x") {
          if (event?.cancelable) event.preventDefault();

          const containerWidth = targetRef.current?.clientWidth;
          if (!containerWidth || containerWidth === 0) {
            // More robust check
            log(
              "Error: containerWidth is invalid. Cannot calculate pixelsPerFrame.",
              { containerWidth }
            );
            return startFrame; // Prevent further calculation if width is bad
          }

          const pixelsForFullTurn = containerWidth * dragSensitivity;
          const pixelsPerFrame = pixelsForFullTurn / frameCount;

          if (pixelsPerFrame === 0) {
            // This should be caught by containerWidth check ideally
            log(
              "Error: pixelsPerFrame is zero. Check frameCount or dragSensitivity.",
              { pixelsPerFrame, frameCount, dragSensitivity }
            );
            return startFrame;
          }

          const frameDelta = mx / pixelsPerFrame;
          preciseFrameRef.current = startFrame - frameDelta;
          stableOnFrameChange(preciseFrameRef.current, false);
        }
      }

      if (last) {
        // ... (drag end logic - no change)
        log("Drag End (last=true)", { vx: vx.toFixed(2) });
        handlePointerUp(lockedAxisRef.current === "x" ? vx : 0);
      }

      return startFrame;
    },
    [
      enabled,
      frameCount,
      targetRef,
      dragSensitivity,
      handlePointerDown,
      handlePointerUp,
      stableOnFrameChange,
      log,
    ]
  );

  const bindGestures = useDrag(dragHandler, {
    /* ... no change ... */
  });

  const setFrame = useCallback(
    (frame) => {
      // ... (setFrame logic - no change)
      if (frameCount <= 0) return;
      log(`Programmatically setting frame to: ${frame}`);
      killTween();
      isInteractingRef.current = false;
      isPointerDownRef.current = false;
      const newFrame =
        ((Math.round(frame) % frameCount) + frameCount) % frameCount;
      preciseFrameRef.current = newFrame;
      prevInitialFramePropRef.current = newFrame;
      stableOnFrameChange(newFrame, false);
    },
    [frameCount, stableOnFrameChange, killTween, log]
  );

  useEffect(() => {
    // ... (initial mount/initialFrame prop change effect - no change)
    log(
      `Mount/initialFrame Prop Change Effect: initialFrame prop is ${initialFrame}, prev was ${prevInitialFramePropRef.current}`
    );
    if (
      initialFrame !== prevInitialFramePropRef.current ||
      preciseFrameRef.current !== initialFrame
    ) {
      log(
        `Calling setFrame(${initialFrame}) due to mount or initialFrame prop change.`
      );
      setFrame(initialFrame);
    }
  }, [initialFrame, setFrame, log]);

  return {
    bindGestures,
    currentFrame: preciseFrameRef,
    setFrame,
  };
}
