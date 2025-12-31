/**
 * Application Constants
 * Centralized configuration and constant values used throughout the application
 */

// App Configuration
export const APP_CONFIG = {
  name: 'Mobile App Designer',
  description: 'AI-powered mobile app design tool',
  version: '1.0.0',
  author: 'Mobile App Designer Team'
} as const

// Platform Options
export const PLATFORMS = {
  IOS: 'iOS',
  ANDROID: 'Android',
  BOTH: 'iOS & Android'
} as const

// App Status Options
export const APP_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const

// Screen Status Options  
export const SCREEN_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const

// Priority Levels
export const PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const

// Complexity Levels
export const COMPLEXITY = {
  SIMPLE: 'Simple',
  MODERATE: 'Moderate',
  COMPLEX: 'Complex'
} as const

// Monetization Types
export const MONETIZATION_TYPES = {
  FREE: 'Free',
  PAID: 'Paid', 
  FREEMIUM: 'Freemium',
  SUBSCRIPTION: 'Subscription',
  ADS: 'Ads'
} as const

// Validation Status
export const VALIDATION_STATUS = {
  VALID: 'VALID',
  VAGUE: 'VAGUE',
  INVALID: 'INVALID'
} as const

// Default Values
export const DEFAULTS = {
  appName: 'My App',
  questionDelay: 1500,
  summaryGenerationDelay: 2000,
  screenGenerationDelay: 2000,
  appsPerPage: 6,
  maxAppNameLength: 50,
  maxDescriptionLength: 500
} as const

// Mock Questions for Conversational Flow
export const MOCK_QUESTIONS = [
  "Who is your target audience for this app?",
  "What is the main problem your app solves?", 
  "How do you plan to monetize your app?",
  "What is your expected timeline for launch?"
] as const

// Feature Categories
export const FEATURE_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  SOCIAL: 'social',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  STORAGE: 'storage',
  CAMERA: 'camera',
  LOCATION: 'location',
  MESSAGING: 'messaging',
  MEDIA: 'media'
} as const

// Common Features List
export const COMMON_FEATURES = [
  'User registration',
  'User authentication', 
  'Push notifications',
  'Social media integration',
  'In-app purchases',
  'Offline functionality',
  'Real-time updates',
  'Analytics tracking',
  'Camera integration',
  'Location services',
  'File upload',
  'Search functionality',
  'User profiles',
  'Settings page',
  'Help & support'
] as const

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  APP_SUMMARY_DATA: 'appSummaryData',
  USER_PREFERENCES: 'userPreferences',
  DRAFT_DATA: 'draftData'
} as const

import { DEFAULT_API_PORT } from '@mobile-app-designer/shared-types';

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${DEFAULT_API_PORT}/api`,
  AUTH: '/auth',
  APPS: '/apps', 
  SCREENS: '/screens',
  USERS: '/users',
  HEALTH: '/health'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  APP_CREATED: 'App created successfully!',
  APP_UPDATED: 'App updated successfully!',
  APP_DELETED: 'App deleted successfully!',
  SCREEN_GENERATED: 'Screen generated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
} as const

// Component Test IDs (for testing)
export const TEST_IDS = {
  APP_IDEA_FORM: 'app-idea-form',
  FEATURE_SELECTION: 'feature-selection', 
  APP_SUMMARY: 'app-summary',
  PREVIEW_SCREEN: 'preview-screen',
  AUTH_MODAL: 'auth-modal',
  OTP_MODAL: 'otp-modal'
} as const