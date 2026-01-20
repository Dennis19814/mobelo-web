import React, { useState, useEffect, useCallback } from 'react';
import { Mail, MessageSquare, Edit2, Eye, Loader2, AlertCircle, FileText, Code } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { Template, PreviewResponse, UpdateTemplateDto } from '@/types/template';
import { TemplateEditModal } from '../modals/TemplateEditModal';
import { TemplatePreviewModal } from '../modals/TemplatePreviewModal';

interface TemplatesSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

export default function TemplatesSection({ appId, apiKey, appSecretKey }: TemplatesSectionProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewData, setPreviewData] = useState<{ template: Template; preview: PreviewResponse } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getSystemTemplates(appId);

      if (response.ok) {
        setTemplates(response.data || []);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleSaveTemplate = async (templateId: number, updates: UpdateTemplateDto) => {
    try {
      const response = await apiService.updateSystemTemplate(appId, templateId, updates);

      if (response.ok) {
        await fetchTemplates();
        setEditingTemplate(null);
      } else {
        throw new Error('Failed to update template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const handlePreviewTemplate = async (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setLoadingPreview(true);
    try {
      const response = await apiService.previewSystemTemplate(appId, templateId);

      if (response.ok) {
        setPreviewData({ template, preview: response.data });
      } else {
        throw new Error('Failed to preview template');
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      alert('Failed to preview template. Please try again.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const emailTemplate = templates.find(t => t.type === 'email_otp');
  const smsTemplate = templates.find(t => t.type === 'sms_otp');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load templates</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchTemplates}
              className="text-sm text-red-600 underline hover:text-red-700 mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden min-w-0">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">OTP Templates</h2>
        <p className="text-gray-600 mt-1">
          Customize email and SMS templates for OTP verification codes sent to your users
        </p>
      </div>

      {/* Email OTP Template Card */}
      {emailTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-600 rounded-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{emailTemplate.name}</h3>
                  <p className="text-sm text-gray-600">Email OTP verification template</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreviewTemplate(emailTemplate.id)}
                  disabled={loadingPreview}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleEditTemplate(emailTemplate)}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Template</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Subject</span>
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-900">{emailTemplate.subject || 'No subject set'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${emailTemplate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {emailTemplate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Content Preview</span>
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {emailTemplate.content.substring(0, 200)}
                  {emailTemplate.content.length > 200 && '...'}
                </pre>
              </div>
            </div>

            {emailTemplate.contentHtml && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>HTML Version Available</span>
                </h4>
                <p className="text-xs text-gray-500">This template includes an HTML version for rich email formatting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS OTP Template Card */}
      {smsTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-600 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{smsTemplate.name}</h3>
                  <p className="text-sm text-gray-600">SMS OTP verification template</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreviewTemplate(smsTemplate.id)}
                  disabled={loadingPreview}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleEditTemplate(smsTemplate)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Template</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Message Length</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-900">
                    {smsTemplate.content.length} characters
                    <span className={`ml-2 text-xs ${smsTemplate.content.length > 160 ? 'text-red-600' : 'text-green-600'}`}>
                      {smsTemplate.content.length > 160 ? '(Over SMS limit)' : '(Within limit)'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${smsTemplate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {smsTemplate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Message Preview</h4>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4 max-w-sm">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-sm text-gray-900">{smsTemplate.content}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">About OTP Templates</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-orange-700">
              <li>Use variables like <code className="bg-blue-100 px-1 rounded">{'{{otp_code}}'}</code> to insert dynamic content</li>
              <li>The <code className="bg-blue-100 px-1 rounded">{'{{otp_code}}'}</code> variable is required in all templates</li>
              <li>SMS messages should be kept under 160 characters to avoid splitting</li>
              <li>Templates are automatically used when sending OTP codes via mobile app</li>
              <li>Changes take effect immediately for all new OTP requests</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onPreview={handlePreviewTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {previewData && (
        <TemplatePreviewModal
          preview={previewData.preview}
          templateType={previewData.template.type}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
