// hooks/useCanvasRenderer.js
import { useEffect, useCallback, useRef } from "react";

const DEBUG_RENDERER = false;
const LOG_LEVEL = { VERBOSE: 3, INFO: 2, ERROR: 1, NONE: 0 };
const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === "development" ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;

/**
 * Custom hook to render an image sequence onto a canvas element.
 * It handles DPI scaling, image fitting (contain/cover), and placeholder rendering.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to the canvas element.
 * @param {HTMLImageElement[]} imageElements - Array of preloaded HTMLImageElement objects.
 * @param {Record<number, 'idle' | 'loading' | 'loaded' | 'error'>} imageStatuses - Status of each image load.
 * @param {number} visualFrameIndex - The current frame index to display (can be fractional during animation).
 * @param {number} frameCount - Total number of frames in the sequence.
 * @param {{width: number, height: number}} canvasSize - Current dimensions of the canvas container.
 * @param {number} devicePixelRatio - The device's pixel ratio for DPI scaling.
 * @param {'contain' | 'cover'} [imageFit='contain'] - How the image should fit within the canvas.
 * @param {boolean} turntableIsEnabled - Whether the turntable interaction logic is currently enabled.
 * @param {number} initialFrameIndex - The specific index of the frame that should be shown initially.
 */
export function useCanvasRenderer(
  canvasRef,
  imageElements,
  imageStatuses,
  visualFrameIndex,
  frameCount,
  canvasSize,
  devicePixelRatio,
  imageFit = "contain",
  turntableIsEnabled, // Renamed from initialFrameActuallyLoaded for clarity
  initialFrameIndex // The *actual* first frame to prioritize
) {
  const log = useCallback((messageLevel, ...args) => {
    if (DEBUG_RENDERER && messageLevel <= CURRENT_LOG_LEVEL) {
      console.log("[CanvasRenderer]", ...args);
    }
  }, []);

  const lastDrawnFrameInfo = useRef({ index: -1, status: null, imageId: null });

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (
      !ctx ||
      !canvasSize ||
      canvasSize.width === 0 ||
      canvasSize.height === 0 ||
      frameCount <= 0
    ) {
      // log(LOG_LEVEL.VERBOSE, "Canvas or size not ready for drawing.");
      return;
    }

    const dpr = devicePixelRatio || 1;
    const canvasWidth = canvasSize.width * dpr;
    const canvasHeight = canvasSize.height * dpr;

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      log(
        LOG_LEVEL.INFO,
        `Canvas internal size set: ${canvasWidth}x${canvasHeight}, DPR: ${dpr}`
      );
    }

    // Determine the frame to attempt drawing. This will be visualFrameIndex once turntable is enabled.
    // Before that, we prioritize showing the specific initialFrameIndex if it's loaded.
    let frameToAttemptDraw =
      ((Math.round(visualFrameIndex) % frameCount) + frameCount) % frameCount;
    const designatedInitialFrame =
      (initialFrameIndex + frameCount) % frameCount;

    let imgToDraw = null;
    let statusOfFrameToDraw = null;
    let imageIdOfFrameToDraw = null;
    let useThisFrameIndexForDrawing = frameToAttemptDraw;

    // Prioritize the designated initial frame if it's loaded and turntable isn't fully enabled yet.
    // This ensures the first thing the user sees is the intended starting image, if available.
    if (
      !turntableIsEnabled &&
      imageStatuses &&
      imageStatuses[designatedInitialFrame] === "loaded" &&
      imageElements &&
      imageElements[designatedInitialFrame]
    ) {
      useThisFrameIndexForDrawing = designatedInitialFrame;
      imgToDraw = imageElements[designatedInitialFrame];
      statusOfFrameToDraw = imageStatuses[designatedInitialFrame];
      imageIdOfFrameToDraw =
        imgToDraw?.src || `initial-${designatedInitialFrame}`;
      log(
        LOG_LEVEL.VERBOSE,
        `Prioritizing initial loaded frame ${designatedInitialFrame} for display before turntable is fully enabled.`
      );
    } else if (
      imageElements &&
      imageStatuses &&
      imageElements.length === frameCount
    ) {
      // Otherwise, use the visualFrameIndex if turntable is enabled or initial frame isn't ready
      imgToDraw = imageElements[frameToAttemptDraw];
      statusOfFrameToDraw = imageStatuses[frameToAttemptDraw];
      imageIdOfFrameToDraw = imgToDraw?.src || `target-${frameToAttemptDraw}`;
    }

    // Skip drawing if the exact same frame (index, status, and image source if loaded) was drawn last.
    if (
      useThisFrameIndexForDrawing === lastDrawnFrameInfo.current.index &&
      statusOfFrameToDraw === lastDrawnFrameInfo.current.status &&
      (statusOfFrameToDraw === "loaded"
        ? imageIdOfFrameToDraw === lastDrawnFrameInfo.current.imageId
        : true)
    ) {
      // log(LOG_LEVEL.VERBOSE, `Skipping redraw for frame ${useThisFrameIndexForDrawing}, status ${statusOfFrameToDraw}`);
      return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (
      statusOfFrameToDraw === "loaded" &&
      imgToDraw &&
      imgToDraw.complete &&
      imgToDraw.naturalWidth > 0
    ) {
      ctx.save();
      const imgWidth = imgToDraw.naturalWidth;
      const imgHeight = imgToDraw.naturalHeight;
      const imgAspect = imgWidth / imgHeight;
      const canvasAspect = canvasWidth / canvasHeight;
      let drawWidth,
        drawHeight,
        drawX = 0,
        drawY = 0;

      if (imageFit === "contain") {
        if (imgAspect > canvasAspect) {
          // Image wider than canvas
          drawWidth = canvasWidth;
          drawHeight = drawWidth / imgAspect;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          // Image taller than canvas or same aspect
          drawHeight = canvasHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvasWidth - drawWidth) / 2;
        }
      } else {
        // 'cover'
        if (imgAspect < canvasAspect) {
          // Image taller than canvas
          drawWidth = canvasWidth;
          drawHeight = drawWidth / imgAspect;
          drawY = (canvasHeight - drawHeight) / 2; // Center vertically
        } else {
          // Image wider than canvas or same aspect
          drawHeight = canvasHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvasWidth - drawWidth) / 2; // Center horizontally
        }
      }
      ctx.drawImage(
        imgToDraw,
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
      lastDrawnFrameInfo.current = {
        index: useThisFrameIndexForDrawing,
        status: statusOfFrameToDraw,
        imageId: imageIdOfFrameToDraw,
      };
      // log(LOG_LEVEL.VERBOSE, `Drew frame ${useThisFrameIndexForDrawing}, status: ${statusOfFrameToDraw}`);
    } else {
      // Placeholder rendering logic
      ctx.fillStyle = "rgba(220, 220, 220, 0.7)"; // Light grey placeholder
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "#555"; // Darker text
      ctx.font = `${14 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let placeholderText = "Preparing viewer...";
      if (statusOfFrameToDraw === "error") {
        placeholderText = `Image unavailable (Frame ${useThisFrameIndexForDrawing})`;
      } else if (statusOfFrameToDraw === "loading") {
        placeholderText = `Loading frame ${useThisFrameIndexForDrawing}...`;
      } else if (
        !imageElements ||
        !imageStatuses ||
        imageElements.length !== frameCount
      ) {
        placeholderText = "Initializing resources...";
      }

      ctx.fillText(placeholderText, canvasWidth / 2, canvasHeight / 2);
      lastDrawnFrameInfo.current = {
        index: useThisFrameIndexForDrawing,
        status: statusOfFrameToDraw,
        imageId: null,
      };
      // log(LOG_LEVEL.VERBOSE, `Drew placeholder for frame ${useThisFrameIndexForDrawing}, status: ${statusOfFrameToDraw || 'unknown'}`);
    }
  }, [
    canvasRef,
    imageElements,
    imageStatuses,
    visualFrameIndex,
    frameCount,
    canvasSize,
    devicePixelRatio,
    imageFit,
    turntableIsEnabled,
    initialFrameIndex,
    log,
  ]);

  useEffect(() => {
    const rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [drawFrame]); // Re-run drawFrame if any of its dependencies change
}
