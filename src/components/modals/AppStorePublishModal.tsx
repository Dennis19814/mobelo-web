'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

interface AppStorePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    bundleId: string;
    apiKey: string;
    appName: string;
    subtitle: string;
    description: string;
    keywords: string;
    primaryLanguage: string;
    supportUrl: string;
    privacyPolicyUrl: string;
    contactEmail: string;
    track: string;
    buildType: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AppStorePublishModal({
  isOpen,
  onClose,
  form,
  onFieldChange,
  onSubmit,
  isSubmitting,
}: AppStorePublishModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-800 flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/images/app-store-icon.webp"
              alt="Apple App Store"
              width={32}
              height={32}
              className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              unoptimized
            />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-white">Publish to App Store</h3>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Provide your App Store Connect details and metadata to queue a publish job.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bundle ID */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Bundle ID *</label>
            <input
              value={form.bundleId}
              onChange={e => onFieldChange('bundleId', e.target.value)}
              placeholder="com.company.appname"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Track */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Track</label>
            <select
              value={form.track}
              onChange={e => onFieldChange('track', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="testflight-internal">TestFlight Internal</option>
              <option value="testflight-external">TestFlight External</option>
              <option value="production">Production</option>
            </select>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">App Name *</label>
            <input
              value={form.appName}
              onChange={e => onFieldChange('appName', e.target.value)}
              placeholder="My App"
              maxLength={30}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">{form.appName.length}/30 characters</p>
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Subtitle</label>
            <input
              value={form.subtitle}
              onChange={e => onFieldChange('subtitle', e.target.value)}
              placeholder="Brief app description"
              maxLength={30}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">{form.subtitle.length}/30 characters</p>
          </div>

          {/* Primary Language */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Primary Language</label>
            <select
              value={form.primaryLanguage}
              onChange={e => onFieldChange('primaryLanguage', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="pt-BR">Portuguese (Brazil)</option>
              <option value="zh-CN">Chinese (Simplified)</option>
            </select>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Contact Email *</label>
            <input
              value={form.contactEmail}
              onChange={e => onFieldChange('contactEmail', e.target.value)}
              placeholder="support@example.com"
              type="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-300">Keywords</label>
            <input
              value={form.keywords}
              onChange={e => onFieldChange('keywords', e.target.value)}
              placeholder="app, mobile, shopping"
              maxLength={100}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">{form.keywords.length}/100 characters • Comma-separated keywords</p>
          </div>

          {/* Description */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-300">Description *</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => onFieldChange('description', e.target.value)}
              placeholder="Describe your app..."
              maxLength={4000}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500">{form.description.length}/4000 characters</p>
          </div>

          {/* Support URL */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-300">Support URL *</label>
            <input
              value={form.supportUrl}
              onChange={e => onFieldChange('supportUrl', e.target.value)}
              placeholder="https://example.com/support"
              type="url"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Privacy Policy URL */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-300">Privacy Policy URL *</label>
            <input
              value={form.privacyPolicyUrl}
              onChange={e => onFieldChange('privacyPolicyUrl', e.target.value)}
              placeholder="https://example.com/privacy"
              type="url"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* App Store Connect API Key */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-300">App Store Connect API Key *</label>
            <textarea
              rows={6}
              value={form.apiKey}
              onChange={e => onFieldChange('apiKey', e.target.value)}
              placeholder='{ "key_id": "ABC123...", "issuer_id": "...", "key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----" }'
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500">Paste your App Store Connect API key in JSON format</p>
          </div>

          {/* Build Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Build Type</label>
            <select
              value={form.buildType}
              onChange={e => onFieldChange('buildType', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ipa">.ipa (iOS App Archive)</option>
            </select>
          </div>
        </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-2 p-4 sm:p-6 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30"
          >
            {isSubmitting ? 'Submitting...' : 'Publish to App Store'}
          </button>
        </div>
      </div>
    </div>
  );
}
