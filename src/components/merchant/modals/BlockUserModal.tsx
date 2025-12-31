'use client';
import { logger } from '@/lib/logger'

import { useState } from 'react';
import { ShieldBan, X, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface BlockUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onBlock: (userId: number, reason: string) => Promise<void>;
  loading?: boolean;
}

export function BlockUserModal({
  user,
  isOpen,
  onClose,
  onBlock,
  loading = false
}: BlockUserModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Spam or unwanted content',
    'Fraudulent activity',
    'Violates terms of service',
    'Abusive behavior',
    'Suspicious account activity',
    'Payment disputes',
    'Other (specify below)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalReason = reason === 'Other (specify below)' ? customReason : reason;

    if (!finalReason.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onBlock(user.id, finalReason);
      handleClose();
    } catch (error) {
      logger.error('Error blocking user:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    setIsSubmitting(false);
    onClose();
  };

  const isCustomReason = reason === 'Other (specify below)';
  const canSubmit = reason && (isCustomReason ? customReason.trim() : true);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="bg-white rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldBan className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Block User</h3>
              <p className="text-sm text-gray-500">
                Block {user?.firstName} {user?.lastName} (ID: {user?.id})
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

        {/* Warning */}
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Warning: This action will immediately block the user</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>The user will be logged out of all active sessions</li>
                  <li>They will not be able to log in until unblocked</li>
                  <li>All API access will be revoked</li>
                  <li>This action can be reversed later</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reason for blocking <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {predefinedReasons.map((predefinedReason) => (
                  <label key={predefinedReason} className="flex items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={predefinedReason}
                      checked={reason === predefinedReason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-4 w-4 text-orange-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">{predefinedReason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom reason input */}
            {isCustomReason && (
              <div>
                <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Specify reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please provide a detailed reason for blocking this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  required={isCustomReason}
                />
              </div>
            )}

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
                disabled={!canSubmit || isSubmitting || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Blocking...
                  </div>
                ) : (
                  'Block User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}