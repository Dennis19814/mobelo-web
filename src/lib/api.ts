// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.mobelo.dev'

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGOUT: '/api/auth/logout',
    SEND_OTP: '/api/auth/send-otp',
    RESEND_OTP: '/api/auth/resend-otp'
  },
  // App endpoints
  APPS: {
    CREATE: '/api/apps',
    LIST: '/api/apps',
    GET_BY_ID: (id: string) => `/api/apps/${id}`,
    UPDATE: (id: string) => `/api/apps/${id}`,
    DELETE: (id: string) => `/api/apps/${id}`
  }
} as const

// Helper function to build full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`
}

// Helper function to make authenticated API calls
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint)
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  return fetch(url, config)
}

const apiConfig = {
  API_ENDPOINTS,
  getApiUrl,
  apiCall
}

export default apiConfig