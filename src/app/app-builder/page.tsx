'use client'
import { useState, useEffect, Suspense, useRef, useCallback, useMemo, memo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Send, Download, ChevronRight, Loader2, Copy, Check, Bot, Video, HelpCircle, RefreshCw, ExternalLink, MessageCircle, ArrowUp, Info } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useJobSocket } from '@/hooks/useJobSocket'
import { usePublishSocket } from '@/hooks/usePublishSocket'
import { useTimeouts } from '@/hooks/useTimeouts'
import { useAbortController } from '@/hooks/useAbortController'
import { useSearchParams } from 'next/navigation'
import { httpClient } from '@/lib/http-client'
import { apiService } from '@/lib/api-service'
import { unhashId, hashId } from '@/lib/url-hash'
import { logger, type LogContext } from '@/lib/logger'
import { APP_BUILDER_CONFIG } from '@/lib/app-builder-config'
import toast from 'react-hot-toast'
import { PublishProgressModal } from '@/components/modals/PublishProgressModal'
import { DownloadSourceModal } from '@/components/modals/DownloadSourceModal'
import { AppStorePublishModal } from '@/components/modals/AppStorePublishModal'

interface ExpoInfo {
  qrCode: string
  webUrl: string
  port: number
}

interface ChatMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  type?: 'stdout' | 'stderr' | 'completion'
  timestamp?: Date
  sessionId?: string
}

const WELCOME_MESSAGE = "Hi! I'm your AI developer. Describe the mobile app change and I'll change it for you."
const isAppGenSession = (sessionId?: string | null) => !!sessionId && sessionId.startsWith('appgen-')
const formatTime = (date?: Date) => {
  if (!date) return ''
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
const getRunLabel = (sessionId?: string | null) => {
  if (!sessionId || !isAppGenSession(sessionId)) return null
  const parts = sessionId.split('-')
  const last = parts[1] || parts[parts.length - 1]
  return `Run ${last}`
}

// Helper function to get user initials for avatar
const getUserInitials = (user: { firstName?: string; lastName?: string; email?: string } | null): string => {
  if (!user) return 'U'
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  return 'U'
}

function AppBuilderContent() {
  const router = useRouter()
  const [userInput, setUserInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Debug: Track chatMessages changes
  useEffect(() => {
    logger.debug('💬 [ChatHistory] chatMessages state changed', {
      count: chatMessages.length,
      messages: chatMessages.map(m => ({ role: m.role, contentPreview: m.content.substring(0, 30) }))
    })
  }, [chatMessages])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null)
  const [apiExpoInfo, setApiExpoInfo] = useState<ExpoInfo | null>(null)
  const [isLoadingExpoInfo, setIsLoadingExpoInfo] = useState(false)
  const [isAppRunning, setIsAppRunning] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [hasObservedExpiration, setHasObservedExpiration] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeError, setIframeError] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null)
  const [isClaudeExecuting, setIsClaudeExecuting] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [totalHistoryCount, setTotalHistoryCount] = useState(0)
  const [hideProgressBar, setHideProgressBar] = useState(false)
  const [activeJobSessionId, setActiveJobSessionId] = useState<string | null>(null)
  const [pendingAppId, setPendingAppId] = useState<number | null>(null)
  const [showSidePanel, setShowSidePanel] = useState<boolean>(true)
  const [progressState, setProgressState] = useState<{
    percent: number
    message: string
    status: 'idle' | 'running' | 'completed' | 'failed'
    updatedAt: Date | null
  }>({
    percent: 0,
    message: '',
    status: 'idle',
    updatedAt: null
  })
  const [showPlayModal, setShowPlayModal] = useState(false)
  const progressHistoryFetchedRef = useRef(false)
  const [playForm, setPlayForm] = useState({
    packageName: '',
    track: 'internal',
    appTitle: '',
    shortDescription: '',
    fullDescription: '',
    serviceAccountJson: '',
    contactEmail: '',
    buildType: 'aab'
  })
  const [showAppStoreModal, setShowAppStoreModal] = useState(false)
  const [appStoreForm, setAppStoreForm] = useState({
    bundleId: '',
    apiKey: '',
    appName: '',
    subtitle: '',
    description: '',
    keywords: '',
    primaryLanguage: 'en-US',
    supportUrl: '',
    privacyPolicyUrl: '',
    contactEmail: '',
    track: 'testflight-internal',
    buildType: 'ipa'
  })
  const [isSubmittingAppStore, setIsSubmittingAppStore] = useState(false)
  const [showPublishProgressModal, setShowPublishProgressModal] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishStatus, setPublishStatus] = useState('pending')
  const [publishStep, setPublishStep] = useState('')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishJobId, setPublishJobId] = useState<number | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [existingDownloadJob, setExistingDownloadJob] = useState<any>(null)
  const [isSubmittingPlay, setIsSubmittingPlay] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Centralized timeout management with automatic cleanup
  const timeouts = useTimeouts()
  const iframeTimeoutIdRef = useRef<number | undefined>(undefined)
  const reloadTimeoutIdRef = useRef<number | undefined>(undefined)
  const lastProcessedReloadTimestampRef = useRef<string | null>(null)
  const lastProcessedRestartTimestampRef = useRef<string | null>(null)
  const previousSocketExpoInfoRef = useRef<ExpoInfo | null>(null)
  // Tracks the timestamp when a restart was requested; used by polling fallback to detect completion
  const restartRequestedAtRef = useRef<number | null>(null)

  // Centralized request cancellation with automatic cleanup
  const abortController = useAbortController()

  const searchParams = useSearchParams()
  const hashedAppId = searchParams?.get('appId')
  const appId = hashedAppId ? unhashId(hashedAppId) : null
  const isCreating = searchParams?.get('creating') === 'true'

  // Debug: Log appId changes
  useEffect(() => {
    logger.debug('🔑 [ChatHistory] appId changed', { hashedAppId, appId, searchParams: searchParams?.toString() })
  }, [appId, hashedAppId, searchParams])

  // Responsive: show side panel by default on desktop, hide on mobile
  useEffect(() => {
    const setFromWidth = () => {
      if (typeof window === 'undefined') return
      setShowSidePanel(window.innerWidth >= 1024)
    }
    setFromWidth()
    window.addEventListener('resize', setFromWidth)
    return () => window.removeEventListener('resize', setFromWidth)
  }, [])

  // Redirect to home if appId is invalid
  useEffect(() => {
    if (hashedAppId && !appId) {
      logger.error('[AppBuilder] Invalid hashed appId, redirecting to home')
      router.push('/')
    }
  }, [hashedAppId, appId, router])

  // Connect to Socket.io for real-time Expo updates and Claude output
  const { socket, expoInfo: socketExpoInfo, appTimeoutEvent, appRestartedEvent, appReloadedEvent, claudeOutputEvent, claudeCodeProgressEvent, lastEvent } = useJobSocket(userId)

  // Publish socket hook for Google Play publishing progress
  const { publishProgress: socketPublishProgress, publishComplete, publishFailed } = usePublishSocket(userId)

  // Merge Socket.io and API expo info (Socket.io takes precedence)
  // Use useMemo to prevent creating new object reference on every render
  const expoInfo = useMemo(() => socketExpoInfo || apiExpoInfo, [socketExpoInfo, apiExpoInfo])

  // DEBUG: Log expoInfo changes
  useEffect(() => {
    console.log('🔍 [EXPO INFO DEBUG] Current expoInfo:', {
      expoInfo,
      socketExpoInfo,
      apiExpoInfo,
      source: socketExpoInfo ? 'SOCKET' : apiExpoInfo ? 'API' : 'NONE',
      webUrl: expoInfo?.webUrl,
      qrCode: expoInfo?.qrCode,
      port: expoInfo?.port,
      isAppRunning,
      iframeLoaded,
      iframeKey
    });
  }, [expoInfo, socketExpoInfo, apiExpoInfo, isAppRunning, iframeLoaded, iframeKey]);

  // Fetch and replay progress history on page load or reconnection
  useEffect(() => {
    const fetchProgressHistory = async () => {
      if (!appId || progressHistoryFetchedRef.current) return;

      try {
        logger.debug('[AppBuilder] Fetching content generation progress history', { appId });
        const response = await apiService.getContentGenerationJobByApp(Number(appId));

        if (response.ok && response.data?.progressHistory) {
          const history = response.data.progressHistory;
          logger.debug('[AppBuilder] Progress history fetched', { historyCount: history.length });

          // Batch add all new history messages in a single setState call
          setChatMessages(prev => {
            const existingMessageTexts = new Set(prev.map(m => m.content));

            const newMessages = history
              .filter(entry => !existingMessageTexts.has(entry.message))
              .map(entry => ({
                role: 'assistant' as const,
                content: entry.message,
                timestamp: new Date(entry.timestamp)
              }));

            if (newMessages.length > 0) {
              logger.debug('[AppBuilder] Adding new progress messages', { count: newMessages.length });
              return [...prev, ...newMessages];
            }
            return prev;
          });

          // Mark as fetched to prevent re-fetching
          progressHistoryFetchedRef.current = true;

          // Update generating state based on job status
          if (response.data.status === 'in_progress' || response.data.status === 'pending') {
            setIsGenerating(true);
          } else if (response.data.status === 'completed' || response.data.status === 'failed') {
            setIsGenerating(false);
          }
        }
      } catch (error) {
        logger.error('[AppBuilder] Error fetching progress history:', { error });
        // Silent fail - don't disrupt user experience
      }
    };

    // Fetch on initial load and when Socket.io connects
    if (appId && socket) {
      fetchProgressHistory();
    }
  }, [appId, socket]);

  // Define handleRestartApp before any useEffects that use it
  const handleRestartApp = useCallback(async () => {
    if (!appId) return

    try {
      // Capture restart request time BEFORE queuing — polling fallback uses this to detect completion
      restartRequestedAtRef.current = Date.now()
      setIsRestarting(true)
      logger.debug('[AppBuilder] Restarting app:', { appId })
      await apiService.restartApp(Number(appId), abortController.getSignal())
      logger.debug('[AppBuilder] Restart queued — socket event or polling will detect completion')
      // Wait for appRestartedEvent (socket) OR polling fallback to update state and reload iframe
    } catch (error: unknown) {
      logger.error('[AppBuilder] Error restarting app:', { error })
      setIsRestarting(false)
      restartRequestedAtRef.current = null

      // Better error messages
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
      let errorMessage = 'Failed to restart app. Please try again.'

      if (err.response?.status === 404) {
        errorMessage = 'App not found. It may have been deleted.'
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many restart requests. Please wait a moment.'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      toast.error(errorMessage)
    }
    // abortController deliberately excluded from deps (new object on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId])

  // Define handleReloadApp — triggers a full app restart (npm install + --reset-cache + Expo start).
  // This is the correct behavior for the 🔄 button: theme changes, new packages, and config
  // changes all require a full restart via ExpoRunnerService, not just an iframe reload.
  // The restart flow (polling + socket) handles iframe reload once Expo is back up.
  const handleReloadApp = useCallback(() => {
    if (!appId || isRestarting) return
    handleRestartApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, isRestarting, handleRestartApp])

  // Memoize handleCopy to prevent recreation
  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedField(field)
        timeouts.setTimeout(() => setCopiedField(null), APP_BUILDER_CONFIG.COPY_FEEDBACK_DURATION_MS)
      })
      .catch((err) => {
        logger.error('[AppBuilder] Failed to copy to clipboard:', err)
      })
  }, [timeouts])

  // Auto-resize textarea: grow up to 5 lines, then show scrollbar
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate line height (approximate based on font size and padding)
    // Using computed styles for accuracy
    const computedStyle = window.getComputedStyle(textarea)
    const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0
    
    // Max height for 5 lines
    const maxHeight = lineHeight * 5 + paddingTop + paddingBottom
    
    // Current scroll height
    const scrollHeight = textarea.scrollHeight
    
    // Set height: min of scrollHeight and maxHeight
    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${scrollHeight}px`
      textarea.style.overflowY = 'hidden'
    } else {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
    }
  }, [])

  // Handle iframe load success
  const handleIframeLoad = useCallback(() => {
    logger.debug('[AppBuilder] iframe loaded successfully')
    setIframeLoaded(true)
    setIframeError(false)

    // Clear timeout if iframe loads successfully
    if (iframeTimeoutIdRef.current !== undefined) {
      timeouts.clearTimeout(iframeTimeoutIdRef.current)
      iframeTimeoutIdRef.current = undefined
    }
  }, [timeouts])

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    logger.error('[AppBuilder] iframe failed to load')
    setIframeError(true)
    setIframeLoaded(false)

    // Clear timeout
    if (iframeTimeoutIdRef.current !== undefined) {
      timeouts.clearTimeout(iframeTimeoutIdRef.current)
      iframeTimeoutIdRef.current = undefined
    }
  }, [timeouts])

  // Manual iframe refresh
  const handleRefreshIframe = useCallback(() => {
    logger.debug('[AppBuilder] Manually refreshing iframe')
    setIframeError(false)
    setIframeLoaded(false)
    setIframeKey(prev => prev + 1)
  }, [])

  // Load chat history from database
  const loadChatHistory = useCallback(async (loadMore: boolean = false) => {
    logger.debug('📥 [ChatHistory] loadChatHistory called', { appId, loadMore })

    if (!appId) {
      logger.debug('⚠️ [ChatHistory] No appId, aborting load')
      return
    }

    if (!userId) {
      logger.debug('⚠️ [ChatHistory] No userId, user not authenticated')
      return
    }

    try {
      setIsLoadingHistory(true)

      // Use functional state to get current offset to avoid dependency issues
      let currentOffset = 0
      if (loadMore) {
        setHistoryOffset(prev => {
          currentOffset = prev
          return prev
        })
      }

      const limit = 100

      logger.debug('[AppBuilder] Loading chat history:', { appId, offset: currentOffset, limit, loadMore })
      logger.debug('🌐 [ChatHistory] Making API call', { url: `/v1/platform/apps/${appId}/chat-history`, offset: currentOffset, limit })

      const response = await httpClient.get(`/v1/platform/apps/${appId}/chat-history?limit=${limit}&offset=${currentOffset}`, {
        signal: abortController.getSignal()
      })
      const data = response.data

      logger.debug('📦 [ChatHistory] API response received', {
        messagesCount: data.messages?.length,
        total: data.total,
        hasMore: data.hasMore,
        rawData: data
      })

      logger.debug('[AppBuilder] Chat history loaded:', {
        messagesCount: data.messages?.length,
        total: data.total,
        hasMore: data.hasMore
      })

      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          type: msg.type,
          sessionId: msg.sessionId,
          timestamp: msg.createdAt ? new Date(msg.createdAt) : undefined
        }))

        logger.debug('✨ [ChatHistory] Formatted messages', { count: formattedMessages.length, formattedMessages })

        if (loadMore) {
          // Prepend older messages to the beginning
          logger.debug('➕ [ChatHistory] Prepending messages (Load More)')
          setChatMessages(prev => {
            const newMessages = [...formattedMessages, ...prev]
            logger.debug('📝 [ChatHistory] New message count after prepend:', { count: newMessages.length })
            return newMessages
          })
        } else {
          // Initial load - set messages from history only (welcome is added after successful build)
          logger.debug('🎯 [ChatHistory] Setting initial messages from history only')
          const latestAppGen = [...formattedMessages].reverse().find(m => isAppGenSession(m.sessionId))
          const filteredMessages = latestAppGen
            ? formattedMessages.filter(m => !isAppGenSession(m.sessionId) || m.sessionId === latestAppGen.sessionId)
            : formattedMessages

          setChatMessages(filteredMessages)

          if (latestAppGen?.sessionId) {
            setActiveJobSessionId(latestAppGen.sessionId)
            setProgressState(prev => ({
              percent: prev.percent || 0,
              message: latestAppGen.content || 'Restoring build progress…',
              status: 'running',
              updatedAt: latestAppGen.timestamp || new Date()
            }))
          }
        }

        setHasMoreHistory(data.hasMore || false)
        setTotalHistoryCount(data.total || 0)
        setHistoryOffset(currentOffset + formattedMessages.length)

        logger.debug('✅ [ChatHistory] State updated successfully', {
          hasMore: data.hasMore,
          total: data.total,
          newOffset: currentOffset + formattedMessages.length
        })
      } else {
        logger.debug('⚠️ [ChatHistory] No messages in response or invalid format')
      }
    } catch (error: any) {
      logger.error('❌ [ChatHistory] Error loading chat history:', error)
    } finally {
      setIsLoadingHistory(false)
      setIsInitialLoad(false)
      logger.debug('🏁 [ChatHistory] loadChatHistory finished')
    }
    // abortController deliberately excluded from deps (new object on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, userId])

  // Save chat message to database
  const saveChatMessage = useCallback(async (message: ChatMessage) => {
    logger.debug('💾 [ChatHistory] saveChatMessage called', { appId, role: message.role, contentPreview: message.content.substring(0, 50) })

    if (!appId || !userId) {
      logger.debug('⚠️ [ChatHistory] No appId or userId, aborting save')
      return
    }

    try {
      logger.debug('[AppBuilder] Saving chat message:', { appId, role: message.role })
      logger.debug('🌐 [ChatHistory] Posting to API', { url: `/v1/platform/apps/${appId}/chat-history` })

      await httpClient.post(`/v1/platform/apps/${appId}/chat-history`, {
        role: message.role,
        content: message.content,
        type: message.type || null,
        sessionId: message.sessionId || null
      }, {
        signal: abortController.getSignal()
      })

      logger.debug('✅ [ChatHistory] Message saved successfully')
    } catch (error: any) {
      logger.error('❌ [ChatHistory] Error saving message:', error)
      // Don't fail the UI if save fails - just log it
    }
    // abortController deliberately excluded from deps (new object on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, userId])

  // Get userId from localStorage on mount and listen for changes
  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('user')
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      console.log('🔍 [AUTH DEBUG] loadUserData called')
      console.log('🔍 [AUTH DEBUG] localStorage contents:', {
        hasUserData: !!userData,
        userDataLength: userData?.length,
        userDataPreview: userData?.substring(0, 100),
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        accessTokenPreview: accessToken?.substring(0, 20) + '...',
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length,
        allKeys: Object.keys(localStorage)
      })

      logger.debug('[AppBuilder] Retrieved user data from localStorage:', { userData })

      const setFromUserObject = (parsedUser: any) => {
        if (parsedUser?.id) {
          console.log('✅ [AUTH DEBUG] Setting userId from parsed user:', parsedUser.id)
          logger.debug('[AppBuilder] Setting userId from parsed user:', parsedUser.id)
          localStorage.setItem('user', JSON.stringify(parsedUser))
          setUserId(parsedUser.id)
          setUser(parsedUser)
          return true
        }
        console.log('❌ [AUTH DEBUG] parsedUser has no id:', parsedUser)
        return false
      }

      // 1) Try cached user first
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          console.log('🔍 [AUTH DEBUG] Parsed user from localStorage:', parsedUser)
          if (setFromUserObject(parsedUser)) {
            console.log('✅ [AUTH DEBUG] Successfully loaded user from localStorage cache')
            return
          }
          logger.warn('[AppBuilder] User object exists but has no id field')
          console.log('⚠️ [AUTH DEBUG] User object exists but has no id field')
        } catch (error) {
          logger.error('[AppBuilder] Error parsing user data:', { error })
          console.log('❌ [AUTH DEBUG] Error parsing user data:', error)
        }
      }

      // 2) Fallback: fetch user from token to restore userId (production often missing localStorage user)
      if (accessToken) {
        console.log('🔍 [AUTH DEBUG] No cached user, attempting to restore from validate-token API')
        logger.debug('[AppBuilder] No cached user, attempting to restore from validate-token API', { hasAccessToken: !!accessToken })
        httpClient.get('/v1/platform/auth/validate-token')
          .then(response => {
            console.log('🔍 [AUTH DEBUG] validate-token API response:', {
              status: response.status,
              data: response.data,
              user: response.data?.user
            })
            logger.debug('[AppBuilder] validate-token response received:', {
              status: response.status,
              hasData: !!response.data,
              hasUser: !!response.data?.user,
              userId: response.data?.user?.id
            })
            const fetchedUser = response.data?.user
            if (setFromUserObject(fetchedUser)) {
              logger.debug('[AppBuilder] ✅ Successfully restored user from validate-token endpoint', { userId: fetchedUser.id })
              console.log('✅ [AUTH DEBUG] Successfully restored user from validate-token')
              return
            }
            console.log('❌ [AUTH DEBUG] validate-token returned no user id, clearing session')
            logger.warn('[AppBuilder] ⚠️ validate-token returned no user id, clearing session', { response: response.data })
            localStorage.removeItem('user')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setUserId(null)
            setUser(null)
          })
          .catch(err => {
            console.log('❌ [AUTH DEBUG] validate-token API failed:', {
              error: err,
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data
            })
            logger.error('[AppBuilder] ❌ Failed to restore user from validate-token:', {
              error: err instanceof Error ? err.message : String(err),
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data
            })
            // Clear all auth data on API failure
            localStorage.removeItem('user')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setUserId(null)
            setUser(null)
          })
        return
      }

      console.log('⚠️ [AUTH DEBUG] No user data or access token found! Socket.io will not connect.')
      logger.warn('[AppBuilder] ⚠️ No user data or access token found! Socket.io will not connect.')
      setUserId(null)
      setUser(null)
    }

    // Initial load
    loadUserData()

    // Listen for storage events (cross-tab changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        logger.debug('[AppBuilder] Storage event detected for user data')
        loadUserData()
      }
    }

    // Listen for custom events (same-tab changes)
    const handleAuthChange = (e: Event) => {
      logger.debug('[AppBuilder] Auth change event detected')
      loadUserData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-changed', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-changed', handleAuthChange)
    }
  }, [])

  // Handle app creation when navigating from app-spec page
  useEffect(() => {
    const creating = searchParams?.get('creating')

    if (creating === 'true' && userId && !appId) {
      logger.debug('[AppBuilder] Creating app from spec data')

      // Retrieve app creation data from sessionStorage
      const appCreationDataStr = sessionStorage.getItem('appCreationData')
      if (!appCreationDataStr) {
        logger.error('[AppBuilder] No app creation data found in sessionStorage')
        router.push('/')
        return
      }

      try {
        const appCreationData = JSON.parse(appCreationDataStr)

        // Log customizations data for debugging
        logger.debug('[AppBuilder] Creating app with customizations:', {
          prompt: appCreationData.prompt,
          appName: appCreationData.spec?.concept?.appName,
          customizations: appCreationData.customizations
        })

        // Call API to create app
        apiService.createAppWithSpec(
          appCreationData.prompt,
          appCreationData.spec,
          appCreationData.customizations
        )
          .then((response) => {
            if (response.ok && response.data?.appId) {
              logger.debug('[AppBuilder] App created successfully:', { appId: response.data.appId })

              // Store appId immediately for socket event matching (before URL update)
              setPendingAppId(response.data.appId)

              // Clear sessionStorage
              sessionStorage.removeItem('appCreationData')

              // Update URL to include appId and remove creating flag
              const hashedAppId = hashId(response.data.appId)
              router.replace(`/app-builder?appId=${hashedAppId}`)

              // Add initial message to chat
              setChatMessages([{
                role: 'assistant',
                content: '🚀 Starting app generation... This may take a few moments.'
              }])
            } else {
              throw new Error('Failed to create app')
            }
          })
          .catch((error) => {
            logger.error('[AppBuilder] Error creating app:', { error })
            toast.error('Failed to create app. Please try again.')
            router.push('/')
          })
      } catch (error) {
        logger.error('[AppBuilder] Error parsing app creation data:', { error })
        router.push('/')
      }
    }
  }, [searchParams, userId, appId, router])

  // Clear pendingAppId when appId is set from URL
  useEffect(() => {
    if (appId && pendingAppId) {
      setPendingAppId(null)
    }
  }, [appId, pendingAppId])

  // Immediately show Build Status when isCreating=true, without waiting for userId
  useEffect(() => {
    if (isCreating) {
      setProgressState({
        percent: 0,
        message: '🚧 Starting app generation...',
        status: 'running',
        updatedAt: new Date()
      })
      setIsGenerating(true)
    }
  }, [isCreating])

  // Load chat history on mount
  useEffect(() => {
    // Reset progress state on app change
    setProgressState({
      percent: 0,
      message: '',
      status: 'idle',
      updatedAt: null
    })
    setHideProgressBar(false)
    setActiveJobSessionId(null)
    if (isCreating) {
      setProgressState({
        percent: 0,
        message: '🚧 Starting app generation...',
        status: 'running',
        updatedAt: new Date()
      })
      setIsGenerating(true)
    }

    logger.debug('🔄 [ChatHistory] useEffect triggered', { appId, userId })

    // Only load if both appId and userId are available
    if (appId && userId) {
      logger.debug('✅ [ChatHistory] appId and userId available, loading history...', { appId, userId })
      loadChatHistory(false)
    } else {
      logger.debug('⏳ [ChatHistory] Waiting for appId and userId...', { appId, userId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, userId]) // loadChatHistory deliberately excluded to prevent infinite loop

  // Fetch existing Expo info from API when appId is available
  useEffect(() => {
    const fetchExpoInfo = async () => {
      if (!appId) return

      // Wait for userId to be loaded from localStorage
      if (!userId) {
        logger.debug('[AppBuilder] Waiting for userId to be loaded from localStorage')
        return
      }

      logger.debug('[AppBuilder] Fetching Expo info for appId:', { appId })
      setIsLoadingExpoInfo(true)

      try {
        // FIRST: Check if there's an active content generation job
        let contentJobStatus: 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' = 'idle'
        try {
          const jobResponse = await apiService.getContentGenerationJobByApp(Number(appId))
          if (jobResponse.ok && jobResponse.data) {
            contentJobStatus = jobResponse.data.status
            logger.debug('[AppBuilder] Content generation job status:', { status: contentJobStatus })

            // Only update isGenerating if status is in_progress or pending
            // Don't update to false here to avoid triggering this effect again
            if (contentJobStatus === 'in_progress' || contentJobStatus === 'pending') {
              setIsGenerating(true)
            }
          }
        } catch (jobError) {
          logger.debug('[AppBuilder] No content generation job found or error fetching:', { jobError })
          // Continue with Expo info check even if job fetch fails
        }

        // If content is being generated, don't show Expo info
        if (contentJobStatus === 'in_progress' || contentJobStatus === 'pending') {
          logger.debug('[AppBuilder] Content generation in progress, skipping Expo info display')
          setApiExpoInfo(null)
          setIsAppRunning(false)
          setIsLoadingExpoInfo(false)
          return
        }

        // If content generation failed, don't show Expo info
        if (contentJobStatus === 'failed') {
          logger.debug('[AppBuilder] Content generation failed, skipping Expo info display')
          setApiExpoInfo(null)
          setIsAppRunning(false)
          setProgressState(prev => ({
            ...prev,
            status: 'failed',
            message: '❌ App generation failed. Please try again.'
          }))
          setIsLoadingExpoInfo(false)
          return
        }

        // SECOND: Content is completed or idle, proceed with Expo info check
        const response = await httpClient.get(`/v1/platform/apps/${appId}`, {
          signal: abortController.getSignal()
        })
        const app = response.data

        logger.debug('[AppBuilder] App data received:', app)

        // API returns snake_case field names
        if (app.expo_qr_code && app.expo_web_url && app.expo_port && app.expo_started_at) {
          // Check if app has expired (15 minute timeout)
          const TIMEOUT_MINUTES = APP_BUILDER_CONFIG.APP_TIMEOUT_MINUTES
          const TIMEOUT_MS = APP_BUILDER_CONFIG.APP_TIMEOUT_MS
          const startedAt = new Date(app.expo_started_at)
          const elapsedMs = Date.now() - startedAt.getTime()
          const hasExpired = elapsedMs >= TIMEOUT_MS

          logger.debug('[AppBuilder] App status check:', {
            startedAt: startedAt.toISOString(),
            elapsedMinutes: Math.floor(elapsedMs / 60000),
            hasExpired
          })

          // Only set expo info and mark as running if NOT expired
          if (!hasExpired) {
            const info: ExpoInfo = {
              qrCode: app.expo_qr_code,
              webUrl: app.expo_web_url,
              port: app.expo_port
            }
            logger.debug('[AppBuilder] Setting Expo info from API:', info)
            setApiExpoInfo(info)
            setIsAppRunning(true)
            // If app is running but progress state is failed/idle, mark as completed to reflect current status
            setProgressState(prev => {
              if (prev.status === 'completed') return prev
              return {
                percent: 100,
                message: iframeLoaded
                  ? '✅ Your app is ready! Scan the QR or open the preview.'
                  : '⏳ App server started, loading preview...',
                status: 'completed',
                updatedAt: new Date()
              }
            })
          } else {
            // App expired - check if safe to auto-restart
            logger.debug('[AppBuilder] App has expired')
            setApiExpoInfo(null)
            setIsAppRunning(false)

            // Check if app was recently created (within last 2 minutes) to avoid race condition
            const appCreatedAt = new Date(app.createdAt || 0)
            const timeSinceCreation = Date.now() - appCreatedAt.getTime()
            const RECENT_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

            if (timeSinceCreation < RECENT_THRESHOLD_MS) {
              logger.debug('[AppBuilder] App was recently created, skipping auto-restart to avoid race condition with generation job')
              // Don't auto-restart - app is likely still being generated
            } else if (!isRestarting && !isGenerating && app.status !== 'failed') {
              // App is older and expired - safe to auto-restart (only if not already restarting/generating and not failed)
              logger.debug('[AppBuilder] App is not recent and not currently restarting, triggering auto-restart')
              handleRestartApp()
            } else {
              logger.debug('[AppBuilder] App needs restart but operation already in progress, skipping auto-restart')
            }
          }
        } else {
          logger.debug('[AppBuilder] No Expo info found in app data or app not started. Fields:', {
            expo_qr_code: app.expo_qr_code,
            expo_web_url: app.expo_web_url,
            expo_port: app.expo_port,
            expo_started_at: app.expo_started_at
          })
          // Clear expo info
          setApiExpoInfo(null)
          setIsAppRunning(false)

          // Check if app was recently created (within last 2 minutes) to avoid race condition
          const appCreatedAt = new Date(app.createdAt || 0)
          const timeSinceCreation = Date.now() - appCreatedAt.getTime()
          const RECENT_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

          if (timeSinceCreation < RECENT_THRESHOLD_MS) {
            logger.debug('[AppBuilder] App was recently created, skipping auto-restart to avoid race condition with generation job')
            // Don't auto-restart - app is likely still being generated
            // User can manually restart if needed
          } else if (!isRestarting && !isGenerating && app.status !== 'failed') {
            // App is older and has no Expo info - safe to auto-restart (only if not already restarting/generating and not failed)
            logger.debug('[AppBuilder] App is not recent and not currently restarting, triggering auto-restart')
            handleRestartApp()
          } else {
            logger.debug('[AppBuilder] App needs restart but operation already in progress, skipping auto-restart')
          }
        }
      } catch (error: unknown) {
        logger.error('[AppBuilder] Error fetching app Expo info:', { error })
        // Don't alert user for API fetch errors on mount - just log them
        // App will show stopped status and user can restart manually
      } finally {
        setIsLoadingExpoInfo(false)
        setIsInitialLoad(false)
      }
    }

    fetchExpoInfo()
    // abortController deliberately excluded from deps (new object on every render)
    // isGenerating, iframeLoaded, isRestarting excluded to prevent circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, userId, isGenerating])

  // Monitor app timeout event
  useEffect(() => {
    if (appTimeoutEvent && appTimeoutEvent.appId === Number(appId)) {
      logger.debug('[AppBuilder] App timed out:', appTimeoutEvent)
      setIsAppRunning(false)
      // Clear expo info when app times out
      setApiExpoInfo(null)
      // Mark that user observed the expiration (was on page when it happened)
      setHasObservedExpiration(true)
    }
  }, [appTimeoutEvent, appId])

  // Monitor app restart event and refresh the iframe preview
  // NOTE: We cannot rely on the socketExpoInfo effect for this because its deep-equality
  // guard (webUrl/qrCode/port) skips updates when values are identical — which is always
  // the case for restarts since the port and URL never change between restarts.
  useEffect(() => {
    logger.debug('[AppBuilder] appRestartedEvent changed:', { appRestartedEvent, appId })
    if (appRestartedEvent && appRestartedEvent.appId === Number(appId)) {
      // Check if we've already processed this event
      if (lastProcessedRestartTimestampRef.current === appRestartedEvent.timestamp) {
        logger.debug('[AppBuilder] ⏭️ Restart event already processed, skipping:', { timestamp: appRestartedEvent.timestamp })
        return
      }

      logger.debug('[AppBuilder] ✅ App restart event matches current app, refreshing preview:', { appRestartedEvent })

      // Mark this event as processed
      lastProcessedRestartTimestampRef.current = appRestartedEvent.timestamp

      // Socket event arrived — clear polling fallback tracker (setIsRestarting(false) will stop the polling useEffect)
      restartRequestedAtRef.current = null

      // Force iframe refresh even when webUrl/qrCode/port are identical to before restart.
      // Wait for Expo server to fully start before refreshing the iframe.
      setIsAppRunning(true)
      setIsRestarting(false)
      timeouts.setTimeout(() => {
        logger.debug('[AppBuilder] Incrementing iframe key after app restart')
        setIframeKey(prev => prev + 1)
      }, APP_BUILDER_CONFIG.EXPO_SERVER_STARTUP_DELAY_MS)
    } else if (appRestartedEvent) {
      logger.debug('[AppBuilder] ⚠️ App restart event for different app, ignoring:', {
        eventAppId: appRestartedEvent.appId,
        currentAppId: Number(appId)
      })
    }
    // Only depend on timestamp to avoid re-running when object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appRestartedEvent?.timestamp, appId])

  // Polling fallback: when waiting for restart, poll /expo-status every 15s.
  // This detects restart completion even if the Socket.io 'app-restarted' event is missed
  // (which can happen when the WebSocket drops during the 60-120s restart window).
  // When the socket event arrives first, setIsRestarting(false) stops this polling via cleanup.
  useEffect(() => {
    if (!isRestarting || !appId) return

    // Capture the restart-request timestamp for comparison
    const pollStartTime = restartRequestedAtRef.current ?? Date.now()
    const MAX_POLL_MS = 5 * 60 * 1000  // 5 minutes hard timeout
    const POLL_INTERVAL_MS = 15 * 1000 // check every 15 seconds

    logger.debug('[AppBuilder] 🔄 Starting expo-status polling fallback', { appId, pollStartTime })

    const intervalId = setInterval(async () => {
      // Hard timeout — stop polling and surface error
      if (Date.now() - pollStartTime > MAX_POLL_MS) {
        clearInterval(intervalId)
        restartRequestedAtRef.current = null
        setIsRestarting(false)
        toast.error('App restart timed out after 5 minutes. Please try again.')
        return
      }

      try {
        const status = await apiService.getExpoStatus(Number(appId))
        if (status?.startedAt) {
          const startedAt = new Date(status.startedAt).getTime()
          // Only treat as "restarted" if Expo started AFTER we requested the restart
          if (startedAt > pollStartTime) {
            logger.debug('[AppBuilder] ✅ Polling detected restart complete', { startedAt, pollStartTime })
            clearInterval(intervalId)
            restartRequestedAtRef.current = null
            setIsAppRunning(true)
            setIsRestarting(false)
            // Brief delay to let Expo fully serve the bundle before reloading
            timeouts.setTimeout(() => {
              logger.debug('[AppBuilder] Reloading iframe after polling-detected restart')
              setIframeKey(prev => prev + 1)
            }, APP_BUILDER_CONFIG.EXPO_SERVER_STARTUP_DELAY_MS)
          }
        }
      } catch {
        // Keep polling silently — transient network errors are expected during restart
      }
    }, POLL_INTERVAL_MS)

    // Cleanup: runs when isRestarting→false (socket path) or appId changes or unmount
    return () => {
      logger.debug('[AppBuilder] 🛑 Stopping expo-status polling (isRestarting cleared or cleanup)')
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestarting, appId])

  // Monitor app reload event
  useEffect(() => {
    logger.debug('[AppBuilder] appReloadedEvent changed:', { appReloadedEvent, appId })
    if (appReloadedEvent && appReloadedEvent.appId === Number(appId)) {
      // Check if we've already processed this event
      if (lastProcessedReloadTimestampRef.current === appReloadedEvent.timestamp) {
        logger.debug('[AppBuilder] ⏭️ Reload event already processed, skipping:', { timestamp: appReloadedEvent.timestamp })
        return
      }

      logger.debug('[AppBuilder] ✅ App reload event matches current app, clearing reload state:', { appReloadedEvent })

      // Mark this event as processed
      lastProcessedReloadTimestampRef.current = appReloadedEvent.timestamp

      // Clear timeout since Socket.io event arrived
      if (reloadTimeoutIdRef.current !== undefined) {
        logger.debug('[AppBuilder] Clearing reload timeout (Socket.io event received)')
        timeouts.clearTimeout(reloadTimeoutIdRef.current)
        reloadTimeoutIdRef.current = undefined
      }

      setIsReloading(false)
      logger.debug('[AppBuilder] isReloading set to false')

      // NOTE: No iframe key increment needed - Expo handles internal reload via HMR
      // Forcing iframe remount causes unwanted full page reload loop
      logger.debug('[AppBuilder] App reload complete - Expo handles internal reload without iframe remount')
    } else if (appReloadedEvent) {
      logger.debug('[AppBuilder] ⚠️ App reload event for different app, ignoring:', {
        eventAppId: appReloadedEvent.appId,
        currentAppId: Number(appId)
      })
    }
    // Only depend on timestamp to avoid re-running when object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReloadedEvent?.timestamp, appId, timeouts])

  // Pre-fill Google Play form when modal opens
  useEffect(() => {
    const prefillPlayForm = async () => {
      if (!showPlayModal || !appId || !user) return

      try {
        // Fetch app details
        const response = await apiService.getApp(appId)
        const appData = response.data

        if (!appData) return

        // Helper: Sanitize app name for package name
        const sanitizeAppName = (name: string) =>
          name.toLowerCase().replace(/[^a-z0-9]/g, '')

        // Generate package name from user and app name
        const userName = user.firstName?.toLowerCase() || user.email?.split('@')[0]?.toLowerCase() || 'user'
        const sanitizedAppName = sanitizeAppName(appData.app_name || 'app')
        const packageName = `com.${userName}.${sanitizedAppName}`

        // Extract short description (first 80 chars of app_idea)
        const shortDescription = appData.app_idea?.substring(0, 80) || ''

        // Pre-fill the form
        setPlayForm(prev => ({
          ...prev,
          packageName,
          appTitle: appData.app_name || '',
          shortDescription,
          fullDescription: appData.app_idea || '',
          contactEmail: user.email || ''
        }))

        logger.debug('🎯 [PlayModal] Pre-filled form with app data', {
          appId,
          appName: appData.app_name,
          packageName,
          contactEmail: user.email
        })
      } catch (error) {
        logger.error('❌ [PlayModal] Failed to pre-fill form', { error })
      }
    }

    prefillPlayForm()
  }, [showPlayModal, appId, user])

  // Pre-fill App Store form when modal opens
  useEffect(() => {
    const prefillAppStoreForm = async () => {
      if (!showAppStoreModal || !appId || !user) return

      try {
        // Fetch app details
        const response = await apiService.getApp(appId)
        const appData = response.data

        if (!appData) return

        // Helper: Sanitize app name for bundle ID
        const sanitizeAppName = (name: string) =>
          name.toLowerCase().replace(/[^a-z0-9]/g, '')

        // Generate bundle ID from user and app name
        const userName = user.firstName?.toLowerCase() || user.email?.split('@')[0]?.toLowerCase() || 'user'
        const sanitizedAppName = sanitizeAppName(appData.app_name || 'app')
        const bundleId = `com.${userName}.${sanitizedAppName}`

        // Extract subtitle (first 30 chars of app_idea)
        const subtitle = appData.app_idea?.substring(0, 30) || ''

        // Pre-fill the form
        setAppStoreForm(prev => ({
          ...prev,
          bundleId,
          appName: appData.app_name || '',
          subtitle,
          description: appData.app_idea || '',
          contactEmail: user.email || ''
        }))

        logger.debug('🎯 [AppStoreModal] Pre-filled form with app data', {
          appId,
          appName: appData.app_name,
          bundleId,
          contactEmail: user.email
        })
      } catch (error) {
        logger.error('❌ [AppStoreModal] Failed to pre-fill form', { error })
      }
    }

    prefillAppStoreForm()
  }, [showAppStoreModal, appId, user])

  const handlePlayFieldChange = (field: string, value: string) => {
    setPlayForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitPlayPublish = async () => {
    if (!appId) {
      toast.error('No app id found')
      return
    }
    if (!playForm.packageName || !playForm.serviceAccountJson || !playForm.appTitle) {
      toast.error('Please fill required fields: package name, service account JSON, app title')
      return
    }


    try {
      setIsSubmittingPlay(true)
      await apiService.savePlayStoreSettings(Number(appId), playForm)
      const publishResult = await apiService.triggerPlayPublish(Number(appId), {
        track: playForm.track,
        buildType: playForm.buildType
      })

      // Show progress modal and reset state
      setShowPlayModal(false)
      setShowPublishProgressModal(true)
      setPublishProgress(0)
      setPublishStatus('pending')
      setPublishStep('Initializing publish...')
      setPublishError(null)
      setPublishJobId(publishResult.data?.jobId)

      toast.success('Publish job started - tracking progress...')
    } catch (err: any) {
      logger.error('[AppBuilder] Play publish submit failed', { err })
      toast.error(err?.response?.data?.message || 'Failed to start Play publish')
    } finally {
      setIsSubmittingPlay(false)
    }
  }

  const handleCancelPublish = async () => {
    if (!publishJobId || !appId) return

    try {
      await apiService.cancelPlayPublish(Number(appId), publishJobId)
      setShowPublishProgressModal(false)
      setPublishJobId(null)
      toast.success('Publish job cancelled')
    } catch (err: any) {
      logger.error('[AppBuilder] Cancel publish failed', { err })
      toast.error(err?.response?.data?.message || 'Failed to cancel publish job')
    }
  }

  // App Store form handlers
  const handleAppStoreFieldChange = (field: string, value: string) => {
    setAppStoreForm(prev => ({ ...prev, [field]: value }))
  }

  const validateAppStoreForm = () => {
    const { bundleId, apiKey, appName, description, supportUrl, privacyPolicyUrl, contactEmail } = appStoreForm

    // Required fields validation
    if (!bundleId.trim()) {
      toast.error('Bundle ID is required')
      return false
    }

    if (!apiKey.trim()) {
      toast.error('App Store Connect API Key is required')
      return false
    }

    if (!appName.trim()) {
      toast.error('App Name is required')
      return false
    }

    if (!description.trim()) {
      toast.error('Description is required')
      return false
    }

    if (!supportUrl.trim()) {
      toast.error('Support URL is required')
      return false
    }

    if (!privacyPolicyUrl.trim()) {
      toast.error('Privacy Policy URL is required')
      return false
    }

    if (!contactEmail.trim()) {
      toast.error('Contact Email is required')
      return false
    }

    // Format validation
    const bundleIdPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i
    if (!bundleIdPattern.test(bundleId)) {
      toast.error('Invalid Bundle ID format. Use format: com.company.appname')
      return false
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(contactEmail)) {
      toast.error('Invalid email address')
      return false
    }

    const urlPattern = /^https?:\/\/.+/
    if (!urlPattern.test(supportUrl)) {
      toast.error('Support URL must be a valid URL starting with http:// or https://')
      return false
    }

    if (!urlPattern.test(privacyPolicyUrl)) {
      toast.error('Privacy Policy URL must be a valid URL starting with http:// or https://')
      return false
    }

    // App name length validation
    if (appName.length > 30) {
      toast.error('App Name must be 30 characters or less')
      return false
    }

    // Subtitle length validation
    if (appStoreForm.subtitle.length > 30) {
      toast.error('Subtitle must be 30 characters or less')
      return false
    }

    // Keywords length validation
    if (appStoreForm.keywords.length > 100) {
      toast.error('Keywords must be 100 characters or less')
      return false
    }

    // Description length validation
    if (description.length > 4000) {
      toast.error('Description must be 4000 characters or less')
      return false
    }

    // API Key JSON validation
    try {
      const parsedKey = JSON.parse(apiKey)
      if (!parsedKey.key_id || !parsedKey.issuer_id || !parsedKey.key) {
        toast.error('API Key must contain key_id, issuer_id, and key fields')
        return false
      }
    } catch (e) {
      toast.error('API Key must be valid JSON')
      return false
    }

    return true
  }

  const handleSubmitAppStorePublish = async () => {
    if (!appId) {
      toast.error('No app id found')
      return
    }

    if (!validateAppStoreForm()) {
      return
    }

    toast.success('Validation passed! Ready to publish to App Store.')
    logger.info('[AppBuilder] App Store form validated successfully', {
      bundleId: appStoreForm.bundleId,
      track: appStoreForm.track
    })

    // Close modal after successful validation
    setShowAppStoreModal(false)
  }

  const handleDownloadSourceClick = async () => {
    if (!appId) return

    try {
      // Check for existing active job
      const response = await apiService.getLatestDownloadJob(Number(appId))

      if (response.ok && response.data) {
        const job = response.data
        // Only set as existing if it's an active job (pending/processing)
        if (job.status === 'pending' || job.status === 'processing') {
          setExistingDownloadJob(job)
        } else {
          // Completed/failed/expired - allow new request
          setExistingDownloadJob(null)
        }
      } else {
        setExistingDownloadJob(null)
      }
    } catch (error) {
      logger.error('[AppBuilder] Error checking download job:', { error })
      setExistingDownloadJob(null)
    }

    setShowDownloadModal(true)
  }

  // Monitor socketExpoInfo changes and update isAppRunning
  // Only trigger when actual values change (not just object reference)
  useEffect(() => {
    // Deep equality check: only trigger if values actually changed
    const previousInfo = previousSocketExpoInfoRef.current
    const hasValuesChanged =
      socketExpoInfo?.webUrl !== previousInfo?.webUrl ||
      socketExpoInfo?.qrCode !== previousInfo?.qrCode ||
      socketExpoInfo?.port !== previousInfo?.port ||
      (socketExpoInfo === null && previousInfo !== null) ||
      (socketExpoInfo !== null && previousInfo === null)

    if (!hasValuesChanged) {
      logger.debug('[AppBuilder] socketExpoInfo object reference changed but values are identical, skipping update')
      return
    }

    if (socketExpoInfo && socketExpoInfo.webUrl) {
      logger.debug('[AppBuilder] ✅ Socket.io Expo info received with new values, setting isAppRunning=true:', { socketExpoInfo })
      setIsAppRunning(true)
      setApiExpoInfo(socketExpoInfo)
      setIsRestarting(false)
      setHasObservedExpiration(false)

      // Wait 2 seconds for Expo server to fully start before refreshing iframe
      logger.debug('[AppBuilder] Waiting 2 seconds for Expo server to fully start...')
      timeouts.setTimeout(() => {
        logger.debug('[AppBuilder] Incrementing iframe key to refresh')
        setIframeKey(prev => {
          const newKey = prev + 1
          logger.debug('[AppBuilder] iframe key incremented:', { prev, newKey })
          return newKey
        })
      }, APP_BUILDER_CONFIG.EXPO_SERVER_STARTUP_DELAY_MS)
    } else if (socketExpoInfo === null) {
      logger.debug('[AppBuilder] ⚠️ Socket.io Expo info cleared (null), setting isAppRunning=false')
      setIsAppRunning(false)
      setApiExpoInfo(null)
    }

    // Update ref with current values
    previousSocketExpoInfoRef.current = socketExpoInfo
  }, [socketExpoInfo, timeouts])

  // Handle publish progress events
  useEffect(() => {
    if (socketPublishProgress) {
      logger.debug('[AppBuilder] Publish progress event:', socketPublishProgress)
      setPublishProgress(socketPublishProgress.progress)
      setPublishStatus(socketPublishProgress.status)
      setPublishStep(socketPublishProgress.step)
    }
  }, [socketPublishProgress])

  // Handle publish completion
  useEffect(() => {
    if (publishComplete) {
      logger.debug('[AppBuilder] Publish complete:', publishComplete)
      setPublishProgress(100)
      setPublishStatus('completed')
      setPublishStep('Published successfully!')
      toast.success('App published to Google Play Store!')
    }
  }, [publishComplete])

  // Handle publish failure
  useEffect(() => {
    if (publishFailed) {
      logger.error('[AppBuilder] Publish failed:', publishFailed)
      setPublishStatus('failed')
      setPublishError(publishFailed.error)
      toast.error(`Publish failed: ${publishFailed.error}`)
    }
  }, [publishFailed])

  // Monitor job progress events and add to chat
  useEffect(() => {
    const effectiveAppId = appId ?? pendingAppId
    if (!lastEvent || lastEvent.appId !== Number(effectiveAppId)) {
      return
    }

    const sessionId = lastEvent.jobId ? `appgen-${lastEvent.jobId}` : undefined
    if (sessionId && sessionId !== activeJobSessionId) {
      setActiveJobSessionId(sessionId)
    }
    const messageTimestamp = lastEvent.timestamp ? new Date(lastEvent.timestamp) : new Date()
    const nextPercent = typeof lastEvent.progress === 'number' ? lastEvent.progress : undefined

    const persistAssistantMessage = (message: ChatMessage, type: 'stdout' | 'stderr' | 'completion' | undefined = message.type) => {
      void saveChatMessage({
        ...message,
        sessionId: sessionId || message.sessionId,
        type: type ?? undefined
      })
    }

    if (lastEvent.status === 'processing' && lastEvent.message) {
      logger.debug('[AppBuilder] Job progress event received:', { lastEvent })

      // Set isGenerating to true while processing
      setIsGenerating(true)

      // Check if message is a progress update (contains "X/Y" pattern or "X of Y")
      const isProgressMessage = /\((\d+)\/(\d+)\)|\((\d+) of (\d+)\)/.test(lastEvent.message!)

      // Extract base task name (e.g., "Generating product images" from "Generating product images (1/50)")
      const progressSessionId = sessionId || `appgen-${appId || 'unknown'}`

      let messageForPersistence: ChatMessage | null = null

      setChatMessages(prev => {
        const withoutOtherSessions = prev.filter(
          m => !(isAppGenSession(m.sessionId) && m.sessionId !== progressSessionId)
        )
        const lastMsg = withoutOtherSessions[withoutOtherSessions.length - 1]

        const progressMessage: ChatMessage = {
          role: 'assistant',
          content: lastEvent.message!,
          timestamp: messageTimestamp,
          type: 'stdout',
          sessionId: progressSessionId
        }

        // Replace last progress bubble for this session to keep a single bubble
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.sessionId === progressSessionId) {
          if (lastMsg.content === lastEvent.message!) {
            return withoutOtherSessions
          }
          messageForPersistence = progressMessage
          return [...withoutOtherSessions.slice(0, -1), progressMessage]
        }

        messageForPersistence = progressMessage
        return [...withoutOtherSessions, progressMessage]
      })

      if (messageForPersistence) {
        persistAssistantMessage(messageForPersistence, 'stdout')
      }

      setProgressState(prev => ({
        percent: nextPercent !== undefined ? nextPercent : prev.percent,
        message: lastEvent.message || prev.message,
        status: 'running',
        updatedAt: messageTimestamp
      }))
    } else if (lastEvent.status === 'completed') {
      logger.debug('[AppBuilder] Job completed event received:', { lastEvent })

      // Set isGenerating to false when completed
      setIsGenerating(false)

      // Add completion message to chat
      const completionMessage: ChatMessage = {
        role: 'assistant',
        content: iframeLoaded
          ? '✅ Your app is ready! Scan the QR or open the preview.'
          : '⏳ App server started, loading preview...',
        timestamp: messageTimestamp,
        type: 'stdout'
      }

      let shouldPersistWelcome = false

      setChatMessages(prev => {
        const withoutOtherSessions = prev.filter(
          m => !(isAppGenSession(m.sessionId) && m.sessionId !== sessionId)
        )
        const hasWelcome = prev.some(m => m.content === WELCOME_MESSAGE)
        // Remove older completion/failure for same session to avoid duplicates
        const nextMessages = withoutOtherSessions.filter(
          m => !(m.sessionId === sessionId && m.content.startsWith('✅ Your app is ready!'))
        ).filter(m => m.content !== WELCOME_MESSAGE) // ensure welcome appears last

        nextMessages.push({ ...completionMessage, sessionId: sessionId || completionMessage.sessionId })

        // Always render welcome as final message in UI
        nextMessages.push({
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: messageTimestamp
        })
        if (!hasWelcome) {
          shouldPersistWelcome = true
        }
        return nextMessages
      })

      persistAssistantMessage(completionMessage, 'stdout')

      if (shouldPersistWelcome) {
        void saveChatMessage({
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: messageTimestamp
        })
      }

      setProgressState({
        percent: 100,
        message: completionMessage.content,
        status: 'completed',
        updatedAt: messageTimestamp
      })
    } else if (lastEvent.status === 'failed') {
      logger.error('[AppBuilder] Job failed event received:', { lastEvent })
      setIsGenerating(false)

      // Detect restart failures: restart processor sends jobId=null, generation sends a numeric jobId.
      // Restart failures should NOT show "App generation failed" or update the progress bar —
      // they are transient restart errors unrelated to the generation pipeline.
      const isRestartFailure = !lastEvent.jobId
      if (isRestartFailure) {
        logger.error('[AppBuilder] App restart failed (restart job):', { errorMessage: lastEvent.errorMessage })
        // Clear restart state so the UI recovers (stops spinner, stops polling)
        setIsRestarting(false)
        restartRequestedAtRef.current = null
        toast.error(`Restart failed: ${lastEvent.errorMessage || 'Unknown error. Please try again.'}`)
        return
      }

      // Generation failure — add to chat and mark progress bar as failed
      const failureMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ App generation failed: ${lastEvent.errorMessage || 'Unknown error'}`,
        timestamp: messageTimestamp,
        type: 'stderr'
      }

      let shouldPersistFailure = true

      setChatMessages(prev => {
        const withoutOtherSessions = prev.filter(
          m => !(isAppGenSession(m.sessionId) && m.sessionId !== sessionId)
        )
        // If same failure already present for this session/content, skip adding
        const alreadyHasFailure = withoutOtherSessions.some(
          m => m.sessionId === sessionId && m.content === failureMessage.content
        )
        if (alreadyHasFailure) {
          shouldPersistFailure = false
          return withoutOtherSessions
        }

        const nextMessages = withoutOtherSessions.filter(
          m => !(m.sessionId === sessionId && m.content.startsWith('❌ App generation failed'))
        )
        nextMessages.push({ ...failureMessage, sessionId: sessionId || failureMessage.sessionId })
        return nextMessages
      })
      if (shouldPersistFailure) {
        persistAssistantMessage({ ...failureMessage, sessionId: sessionId || failureMessage.sessionId }, 'stderr')
      }

      setProgressState(prev => ({
        percent: nextPercent !== undefined ? nextPercent : prev.percent,
        message: failureMessage.content,
        status: 'failed',
        updatedAt: messageTimestamp
      }))
    }
  }, [lastEvent, appId, pendingAppId, saveChatMessage, activeJobSessionId])

  // Memoize Claude output handler to prevent recreation
  const handleClaudeOutput = useCallback((data: {
    sessionId: string
    appId: number
    type: 'stdout' | 'stderr' | 'completion'
    content: string
    timestamp: string
  }) => {
    logger.debug('[AppBuilder][ClaudeSocket] 📨 Received claude-output event', {
      receivedSessionId: data.sessionId,
      expectedSessionId: claudeSessionId,
      type: data.type,
      appId: data.appId,
      contentLength: data.content.length,
      timestamp: data.timestamp,
      matches: data.sessionId === claudeSessionId
    })

    if (data.sessionId !== claudeSessionId) {
      logger.warn('[AppBuilder][ClaudeSocket] ⚠️ Session ID mismatch, ignoring event', {
        received: data.sessionId,
        expected: claudeSessionId
      })
      return
    }

    // Skip completion messages - they're just status updates, not actual output
    if (data.type === 'completion') {
      logger.debug('[AppBuilder][ClaudeSocket] ℹ️ Skipping completion message (internal status)')

      // Check if execution completed to stop loading state
      if (data.content.includes('Execution completed') || data.content.includes('Execution failed') || data.content.includes('Execution timeout')) {
        setIsClaudeExecuting(false)
      }
      return
    }

    logger.debug('[AppBuilder][ClaudeSocket] ✅ Processing claude-output', {
      type: data.type,
      contentPreview: data.content.substring(0, 100)
    })

    // When worker signals git commit is done, trigger API-based restart from frontend.
    // This is more reliable than the worker calling restartApp() directly, because
    // the socket event from a worker-side restart fires ~2-3min later when the
    // WebSocket may have dropped and missed the event.
    if (data.type === 'stdout' && data.content.includes('Changes committed')) {
      handleRestartApp()
    }

    const assistantMessage: ChatMessage = {
      role: 'assistant' as const,
      content: data.content,
      type: data.type,
      timestamp: new Date(data.timestamp),
      sessionId: data.sessionId
    }

    setChatMessages(prev => {
      const newMessages = [...prev, assistantMessage]
      logger.debug('[AppBuilder][ClaudeSocket] 📝 Messages updated, total count:', { count: newMessages.length })
      return newMessages
    })

    // Save assistant message to database
    saveChatMessage(assistantMessage)
  }, [claudeSessionId, saveChatMessage, handleRestartApp])

  // Memoize Claude Code progress handler for git operations
  const handleClaudeCodeProgress = useCallback((data: {
    sessionId: string
    appId: number
    type: string
    message: string
    timestamp: string
  }) => {
    logger.debug('[AppBuilder][GitProgress] 📨 Received claude-code-progress event', {
      appId: data.appId,
      expectedAppId: appId,
      type: data.type,
      message: data.message,
      timestamp: data.timestamp,
      matches: data.appId === appId
    })

    // Only show messages for the current app
    if (data.appId !== appId) {
      logger.warn('[AppBuilder][GitProgress] ⚠️ App ID mismatch, ignoring event', {
        received: data.appId,
        expected: appId
      })
      return
    }

    logger.debug('[AppBuilder][GitProgress] ✅ Processing git progress', {
      type: data.type,
      messagePreview: data.message.substring(0, 100)
    })

    const progressMessage: ChatMessage = {
      role: 'assistant' as const,
      content: data.message,
      timestamp: new Date(data.timestamp),
      sessionId: data.sessionId
    }

    setChatMessages(prev => {
      const newMessages = [...prev, progressMessage]
      logger.debug('[AppBuilder][GitProgress] 📝 Messages updated, total count:', { count: newMessages.length })
      return newMessages
    })

    // Save progress message to database
    saveChatMessage(progressMessage)
  }, [appId, saveChatMessage])

  // Listen for git operation progress via Socket.io
  useEffect(() => {
    logger.debug('[AppBuilder][GitProgress] 🔄 Effect triggered', {
      hasSocket: !!socket,
      appId,
      socketConnected: socket?.connected,
      timestamp: new Date().toISOString()
    })

    if (!socket) {
      logger.warn('[AppBuilder][GitProgress] ⚠️ No socket available, skipping listener setup')
      return
    }

    if (!appId) {
      logger.debug('[AppBuilder][GitProgress] ℹ️ No app ID, listener not attached')
      return
    }

    logger.debug('[AppBuilder][GitProgress] ✅ Attaching claude-code-progress listener for app:', { appId })
    socket.on('claude-code-progress', handleClaudeCodeProgress)
    logger.debug('[AppBuilder][GitProgress] 🎧 Listener attached successfully')

    return () => {
      logger.debug('[AppBuilder][GitProgress] 🧹 Cleaning up claude-code-progress listener for app:', { appId })
      socket.off('claude-code-progress', handleClaudeCodeProgress)
    }
  }, [socket, appId, handleClaudeCodeProgress])

  // Listen for Claude Code output via Socket.io
  useEffect(() => {
    logger.debug('[AppBuilder][ClaudeSocket] 🔄 Effect triggered', {
      hasSocket: !!socket,
      claudeSessionId,
      socketConnected: socket?.connected,
      timestamp: new Date().toISOString()
    })

    if (!socket) {
      logger.warn('[AppBuilder][ClaudeSocket] ⚠️ No socket available, skipping listener setup')
      return
    }

    if (!claudeSessionId) {
      logger.debug('[AppBuilder][ClaudeSocket] ℹ️ No active Claude session, listener not attached')
      return
    }

    logger.debug('[AppBuilder][ClaudeSocket] ✅ Attaching claude-output listener for session:', { claudeSessionId })
    socket.on('claude-output', handleClaudeOutput)
    logger.debug('[AppBuilder][ClaudeSocket] 🎧 Listener attached successfully')

    return () => {
      logger.debug('[AppBuilder][ClaudeSocket] 🧹 Cleaning up claude-output listener for session:', { claudeSessionId })
      socket.off('claude-output', handleClaudeOutput)
    }
  }, [socket, claudeSessionId, handleClaudeOutput])

  const handleSendMessage = useCallback(async () => {
    logger.debug('[AppBuilder][ClaudeExecution] 🚀 handleSendMessage called', {
      hasInput: !!userInput.trim(),
      inputLength: userInput.length,
      appId,
      userId,
      timestamp: new Date().toISOString()
    })

    if (!userInput.trim() || !appId) {
      logger.warn('[AppBuilder][ClaudeExecution] ⚠️ Validation failed', {
        hasInput: !!userInput.trim(),
        hasAppId: !!appId
      })
      return
    }

    // Validate prompt length
    if (userInput.length > APP_BUILDER_CONFIG.PROMPT_MAX_LENGTH) {
      logger.error('[AppBuilder][ClaudeExecution] ❌ Prompt too long', {
        length: userInput.length,
        maxLength: APP_BUILDER_CONFIG.PROMPT_MAX_LENGTH
      })
      toast.error('Prompt too long (max 10,000 characters)')
      return
    }

    logger.debug('[AppBuilder][ClaudeExecution] ✅ Validation passed, preparing execution')

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: userInput }
    setChatMessages([...chatMessages, userMessage])
    logger.debug('[AppBuilder][ClaudeExecution] 📝 User message added to chat')
    setHideProgressBar(true)

    // Generate session ID
    const sessionId = `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    logger.debug('[AppBuilder][ClaudeExecution] 🆔 Generated session ID:', { sessionId })

    // Save user message to database
    await saveChatMessage({ ...userMessage, sessionId })

    setClaudeSessionId(sessionId)
    setIsClaudeExecuting(true)
    const promptToSend = userInput

    // Save to command history (keep last 10)
    setCommandHistory(prev => {
      const newHistory = [promptToSend, ...prev].slice(0, APP_BUILDER_CONFIG.COMMAND_HISTORY_LIMIT)
      return newHistory
    })
    setHistoryIndex(-1)

    setUserInput('')

    logger.debug('[AppBuilder][ClaudeExecution] 🔄 State updated, calling API', {
      sessionId,
      appId,
      promptLength: promptToSend.length,
      endpoint: `/v1/platform/apps/${appId}/claude-execute`
    })

    try {
      const startTime = Date.now()
      await httpClient.post(`/v1/platform/apps/${appId}/claude-execute`, {
        prompt: promptToSend,
        sessionId
      }, {
        signal: abortController.getSignal()
      })
      const duration = Date.now() - startTime

      logger.debug('[AppBuilder][ClaudeExecution] ✅ API call successful', {
        sessionId,
        appId,
        duration: `${duration}ms`,
        status: 'queued'
      })
    } catch (error: any) {
      logger.error('[AppBuilder][ClaudeExecution] ❌ API call failed', {
        sessionId,
        appId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack
      })

      let errorMessage = 'Failed to execute Claude Code. Please try again.'

      if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before trying again.'
        logger.warn('[AppBuilder][ClaudeExecution] 🚦 Rate limit hit', {
          userId,
          appId,
          sessionId
        })
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || 'This prompt contains forbidden patterns for security reasons.'
        logger.warn('[AppBuilder][ClaudeExecution] 🚫 Forbidden pattern detected', {
          reason: error.response?.data?.reason,
          sessionId
        })
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Maximum concurrent executions reached. Please wait.'
        logger.warn('[AppBuilder][ClaudeExecution] ⏸️ Concurrent limit reached', {
          appId,
          sessionId
        })
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        type: 'stderr'
      }])

      setIsClaudeExecuting(false)
      setClaudeSessionId(null)
      logger.debug('[AppBuilder][ClaudeExecution] 🔄 Execution state reset after error')
    }
    // abortController deliberately excluded from deps (new object on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, userId, userInput, chatMessages, saveChatMessage])


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isClaudeExecuting])

  // Adjust textarea height when userInput changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      adjustTextareaHeight()
    })
  }, [userInput, adjustTextareaHeight])

  // Set iframe load timeout when iframe key changes
  useEffect(() => {
    logger.debug(`[AppBuilder] 🔑 iframe key changed to ${iframeKey}, iframe will load`, {
      isAppRunning,
      hasExpoWebUrl: !!expoInfo?.webUrl,
      expoWebUrl: expoInfo?.webUrl,
      iframeLoaded
    })

    if (!isAppRunning || !expoInfo?.webUrl) {
      logger.debug('[AppBuilder] Skipping iframe reload - app not running or no webUrl')
      return
    }

    // Only reset iframe loaded state when iframe key actually changes (not on every render)
    logger.debug(`[AppBuilder] Resetting iframeLoaded to false for iframe key ${iframeKey}`)
    setIframeLoaded(false)
    // NOTE: Do NOT reset iframeError here - it creates an infinite loop
    // iframeError should only be reset by manual user action (handleRefreshIframe)

    // DISABLED: 10 second timeout - was causing page reload issues
    // If iframe doesn't load, user can manually refresh using the button
    // iframeTimeoutIdRef.current = timeouts.setTimeout(() => {
    //   logger.warn(`[AppBuilder] ⏱️ iframe load timeout after 10 seconds (iframeKey=${iframeKey})`)
    //   setIframeError(true)
    //   iframeTimeoutIdRef.current = undefined
    // }, APP_BUILDER_CONFIG.IFRAME_LOAD_TIMEOUT_MS)

    // Cleanup timeout when dependencies change
    return () => {
      if (iframeTimeoutIdRef.current !== undefined) {
        timeouts.clearTimeout(iframeTimeoutIdRef.current)
        iframeTimeoutIdRef.current = undefined
      }
    }
    // ONLY depend on iframeKey - not expoInfo or isAppRunning to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeKey])

  // Update progress and chat messages when iframe finishes loading
  useEffect(() => {
    if (iframeLoaded && progressState.status === 'completed') {
      // Update progress message
      setProgressState(prev => ({
        ...prev,
        message: '✅ Your app is ready! Scan the QR or open the preview.'
      }))

      // Update chat message
      setChatMessages(prev => {
        const messages = [...prev]
        // Find the most recent completion message and update it
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].content.includes('App server started, loading preview')) {
            messages[i] = {
              ...messages[i],
              content: '✅ Your app is ready! Scan the QR or open the preview.'
            }
            break
          }
        }
        return messages
      })
    }
  }, [iframeLoaded, progressState.status])

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-y-auto lg:overflow-hidden app-builder-surface text-gray-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap');
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentlePulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.25); }
          70% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .app-builder-surface {
          font-family: 'Inter Tight', 'Inter', system-ui, -apple-system, sans-serif;
        }
        /* Custom scrollbar styling for textarea with rounded corners */
        .textarea-rounded-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .textarea-rounded-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 4px 2px;
          border-radius: 0.5rem; /* rounded-md - matches textarea border radius */
        }
        .textarea-rounded-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; /* gray-300 */
          border-radius: 0.5rem; /* rounded-md - matches textarea border radius */
          border: none;
        }
        .textarea-rounded-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; /* gray-400 */
        }
        /* Firefox scrollbar styling */
        .textarea-rounded-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        @media (min-width: 640px) {
          .textarea-rounded-scrollbar::-webkit-scrollbar-track {
            border-radius: 0.5rem; /* rounded-lg */
          }
          .textarea-rounded-scrollbar::-webkit-scrollbar-thumb {
            border-radius: 0.5rem; /* rounded-lg */
          }
        }
        @media (min-width: 768px) {
          .textarea-rounded-scrollbar::-webkit-scrollbar-track {
            border-radius: 0.75rem; /* rounded-xl */
          }
          .textarea-rounded-scrollbar::-webkit-scrollbar-thumb {
            border-radius: 0.75rem; /* rounded-xl */
          }
        }
      `}</style>
      <Navigation
        hideMenuItems={true}
        showGenerateNewApp={true}
        appId={appId || undefined}
        currentUserId={userId || undefined}
        onTimerExpire={() => setHasObservedExpiration(true)}
        pageTitle="App Builder"
      />

      {/* Spacer for fixed Navigation */}
      <div className="h-14 md:h-16 lg:h-20 flex-shrink-0"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 p-1.5 sm:p-2 md:p-3 lg:p-4 max-w-6xl mx-auto w-full overflow-y-auto lg:overflow-hidden min-h-0">

        {/* Wrapper for Left + Middle Panels (for tablet layout) */}
        <div className="flex flex-col md:flex-row lg:contents gap-2 sm:gap-2.5 md:gap-3 md:h-full">
          {/* Left Panel: AI Builder */}
          <div className="w-full md:w-[280px] lg:w-[280px] xl:w-[360px] h-[50vh] sm:h-[50vh] md:h-full lg:h-full flex-shrink-0 order-1 md:order-1 lg:order-1">

          {/* AI Builder */}
          <div className="h-full bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 border-b border-gray-100">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0 flex-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-md sm:rounded-lg md:rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-semibold flex-shrink-0">AI</div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-gray-900 truncate">AI Developer</p>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] text-gray-500 hidden sm:block">Chat and build your app</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[8px] sm:text-[9px] md:text-[10px] font-medium border border-green-100 flex-shrink-0">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500"></div>
                <span className="hidden sm:inline">Ready</span>
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-2 sm:space-y-2.5 md:space-y-3 min-h-0 chat-scroll">
            {/* Build Status Bar */}
            {!hideProgressBar && (progressState.status !== 'idle' || isCreating) && (
              <div className={`bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 mb-1.5 sm:mb-2 sticky top-0 z-10 ${progressState.status === 'running' ? 'animate-[gentlePulse_2s_ease-in-out_infinite]' : ''}`}>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-800 truncate">Build status</span>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${
                    progressState.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : progressState.status === 'failed'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : progressState.status === 'running'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}>
                    {progressState.status === 'completed'
                      ? 'Completed'
                      : progressState.status === 'failed'
                      ? 'Failed'
                      : 'In progress'}
                  </span>
                </div>
                <div className="w-full h-2 sm:h-2.5 md:h-3 rounded-full bg-gray-200 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${progressState.status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600'}`}
                    style={{
                      width: `${Math.min(Math.max(progressState.percent, 0), 100)}%`,
                      backgroundSize: progressState.status === 'failed' ? undefined : '200% 100%',
                      animation: progressState.status === 'running' ? 'shimmer 2s ease-in-out infinite' : undefined
                    }}
                  />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-600 gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0 flex-1">
                    {progressState.status === 'running' && <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 animate-spin flex-shrink-0" />}
                    {progressState.status === 'completed' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 flex-shrink-0" />}
                    {progressState.status === 'failed' && <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 flex-shrink-0" />}
                    <span className="line-clamp-1 text-[10px] sm:text-[11px]">{progressState.message || (isCreating ? '🚧 Starting app generation...' : 'Waiting for build to start...')}</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 flex-shrink-0">{Math.round(progressState.percent)}%</span>
                </div>
              </div>
            )}
            {/* Load More History Button */}
            {hasMoreHistory && !isLoadingHistory && (
              <div className="flex justify-center mb-1.5 sm:mb-2">
                <button
                  onClick={() => loadChatHistory(true)}
                  className="text-[10px] sm:text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-colors border border-orange-200 active:bg-orange-100"
                >
                  Load More ({totalHistoryCount - chatMessages.length + 1})
                </button>
              </div>
            )}
            {/* Prominent Initial Loading Spinner */}
            {(isInitialLoad || isLoadingHistory || isLoadingExpoInfo) && chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
                <div className="relative w-12 h-12 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
                </div>
                <p className="text-sm sm:text-base text-gray-500">Please wait while we prepare your workspace</p>
              </div>
            )}
            {isLoadingHistory && chatMessages.length > 0 && (
              <div className="flex justify-center mb-2">
                <div className="w-full">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 bg-gray-200 rounded w-32 animate-pulse" />
                          <div className="h-2.5 bg-gray-200 rounded w-40 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!isInitialLoad && !isLoadingHistory && !isLoadingExpoInfo && chatMessages.length === 0 && progressState.status === 'idle' && !isGenerating && !isCreating && (
              <div className="border border-gray-200 bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center">
                <p className="font-semibold text-gray-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">No active build</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">Start a new run to see progress and chat updates here.</p>
              </div>
            )}
  {chatMessages.map((msg, idx) => {
              // Generate unique key based on message content, timestamp, and index
              const uniqueKey = msg.id
                ? `msg-${msg.id}`
                : `${msg.role}-${msg.timestamp?.getTime() || Date.now()}-${idx}-${msg.content.substring(0, 20)}`;

              return (
                <div key={uniqueKey} className={`flex items-end gap-1 sm:gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-[fadeInUp_180ms_ease]`}>
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-orange-500' : 'bg-gray-200'
                  }`}>
                    {msg.role === 'user' ? (
                      <span className="text-white text-[10px] sm:text-[11px] font-bold">{getUserInitials(user)}</span>
                    ) : (
                      <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-700" />
                    )}
                  </div>
                  <div className={`flex flex-col gap-0.5 sm:gap-1 max-w-[85%] sm:max-w-[220px] md:max-w-[260px] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[8px] sm:text-[9px] text-gray-500 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.timestamp && <span className="font-medium">{formatTime(msg.timestamp)}</span>}
                      {getRunLabel(msg.sessionId) && (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[8px] sm:text-[9px] text-blue-600 font-medium">
                          {getRunLabel(msg.sessionId)}
                        </span>
                      )}
                    </div>
                    <div className={`rounded-xl px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : msg.type === 'stderr'
                        ? 'bg-red-50 border border-red-200 text-red-900'
                        : msg.type === 'stdout'
                        ? 'bg-gray-100 border border-gray-200 text-gray-900'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className={`text-[10px] sm:text-[11px] leading-relaxed whitespace-pre-line ${msg.type ? 'font-mono text-[9px] sm:text-[10px]' : ''}`}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {isClaudeExecuting && (
              <div className="flex justify-start">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-100 flex items-center justify-center mr-1 sm:mr-1.5">
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 animate-spin" />
                </div>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2">
                  <p className="text-[9px] sm:text-[9.5px] text-gray-500">Analyzing your change request...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
 <div className="p-1 sm:p-1.5 md:p-2 border-t border-gray-100">
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value)
          }}
          disabled={isGenerating}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1
                setHistoryIndex(newIndex)
                setUserInput(commandHistory[newIndex])
              }
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              if (historyIndex > 0) {
                const newIndex = historyIndex - 1
                setHistoryIndex(newIndex)
                setUserInput(commandHistory[newIndex])
              } else if (historyIndex === 0) {
                setHistoryIndex(-1)
                setUserInput('')
              }
            }
          }}
          placeholder="Describe change..."
          className="flex-1 px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg md:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-[9.5px] sm:text-[10px] md:text-[10.5px] resize-none overflow-hidden textarea-rounded-scrollbar"
          style={{ minHeight: '2rem' }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!userInput.trim() || isClaudeExecuting || isGenerating}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center h-6 sm:h-7 md:h-8 w-6 sm:w-7 md:w-8 rounded-lg flex-shrink-0"
        >
          {isGenerating || isClaudeExecuting ? (
            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 text-white animate-spin" />
          ) : (
            <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 text-white" />
          )}
        </button>
      </div>
      {/* Powered by Claude Sonnet 4.5 & GPT-5 */}
      <div className="hidden sm:flex items-center justify-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
        <span className="text-[9px] sm:text-[10px] md:text-[10.5px] text-gray-400">Powered by</span>
        <span className="text-[9px] sm:text-[10px] md:text-[10.5px] font-semibold text-gray-400">Claude Sonnet 4.5 & GPT-5</span>
      </div>
    </div>
          </div>
        </div>

          {/* Middle Panel: Live Preview */}
          <div className="hidden md:flex w-full md:flex-1 lg:flex-1 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-1.5 sm:p-2 md:p-3 lg:p-4 flex-col h-full min-h-0 overflow-hidden order-2">
  
  <div className="flex items-center justify-between  gap-2 flex-shrink-0">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 truncate">Live Preview</h2>
    </div>
    <button
      onClick={handleReloadApp}
      disabled={!expoInfo || isRestarting || !isAppRunning || isGenerating}
      className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
    >
      <RefreshCw className={`w-4 h-4 ${isRestarting ? 'animate-spin' : ''}`} />
    </button>
  </div>

  {/* Info Box under Live Preview */}
  <div className="flex items-center gap-1  bg-white  border-gray-200 rounded-lg  flex-shrink-0">
    <Info className="w-3 h-3 text-orange-600 flex-shrink-0" />
    <p className="text-[11px] text-gray-600 leading-tight lg:whitespace-nowrap">
      <span className="hidden lg:inline">Preview may not be fully accurate. Test on a real device.</span>
      <span className="lg:hidden">
        Preview may not be fully<br />
        accurate. Test on a real<br />
        device.
      </span>
    </p>
  </div>

  {/* Phone Mockup Container */}
  <div className="flex-1 w-full flex justify-center items-center min-h-0 overflow-hidden p-2 sm:p-4">
    
    {/* iPhone 16 Pro Frame (Black Hardware)
        - The borderRadius uses percentage to scale perfectly without becoming a circle
    */}
    <div className="relative aspect-[9/19.5] h-full max-h-[550px] w-auto max-w-[240px] bg-[#080808] p-[1.2%] shadow-2xl flex flex-col ring-1 ring-black/50"
         style={{ borderRadius: '18% / 8.5%', maxHeight: 'min(550px, 65vh)' }}>
      
      {/* Side Buttons */}
      <div className="absolute -left-[2px] top-[18%] w-[3px] h-[6%] bg-[#1a1a1a] rounded-l-sm"></div>
      <div className="absolute -left-[2px] top-[26%] w-[3px] h-[12%] bg-[#1a1a1a] rounded-l-sm"></div>
      <div className="absolute -left-[2px] top-[40%] w-[3px] h-[12%] bg-[#1a1a1a] rounded-l-sm"></div>
      <div className="absolute -right-[2px] top-[32%] w-[3px] h-[18%] bg-[#1a1a1a] rounded-r-sm"></div>

      {/* Screen Area (White Background) */}
      <div className="relative w-full h-full bg-white overflow-hidden flex flex-col shadow-inner"
           style={{ borderRadius: '16.5% / 7.8%' }}>
        
        {/* Dynamic Island */}
        <div className="absolute top-[2.5%] left-1/2 -translate-x-1/2 w-[28%] h-[3.2%] bg-black rounded-full z-30 flex items-center justify-end px-[1.5%]">
           <div className="w-[12%] aspect-square rounded-full bg-[#1a1a2e]"></div>
        </div>

        {/* Status Bar (Dark Icons for White BG) */}
<div className="h-[6%] w-full flex items-end justify-between px-[8%] pb-[0%] flex-shrink-0 z-20 bg-white">
          <span className="text-[min(1.4vh,12px)] font-bold text-black">9:41</span>
          <div className="flex gap-1 items-center">
            <svg className="w-[min(2.4vh,20px)] h-[min(1.2vh,10px)]" viewBox="0 0 18 12" fill="black">
               <rect x="0" y="9" width="2.5" height="3" rx="0.5"/><rect x="4" y="6" width="2.5" height="6" rx="0.5"/>
               <rect x="8" y="3" width="2.5" height="9" rx="0.5"/><rect x="12" y="0" width="2.5" height="12" rx="0.5"/>
            </svg>
              <svg className="w-[min(2.4vh,20px)] h-[min(1.2vh,10px)]" viewBox="0 0 25 12" fill="none">
                        <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" strokeOpacity="0.35"/>
                        <path d="M23 4v4" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round"/>
                        <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor"/>
                      </svg>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full relative min-h-0 bg-white">
          {isAppRunning && expoInfo?.webUrl ? (
            iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <p className="text-xs font-medium text-gray-700">Preview failed to load</p>
                <button onClick={handleRefreshIframe} className="mt-3 px-4 py-1.5 bg-orange-600 text-white text-[10px] rounded-full">Refresh</button>
              </div>
            ) : (
              <>
                {!iframeLoaded && (
                  <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                )}
                <iframe
                  key={`${expoInfo.webUrl}-${iframeKey}`}
                  src={expoInfo.webUrl}
                  className="w-full h-full border-0"
                  style={{ zoom: APP_BUILDER_CONFIG.IFRAME_ZOOM }}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              </>
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
<div className="text-center">
  <p className="text-xs font-medium text-gray-700 mb-1">
    App is not running
  </p>

  <p className="text-[9px] sm:text-[8px] md:text-[8px] text-gray-500 leading-tight text-center px-2 pb-2">
    The app has stopped or expired after 15 minutes
  </p>
</div>
               
               <button 
                onClick={handleRestartApp} 
                disabled={isRestarting}
                className="px-6 py-2.5 bg-[#f05123] text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-lg active:scale-95 transition-all"
               >
                 {isRestarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                 <span>{isRestarting ? 'Restarting...' : 'Restart App'}</span>
               </button>
            </div>
          )}
        </div>

        {/* Home Bar (Dark for White BG) */}
        <div className=" w-full flex items-center justify-center flex-shrink-0 bg-white pb-[2%]">
          <div className="w-[35%] h-[2.5px] bg-black/10 rounded-full "></div>
        </div>

      </div>
    </div>
  </div>
</div>
        </div>

        {/* Right Panel: Expo Connect Screen */}
        <div className="w-full lg:w-[240px] xl:w-[320px] order-3 md:order-3 lg:order-3">

          {/* Expo Connect Screen */}
          <div className="bg-[#1a1a1a] rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-800 overflow-y-auto flex flex-col min-h-[320px] xs:min-h-[350px] sm:min-h-[380px] md:min-h-[450px] lg:h-full items-center pt-1 sm:pt-1.5 md:pt-2 px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
            {/* Expo Logo */}
            <div className="mb-0">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" viewBox="0 -183.5 512 512" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <g fill="white">
                  <path d="M66.6783973,46.5413294 C67.8291061,44.8451711 69.0888057,44.6294864 70.1107072,44.6294864 C71.1326087,44.6294864 72.8350272,44.8451711 73.9861863,46.5413294 C83.0567441,59.0000603 98.0290194,83.8184395 109.073572,102.125744 C116.275973,114.064741 121.807933,123.234382 122.942878,124.401304 C127.203428,128.782104 133.046597,126.05193 136.441976,121.082939 C139.784661,116.190963 140.712434,112.755951 140.712434,109.091247 C140.712434,106.595268 92.2849333,16.5289974 87.4078196,9.03209576 C82.7176116,1.82134459 81.1899387,0 73.16245,0 L67.1553447,0 C59.1517259,0 57.9951622,1.82134459 53.3045039,9.03209576 C48.4278405,16.5289974 0,106.595268 0,109.091247 C0,112.755951 0.927977482,116.190963 4.27073475,121.082939 C7.66608684,126.05193 13.5092105,128.782104 17.7696253,124.401304 C18.9047061,123.234382 24.4366655,114.064741 31.6391568,102.125744 C42.6835292,83.8184395 57.6078395,59.0000603 66.6783973,46.5413294 Z"/>
                  <path d="M387.841898,39.3946846 C407.787668,39.3946846 423.649434,57.4016785 423.649434,79.673636 C423.649434,101.945594 407.787668,120.110579 387.841898,120.110579 C377.1626,120.110579 368.838765,115.687894 363.499115,107.632032 L363.499115,107.632032 L363.499115,144.120084 L341.355065,144.120084 L341.355065,40.9742858 L363.499115,40.9742858 L363.499115,51.8733221 C368.838765,43.8175048 377.1626,39.3946846 387.841898,39.3946846 Z M471.952632,39.3946846 C494.565974,39.3946846 512,56.769802 512,79.8317177 C512,102.893183 494.565974,120.110579 471.952632,120.110579 C449.179406,120.110579 431.903462,102.893183 431.903462,79.8317177 C431.903462,56.769802 449.179406,39.3946846 471.952632,39.3946846 Z M241.752323,7.96128353 L241.752323,30.3911426 L197.620952,30.3911426 L197.620952,50.2938561 L236.883767,50.2938561 L236.883767,72.7234449 L197.620952,72.7234449 L197.620952,96.1010737 L241.752323,96.1010737 L241.752323,118.531113 L174.377535,118.531113 L174.377535,7.96128353 L241.752323,7.96128353 Z M277.784596,40.9742858 L290.505896,59.2973079 L303.383926,40.9742858 L329.768711,40.9742858 L303.698288,78.409883 L331.653081,118.531113 L304.954385,118.531113 L290.348715,97.5229084 L275.743045,118.531113 L249.358711,118.531113 L277.156323,78.5679647 L251.0859,40.9742858 L277.784596,40.9742858 Z M382.816611,60.5610609 C371.979682,60.5610609 363.499115,68.9326363 363.499115,79.673636 C363.499115,90.5727174 371.979682,98.7866614 382.816611,98.7866614 C393.49591,98.7866614 402.133657,90.4146357 402.133657,79.673636 C402.133657,69.0907181 393.49591,60.5610609 382.816611,60.5610609 Z M471.952632,60.7186923 C461.427362,60.7186923 453.577321,68.7745546 453.577321,79.8317177 C453.577321,90.5727174 461.427362,98.7866614 471.952632,98.7866614 C482.315766,98.7866614 490.327942,90.5727174 490.327942,79.8317177 C490.327942,68.7745546 482.315766,60.7186923 471.952632,60.7186923 Z"/>
                </g>
              </svg>
            </div>

            {/* App Status */}
            <div className="mb-1.5 sm:mb-2 md:mb-3 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-md sm:rounded-lg bg-gray-800 flex items-center justify-between w-full">
              <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400">App Status</span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isAppRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-300">
                  {isAppRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-0.5 sm:space-y-1 mb-1.5 sm:mb-2 md:mb-3 text-gray-400 text-[9px] sm:text-[10px] md:text-xs">
              <p>1. Install Expo Go</p>
              <p>2. Scan this QR code</p>
            </div>


            {/* QR Code or Restart Button */}
            <div className="bg-white p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg mb-2 sm:mb-3 md:mb-4">
              {isAppRunning && expoInfo?.qrCode && iframeLoaded ? (
                <QRCode
                  value={expoInfo.qrCode}
                  size={144}
                  level="M"
                  className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36"
                />
              ) : isAppRunning && expoInfo?.qrCode ? (
                <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-blue-50 flex items-center justify-center rounded-md sm:rounded-lg border border-blue-100">
                  <div className="text-center">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-500 animate-spin mx-auto mb-1 sm:mb-1.5 md:mb-2" />
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-blue-600 font-medium">Preparing QR...</p>
                  </div>
                </div>
              ) : isAppRunning ? (
                <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-gray-100 flex items-center justify-center rounded-md sm:rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-400 animate-spin mx-auto mb-1 sm:mb-1.5 md:mb-2" />
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">Waiting for Expo...</p>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-600 text-center px-1 sm:px-2">App stopped or expired</p>
                  <button
                    onClick={handleRestartApp}
                    disabled={isRestarting || isGenerating}
                    className="px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2 bg-orange-600 text-white text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium rounded-md sm:rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-1 sm:gap-1.5"
                  >
                    {isRestarting ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 animate-spin" />
                        <span>Restarting...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                        <span>Restart</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-700 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4"></div>

            {/* Quick Links */}
            <div className="w-full">
              <h4 className="text-white font-semibold text-[10px] sm:text-xs md:text-sm mb-1.5 sm:mb-2 md:mb-3 text-center">Quick Links</h4>

              <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
                {/* Access Merchant Panel */}
                <a
                  href={`/merchant-panel/${hashedAppId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-gray-800 hover:bg-gray-700 rounded-md sm:rounded-lg transition-colors group active:bg-gray-600"
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 min-w-0 flex-1">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400" />
                    </div>
                    <span className="font-medium text-white text-[9px] sm:text-[10px] md:text-xs truncate">Access Merchant Panel</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                </a>

                {/* Publish to App Store */}
                <button
                  onClick={() => setShowAppStoreModal(true)}
                  className="w-full flex items-center justify-between px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-gray-800 hover:bg-gray-700 rounded-md sm:rounded-lg transition-colors group active:bg-gray-600"
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 min-w-0 flex-1">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                      <Image
                        src="/images/app-store-icon.webp"
                        alt="Apple App Store"
                        width={20}
                        height={20}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                        unoptimized
                      />
                    </div>
                    <span className="font-medium text-white text-[9px] sm:text-[10px] md:text-xs truncate">Publish to App Store</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                </button>

                {/* Publish to Google Play Store */}
                <button
                  onClick={() => setShowPlayModal(true)}
                  className="w-full flex items-center justify-between px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-gray-800 hover:bg-gray-700 rounded-md sm:rounded-lg transition-colors group active:bg-gray-600"
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 min-w-0 flex-1">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                      <Image
                        src="/images/app-store-icon.png"
                        alt="Google Play Store"
                        width={20}
                        height={20}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                      />
                    </div>
                    <span className="font-medium text-white text-[9px] sm:text-[10px] md:text-xs truncate">Publish to Google Play Store</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                </button>

                {/* Download Source */}
                <button
                  onClick={handleDownloadSourceClick}
                  className="w-full flex items-center justify-between px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-gray-800 hover:bg-purple-900 rounded-md sm:rounded-lg transition-colors group active:bg-purple-800"
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 min-w-0 flex-1">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-400" />
                    </div>
                    <span className="font-medium text-white text-[9px] sm:text-[10px] md:text-xs truncate">Download Source</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                </button>

                {/* Talk to a Human */}
                <button className="w-full flex items-center justify-between px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-gray-800 hover:bg-blue-900 rounded-md sm:rounded-lg transition-colors group active:bg-blue-800">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 min-w-0 flex-1">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400" />
                    </div>
                    <span className="font-medium text-white text-[9px] sm:text-[10px] md:text-xs truncate">Talk to a Human</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play Publish Modal */}
      {showPlayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/app-store-icon.png"
                  alt="Google Play Store"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">Publish to Google Play</h3>
                  <p className="text-sm text-gray-400">Provide your Play Console details and metadata to queue a publish job.</p>
                </div>
              </div>
              <button onClick={() => setShowPlayModal(false)} className="text-gray-400 hover:text-gray-200 transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Package name *</label>
                <input
                  value={playForm.packageName}
                  onChange={e => handlePlayFieldChange('packageName', e.target.value)}
                  placeholder="com.example.app"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Track</label>
                <select
                  value={playForm.track}
                  onChange={e => handlePlayFieldChange('track', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="internal">Internal</option>
                  <option value="alpha">Alpha</option>
                  <option value="beta">Beta</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">App title *</label>
                <input
                  value={playForm.appTitle}
                  onChange={e => handlePlayFieldChange('appTitle', e.target.value)}
                  placeholder="My App"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Contact email</label>
                <input
                  value={playForm.contactEmail}
                  onChange={e => handlePlayFieldChange('contactEmail', e.target.value)}
                  placeholder="support@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Short description</label>
                <input
                  value={playForm.shortDescription}
                  onChange={e => handlePlayFieldChange('shortDescription', e.target.value)}
                  maxLength={80}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Full description</label>
                <textarea
                  rows={3}
                  value={playForm.fullDescription}
                  onChange={e => handlePlayFieldChange('fullDescription', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Service account JSON *</label>
                <textarea
                  rows={4}
                  value={playForm.serviceAccountJson}
                  onChange={e => handlePlayFieldChange('serviceAccountJson', e.target.value)}
                  placeholder='{ "type": "service_account", ... }'
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Build type</label>
                <select
                  value={playForm.buildType}
                  onChange={e => handlePlayFieldChange('buildType', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="aab">.aab (recommended)</option>
                  <option value="apk">.apk</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPlayModal(false)}
                className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                disabled={isSubmittingPlay}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPlayPublish}
                disabled={isSubmittingPlay}
                className="px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30"
              >
                {isSubmittingPlay ? 'Submitting...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Progress Modal */}
      <PublishProgressModal
        isOpen={showPublishProgressModal}
        progress={publishProgress}
        status={publishStatus}
        step={publishStep}
        error={publishError}
        jobId={publishJobId}
        onClose={() => setShowPublishProgressModal(false)}
        onCancel={handleCancelPublish}
      />

      {/* Download Source Modal */}
      <DownloadSourceModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        appId={Number(appId)}
        existingJob={existingDownloadJob}
      />

      {/* App Store Publish Modal */}
      <AppStorePublishModal
        isOpen={showAppStoreModal}
        onClose={() => setShowAppStoreModal(false)}
        form={appStoreForm}
        onFieldChange={handleAppStoreFieldChange}
        onSubmit={handleSubmitAppStorePublish}
        isSubmitting={isSubmittingAppStore}
      />
    </div>
  )
}

export default function AppBuilderPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>}>
        <AppBuilderContent />
      </Suspense>
    </ErrorBoundary>
  )
}
