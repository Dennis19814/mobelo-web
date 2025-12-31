/**
 * App Builder Configuration
 * Centralized constants for app-builder page
 */

export const APP_BUILDER_CONFIG = {
  // Prompt validation
  PROMPT_MAX_LENGTH: 10000,

  // Timeouts (in milliseconds)
  APP_TIMEOUT_MINUTES: 15,
  APP_TIMEOUT_MS: 15 * 60 * 1000,
  IFRAME_LOAD_TIMEOUT_MS: 10000,
  EXPO_SERVER_STARTUP_DELAY_MS: 2000,

  // UI Settings
  IFRAME_ZOOM: 0.65,
  COPY_FEEDBACK_DURATION_MS: 2000,
  COMMAND_HISTORY_LIMIT: 10
} as const

export type AppBuilderConfig = typeof APP_BUILDER_CONFIG
