// components/features/products/VideoSection.jsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, Expand, Minimize } from "lucide-react"; // Using lucide for icons
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Close } from "@carbon/icons-react";
import Image from "next/image";

export default function VideoSection({ block }) {
  const {
    title: sectionTitle,
    description: sectionSubtitle,
    videoFile,
    posterImage,
    youtubeLink,
    aspectRatio = "16/9",
  } = block || {};

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showControls, setShowControls] = useState(false); // Controls only visible on hover initially
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const youtubeVideoId = youtubeLink
    ? new URLSearchParams(new URL(youtubeLink).search).get("v")
    : null;
  const youtubeEmbedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`
    : null;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch((e) => console.error("Video play error:", e));
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const openYouTubeOverlay = useCallback(() => {
    if (youtubeEmbedUrl) {
      videoRef.current?.pause();
      setIsPlaying(false);
      setIsOverlayOpen(true);
    } else {
      console.warn("No valid YouTube link provided for overlay.");
      // Optionally toggle local video play if no YouTube link
      togglePlay();
    }
  }, [youtubeEmbedUrl, togglePlay]);

  // Auto-play/pause on hover (muted only)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHovering) {
      if (video && isPlaying && !video.paused) {
        // Pause if leaving hover while playing
        video.pause();
        setIsPlaying(false);
      }
      setShowControls(false); // Hide controls on leave
      return;
    }

    setShowControls(true); // Show controls on hover

    // Only attempt hover-play if video exists and is muted
    if (video.muted) {
      video.play().catch((e) => console.error("Hover play error:", e));
      setIsPlaying(true);
    }
  }, [isHovering]); // Only depends on hover state

  // Update playing state based on video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  if (!videoFile?.asset?.url && !youtubeLink) {
    console.warn("VideoSection: Missing videoFile URL and youtubeLink.");
    return null; // Don't render if no video source
  }

  const hasLocalVideo = !!videoFile?.asset?.url;

  return (
    <section className="py-16 md:py-24 bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            {sectionTitle && (
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 text-white">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg md:text-xl text-gray-300">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        <Dialog open={isOverlayOpen} onOpenChange={setIsOverlayOpen}>
          <div
            className="aspect-video max-w-4xl mx-auto relative rounded-lg overflow-hidden shadow-xl bg-black group"
            style={{ aspectRatio: aspectRatio.replace("/", " / ") }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={!hasLocalVideo ? openYouTubeOverlay : undefined} // Click main area only if no local video
          >
            {hasLocalVideo && (
              <video
                ref={videoRef}
                src={videoFile.asset.url}
                poster={posterImage?.asset?.url}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted // Always muted for hover play
                loop
                preload="metadata"
                aria-label={sectionTitle || "Product video"}
              />
            )}
            {/* Render Poster Image if local video exists or as fallback */}
            {!hasLocalVideo && posterImage?.asset?.url && (
              <Image
                src={posterImage.asset.url}
                alt={posterImage.alt || sectionTitle || "Video Poster"}
                fill
                className="object-cover"
                priority // Load poster quickly
              />
            )}

            {/* Play/Pause/Expand Controls */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                "bg-black/30", // Slightly darker overlay always visible
                hasLocalVideo && !isPlaying && "opacity-100", // Show play icon when paused
                hasLocalVideo && isPlaying && !showControls && "opacity-0", // Hide pause when playing & not hovered
                hasLocalVideo && isPlaying && showControls && "opacity-100", // Show pause when playing & hovered
                !hasLocalVideo && "opacity-100 cursor-pointer" // Always show play for YouTube link
              )}
            >
              <Button
                variant="secondary"
                size="icon"
                className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                onClick={hasLocalVideo ? togglePlay : openYouTubeOverlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {hasLocalVideo ? (
                  isPlaying ? (
                    <PauseIcon className="w-8 h-8" />
                  ) : (
                    <PlayIcon className="w-8 h-8 fill-current" />
                  )
                ) : (
                  <PlayIcon className="w-8 h-8 fill-current" /> // Always show play for YouTube
                )}
              </Button>
            </div>

            {/* Expand button specifically for YouTube links */}
            {youtubeEmbedUrl && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute bottom-3 right-3 rounded-full w-9 h-9 z-20 transition-opacity duration-200 bg-black/40 hover:bg-black/60 text-white",
                  showControls ? "opacity-100" : "opacity-0" // Show on hover
                )}
                onClick={openYouTubeOverlay}
                aria-label="Watch on YouTube"
                title="Watch on YouTube"
              >
                <Expand size={18} />
              </Button>
            )}
          </div>

          {/* YouTube Overlay Content */}
          {youtubeEmbedUrl && (
            <DialogContent
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 bg-black border-none flex aspect-video" // Aspect ratio for video
              onInteractOutside={(e) => e.preventDefault()} // Keep open on outside click
            >
              <iframe
                src={youtubeEmbedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
              <DialogClose
                asChild
                className="absolute -top-2 -right-2 md:top-2 md:right-2 rounded-full opacity-80 hover:opacity-100 z-50"
              >
                <Button variant="secondary" size="icon" className="w-8 h-8">
                  <Close size={20} />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </section>
  );
}

// --- PropTypes ---
const AssetPropTypes = PropTypes.shape({
  url: PropTypes.string,
  // Add other asset fields if needed (mimeType, size etc.)
});

VideoSection.propTypes = {
  block: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    videoFile: PropTypes.shape({ asset: AssetPropTypes }),
    posterImage: PropTypes.shape({
      asset: AssetPropTypes,
      alt: PropTypes.string,
    }),
    youtubeLink: PropTypes.string,
    aspectRatio: PropTypes.string,
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }).isRequired,
};
