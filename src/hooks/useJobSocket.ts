import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

const resolveWorkerUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_WORKER_URL ||
    (process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : '');

  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost) {
      return 'http://localhost:3004';
    }

    // Prefer api.<domain> when frontend runs on the apex domain
    const apiHost = hostname.startsWith('api.') ? hostname : `api.${hostname}`;
    return `${protocol}//${apiHost}`;
  }

  return 'http://localhost:3004';
};

interface JobEvent {
  jobId: number;
  appId: number;
  status: 'completed' | 'failed' | 'processing';
  progress?: number;
  message?: string;
  errorMessage?: string;
  timestamp: string;
  expoQrCode?: string;
  expoWebUrl?: string;
  expoPort?: number;
}

interface ExpoInfo {
  qrCode: string;
  webUrl: string;
  port: number;
}

interface ClaudeOutputEvent {
  sessionId: string;
  userId: number;
  appId: number;
  type: 'stdout' | 'stderr' | 'completion';
  content: string;
  timestamp: Date;
}

interface ClaudeCodeProgressEvent {
  sessionId: string;
  appId: number;
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: string;
}

interface UseJobSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastEvent: JobEvent | null;
  expoInfo: ExpoInfo | null;
  appTimeoutEvent: { appId: number; timestamp: string } | null;
  appRestartedEvent: { appId: number; timestamp: string } | null;
  appReloadedEvent: { appId: number; timestamp: string } | null;
  claudeOutputEvent: ClaudeOutputEvent | null;
  claudeCodeProgressEvent: ClaudeCodeProgressEvent | null;
}

/**
 * useJobSocket - React hook for Socket.io connection to worker
 *
 * Connects to app-builder-worker Socket.io server and listens for job events:
 * - job-completed: Job finished successfully
 * - job-failed: Job failed with error
 * - job-progress: Job progress update
 *
 * Usage:
 * ```tsx
 * const { isConnected, lastEvent } = useJobSocket(userId);
 *
 * useEffect(() => {
 *   if (lastEvent?.status === 'completed') {
 *     navigate(`/app-builder?appId=${lastEvent.appId}`);
 *   }
 * }, [lastEvent]);
 * ```
 *
 * @param userId - User ID for room-based messaging
 * @returns Connection status and last event received
 */
export function useJobSocket(userId: number | null): UseJobSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<JobEvent | null>(null);
  const [expoInfo, setExpoInfo] = useState<ExpoInfo | null>(null);
  const [appTimeoutEvent, setAppTimeoutEvent] = useState<{ appId: number; timestamp: string } | null>(null);
  const [appRestartedEvent, setAppRestartedEvent] = useState<{ appId: number; timestamp: string } | null>(null);
  const [appReloadedEvent, setAppReloadedEvent] = useState<{ appId: number; timestamp: string } | null>(null);
  const [claudeOutputEvent, setClaudeOutputEvent] = useState<ClaudeOutputEvent | null>(null);
  const [claudeCodeProgressEvent, setClaudeCodeProgressEvent] = useState<ClaudeCodeProgressEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Memoize event handlers to prevent recreation on every render
  const handleConnect = useCallback(() => {
    if (!socketRef.current) return;
    logger.debug('[useJobSocket] ✅ Connected to worker, socket.id:', { socketId: socketRef.current.id });
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    logger.debug('[useJobSocket] ❌ Disconnected from worker, reason:', { reason });
    setIsConnected(false);
  }, []);

  const handleConnectError = useCallback((error: Error) => {
    logger.error('[useJobSocket] ⚠️ Connection error:', { error: error.message });
    setIsConnected(false);
  }, []);

  const handleJobCompleted = useCallback((event: JobEvent) => {
    logger.debug('[useJobSocket] Job completed:', { event });
    setLastEvent(event);

    // Extract and store Expo info if available
    if (event.expoQrCode && event.expoWebUrl && event.expoPort) {
      setExpoInfo({
        qrCode: event.expoQrCode,
        webUrl: event.expoWebUrl,
        port: event.expoPort,
      });
      logger.debug('[useJobSocket] Expo info received:', {
        qrCode: event.expoQrCode,
        webUrl: event.expoWebUrl,
        port: event.expoPort,
      });
    }
  }, []);

  const handleJobFailed = useCallback((event: JobEvent) => {
    logger.error('[useJobSocket] Job failed:', { event });
    setLastEvent(event);
  }, []);

  const handleJobProgress = useCallback((event: JobEvent) => {
    logger.debug('[useJobSocket] Job progress:', { event });
    setLastEvent(event);
  }, []);

  const handleAppTimeout = useCallback((event: { appId: number; message: string; timestamp: string }) => {
    logger.debug('[useJobSocket] App timeout:', { event });
    setAppTimeoutEvent({ appId: event.appId, timestamp: event.timestamp });
    // Clear expo info when app times out (app is stopped)
    setExpoInfo(null);
  }, []);

  const handleAppRestarted = useCallback((event: { appId: number; expoQrCode: string; expoWebUrl: string; expoPort: number; timestamp: string }) => {
    logger.debug('[useJobSocket] App restarted:', { event });
    console.log('🔥 [SOCKET DEBUG] app-restarted event received:', {
      appId: event.appId,
      webUrl: event.expoWebUrl,
      qrCode: event.expoQrCode,
      port: event.expoPort,
      timestamp: event.timestamp
    });
    setAppRestartedEvent({ appId: event.appId, timestamp: event.timestamp });

    // Update expoInfo with new data
    const newExpoInfo = {
      qrCode: event.expoQrCode,
      webUrl: event.expoWebUrl,
      port: event.expoPort,
    };
    console.log('🔥 [SOCKET DEBUG] Setting socketExpoInfo to:', newExpoInfo);
    setExpoInfo(newExpoInfo);
  }, []);

  const handleClaudeOutput = useCallback((event: ClaudeOutputEvent) => {
    logger.debug('[useJobSocket] Claude output:', { event });
    setClaudeOutputEvent(event);
  }, []);

  const handleClaudeCodeProgress = useCallback((event: ClaudeCodeProgressEvent) => {
    logger.debug('[useJobSocket] Claude code progress:', { event });
    setClaudeCodeProgressEvent(event);
  }, []);

  const handleAppReloaded = useCallback((event: { appId: number; message: string; timestamp: string }) => {
    logger.debug('[useJobSocket] App reloaded:', { event });
    setAppReloadedEvent({ appId: event.appId, timestamp: event.timestamp });
  }, []);

  useEffect(() => {
    console.log('🔍 [SOCKET DEBUG] useJobSocket effect triggered:', {
      userId,
      userIdType: typeof userId,
      userIdIsNull: userId === null,
      userIdIsUndefined: userId === undefined,
      userIdValue: userId
    });
    logger.debug('[useJobSocket] Effect triggered, userId:', { userId });

    if (!userId) {
      console.log('⚠️ [SOCKET DEBUG] No userId provided, skipping Socket.io connection');
      logger.warn('[useJobSocket] No userId provided, skipping Socket.io connection');
      return;
    }

    const workerUrl = resolveWorkerUrl();
    console.log('🔍 [SOCKET DEBUG] Connecting to Socket.io server:', {
      workerUrl,
      userId,
      userIdString: userId.toString()
    });
    logger.debug('[useJobSocket] Connecting to Socket.io server:', { workerUrl, userId });

    // Connect to worker Socket.io server
    const socket = io(workerUrl, {
      query: { userId: userId.toString() },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Enhanced connection diagnostics
    logger.debug('[useJobSocket] Connection attempt details:', {
      workerUrl,
      userId,
      transports: socket.io.opts.transports,
      withCredentials: socket.io.opts.withCredentials,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    socketRef.current = socket;

    // Attach memoized event handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('job-completed', handleJobCompleted);
    socket.on('job-failed', handleJobFailed);
    socket.on('job-progress', handleJobProgress);
    socket.on('app-timeout', handleAppTimeout);
    socket.on('app-restarted', handleAppRestarted);
    socket.on('app-reloaded', handleAppReloaded);
    socket.on('claude-output', handleClaudeOutput);
    socket.on('claude-code-progress', handleClaudeCodeProgress);

    // Cleanup on unmount
    return () => {
      logger.debug('[useJobSocket] Cleaning up socket connection');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('job-completed', handleJobCompleted);
      socket.off('job-failed', handleJobFailed);
      socket.off('job-progress', handleJobProgress);
      socket.off('app-timeout', handleAppTimeout);
      socket.off('app-restarted', handleAppRestarted);
      socket.off('app-reloaded', handleAppReloaded);
      socket.off('claude-output', handleClaudeOutput);
      socket.off('claude-code-progress', handleClaudeCodeProgress);
      socket.disconnect();
    };
  }, [userId, handleConnect, handleDisconnect, handleConnectError, handleJobCompleted, handleJobFailed, handleJobProgress, handleAppTimeout, handleAppRestarted, handleAppReloaded, handleClaudeOutput, handleClaudeCodeProgress]);

  return { socket: socketRef.current, isConnected, lastEvent, expoInfo, appTimeoutEvent, appRestartedEvent, appReloadedEvent, claudeOutputEvent, claudeCodeProgressEvent };
}
