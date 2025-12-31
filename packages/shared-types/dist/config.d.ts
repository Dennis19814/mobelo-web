/**
 * Centralized Configuration for Mobile App Designer
 *
 * This file contains all shared configuration values that need to be
 * consistent across both frontend (Next.js) and backend (NestJS) applications.
 *
 * The configuration can be overridden by environment variables but provides
 * sensible defaults for development.
 */
/**
 * Application-wide configuration constants
 */
export declare const APP_CONFIG: {
    /**
     * API Configuration
     */
    readonly API: {
        /** Default port for the API server - UPDATED to match current backend */
        readonly DEFAULT_PORT: 3000;
        /** Default host for the API server */
        readonly DEFAULT_HOST: "localhost";
        /** Default protocol for the API server */
        readonly DEFAULT_PROTOCOL: "http";
    };
    /**
     * Frontend Configuration
     */
    readonly FRONTEND: {
        /** Default port for the frontend server */
        readonly DEFAULT_PORT: 5173;
        /** Default host for the frontend server */
        readonly DEFAULT_HOST: "localhost";
        /** Default protocol for the frontend server */
        readonly DEFAULT_PROTOCOL: "http";
    };
    /**
     * Authentication Configuration
     */
    readonly AUTH: {
        /** JWT expiry time */
        readonly JWT_EXPIRES_IN: "7d";
        /** OTP length */
        readonly OTP_LENGTH: 6;
        /** OTP expiry in minutes */
        readonly OTP_EXPIRY_MINUTES: 10;
    };
    /**
     * Get the base URL for the API (without /api suffix)
     * Respects environment variables: PORT, API_HOST, API_PROTOCOL
     */
    readonly API_BASE_URL: string;
    /**
     * Get the full API URL (with /api suffix)
     */
    readonly API_FULL_URL: string;
    /**
     * Get the frontend URL
     */
    readonly FRONTEND_URL: string;
};
/**
 * Export individual constants for convenience
 */
export declare const DEFAULT_API_PORT: 3000;
export declare const DEFAULT_API_HOST: "localhost";
export declare const DEFAULT_API_PROTOCOL: "http";
export declare const DEFAULT_FRONTEND_PORT: 5173;
export declare const DEFAULT_FRONTEND_HOST: "localhost";
export declare const DEFAULT_FRONTEND_PROTOCOL: "http";
/**
 * Export authentication constants
 */
export declare const JWT_EXPIRES_IN: "7d";
export declare const OTP_LENGTH: 6;
export declare const OTP_EXPIRY_MINUTES: 10;
/**
 * Helper function to build API URL
 * This is useful for proxy routes and API clients
 */
export declare function buildApiUrl(path?: string): string;
/**
 * Get the API base URL (without /api suffix)
 * This respects environment variables and provides consistent URL across the app
 */
export declare function getApiBaseUrl(): string;
/**
 * Get the full API URL (with /api suffix)
 * This is the most commonly used configuration for API calls
 */
export declare function getApiFullUrl(): string;
/**
 * Get the frontend URL
 */
export declare function getFrontendUrl(): string;
/**
 * Validate environment configuration
 */
export declare function validateConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Legacy exports for backward compatibility
 */
export declare const DEFAULT_API_URL: string;
