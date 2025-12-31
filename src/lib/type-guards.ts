/**
 * TypeScript type guards and validation utilities
 * Provides runtime type checking for better error handling
 */

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Check if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Check if value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if value is defined (not null, not undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0
}

/**
 * Check if object has a specific property
 */
export function hasProperty<T extends Record<string, unknown>, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return prop in obj
}

/**
 * Safe property access with type checking
 */
export function getProperty<T>(
  obj: unknown,
  prop: string,
  defaultValue: T
): T {
  if (isObject(obj) && hasProperty(obj, prop)) {
    const value = obj[prop]
    return isDefined(value) ? (value as T) : defaultValue
  }
  return defaultValue
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: (keyof T)[]
): obj is T {
  if (!isObject(obj)) return false
  
  return requiredFields.every(field => 
    hasProperty(obj, String(field)) && isDefined(obj[String(field)])
  )
}

/**
 * Type-safe error handling
 */
export function assertIsError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) {
    throw new Error('Expected error instance')
  }
}

/**
 * Check if value is a valid React component props object
 */
export function isValidProps(value: unknown): value is Record<string, unknown> {
  return isObject(value) || value === null || value === undefined
}