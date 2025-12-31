import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

const resolvePublishSocketUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_PUBLISH_SOCKET_URL ||
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
      return 'http://localhost:3003';
    }

    const apiHost = hostname.startsWith('api.') ? hostname : `api.${hostname}`;
    return `${protocol}//${apiHost}`;
  }

  return 'http://localhost:3003';
};

interface PublishProgressEvent {
  jobId: number;
  status: string;
  step: string;
  progress: number;
}

interface PublishCompleteEvent {
  jobId: number;
  appId: number;
  platform: string;
  publishInfo: {
    editId: string;
    versionCode: number;
    track: string;
    publishedAt: Date;
  };
}

interface PublishFailedEvent {
  jobId: number;
  appId: number;
  error: string;
}

interface UsePublishSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  publishProgress: PublishProgressEvent | null;
  publishComplete: PublishCompleteEvent | null;
  publishFailed: PublishFailedEvent | null;
}

/**
 * usePublishSocket - React hook for Socket.io connection to publish-app microservice
 *
 * Connects to publish-app Socket.io server on /publish namespace and listens for events:
 * - publish-progress: Real-time progress updates (0-100%)
 * - publish-complete: Publish succeeded
 * - publish-failed: Publish failed with error
 *
 * Usage:
 * ```tsx
 * const { isConnected, publishProgress, publishComplete, publishFailed } = usePublishSocket(userId);
 *
 * useEffect(() => {
 *   if (publishProgress) {
 *     console.log(`Progress: ${publishProgress.progress}% - ${publishProgress.step}`);
 *   }
 * }, [publishProgress]);
 * ```
 *
 * @param userId - User ID for room-based messaging
 * @returns Connection status and publish events
 */
export function usePublishSocket(userId: number | null): UsePublishSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [publishProgress, setPublishProgress] = useState<PublishProgressEvent | null>(null);
  const [publishComplete, setPublishComplete] = useState<PublishCompleteEvent | null>(null);
  const [publishFailed, setPublishFailed] = useState<PublishFailedEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Memoize event handlers
  const handleConnect = useCallback(() => {
    if (!socketRef.current) return;
    logger.debug('[usePublishSocket] ✅ Connected to publish-app, socket.id:', { socketId: socketRef.current.id });
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    logger.debug('[usePublishSocket] ❌ Disconnected from publish-app, reason:', { reason });
    setIsConnected(false);
  }, []);

  const handleConnectError = useCallback((error: Error) => {
    logger.error('[usePublishSocket] ⚠️ Connection error:', { error: error.message });
    setIsConnected(false);
  }, []);

  const handlePublishProgress = useCallback((event: PublishProgressEvent) => {
    logger.debug('[usePublishSocket] Publish progress:', { event });
    setPublishProgress(event);
  }, []);

  const handlePublishComplete = useCallback((event: PublishCompleteEvent) => {
    logger.debug('[usePublishSocket] Publish complete:', { event });
    setPublishComplete(event);
    setPublishProgress(null); // Clear progress
  }, []);

  const handlePublishFailed = useCallback((event: PublishFailedEvent) => {
    logger.error('[usePublishSocket] Publish failed:', { event });
    setPublishFailed(event);
    setPublishProgress(null); // Clear progress
  }, []);

  useEffect(() => {
    console.log('🔍 [PUBLISH SOCKET DEBUG] usePublishSocket effect triggered:', {
      userId,
      userIdType: typeof userId,
      userIdIsNull: userId === null,
      userIdValue: userId
    });

    if (!userId) {
      console.log('⚠️ [PUBLISH SOCKET DEBUG] No userId provided, skipping socket connection');
      logger.debug('[usePublishSocket] No userId provided, skipping socket connection');
      return;
    }

    const publishSocketUrl = resolvePublishSocketUrl();

    console.log('🔍 [PUBLISH SOCKET DEBUG] Initializing Socket.io client:', {
      userId,
      publishSocketUrl,
      namespace: '/publish',
      room: `user-${userId}`
    });

    logger.debug('[usePublishSocket] Initializing Socket.io client:', {
      userId,
      publishSocketUrl,
      namespace: '/publish',
    });

    // Create socket connection to /publish namespace on port 3003
    const socket = io(`${publishSocketUrl}/publish`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('publish-progress', handlePublishProgress);
    socket.on('publish-complete', handlePublishComplete);
    socket.on('publish-failed', handlePublishFailed);

    // Join user-specific room
    socket.emit('join', `user-${userId}`);
    logger.debug('[usePublishSocket] Emitted join event for room:', { room: `user-${userId}` });

    // Cleanup on unmount
    return () => {
      logger.debug('[usePublishSocket] Cleaning up socket connection');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('publish-progress', handlePublishProgress);
      socket.off('publish-complete', handlePublishComplete);
      socket.off('publish-failed', handlePublishFailed);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    userId,
    handleConnect,
    handleDisconnect,
    handleConnectError,
    handlePublishProgress,
    handlePublishComplete,
    handlePublishFailed,
  ]);

  return {
    socket: socketRef.current,
    isConnected,
    publishProgress,
    publishComplete,
    publishFailed,
  };
}
