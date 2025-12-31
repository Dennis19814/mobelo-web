'use client'

import { TypeAnimation } from 'react-type-animation'

interface TypewriterTextProps {
  className?: string
}

export function TypewriterText({ className = '' }: TypewriterTextProps) {
  return (
    <TypeAnimation
      sequence={[
        'Create a fitness tracker with AI-powered workout plans...',
        2000, // Wait 2s
        '', // Delete everything
        500, // Small pause after deletion
        'Build a recipe app with step-by-step video tutorials...',
        2000,
        '',
        500,
        'Design a meditation app with guided breathing exercises...',
        2000,
        '',
        500,
        'Develop a language learning app with native speakers...',
        2000,
        '',
        500,
        'Make a pet care app with vet consultations and health tracking...',
        2000,
        '',
        500,
        'Create a budget tracker with smart spending insights...',
        2000,
        '',
        500,
        'Build a habit tracker with motivational rewards...',
        2000,
        '',
        500,
        'Design a travel planner with local recommendations...',
        2000,
        '',
        500,
        'Develop a music learning app with interactive lessons...',
        2000,
        '',
        500,
        'Make a plant care app with disease detection...',
        2000,
        '',
        500,
      ]}
      wrapper="span"
      speed={50}
      deletionSpeed={25}
      className={className}
      style={{ display: 'inline-block' }}
      repeat={Infinity}
    />
  )
}