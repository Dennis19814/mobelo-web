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
  
  // Merchant panel data
  clearMerchantPanelData();
}

/**
 * Clear merchant panel related localStorage items
 * Removes all merchant-panel-section-{appId} keys
 */
export function clearMerchantPanelData(): void {
  // Clear all merchant panel section keys (we don't know all app IDs)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('merchant-panel-section-')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
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
  clearMerchantPanelData();
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
