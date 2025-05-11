// components/features/products/VideoSection.jsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ExpandIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion"; // <<<< IMPORT ADDED HERE

/**
 * @typedef {object} VideoBlockSanity
 * @property {string} [_key]
 * @property {string} [_type]
 * @property {string} [sectionTitle]
 * @property {string} [sectionSubtitle]
 * @property {{asset?: {url: string, mimeType?: string}}} [videoFile]
 * @property {string} [videoUrl]
 * @property {{asset: {url: string, metadata?: {lqip?: string, dimensions?: {width: number, height: number}}}, alt: string}} posterImage
 * @property {string} [caption]
 * @property {boolean} [autoplay]
 * @property {boolean} [loop]
 * @property {boolean} [showControls]
 */

export default function VideoSection({ block }) {
  const {
    sectionTitle,
    sectionSubtitle,
    videoFile,
    videoUrl: externalVideoUrl,
    posterImage,
    caption,
    autoplay: initialAutoplay = false,
    loop = false,
    showControls: showNativeControls = true,
  } = block || {};

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialAutoplay);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);

  const finalVideoUrl = externalVideoUrl || videoFile?.asset?.url;

  const isYouTube =
    finalVideoUrl &&
    (finalVideoUrl.includes("youtube.com/watch") ||
      finalVideoUrl.includes("youtu.be/"));

  let youtubeEmbedUrl = null;
  if (isYouTube) {
    try {
      const url = new URL(finalVideoUrl);
      const videoId =
        url.hostname === "youtu.be"
          ? url.pathname.substring(1)
          : url.searchParams.get("v");
      if (videoId) {
        youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1`;
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video
        .play()
        .catch((error) => console.error("Error playing video:", error));
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const openLightbox = useCallback(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    setIsLightboxOpen(true);
  }, [isPlaying]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (!loop && video) video.currentTime = 0;
    };
    const handleVolumeChange = () => {
      if (video) setIsMuted(video.muted);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("volumechange", handleVolumeChange);

    if (initialAutoplay && video.muted) {
      video
        .play()
        .catch((error) => console.error("Error attempting autoplay:", error));
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [initialAutoplay, loop]);

  useEffect(() => {
    const isInlinePlayableVideo = finalVideoUrl && !isYouTube;
    if (!showNativeControls && isInlinePlayableVideo) {
      setShowCustomControls(isHoveringPlayer || isPlaying);
    } else {
      setShowCustomControls(false);
    }
  }, [
    isHoveringPlayer,
    isPlaying,
    showNativeControls,
    isYouTube,
    finalVideoUrl,
  ]);

  if (!finalVideoUrl) {
    if (process.env.NODE_ENV === "development")
      console.warn("VideoSection: Missing video source.");
    return null;
  }
  if (!posterImage?.asset?.url) {
    if (process.env.NODE_ENV === "development")
      console.warn("VideoSection: Missing poster image.");
    return null;
  }

  const isInlinePlayable = finalVideoUrl && !isYouTube;
  const dialogTitle = sectionTitle || posterImage.alt || "Video Player";
  const dialogDescription =
    sectionSubtitle || caption || `Playing video: ${dialogTitle}`;

  return (
    <section
      ref={playerContainerRef}
      className="h-screen relative flex flex-col justify-center items-start bg-black text-white overflow-hidden"
      onMouseEnter={() => setIsHoveringPlayer(true)}
      onMouseLeave={() => setIsHoveringPlayer(false)}
      aria-label={sectionTitle || "Featured Video"}
    >
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {isInlinePlayable ? (
          <video
            ref={videoRef}
            src={finalVideoUrl}
            poster={posterImage.asset.url}
            className="w-full h-full object-cover"
            playsInline
            loop={loop}
            muted={isMuted}
            controls={showNativeControls}
            aria-label={sectionTitle || posterImage.alt || "Product video"}
          />
        ) : (
          <Image
            src={posterImage.asset.url}
            alt={posterImage.alt || sectionTitle || "Video background"}
            fill
            className="object-cover"
            priority
            placeholder={posterImage.asset.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={posterImage.asset.metadata?.lqip}
            quality={85}
          />
        )}
      </div>

      <div
        className="absolute inset-0 z-[5] bg-gradient-to-r from-black/70 via-black/50 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="pl-0 md:pl-16">
          {(sectionTitle || sectionSubtitle) && (
            <div className="text-left max-w-xl md:max-w-2xl">
              {sectionTitle && (
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-3 sm:mb-4">
                  {sectionTitle}
                </h2>
              )}
              {sectionSubtitle && (
                <p className="text-lg sm:text-xl md:text-2xl text-neutral-300">
                  {sectionSubtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {(!isPlaying || isYouTube) && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300",
            isHoveringPlayer || !isPlaying || isYouTube
              ? "opacity-100"
              : "opacity-0"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={isInlinePlayable ? togglePlay : openLightbox}
            aria-label={
              isPlaying && isInlinePlayable ? "Pause video" : "Play video"
            }
          >
            {isPlaying && isInlinePlayable ? (
              <PauseIcon size={48} />
            ) : (
              <PlayIcon size={48} className="fill-current" />
            )}
          </Button>
        </div>
      )}

      {isInlinePlayable && !showNativeControls && showCustomControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-8 md:left-16 z-20 flex items-center gap-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="text-white hover:bg-white/20 w-10 h-10"
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-pressed={isPlaying}
          >
            {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20 w-10 h-10"
              aria-label={isMuted ? "Unmute" : "Mute"}
              aria-pressed={!isMuted}
            >
              {isMuted ? <VolumeXIcon size={22} /> : <Volume2Icon size={22} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={openLightbox}
              className="text-white hover:bg-white/20 w-10 h-10"
              aria-label="Open fullscreen player"
            >
              <ExpandIcon size={20} />
            </Button>
          </div>
        </div>
      )}

      {caption && !isLightboxOpen && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-16 md:translate-x-0 text-xs text-center md:text-right text-neutral-400 italic max-w-xs md:max-w-sm z-20 pointer-events-none">
          {caption}
        </p>
      )}

      <DialogPrimitive.Root
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
      >
        <DialogPrimitive.Portal forceMount>
          <AnimatePresence>
            {isLightboxOpen && (
              <>
                <DialogPrimitive.Overlay asChild forceMount>
                  <motion.div
                    className="fixed inset-0 z-[199] bg-black/90 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </DialogPrimitive.Overlay>
                <DialogPrimitive.Content
                  asChild
                  forceMount
                  onEscapeKeyDown={closeLightbox}
                >
                  <motion.div
                    className={cn(
                      "fixed left-1/2 top-1/2 z-[200] grid place-items-center overflow-hidden p-0 border-none",
                      "-translate-x-1/2 -translate-y-1/2",
                      "w-[calc(100vw-80px)] h-[calc(100vh-80px)]",
                      "max-w-none max-h-none rounded-xl shadow-2xl bg-black"
                    )}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    <VisuallyHidden asChild>
                      <DialogPrimitive.Title>
                        {dialogTitle}
                      </DialogPrimitive.Title>
                    </VisuallyHidden>
                    {dialogDescription && (
                      <VisuallyHidden asChild>
                        <DialogPrimitive.Description>
                          {dialogDescription}
                        </DialogPrimitive.Description>
                      </VisuallyHidden>
                    )}

                    <div className="relative w-full h-full">
                      {youtubeEmbedUrl ? (
                        <iframe
                          src={youtubeEmbedUrl}
                          title={
                            sectionTitle || posterImage.alt || "Video Player"
                          }
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        finalVideoUrl && (
                          <video
                            src={finalVideoUrl}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                            loop={loop}
                            muted={false} // Typically unmuted in lightbox
                            aria-label={
                              sectionTitle ||
                              posterImage.alt ||
                              "Lightbox video"
                            }
                          />
                        )
                      )}
                    </div>
                    <DialogPrimitive.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute rounded-full bg-black/50 hover:bg-black/70 text-white z-20",
                          "top-8 right-8",
                          "w-10 h-10 sm:w-11 sm:h-11"
                        )}
                        aria-label="Close video player"
                      >
                        <XIcon size={24} />
                      </Button>
                    </DialogPrimitive.Close>
                  </motion.div>
                </DialogPrimitive.Content>
              </>
            )}
          </AnimatePresence>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  );
}

VideoSection.propTypes = {
  block: PropTypes.shape({
    sectionTitle: PropTypes.string,
    sectionSubtitle: PropTypes.string,
    videoFile: PropTypes.shape({
      asset: PropTypes.shape({
        url: PropTypes.string,
        mimeType: PropTypes.string,
      }),
    }),
    videoUrl: PropTypes.string,
    posterImage: PropTypes.shape({
      asset: PropTypes.shape({
        url: PropTypes.string.isRequired,
        metadata: PropTypes.shape({
          lqip: PropTypes.string,
          dimensions: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number,
          }),
        }),
      }).isRequired,
      alt: PropTypes.string.isRequired,
    }).isRequired,
    caption: PropTypes.string,
    autoplay: PropTypes.bool,
    loop: PropTypes.bool,
    showControls: PropTypes.bool,
  }).isRequired,
};
