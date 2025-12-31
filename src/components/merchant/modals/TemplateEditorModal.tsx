'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Code, Eye, Save, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { apiService } from '@/lib/api-service';
import { logger } from '@/lib/logger';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any | null;
  appId: number;
  onSave: () => void;
}

export function TemplateEditorModal({
  isOpen,
  onClose,
  template,
  appId,
  onSave,
}: TemplateEditorModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'plain' | 'html'>('plain');

  const isEmailTemplate = template?.type === 'email_otp';

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean'],
      [{ 'code-block': true }],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link',
    'code-block'
  ];

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setSubject(template.subject || '');
      setContent(template.content || '');
      setContentHtml(template.contentHtml || '');
      setViewMode(template.type === 'sms_otp' ? 'plain' : 'plain');
    }
  }, [template]);

  const handleInsertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;

    if (viewMode === 'plain') {
      // Insert into plain text content
      setContent(prev => prev + placeholder);
    } else {
      // Insert into HTML content
      setContentHtml(prev => prev + placeholder);
    }
  };

  const handlePreview = async () => {
    if (!template) return;

    try {
      const response = await apiService.previewSystemTemplate(appId, template.id, {
        otp_code: '123456',
        app_name: 'MyApp',
        user_name: 'John Doe',
        expiry_minutes: '15',
      });

      if (response.ok) {
        setPreviewData(response.data);
        setShowPreview(true);
      }
    } catch (err) {
      logger.error('Preview error:', { error: err instanceof Error ? err.message : String(err) });
      setError('Failed to generate preview');
    }
  };

  const handleSave = async () => {
    if (!template) return;

    // Validate required fields
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (!content.includes('{{otp_code}}')) {
      setError('Template must include {{otp_code}} variable');
      return;
    }

    if (isEmailTemplate && !subject.trim()) {
      setError('Subject is required for email templates');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: any = {
        name,
        content,
      };

      if (isEmailTemplate) {
        updateData.subject = subject;
        updateData.contentHtml = contentHtml || content;
      }

      const response = await apiService.updateSystemTemplate(appId, template.id, updateData);

      if (response.ok) {
        onSave();
        onClose();
      } else {
        setError(response.data?.message || 'Failed to save template');
      }
    } catch (err) {
      logger.error('Save error:', { error: err instanceof Error ? err.message : String(err) });
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit {template.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEmailTemplate ? 'Email OTP Template' : 'SMS OTP Template'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Subject (Email only) */}
            {isEmailTemplate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your {{app_name}} Verification Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* View Mode Toggle (Email only) */}
            {isEmailTemplate && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('plain')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    viewMode === 'plain'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-2" />
                  Plain Text
                </button>
                <button
                  onClick={() => setViewMode('html')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    viewMode === 'html'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-2" />
                  HTML
                </button>
              </div>
            )}

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              {viewMode === 'html' && isEmailTemplate ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    value={contentHtml}
                    onChange={setContentHtml}
                    modules={modules}
                    formats={formats}
                    theme="snow"
                    className="bg-white"
                  />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={isEmailTemplate ? 6 : 4}
                  placeholder="Your {{app_name}} verification code is: {{otp_code}}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              )}
            </div>

            {/* Available Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Variables (click to insert)
              </label>
              <div className="flex flex-wrap gap-2">
                {template.availableVariables.map((variable: string) => (
                  <button
                    key={variable}
                    onClick={() => handleInsertVariable(variable)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {showPreview && previewData && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                {previewData.subject && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Subject: </span>
                    <span className="text-sm text-gray-900">{previewData.subject}</span>
                  </div>
                )}
                {previewData.contentHtml ? (
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: previewData.contentHtml }}
                  />
                ) : (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{previewData.content}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={handlePreview}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
