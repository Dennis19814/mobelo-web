import React, { useState, useEffect } from 'react';
import { X, Save, Eye, AlertCircle, Code, FileText, Copy, Check } from 'lucide-react';
import { Template, UpdateTemplateDto, TEMPLATE_VARIABLES } from '@/types/template';

interface TemplateEditModalProps {
  template: Template;
  onSave: (templateId: number, updates: UpdateTemplateDto) => Promise<void>;
  onPreview: (templateId: number) => void;
  onClose: () => void;
}

export function TemplateEditModal({ template, onSave, onPreview, onClose }: TemplateEditModalProps) {
  const [formData, setFormData] = useState({
    subject: template.subject || '',
    content: template.content || '',
    contentHtml: template.contentHtml || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'html'>('content');
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEmail = template.type === 'email_otp';
  const variables = TEMPLATE_VARIABLES[template.type];

  // Validate that required variables are present
  const validateContent = (): boolean => {
    const contentToCheck = activeTab === 'html' && formData.contentHtml ? formData.contentHtml : formData.content;

    if (!contentToCheck.includes('{{otp_code}}')) {
      setValidationError('Template must include {{otp_code}} variable');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError(null); // Clear validation error on change
  };

  const handleInsertVariable = async (variableKey: string) => {
    const variableToken = `{{${variableKey}}}`;
    const textarea = document.querySelector(`textarea[name="${activeTab === 'html' ? 'contentHtml' : 'content'}"]`) as HTMLTextAreaElement;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const field = activeTab === 'html' ? 'contentHtml' : 'content';
      const currentValue = formData[field];
      const newValue = currentValue.substring(0, start) + variableToken + currentValue.substring(end);

      handleInputChange(field, newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableToken.length, start + variableToken.length);
      }, 0);
    }

    // Copy to clipboard feedback
    setCopiedVariable(variableKey);
    setTimeout(() => setCopiedVariable(null), 1500);
  };

  const handleSave = async () => {
    if (!validateContent()) {
      return;
    }

    setIsSaving(true);
    try {
      const updates: UpdateTemplateDto = {
        content: formData.content,
      };

      if (isEmail) {
        updates.subject = formData.subject || null;
        updates.contentHtml = formData.contentHtml || null;
      }

      await onSave(template.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      setValidationError('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const characterCount = formData.content.length;
  const isOverSmsLimit = !isEmail && characterCount > 160;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit {template.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{isEmail ? 'Email' : 'SMS'} OTP Template</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Form Fields */}
            <div className="col-span-2 space-y-4">
              {/* Email Subject (only for email templates) */}
              {isEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Tab Switcher (for email) */}
              {isEmail && (
                <div className="flex space-x-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'content'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Plain Text
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'html'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Code className="w-4 h-4 inline mr-2" />
                    HTML
                  </button>
                </div>
              )}

              {/* Content Textarea */}
              {(!isEmail || activeTab === 'content') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEmail ? 'Plain Text Content' : 'SMS Message'}
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder={`Enter ${isEmail ? 'email content' : 'SMS message'}...`}
                    rows={isEmail ? 12 : 6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  {!isEmail && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        Characters: {characterCount}
                      </span>
                      <span className={`text-sm font-medium ${isOverSmsLimit ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverSmsLimit ? `${characterCount - 160} over SMS limit` : `${160 - characterCount} remaining`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* HTML Content Textarea (email only) */}
              {isEmail && activeTab === 'html' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTML Content
                  </label>
                  <textarea
                    name="contentHtml"
                    value={formData.contentHtml}
                    onChange={(e) => handleInputChange('contentHtml', e.target.value)}
                    placeholder="Enter HTML email template..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{validationError}</p>
                </div>
              )}
            </div>

            {/* Right Column - Variables */}
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sticky top-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Variables</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Click to insert at cursor position
                </p>
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => handleInsertVariable(variable.key)}
                      className="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <code className="text-xs font-mono text-orange-600 truncate block">
                              {`{{${variable.key}}}`}
                            </code>
                            {variable.required && (
                              <span className="text-xs text-red-600">*</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{variable.label}</p>
                        </div>
                        {copiedVariable === variable.key ? (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-orange-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  * Required variables must be included
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onPreview(template.id)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
