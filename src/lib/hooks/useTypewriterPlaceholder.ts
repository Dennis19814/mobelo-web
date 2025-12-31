'use client'

import { useState, useEffect, useRef } from 'react'

interface UseTypewriterPlaceholderOptions {
  phrases: string[]
  typingSpeed?: number
  erasingSpeed?: number
  pauseDuration?: number
  startDelay?: number
}

export function useTypewriterPlaceholder({
  phrases,
  typingSpeed = 50,
  erasingSpeed = 30,
  pauseDuration = 2000,
  startDelay = 500,
}: UseTypewriterPlaceholderOptions) {
  const [displayText, setDisplayText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!phrases || phrases.length === 0) return

    const currentPhrase = phrases[phraseIndex]

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (isTyping) {
      // Typing phase
      if (charIndex < currentPhrase.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, charIndex + 1))
          setCharIndex(charIndex + 1)
        }, typingSpeed)
      } else {
        // Finished typing, pause then start deleting
        timeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setCharIndex(currentPhrase.length)
        }, pauseDuration)
      }
    } else {
      // Deleting phase
      if (charIndex > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, charIndex - 1))
          setCharIndex(charIndex - 1)
        }, erasingSpeed)
      } else {
        // Finished deleting, move to next phrase
        setIsTyping(true)
        setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        setCharIndex(0)
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [phrases, phraseIndex, charIndex, isTyping, typingSpeed, erasingSpeed, pauseDuration])

  // Initial delay
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [startDelay])

  if (!isReady) return ''
  
  return displayText
}