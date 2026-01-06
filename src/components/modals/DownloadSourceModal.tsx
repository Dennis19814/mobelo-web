'use client';

import { useState, useEffect } from 'react';
import { Download, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { logger } from '@/lib/logger';

interface DownloadSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  existingJob?: {
    id: number;
    status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed' | 'cancelled';
    createdAt: string;
  } | null;
}

export function DownloadSourceModal({ isOpen, onClose, appId, existingJob }: DownloadSourceModalProps) {
  const [stage, setStage] = useState<'confirm' | 'success' | 'status'>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState(existingJob);

  // Determine initial stage based on existing job
  useEffect(() => {
    if (existingJob) {
      setStage('status');
      setCurrentJob(existingJob);
    } else {
      setStage('confirm');
      setCurrentJob(null);
    }
    setError(null);
  }, [existingJob, isOpen]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.requestSourceDownload(appId);

      if (response.ok) {
        setCurrentJob(response.data);
        setStage('success');
        // Auto-transition to status view after 2 seconds
        setTimeout(() => {
          setStage('status');
        }, 2000);
      } else {
        setError(response.data?.message || 'Failed to create download request. Please try again.');
      }
    } catch (err: any) {
      logger.error('Error requesting source download:', err);
      setError(err.data?.message || 'Failed to create download request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isActiveJob = currentJob && (currentJob.status === 'pending' || currentJob.status === 'processing');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">

        {/* STAGE: Active Job Status View */}
        {stage === 'status' && isActiveJob && (
          <>
            <div className="px-6 py-4 border-b bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                {currentJob.status === 'pending' && <Clock className="w-6 h-6 text-orange-600" />}
                {currentJob.status === 'processing' && <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Download Request {currentJob.status === 'pending' ? 'Pending' : 'In Progress'}
                  </h3>
                  <p className="text-sm text-orange-700">
                    You have an existing source code download request
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-1.5 text-sm font-medium rounded-full ${
                    currentJob.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentJob.status === 'pending' ? 'Pending' : 'Processing'}
                  </span>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 You will receive an email when the download is ready. This may take several hours.
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Requested: {new Date(currentJob.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* STAGE: Confirmation */}
        {stage === 'confirm' && (
          <>
            <div className="px-6 py-4 border-b bg-purple-50 border-purple-200">
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Download Source Code</h3>
                  <p className="text-sm text-purple-700">Confirm your request</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-700">
                Please confirm the Mobile App full source code download. Once the download is ready, you should receive an email with a download link.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </>
        )}

        {/* STAGE: Success (Shows briefly before auto-transition) */}
        {stage === 'success' && (
          <>
            <div className="px-6 py-4 border-b bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Request Confirmed</h3>
                  <p className="text-sm text-green-700">Download request created successfully</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm text-gray-700 text-center">
                Source code download confirmed. You should hear from us soon via email.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
