// hooks/useTurntableControlsFramer.js
"use client";

import { useRef, useCallback, useEffect } from "react";
import { useDrag } from "@use-gesture/react";
import { animate } from "popmotion";

const DEBUG_CONTROLS = true;
const AXIS_LOCK_THRESHOLD = 1.5;

const DEFAULT_DECAY_POWER = 0.6;
const DEFAULT_DECAY_TIMECONSTANT = 350;
const DEFAULT_DECAY_RESTDELTA = 0.5;
const DEFAULT_FLICK_BOOST_POPMOTION = 20;
const DEFAULT_DRAG_FACTOR_POPMOTION = 5;

/**
 * @typedef {import('@use-gesture/react').DragConfig} UseDragConfig
 * @typedef {import('@use-gesture/react').Handler<"drag", PointerEvent | MouseEvent | TouchEvent | KeyboardEvent>} DragHandler
 * @typedef {import('@use-gesture/react').UserDragConfig} UserDragConfig
 */

export function useTurntableControlsFramer(
  targetRef,
  frameCount,
  options = {}
) {
  const {
    initialFrame = 0,
    enabled = true,
    onFrameChange,
    onInteractionStart,
    onInteractionEnd,
    dragFactor = DEFAULT_DRAG_FACTOR_POPMOTION,
    flickBoost = DEFAULT_FLICK_BOOST_POPMOTION,
    decayOptions = {},
  } = options;

  const popmotionDecayConfig = {
    power: decayOptions.power ?? DEFAULT_DECAY_POWER,
    timeConstant: decayOptions.timeConstant ?? DEFAULT_DECAY_TIMECONSTANT,
    restDelta: decayOptions.restDelta ?? DEFAULT_DECAY_RESTDELTA,
    modifyTarget: decayOptions.modifyTarget,
  };

  const log = useCallback((...args) => {
    if (DEBUG_CONTROLS)
      console.log("[TurntableControlsFramer_useGesture]", ...args);
  }, []);

  const preciseFrameRef = useRef(initialFrame);
  const animationControlsRef = useRef(null);
  const isPointerActiveRef = useRef(false);
  const lockedAxisRef = useRef(null);
  const prevInitialFramePropRef = useRef(initialFrame);

  const stableOnFrameChange = useCallback(
    (frame, isAnimating) => onFrameChange?.(frame, isAnimating),
    [onFrameChange]
  );
  const stableOnInteractionStart = useCallback(
    () => onInteractionStart?.(),
    [onInteractionStart]
  );
  const stableOnInteractionEnd = useCallback(
    (completed = true) => onInteractionEnd?.(completed),
    [onInteractionEnd]
  );

  const stopAnimation = useCallback(() => {
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
      animationControlsRef.current = null;
      log("Popmotion animation stopped.");
    }
  }, [log]);

  const setFrame = useCallback(
    (frame, triggerCallbacks = true) => {
      if (frameCount <= 0) return;
      stopAnimation();
      const newFrameRaw = frame % frameCount;
      const newFrameNormalized =
        newFrameRaw < 0 ? newFrameRaw + frameCount : newFrameRaw;
      preciseFrameRef.current = newFrameNormalized;
      if (triggerCallbacks) stableOnFrameChange(preciseFrameRef.current, false);
      prevInitialFramePropRef.current = Math.round(newFrameNormalized);
      log(
        `Frame programmatically set to: ${preciseFrameRef.current.toFixed(
          2
        )} (Normalized: ${newFrameNormalized.toFixed(2)})`
      );
    },
    [frameCount, stopAnimation, stableOnFrameChange, log]
  );

  useEffect(() => {
    const currentPropInitialFrame =
      ((Math.round(initialFrame) % frameCount) + frameCount) % frameCount;
    if (
      Math.round(prevInitialFramePropRef.current) !== currentPropInitialFrame ||
      (Math.round(preciseFrameRef.current) !== currentPropInitialFrame &&
        !isPointerActiveRef.current &&
        !animationControlsRef.current)
    ) {
      log(
        `InitialFrame Effect: Prop is ${currentPropInitialFrame}, prevPropRef was ${Math.round(
          prevInitialFramePropRef.current
        )}, preciseFrame is ${preciseFrameRef.current.toFixed(
          2
        )}. Setting frame.`
      );
      setFrame(currentPropInitialFrame, true);
    }
  }, [initialFrame, frameCount, setFrame, log]);

  const handlePointerDown = useCallback(() => {
    if (!enabled) return;
    stopAnimation();
    isPointerActiveRef.current = true;
    lockedAxisRef.current = null;
    stableOnInteractionStart();
    log("Pointer Down / Interaction Start (useDrag)");
  }, [enabled, stopAnimation, stableOnInteractionStart, log]);

  const handlePointerUp = useCallback(
    (velocityPxPerMsArgument = 0) => {
      isPointerActiveRef.current = false;
      if (!enabled) {
        stableOnInteractionEnd(true);
        return;
      }

      log(
        `Pointer Up. Received raw velocityPxPerMsArgument: ${velocityPxPerMsArgument.toFixed(
          3
        )}`
      );

      const wasYLocked = lockedAxisRef.current === "y";
      lockedAxisRef.current = null;

      const safeDragFactor =
        dragFactor === 0 ? DEFAULT_DRAG_FACTOR_POPMOTION : dragFactor;
      // Velocity for Popmotion is in units (frames) per second
      const velocityFramesPerSec =
        ((velocityPxPerMsArgument * 1000) / safeDragFactor) * flickBoost;

      log(
        `Pointer Up Details: Vel_Arg (px/ms): ${velocityPxPerMsArgument.toFixed(
          3
        )}, dragFactor: ${safeDragFactor}, flickBoost: ${flickBoost}, Calc FrameVel (f/s): ${velocityFramesPerSec.toFixed(
          2
        )}`
      );

      if (frameCount <= 0 || Math.abs(velocityFramesPerSec) < 5 || wasYLocked) {
        // Threshold: 5 frames/sec
        log("No significant inertia or Y-locked. Ending interaction.");
        stableOnFrameChange(preciseFrameRef.current, false); // Ensure final state is communicated
        stableOnInteractionEnd(true);
        return;
      }

      log(
        `Starting Popmotion decay. Start: ${preciseFrameRef.current.toFixed(
          2
        )}, Target Vel (f/s): ${velocityFramesPerSec.toFixed(2)}`
      );
      animationControlsRef.current = animate({
        from: preciseFrameRef.current,
        velocity: velocityFramesPerSec,
        type: "decay",
        power: popmotionDecayConfig.power,
        timeConstant: popmotionDecayConfig.timeConstant,
        restDelta: popmotionDecayConfig.restDelta,
        modifyTarget: popmotionDecayConfig.modifyTarget, // e.g., target => (Math.round(target % frameCount) + frameCount) % frameCount
        onUpdate: (latest) => {
          if (isPointerActiveRef.current) {
            stopAnimation();
            return;
          }
          preciseFrameRef.current = latest;
          stableOnFrameChange(latest, true);
        },
        onPlay: () => log("Popmotion decay animation playing."),
        onStop: () => {
          log("Popmotion decay animation stopped.");
          animationControlsRef.current = null;
        },
        onComplete: () => {
          log("Popmotion decay animation completed.");
          animationControlsRef.current = null;
          const finalFrameRaw = preciseFrameRef.current % frameCount;
          const finalFrameNormalized =
            finalFrameRaw < 0 ? finalFrameRaw + frameCount : finalFrameRaw;
          preciseFrameRef.current = finalFrameNormalized;
          stableOnFrameChange(finalFrameNormalized, false);
          stableOnInteractionEnd(true);
        },
      });
    },
    [
      enabled,
      frameCount,
      flickBoost,
      dragFactor,
      popmotionDecayConfig,
      stopAnimation,
      stableOnFrameChange,
      stableOnInteractionEnd,
      log,
    ]
  );

  /** @type {DragHandler} */
  const dragHandler = useCallback(
    (state) => {
      const {
        first,
        last,
        movement,
        velocity,
        dragging,
        tap,
        memo,
        event,
        touches,
      } = state;

      const [mx, my] = Array.isArray(movement) ? movement : [0, 0];
      const [vxFromGesture, vyFromGesture] = Array.isArray(velocity)
        ? velocity
        : [0, 0];

      log("useDrag state:", {
        first,
        last,
        dragging,
        tap,
        mx: mx.toFixed(2),
        my: my.toFixed(2),
        vx: vxFromGesture.toFixed(3),
        vy: vyFromGesture.toFixed(3),
        memo_received: typeof memo === "number" ? memo.toFixed(2) : memo,
      });

      if (!enabled || tap || frameCount <= 0) {
        if (tap) log("Tap detected, ignored.");
        return memo;
      }

      let frameAtGestureStart = memo;

      if (first) {
        handlePointerDown();
        frameAtGestureStart = preciseFrameRef.current;
        if (touches > 0) {
          // Touch events
          if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 5)
            lockedAxisRef.current = "y";
          else if (Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 5)
            lockedAxisRef.current = "x";
        } else {
          // Mouse events
          lockedAxisRef.current = "x"; // Default to X-axis for mouse
        }
        log(
          "Drag Start. Captured frameAtGestureStart:",
          frameAtGestureStart.toFixed(2),
          "Axis:",
          lockedAxisRef.current
        );
        return frameAtGestureStart;
      }

      frameAtGestureStart =
        typeof memo === "number" ? memo : preciseFrameRef.current;

      if (dragging) {
        if (lockedAxisRef.current === null) {
          if (Math.abs(my) > Math.abs(mx) * AXIS_LOCK_THRESHOLD)
            lockedAxisRef.current = "y";
          else lockedAxisRef.current = "x";
          log("Axis lock determined during drag:", lockedAxisRef.current);
        }

        if (lockedAxisRef.current === "y") {
          return frameAtGestureStart;
        }

        if (lockedAxisRef.current === "x") {
          if (event?.cancelable) event.preventDefault();

          const safeDragFactor =
            dragFactor === 0 ? DEFAULT_DRAG_FACTOR_POPMOTION : dragFactor;
          const currentFrameDelta = mx / safeDragFactor;
          preciseFrameRef.current = frameAtGestureStart + currentFrameDelta;

          log(
            `Dragging (X): mx=${mx.toFixed(
              2
            )}, dragFactor=${safeDragFactor}, frameDelta=${currentFrameDelta.toFixed(
              2
            )}, newPreciseFrame=${preciseFrameRef.current.toFixed(
              2
            )} (start: ${frameAtGestureStart.toFixed(2)})`
          );
          stableOnFrameChange(preciseFrameRef.current, false);
        }
      }

      if (last) {
        const finalVxFromState = Array.isArray(state.velocity)
          ? state.velocity[0]
          : 0; // px/ms
        const totalMovementX = Array.isArray(state.movement)
          ? state.movement[0]
          : 0; // px

        // Determine the sign from the total movement of the gesture
        // Math.sign(0) is 0, so (sign || 1) defaults to positive for no movement.
        const movementSign = Math.sign(totalMovementX) || 1;

        // Apply this sign to the magnitude of the reported velocity
        const signedCorrectedVelocityPxMs =
          movementSign * Math.abs(finalVxFromState);

        log("Drag End Details:", {
          raw_vx_from_state: finalVxFromState?.toFixed(3),
          total_mx: totalMovementX?.toFixed(2),
          derived_movement_sign: movementSign,
          signed_corrected_vx_px_ms: signedCorrectedVelocityPxMs.toFixed(3),
        });

        handlePointerUp(
          lockedAxisRef.current === "x" ? signedCorrectedVelocityPxMs : 0
        );
      }
      return frameAtGestureStart;
    },
    [
      enabled,
      frameCount,
      dragFactor,
      handlePointerDown,
      handlePointerUp,
      stableOnFrameChange,
      log,
    ]
  );

  const bindGestures = useDrag(dragHandler, {
    target: targetRef,
    filterTaps: true,
    eventOptions: { passive: false },
    enabled: enabled,
    threshold: 3,
  });

  useEffect(() => {
    if (!enabled) {
      log("Controls disabled, stopping animation.");
      stopAnimation();
    }
    return () => {
      log("Unmounting or deps changed, stopping animation.");
      stopAnimation();
    };
  }, [enabled, stopAnimation, log]);

  return {
    bindGestures,
    currentFrameRef: preciseFrameRef,
    setFrame,
  };
}
