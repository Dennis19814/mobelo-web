/**
 * URL Hash Utilities
 *
 * Utilities for hashing and unhashing IDs in URLs for security/obfuscation.
 * Uses base64 encoding (btoa/atob) for simple obfuscation.
 */

/**
 * Hash an ID for use in URLs
 * @param id - The ID to hash (number or string)
 * @returns Base64 encoded hash of the ID
 */
export function hashId(id: number | string): string {
  if (id === null || id === undefined) {
    throw new Error('Cannot hash null or undefined ID')
  }
  return btoa(String(id))
}

/**
 * Unhash an ID from a URL
 * @param hashed - The hashed ID string
 * @returns The original ID as a number, or null if invalid
 */
export function unhashId(hashed: string | null): number | null {
  if (!hashed) {
    return null
  }

  try {
    const decoded = atob(hashed)
    const id = parseInt(decoded, 10)

    if (isNaN(id)) {
      console.error('[url-hash] Invalid ID after unhashing:', decoded)
      return null
    }

    return id
  } catch (error) {
    console.error('[url-hash] Error unhashing ID:', error)
    return null
  }
}
