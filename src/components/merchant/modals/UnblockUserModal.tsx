'use client';
import { logger } from '@/lib/logger'

import { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface UnblockUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUnblock: (userId: number, note?: string) => Promise<void>;
  loading?: boolean;
}

export function UnblockUserModal({
  user,
  isOpen,
  onClose,
  onUnblock,
  loading = false
}: UnblockUserModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await onUnblock(user.id, note.trim() || undefined);
      handleClose();
    } catch (error) {
      logger.error('Error unblocking user:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNote('');
    setIsSubmitting(false);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="bg-white rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Unblock User</h3>
              <p className="text-sm text-gray-500">
                Restore access for {user?.firstName} {user?.lastName} (ID: {user?.id})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Block Information */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900 mb-2">Current Block Details</p>
                <div className="space-y-1 text-red-800">
                  <div><strong>Reason:</strong> {user?.blockReason || 'No reason provided'}</div>
                  <div><strong>Blocked on:</strong> {formatDate(user?.blockedAt)}</div>
                  {user?.blockedByUserId && (
                    <div><strong>Blocked by:</strong> User ID {user.blockedByUserId}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Unblock confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Unblocking this user will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Restore their ability to log in to the app</li>
                  <li>Re-enable API access for their account</li>
                  <li>Allow them to make new orders and transactions</li>
                  <li>Remove the blocked status from their profile</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="unblockNote" className="block text-sm font-medium text-gray-700 mb-2">
                Unblock note (optional)
              </label>
              <textarea
                id="unblockNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about why this user is being unblocked (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                This note will be recorded in the user's activity log for future reference.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Unblocking...
                  </div>
                ) : (
                  'Unblock User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}