/**
 * API-related type definitions
 */

// User Types
export interface User {
  id?: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
}

// Authentication Types
export interface LoginRequest {
  email: string
}

export interface LoginResponse {
  message: string
  success: boolean
}

export interface OTPVerificationRequest {
  email: string
  code: string
}

export interface OTPVerificationResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
}

// Generic API Response Types
export interface ApiResponse<T = any> {
  data: T
  message: string
  success: boolean
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Validation Types
export interface IdeaValidationResponse {
  status: 'VALID' | 'VAGUE' | 'INVALID'
  reason: string
  next_question: string | null
}

export interface AnswerValidationResponse {
  isValid: boolean
  feedback: string
  suggestions: string[]
  examples: string[]
}

// Conversation Types
export interface ConversationEntry {
  question: string
  answer: string
}

export interface ConversationResponse {
  question: string
  answer: string
}

export interface ConversationData {
  responses: ConversationResponse[]
  targetAudience: string
  features: string[]
  monetization: string
  timeline: string
}

export interface FollowupResponse {
  question: string
  isFinal: boolean
  context: string
  examples: string[]
  questionNumber: number
  totalQuestions: number
}

// Screen Generation Types
export interface ScreenGenerationRequest {
  screenId: number
  title: string
  description: string
  style?: string
  palette?: string
  font?: string
  imageType?: string
}

export interface ScreenGenerationResponse {
  html: string
  screenId: number
  deviceCompatibility?: any
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
}