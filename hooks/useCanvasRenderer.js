// hooks/useCanvasRenderer.js
import { useEffect, useCallback, useRef } from "react";

const DEBUG_RENDERER = false; // Set to false for less noise in production

export function useCanvasRenderer(
  canvasRef,
  imageElements,
  imageStatuses,
  visualFrameIndex,
  frameCount,
  canvasSize,
  devicePixelRatio,
  imageFit = "contain",
  initialFrameActuallyLoaded,
  initialFrameIndex
) {
  const log = useCallback((...args) => {
    if (DEBUG_RENDERER) console.log("[CanvasRenderer]", ...args);
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
      return;
    }

    const dpr = devicePixelRatio || 1;
    const canvasWidth = canvasSize.width * dpr;
    const canvasHeight = canvasSize.height * dpr;

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      log(`Canvas internal size set: ${canvasWidth}x${canvasHeight}`);
    }

    let frameToAttemptDraw =
      ((Math.round(visualFrameIndex) % frameCount) + frameCount) % frameCount; // Ensure rounded index

    const safeInitialDisplayIndex =
      (initialFrameIndex + frameCount) % frameCount;
    if (
      !initialFrameActuallyLoaded &&
      imageStatuses &&
      imageStatuses[safeInitialDisplayIndex] === "loaded"
    ) {
      frameToAttemptDraw = safeInitialDisplayIndex;
    }

    if (
      !imageElements ||
      !imageStatuses ||
      imageElements.length !== frameCount ||
      imageStatuses[frameToAttemptDraw] === undefined
    ) {
      log(
        `Data not ready. Elements: ${imageElements?.length}, Statuses: ${
          Object.keys(imageStatuses || {}).length
        }, Target status: ${
          imageStatuses ? imageStatuses[frameToAttemptDraw] : "N/A"
        }`
      );
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "rgba(220, 220, 220, 0.7)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "#555";
      ctx.font = `${14 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Preparing viewer...", canvasWidth / 2, canvasHeight / 2);
      lastDrawnFrameInfo.current = {
        index: -1,
        status: "preparing",
        imageId: null,
      };
      return;
    }

    const imgToDraw = imageElements[frameToAttemptDraw];
    const statusToDraw = imageStatuses[frameToAttemptDraw];
    const currentImageId = imgToDraw?.src || null; // Use src as a proxy for image identity

    // More robust skip logic:
    // Skip if same frame, same 'loaded' status, AND same image source (in case color changed but frame index is same)
    // OR if same frame and same non-'loaded' status (e.g. still 'loading' or 'error')
    if (
      frameToAttemptDraw === lastDrawnFrameInfo.current.index &&
      statusToDraw === lastDrawnFrameInfo.current.status &&
      (statusToDraw === "loaded"
        ? currentImageId === lastDrawnFrameInfo.current.imageId
        : true)
    ) {
      return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (
      statusToDraw === "loaded" &&
      imgToDraw &&
      imgToDraw.complete && // Ensure image object reports completeness
      imgToDraw.naturalWidth > 0 // Ensure image has dimensions
    ) {
      ctx.save();
      // ... (drawing logic for imageFit 'contain' or 'cover' remains the same)
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
          drawWidth = canvasWidth;
          drawHeight = drawWidth / imgAspect;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvasWidth - drawWidth) / 2;
        }
      } else {
        // 'cover'
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
      // ---
      ctx.restore();
      lastDrawnFrameInfo.current = {
        index: frameToAttemptDraw,
        status: statusToDraw,
        imageId: currentImageId,
      };
    } else {
      ctx.fillStyle = "rgba(235, 235, 235, 0.8)"; // Slightly different placeholder for non-loaded
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (statusToDraw === "error") {
        ctx.fillStyle = "#777";
        ctx.font = `${11 * dpr}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(
          `Image Unavailable (Frame ${frameToAttemptDraw})`,
          canvasWidth / 2,
          canvasHeight / 2
        );
      }
      // No text for 'loading' or 'idle' to keep it cleaner, main UI handles that.
      lastDrawnFrameInfo.current = {
        index: frameToAttemptDraw,
        status: statusToDraw,
        imageId: null,
      };
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
    initialFrameActuallyLoaded,
    initialFrameIndex,
    log,
  ]);

  useEffect(() => {
    const rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [drawFrame]);
}
