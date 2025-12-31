'use client'
import { logger } from '@/lib/logger'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play, Loader2, AlertCircle, Volume2, VolumeX } from 'lucide-react'

interface VideoThumbnailProps {
  videoUrl: string
  thumbnailUrl?: string
  alt?: string
  width?: number
  height?: number
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  onPlay?: () => void
  onPause?: () => void
  onError?: (error: string) => void
  onDoubleClick?: () => void
  preload?: 'none' | 'metadata' | 'auto'
  poster?: string
  showFullscreenButton?: boolean
}

export default function VideoThumbnail({
  videoUrl,
  thumbnailUrl,
  alt = 'Video thumbnail',
  width = 400,
  height = 300,
  className = '',
  autoPlay = false,
  muted = true,
  loop = false,
  onPlay,
  onPause,
  onError,
  onDoubleClick,
  preload = 'metadata',
  poster,
  showFullscreenButton = false
}: VideoThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Handle video play/pause
  const handlePlayPause = async () => {
    if (!videoRef.current) return

    try {
      setIsLoading(true)
      setHasError(false)

      if (isPlaying) {
        await videoRef.current.pause()
        setIsPlaying(false)
        onPause?.()
      } else {
        // Ensure video is loaded before playing
        if (videoRef.current.readyState < 2) {
          await new Promise((resolve, reject) => {
            const handleLoadedData = () => {
              videoRef.current?.removeEventListener('loadeddata', handleLoadedData)
              videoRef.current?.removeEventListener('error', handleError)
              resolve(void 0)
            }
            
            const handleError = () => {
              videoRef.current?.removeEventListener('loadeddata', handleLoadedData)
              videoRef.current?.removeEventListener('error', handleError)
              reject(new Error('Failed to load video'))
            }

            videoRef.current?.addEventListener('loadeddata', handleLoadedData)
            videoRef.current?.addEventListener('error', handleError)
          })
        }

        await videoRef.current.play()
        setIsPlaying(true)
        setShowControls(true)
        onPlay?.()
      }
    } catch (error) {
      logger.error('Error playing video:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setHasError(true)
      onError?.('Failed to play video')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle video ended
  const handleVideoEnded = () => {
    setIsPlaying(false)
    if (!loop) {
      setShowControls(false)
    }
  }

  // Handle video error
  const handleVideoError = () => {
    logger.error('Video loading error')
    setHasError(true)
    setIsLoading(false)
    onError?.('Video failed to load')
  }

  // Handle mute toggle
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!isPlaying || !showControls) return

    const timer = setTimeout(() => {
      if (!isHovered) {
        setShowControls(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, showControls, isHovered])

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePlayPause()
    }
  }

  return (
    <div 
      className={`relative group cursor-pointer overflow-hidden bg-gray-900 ${className}`}
      style={{ width, height }}
      onClick={handlePlayPause}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={isPlaying ? 'Pause video' : 'Play video'}
    >
      {/* Video element - hidden until playing */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster || thumbnailUrl}
        muted={isMuted}
        loop={loop}
        preload={preload}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        playsInline
      />

      {/* Thumbnail image - shown when not playing */}
      {!isPlaying && thumbnailUrl && !hasError && (
        <Image
          src={thumbnailUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${width}px`}
          priority={false}
        />
      )}

      {/* Fallback for missing thumbnail */}
      {!isPlaying && !thumbnailUrl && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-80" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center text-white">
          <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
          <span className="text-sm text-center px-4">Video unavailable</span>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Play button overlay - shown when not playing */}
      {!isPlaying && !hasError && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full p-3 sm:p-4 transition-all duration-300 transform group-hover:scale-110">
            <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Video controls - shown during playback */}
      {isPlaying && (showControls || isHovered) && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none">
          <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
            <button
              onClick={handleMuteToggle}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 transition-all duration-200"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Video duration indicator (if available) */}
      {!isPlaying && videoRef.current?.duration && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {Math.floor(videoRef.current.duration / 60)}:{String(Math.floor(videoRef.current.duration % 60)).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}

// Export type for use in other components
export type { VideoThumbnailProps }