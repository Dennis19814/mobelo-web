/**
 * Type definitions index
 * Central export point for all application types
 */

// Re-export all types from specific type files
export * from './app.types'
export * from './api.types'
export * from './ui.types'
export * from './category'

// Add missing auth types
export interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  apiKey?: string
  createdAt?: string
  updatedAt?: string
}

// Legacy types for backward compatibility
// These can be removed once all components are updated

// Keeping these temporarily for components that haven't been updated yet
export interface AppSummaryData {
  title: string
  description: string
  features: Feature[]
  targetAudience: string
  monetization: MonetizationModel
  timeline: string
  techStack: TechStack
}

export interface Feature {
  name: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface MonetizationModel {
  type: 'Free' | 'Paid' | 'Freemium' | 'Subscription' | 'Ads'
  description: string
}

export interface TechStack {
  frontend: string[]
  backend: string[]
  database: string
  hosting: string
}