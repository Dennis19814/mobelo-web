'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Rocket, Clock, FileCode, Package, Upload, CheckCheck } from 'lucide-react';

interface StepLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface PublishProgressModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
  step: string;
  error?: string | null;
  jobId?: number | null;
  onClose: () => void;
  onCancel?: () => void;
}

export function PublishProgressModal({
  isOpen,
  progress,
  status,
  step,
  error,
  jobId,
  onClose,
  onCancel,
}: PublishProgressModalProps) {
  const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Add new log entry when step changes
  useEffect(() => {
    if (step && isOpen) {
      const logType =
        status === 'failed' ? 'error' :
        status === 'completed' ? 'success' :
        progress >= 90 ? 'success' : 'info';

      setStepLogs(prev => [...prev, {
        timestamp: new Date(),
        message: step,
        type: logType,
      }]);
    }
  }, [step, status, progress, isOpen]);

  // Auto-scroll to latest log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [stepLogs]);

  // Reset logs when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStepLogs([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isProcessing = !isCompleted && !isFailed;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isCompleted ? 'bg-green-50 border-green-200' :
          isFailed ? 'bg-red-50 border-red-200' :
          'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center gap-3">
            {isCompleted && (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
            {isFailed && (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            {isProcessing && (
              <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                isCompleted ? 'text-green-900' :
                isFailed ? 'text-red-900' :
                'text-slate-900'
              }`}>
                {isCompleted && 'Published Successfully! 🎉'}
                {isFailed && 'Publish Failed'}
                {isProcessing && 'Publishing to Google Play'}
              </h3>
              <p className={`text-sm ${
                isCompleted ? 'text-green-700' :
                isFailed ? 'text-red-700' :
                'text-orange-700'
              }`}>
                {isCompleted && 'Your app is now live on Google Play Store'}
                {isFailed && 'Something went wrong during publishing'}
                {isProcessing && 'Please wait while we publish your app...'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Progress Bar */}
          {!isFailed && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isCompleted ? 'bg-green-600' : 'bg-orange-600'
                  }`}
                  style={{ width: `${progress}%` }}
                >
                  {isProcessing && (
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Step */}
          <div className="space-y-3">
            {!isFailed && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Rocket className={`w-5 h-5 mt-0.5 ${
                  isCompleted ? 'text-green-600' : 'text-orange-600'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Current Step</p>
                  <p className="text-sm text-gray-600 mt-0.5">{step}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {isFailed && error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-1">Error Details</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Info */}
            {isCompleted && (
              <div className="space-y-2 mt-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Your app has been successfully published to the internal track.
                  </p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 It may take a few hours for your app to appear in the Play Console and be available for testing.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log - Detailed micro-status updates */}
          {stepLogs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Activity Log</span>
              </div>
              <div
                ref={logContainerRef}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2"
              >
                {stepLogs.map((log, index) => {
                  const Icon =
                    log.type === 'success' ? CheckCheck :
                    log.type === 'error' ? XCircle :
                    log.type === 'warning' ? Clock :
                    FileCode;

                  const iconColor =
                    log.type === 'success' ? 'text-green-600' :
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'warning' ? 'text-yellow-600' :
                    'text-orange-600';

                  const textColor =
                    log.type === 'success' ? 'text-green-800' :
                    log.type === 'error' ? 'text-red-800' :
                    log.type === 'warning' ? 'text-yellow-800' :
                    'text-gray-800';

                  return (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-[10px] font-mono">
                            {log.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className={`${textColor} font-medium leading-tight mt-0.5`}>
                          {log.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Processing Steps Preview */}
          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full ${progress >= 5 ? 'bg-orange-600' : 'bg-gray-300'}`} />
                <span className={progress >= 5 ? 'text-gray-700 font-medium' : ''}>Validating configuration</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full ${progress >= 15 ? 'bg-orange-600' : 'bg-gray-300'}`} />
                <span className={progress >= 15 ? 'text-gray-700 font-medium' : ''}>Building Android app</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full ${progress >= 65 ? 'bg-orange-600' : 'bg-gray-300'}`} />
                <span className={progress >= 65 ? 'text-gray-700 font-medium' : ''}>Uploading to Play Console</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className={progress >= 100 ? 'text-gray-700 font-medium' : ''}>Publishing to track</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {(isCompleted || isFailed) ? (
            <button
              onClick={onClose}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors ${
                isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Close
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  This may take several minutes. Please don't close this window.
                </p>
              </div>
              {onCancel && jobId && (
                <button
                  onClick={onCancel}
                  className="w-full py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel Publishing
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
