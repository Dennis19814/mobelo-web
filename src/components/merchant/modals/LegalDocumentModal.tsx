'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { apiService } from '@/lib/api-service';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any;

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'terms_and_conditions' | 'privacy_policy';
  appId: number;
  onSave: () => void;
}

export function LegalDocumentModal({
  isOpen,
  onClose,
  documentType,
  appId,
  onSave,
}: LegalDocumentModalProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingDocument, setExistingDocument] = useState<any>(null);
  const [hasFocused, setHasFocused] = useState(false);
  const quillRef = useRef<any>(null);

  const title = documentType === 'terms_and_conditions'
    ? 'Terms and Conditions'
    : 'Privacy Policy';

  // Quill modules configuration for legal documents
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link'],
      ['blockquote'],
      [{ 'align': [] }],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'blockquote', 'align'
  ];

  // Fetch existing document when modal opens
  useEffect(() => {
    if (isOpen && appId && documentType) {
      setHasFocused(false); // Reset focus flag when fetching new document
      fetchDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appId, documentType]);

  // Focus the editor when modal opens and content is loaded
  useEffect(() => {
    if (!isOpen) {
      setHasFocused(false); // Reset when modal closes
      return;
    }

    if (!loading && content !== undefined && !hasFocused) {
      // Use requestAnimationFrame and multiple attempts to ensure ReactQuill is fully mounted
      let attempt = 0;
      const maxAttempts = 10;
      const timers: NodeJS.Timeout[] = [];
      
      const attemptFocus = () => {
        if (hasFocused) {
          return;
        }

        if (attempt >= maxAttempts) {
          logger.warn('Could not focus editor after multiple attempts');
          return;
        }

        attempt++;
        
        // Use requestAnimationFrame for better timing with DOM updates
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (hasFocused) return;
            
            if (quillRef.current) {
              try {
                const editor = quillRef.current.getEditor();
                if (editor) {
                  // Try multiple methods to ensure focus works
                  // Method 1: Focus via Quill API
                  editor.focus();
                  
                  // Method 2: Focus the editor's root DOM element directly
                  const editorElement = editor.root;
                  if (editorElement && editorElement instanceof HTMLElement) {
                    editorElement.focus();
                    // Also try clicking it to ensure focus
                    editorElement.click();
                  }
                  
                  // Method 3: Find and focus the .ql-editor element within the ReactQuill container
                  const quillContainer = quillRef.current;
                  if (quillContainer) {
                    const qlEditor = (quillContainer as any).editingArea || 
                                     (quillContainer as any).editor?.root ||
                                     document.querySelector('.ql-editor') as HTMLElement;
                    if (qlEditor && qlEditor instanceof HTMLElement) {
                      qlEditor.focus();
                      qlEditor.click();
                    }
                  }
                  
                  // Move cursor to end of content
                  const length = editor.getLength();
                  if (length > 1) {
                    editor.setSelection(length - 1, 0);
                  } else {
                    editor.setSelection(0, 0);
                  }
                  
                  setHasFocused(true);
                  return;
                }
              } catch (err) {
                // Quill might not be ready yet, retry
                attemptFocus();
                return;
              }
            }
            
            // ReactQuill ref not ready yet, retry
            attemptFocus();
          }, 50 * attempt); // Increasing delay: 50ms, 100ms, 150ms, etc.
        });
      };

      // Start focusing after a short delay to ensure modal is fully rendered
      const initialTimer = setTimeout(() => {
        attemptFocus();
      }, 100);
      timers.push(initialTimer);
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isOpen, loading, content, hasFocused]);

  const fetchDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getLegalDocument(appId, documentType);
      if (response.ok && response.data) {
        setExistingDocument(response.data);
        setContent(response.data.content || '');
      } else if (response.status === 404) {
        // Document doesn't exist yet, start with empty content - this is OK
        setExistingDocument(null);
        setContent('');
      } else {
        // Other non-OK responses
        setExistingDocument(null);
        setContent('');
        logger.warn('Non-OK response fetching legal document:', response);
      }
    } catch (err: any) {
      // Catch network errors or other exceptions
      logger.warn('Error fetching legal document (might not exist yet):', err);
      // Assume document doesn't exist yet - start with empty content
      setExistingDocument(null);
      setContent('');
      // Don't show error to user since it's likely just a 404
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    // Validate minimum content length (stripping HTML tags)
    const strippedContent = content.replace(/<[^>]*>/g, '').trim();
    if (strippedContent.length < 10) {
      setError('Content must contain at least 10 characters of actual text');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiService.upsertLegalDocument(appId, {
        documentType,
        content,
      });

      if (response.ok) {
        toast.success('Legal document saved successfully!');
        onSave();
        onClose();
      } else {
        setError(response.data?.message || 'Failed to save document');
      }
    } catch (err: any) {
      logger.error('Error saving legal document:', err);
      setError(err.data?.message || 'Failed to save document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setError(null);
    setExistingDocument(null);
    setHasFocused(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
            disabled={saving}
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Content
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    ref={(el) => {
                      quillRef.current = el;
                      // Try to focus immediately when ReactQuill is mounted
                      if (el && isOpen && !loading && !hasFocused) {
                        setTimeout(() => {
                          try {
                            const editor = el.getEditor();
                            if (editor) {
                              editor.focus();
                              const length = editor.getLength();
                              if (length > 1) {
                                editor.setSelection(length - 1, 0);
                              } else {
                                editor.setSelection(0, 0);
                              }
                              setHasFocused(true);
                            }
                          } catch (err) {
                            // Editor not ready yet, will be handled by useEffect
                          }
                        }, 100);
                      }
                    }}
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    formats={formats}
                    placeholder={`Enter your ${title.toLowerCase()} here...`}
                    style={{ minHeight: '400px' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 10 characters required. Current: {content.replace(/<[^>]*>/g, '').trim().length} characters
                </p>
              </div>

              {existingDocument && (
                <div className="text-sm text-gray-500">
                  Version: {existingDocument.version} | Last updated: {new Date(existingDocument.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !content.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save {title}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
