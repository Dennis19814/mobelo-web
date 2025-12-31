import { logger } from '@/lib/logger'
/**
 * Utility Functions
 * Reusable utility functions used throughout the application
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Converts a string to title case
 */
export function toTitleCase(str: string): string {
  return str.split(' ').map(word => capitalize(word)).join(' ')
}

/**
 * Converts kebab-case or snake_case to title case
 */
export function formatFeatureName(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Creates a delay/sleep function
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formats a timestamp to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMilliseconds = now.getTime() - dateObj.getTime()
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  
  return formatDate(dateObj)
}

/**
 * Generates a random ID string
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates a random number within a range
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitizes text input (removes HTML tags)
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Safely parses JSON with fallback
 */
export function safeParseJSON<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString)
  } catch {
    return fallback
  }
}

/**
 * Downloads data as a JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

/**
 * Checks if code is running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Gets item from localStorage safely
 */
export function getStorageItem(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Sets item in localStorage safely
 */
export function setStorageItem(key: string, value: string): boolean {
  if (!isBrowser()) return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Removes item from localStorage safely
 */
export function removeStorageItem(key: string): boolean {
  if (!isBrowser()) return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * Scrolls to element smoothly
 */
export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

/**
 * Creates a hash from string (simple hash function)
 */
export function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

/**
 * Detects if content is React Native, JSX, or HTML
 */
export function detectContentType(content: string): 'react-native' | 'html' | 'jsx' {
  logger.debug('🔍 Detecting content type for:', { preview: content.substring(0, 200) + '...' })
  
  if (!content || content.trim() === '') {
    logger.debug('❌ Empty content')
    return 'html'
  }

  // Clean content for analysis
  const cleanContent = content.trim()
  
  // Enhanced React Native import patterns
  const hasReactNativeImports = cleanContent.includes('react-native') || 
                               cleanContent.includes('expo') ||
                               cleanContent.includes('@expo/') ||
                               cleanContent.includes("from 'react-native'") ||
                               cleanContent.includes('from "react-native"') ||
                               cleanContent.includes('react-native-web')
  
  // Enhanced React Native component patterns - more comprehensive
  const rnComponentRegex = /\b(View|Text|ScrollView|TouchableOpacity|StyleSheet|SafeAreaView|StatusBar|FlatList|Image|TextInput|Pressable|ImageBackground|Dimensions|Platform|TouchableHighlight|SectionList|VirtualizedList|RefreshControl|ActivityIndicator|Modal|Switch|Picker|Slider|WebView)\b/
  const hasRNComponents = rnComponentRegex.test(cleanContent)
  
  // Expo-specific patterns
  const hasExpoImports = /@expo\/|expo-|Expo\.|expo\.io|expo\/|expo-router|expo-status-bar/i.test(cleanContent)
  
  // React Native function component patterns - more flexible
  const hasRNFunctionPattern = /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{[\s\S]*return\s*\([\s\S]*<(View|SafeAreaView|ScrollView|Text)/m.test(cleanContent) ||
                              /function\s+\w+\s*\(\s*\)\s*\{[\s\S]*return\s*\([\s\S]*<(View|SafeAreaView|ScrollView|Text)/m.test(cleanContent)
  
  // StyleSheet.create pattern
  const hasStyleSheet = /StyleSheet\.create\s*\(/i.test(cleanContent)
  
  // React Native specific style patterns
  const hasRNStyles = /flexDirection\s*:\s*['"`](row|column)['"`]/i.test(cleanContent) ||
                     /justifyContent\s*:\s*['"`](flex-start|flex-end|center|space-between|space-around|space-evenly)['"`]/i.test(cleanContent) ||
                     /alignItems\s*:\s*['"`](flex-start|flex-end|center|stretch|baseline)['"`]/i.test(cleanContent)
  
  // React Native specific props
  const hasRNProps = /onPress\s*=/.test(cleanContent) ||
                    /testID\s*=/.test(cleanContent) ||
                    /accessible\s*=/.test(cleanContent) ||
                    /accessibilityLabel\s*=/.test(cleanContent)
  
  // Check for React Native hooks/APIs
  const hasRNApis = /useDeviceOrientation|useDimensions|Keyboard\.|Alert\.|Linking\.|AppState\.|NetInfo\.|AsyncStorage\.|PermissionsAndroid/.test(cleanContent)
  
  // JSX patterns without React Native
  const hasJSX = /<[A-Z][a-zA-Z0-9]*[\s\S]*?>/.test(cleanContent) || 
                /<\/[A-Z][a-zA-Z0-9]*>/.test(cleanContent)
  
  // HTML patterns
  const hasHTMLTags = /<(html|head|body|div|span|p|h[1-6]|img|a|ul|ol|li|table|form|input|button)\b/i.test(cleanContent)
  const hasHTMLDoctype = /<!DOCTYPE\s+html/i.test(cleanContent)
  
  // Web-specific patterns that indicate it's NOT React Native
  const hasWebSpecific = /className\s*=/.test(cleanContent) ||
                         /onClick\s*=/.test(cleanContent) ||
                         /style\s*=\s*\{[\s\S]*?(display|margin|padding|border|background)/.test(cleanContent)
  
  logger.debug('🔍 Enhanced content analysis:', {
    hasReactNativeImports,
    hasRNComponents,
    hasExpoImports, 
    hasRNFunctionPattern,
    hasStyleSheet,
    hasRNStyles,
    hasRNProps,
    hasRNApis,
    hasJSX,
    hasHTMLTags,
    hasHTMLDoctype,
    hasWebSpecific
  })
  
  // Enhanced React Native detection - multiple criteria
  const rnScore = [
    hasReactNativeImports,
    hasRNComponents,
    hasExpoImports,
    hasRNFunctionPattern,
    hasStyleSheet,
    hasRNStyles,
    hasRNProps,
    hasRNApis
  ].filter(Boolean).length

  logger.debug('🎯 React Native score:', { score: rnScore, max: 8 })

  // If we have strong React Native indicators and no conflicting web patterns
  if (rnScore >= 2 && !hasWebSpecific) {
    logger.debug('✅ Detected React Native content (score-based)')
    return 'react-native'
  }
  
  // Fallback to original logic for edge cases
  if (hasReactNativeImports || hasRNComponents || hasExpoImports || hasRNFunctionPattern || hasStyleSheet) {
    logger.debug('✅ Detected React Native content (fallback)')
    return 'react-native'
  }
  
  // Check for HTML
  if (hasHTMLDoctype || hasHTMLTags) {
    logger.debug('✅ Detected HTML content')
    return 'html'
  }
  
  // Check for JSX
  if (hasJSX) {
    logger.debug('✅ Detected JSX content')
    return 'jsx'
  }
  
  logger.debug('⚠️ Defaulting to HTML content type')
  return 'html'
}