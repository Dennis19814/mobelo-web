'use client';
import { useState } from 'react';
import { Key, Shield, FileText, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface SettingsApiSectionProps {
  apiKey?: string;
  appSecretKey?: string;
}

export default function SettingsApiSection({ apiKey, appSecretKey }: SettingsApiSectionProps) {
  const [copiedKey, setCopiedKey] = useState<'api' | 'secret' | null>(null);

  const handleCopyKey = async (key: string, type: 'api' | 'secret') => {
    const success = await copyToClipboard(key);
    if (success) {
      setCopiedKey(type);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">API Credentials</h3>
          <p className="text-xs md:text-sm text-gray-600 break-words">Use these credentials to authenticate with the Mobelo API</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Key className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">API Key</h4>
              <p className="text-sm text-gray-500">Used for authenticating API requests</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 min-w-0">
            <div className="flex-1 w-full min-w-0 overflow-hidden">
              <p className="text-xs md:text-sm font-mono text-gray-900 break-all">{apiKey || 'Not available'}</p>
            </div>
            {apiKey && (
              <button
                onClick={() => handleCopyKey(apiKey, 'api')}
                className="flex items-center px-3 py-2 text-xs md:text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0 w-full lg:w-auto justify-center"
              >
                {copiedKey === 'api' ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">App Secret Key</h4>
              <p className="text-sm text-gray-500">Keep this secret and never share it publicly</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 min-w-0">
            <div className="flex-1 w-full min-w-0 overflow-hidden">
              <p className="text-xs md:text-sm font-mono text-gray-900 break-all">{appSecretKey || 'Not available'}</p>
            </div>
            {appSecretKey && (
              <button
                onClick={() => handleCopyKey(appSecretKey, 'secret')}
                className="flex items-center px-3 py-2 text-xs md:text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0 w-full lg:w-auto justify-center"
              >
                {copiedKey === 'secret' ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <FileText className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">API Documentation</p>
            <p className="text-sm text-orange-700 mt-1">
              Learn how to integrate these credentials into your mobile app.
            </p>
            <a
              href="https://api.mobelo.dev/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-orange-600 hover:text-blue-800 font-medium mt-2 underline"
            >
              View API Documentation (Swagger)
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

