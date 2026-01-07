import React from 'react';
import { X, Mail, MessageSquare } from 'lucide-react';
import { PreviewResponse, TemplateType } from '@/types/template';

interface TemplatePreviewModalProps {
  preview: PreviewResponse | null;
  templateType: TemplateType;
  onClose: () => void;
}

export function TemplatePreviewModal({ preview, templateType, onClose }: TemplatePreviewModalProps) {
  if (!preview) return null;

  const isEmail = templateType === 'email_otp';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              {isEmail ? (
                <Mail className="w-3.5 h-3.5 text-orange-600" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEmail ? 'Email' : 'SMS'} Template Preview
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Close preview"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEmail ? (
            <div className="space-y-6">
              {/* Email Subject */}
              {preview.subject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-900 font-medium">{preview.subject}</p>
                  </div>
                </div>
              )}

              {/* Email Body (HTML or Plain Text) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                {preview.contentHtml ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={preview.contentHtml}
                      className="w-full h-96 bg-white"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap font-sans text-gray-900 text-sm">
                      {preview.content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // SMS Preview
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Message
              </label>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-4 max-w-sm">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-gray-900 text-sm leading-relaxed">{preview.content}</p>
                </div>
                <div className="mt-2 text-xs text-gray-600 flex justify-between items-center px-2">
                  <span>Character count: {preview.content.length}</span>
                  <span className={preview.content.length > 160 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {preview.content.length > 160 ? 'Over SMS limit!' : 'Within SMS limit'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Test Data Info */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This preview uses test data. Actual OTP codes and user information will be dynamically inserted when sending.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
