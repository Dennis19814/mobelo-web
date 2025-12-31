/**
 * Authentication Utilities
 *
 * Simple utility functions to manage authentication state and prevent conflicts
 * between app owner and staff member sessions.
 */

/**
 * Clear all authentication data from localStorage
 * Ensures no conflicts when switching between owner and staff logins
 */
export function clearAllAuthData(): void {
  // Owner auth tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userApiKey');
  localStorage.removeItem('appSecretKey');

  // Staff auth tokens
  localStorage.removeItem('staff_access_token');
  localStorage.removeItem('staff_refresh_token');
  localStorage.removeItem('staff_user');
  localStorage.removeItem('staff_app');
}

/**
 * Clear only owner authentication data
 */
export function clearOwnerAuthData(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userApiKey');
  localStorage.removeItem('appSecretKey');
}

/**
 * Clear only staff authentication data
 */
export function clearStaffAuthData(): void {
  localStorage.removeItem('staff_access_token');
  localStorage.removeItem('staff_refresh_token');
  localStorage.removeItem('staff_user');
  localStorage.removeItem('staff_app');
}

/**
 * Check if user is authenticated as staff
 */
export function isStaffAuthenticated(): boolean {
  return !!localStorage.getItem('staff_access_token');
}

/**
 * Check if user is authenticated as owner
 */
export function isOwnerAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
