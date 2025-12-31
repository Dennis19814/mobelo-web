import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'

export async function getAuthHeaders() {
  const cookieStore = cookies()
  const token = cookieStore.get('access_token')?.value
  const apiKey = cookieStore.get('api_key')?.value
  const appSecretKey = cookieStore.get('app_secret_key')?.value

  logger.debug('getAuthHeaders - Cookie extraction:', {
    hasAccessToken: !!token,
    hasApiKey: !!apiKey,
    hasAppSecretKey: !!appSecretKey,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
  })

  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // CRITICAL: Headers MUST be lowercase for dual-key authentication
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  if (appSecretKey) {
    headers['x-app-secret'] = appSecretKey
  }

  logger.debug('getAuthHeaders - Final headers:', {
    hasAuthorization: !!headers['Authorization'],
    hasApiKey: !!headers['x-api-key'],
    hasAppSecret: !!headers['x-app-secret']
  })

  return headers
}