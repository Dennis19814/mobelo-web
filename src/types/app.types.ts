/**
 * App-related type definitions
 */

// Core App Types
export interface AppIdea {
  description: string
  platform: 'iOS' | 'Android' | 'iOS & Android'
}

export interface App {
  id: number
  name: string
  description?: string
  app_idea?: string
  conversation_data?: any
  status: 'draft' | 'published' | 'archived'
  logoUrl?: string
  logoMetadata?: {
    original: string
    sizes: {
      [key: string]: string // e.g., '512x512': 'https://cdn.../logo-512.webp'
    }
    cdnUrl?: string
    uploadedAt: Date
  }
  showAppNameWithLogo?: boolean
  vertical_id?: number | null
  theme_id?: string | null
  // user_id removed - authentication system disabled
  screens?: Screen[]
  created_at: Date
  updated_at: Date
}

export interface Screen {
  id: number
  step_number: number
  title: string
  description?: string
  html_blob?: string
  style?: any
  fonts?: any
  colours?: any
  images_style?: any
  status: 'pending' | 'in_progress' | 'completed'
  is_active: boolean
  app_id: number
  app?: App
  created_at: Date
  updated_at: Date
}

// App Feature Types
export interface Feature {
  name: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface AppFeature extends Feature {
  userStory: string
}

export interface AppScreen {
  name: string
  description: string
  elements: string[]
  actions: string[]
  features?: string[]
}

export interface UserFlow {
  name: string
  description: string
  steps: string[]
  screens: AppScreen[]
  priority: 'High' | 'Medium' | 'Low'
}

// Monetization Types
export interface MonetizationModel {
  type: 'Free' | 'Paid' | 'Freemium' | 'Subscription' | 'Ads'
  description: string
}

// Tech Stack Types
export interface TechStack {
  frontend: string[]
  backend: string[]
  database: string
  hosting: string
}

// App Summary Types
export interface AppSummaryData {
  title: string
  description: string
  features: Feature[]
  targetAudience: string
  monetization: MonetizationModel
  timeline: string
  techStack: TechStack
}

export interface AppSummaryResponse {
  title: string
  description: string
  targetAudience: string
  problemStatement: string
  valueProposition: string
  features: AppFeature[]
  userFlows?: UserFlow[]
  screens?: AppScreen[]
  monetization: string
  complexity: 'Simple' | 'Moderate' | 'Complex'
  timeline: string
  technicalRequirements: string[]
}

// Request/Response DTOs
export interface CreateAppRequest {
  name: string
  description?: string
  app_idea?: string
  conversation_data?: any
  status?: 'draft' | 'published' | 'archived'
}

export interface UpdateAppRequest {
  name?: string
  description?: string
  app_idea?: string
  conversation_data?: any
  status?: 'draft' | 'published' | 'archived'
}

export interface CreateScreenRequest {
  step_number: number
  title: string
  description?: string
  html_blob?: string
  style?: any
  fonts?: any
  colours?: any
  images_style?: any
  status?: 'pending' | 'in_progress' | 'completed'
  is_active?: boolean
}

export interface UpdateScreenRequest {
  step_number?: number
  title?: string
  description?: string
  html_blob?: string
  style?: any
  fonts?: any
  colours?: any
  images_style?: any
  status?: 'pending' | 'in_progress' | 'completed'
  is_active?: boolean
}

// Preview Screen Types (for UI)
export interface PreviewScreen {
  id: number
  name: string
  description: string
  status: 'completed' | 'pending'
  active?: boolean
  step_number: number
}

// User type removed - authentication system disabled