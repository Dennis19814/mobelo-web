'use client'
import { logger } from '@/lib/logger'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import Modal from './Modal'

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title?: string
  autoPlay?: boolean
  className?: string
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  title = 'Video Player',
  autoPlay = true,
  className = ''
}: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<number | undefined>(undefined)

  // Initialize video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      setIsLoading(true)
      if (autoPlay) {
        handlePlay()
      }
    } else {
      // Reset states when modal closes
      setIsPlaying(false)
      setCurrentTime(0)
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, videoUrl, autoPlay])

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && showControls) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying, showControls])

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current) return

    try {
      if (isPlaying) {
        await videoRef.current.pause()
        setIsPlaying(false)
      } else {
        await handlePlay()
      }
    } catch (error) {
      logger.error('Error controlling video playback:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    }
  }, [isPlaying])

  const handlePlay = async () => {
    if (!videoRef.current) return

    try {
      setIsLoading(true)
      await videoRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      logger.error('Error playing video:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return

    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return

    if (isMuted) {
      videoRef.current.volume = volume
      videoRef.current.muted = false
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      videoRef.current.muted = true
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // Handle seek
  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle skip forward/backward
  const handleSkip = useCallback((seconds: number) => {
    if (!videoRef.current) return

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    handleSeek(newTime)
  }, [duration, currentTime])

  // Handle playback speed change
  const handleSpeedChange = () => {
    if (!videoRef.current) return
    
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    
    videoRef.current.playbackRate = nextSpeed
    setPlaybackSpeed(nextSpeed)
  }

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (error) {
      logger.error('Fullscreen error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    }
  }, [isFullscreen])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSkip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSkip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
        case 'KeyM':
          e.preventDefault()
          handleMuteToggle()
          break
        case 'KeyF':
          e.preventDefault()
          handleFullscreenToggle()
          break
        case 'Escape':
          if (!isFullscreen) {
            onClose()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isPlaying, volume, currentTime, duration, isFullscreen, handlePlayPause, handleSkip, handleVolumeChange, handleMuteToggle, handleFullscreenToggle, onClose])

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      className={`bg-black ${className}`}
      showCloseButton={false}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full bg-black flex items-center justify-center"
        onMouseMove={() => {
          setShowControls(true)
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
          }
        }}
        onClick={(e) => {
          // Only toggle play/pause if clicking on video area, not controls
          if (e.target === videoRef.current || e.target === containerRef.current) {
            handlePlayPause()
          }
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration)
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime)
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          playsInline
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
            <h3 className="text-white text-lg font-semibold truncate">{title}</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 p-2"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Play Button (when paused) */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-colors"
              >
                <Play className="w-12 h-12 text-white ml-1" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleSkip(-10)}
                  className="text-white hover:text-gray-300"
                  title="Rewind 10s"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-gray-300"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" fill="currentColor" />}
                </button>

                <button
                  onClick={() => handleSkip(10)}
                  className="text-white hover:text-gray-300"
                  title="Forward 10s"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-gray-300"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>

                {/* Time Display */}
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Playback Speed */}
                <button
                  onClick={handleSpeedChange}
                  className="text-white hover:text-gray-300 text-sm px-2 py-1 rounded border border-white/30"
                  title="Playback speed"
                >
                  {playbackSpeed}x
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={handleFullscreenToggle}
                  className="text-white hover:text-gray-300"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Export type for use in other components
export type { VideoPlayerModalProps }