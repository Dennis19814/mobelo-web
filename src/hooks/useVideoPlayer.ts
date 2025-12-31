'use client'

import { useState, useCallback } from 'react'

interface VideoPlayerState {
  isOpen: boolean
  videoUrl: string
  title: string
}

interface UseVideoPlayerReturn {
  isOpen: boolean
  videoUrl: string
  title: string
  openVideo: (videoUrl: string, title?: string) => void
  closeVideo: () => void
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isOpen: false,
    videoUrl: '',
    title: ''
  })

  const openVideo = useCallback((videoUrl: string, title: string = 'Video Player') => {
    setPlayerState({
      isOpen: true,
      videoUrl,
      title
    })
  }, [])

  const closeVideo = useCallback(() => {
    setPlayerState({
      isOpen: false,
      videoUrl: '',
      title: ''
    })
  }, [])

  return {
    isOpen: playerState.isOpen,
    videoUrl: playerState.videoUrl,
    title: playerState.title,
    openVideo,
    closeVideo
  }
}