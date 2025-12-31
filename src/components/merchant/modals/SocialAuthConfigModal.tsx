'use client';

import { useState, useEffect } from 'react';
import { X, Info, Eye, EyeOff } from 'lucide-react';
import { CreateAppConfigDto, UpdateAppConfigDto, AppConfiguration } from '@/types/configuration.types';

interface SocialAuthConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CreateAppConfigDto | UpdateAppConfigDto) => Promise<void>;
  provider: string;
  existingConfig?: AppConfiguration | null;
  appId: number;
}

const PROVIDER_INFO: Record<string, { name: string; icon: string; defaultScopes: string[]; docs: string }> = {
  google: {
    name: 'Google',
    icon: '🔵',
    defaultScopes: ['email', 'profile', 'openid'],
    docs: 'https://developers.google.com/identity/protocols/oauth2'
  },
  facebook: {
    name: 'Facebook',
    icon: '🔷',
    defaultScopes: ['email', 'public_profile'],
    docs: 'https://developers.facebook.com/docs/facebook-login'
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    defaultScopes: ['user_profile', 'user_media'],
    docs: 'https://developers.facebook.com/docs/instagram-basic-display-api'
  },
  apple: {
    name: 'Apple',
    icon: '🍎',
    defaultScopes: ['name', 'email'],
    docs: 'https://developer.apple.com/sign-in-with-apple'
  }
};

export function SocialAuthConfigModal({
  isOpen,
  onClose,
  onSave,
  provider,
  existingConfig,
  appId
}: SocialAuthConfigModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [scopes, setScopes] = useState<string[]>([]);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerInfo = PROVIDER_INFO[provider];

  useEffect(() => {
    if (existingConfig) {
      setClientId(existingConfig.clientId || '');
      setScopes(existingConfig.scopes || providerInfo?.defaultScopes || []);
      setCallbackUrl(existingConfig.callbackUrl || '');
      setIsEnabled(existingConfig.isEnabled);
    } else {
      setScopes(providerInfo?.defaultScopes || []);
      setCallbackUrl(`${window.location.origin}/api/auth/callback/${provider}`);
    }
  }, [existingConfig, provider, providerInfo]);

  const handleSave = async () => {
    if (!clientId.trim()) {
      setError('Client ID is required');
      return;
    }

    if (!existingConfig && !clientSecret.trim()) {
      setError('Client Secret is required for new configurations');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const configData: CreateAppConfigDto | UpdateAppConfigDto = existingConfig
        ? {
            clientId,
            ...(clientSecret && { clientSecret }),
            scopes,
            callbackUrl,
            isEnabled
          }
        : {
            configType: 'social_auth',
            provider: provider as any,
            clientId,
            clientSecret,
            scopes,
            callbackUrl,
            isEnabled,
            environment: 'production'
          };

      await onSave(configData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleScopeToggle = (scope: string) => {
    setScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{providerInfo?.icon}</span>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Configure {providerInfo?.name} Authentication
              </h3>
              <p className="text-sm text-gray-500">
                {existingConfig ? 'Update existing configuration' : 'Set up OAuth 2.0 authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-sm">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Client ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Client ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter OAuth Client ID"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Client Secret {!existingConfig && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showClientSecret ? 'text' : 'password'}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={existingConfig ? 'Leave blank to keep existing secret' : 'Enter OAuth Client Secret'}
                className="w-full px-2.5 py-1.5 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowClientSecret(!showClientSecret)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showClientSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              OAuth Scopes
            </label>
            <div className="flex flex-wrap gap-2">
              {providerInfo?.defaultScopes.map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => handleScopeToggle(scope)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    scopes.includes(scope)
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click to toggle scopes. Selected scopes will be requested during authentication.
            </p>
          </div>

          {/* Callback URL */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Callback URL
            </label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="OAuth callback URL"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add this URL to your OAuth app configuration in {providerInfo?.name}
            </p>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Configuration
              </label>
              <p className="text-xs text-gray-500">
                Users will be able to sign in with {providerInfo?.name}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Documentation Link */}
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-900">Setup Instructions</h4>
                <p className="text-sm text-orange-700 mt-1">
                  You'll need to create an OAuth application in {providerInfo?.name}'s developer console.
                </p>
                <a
                  href={providerInfo?.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2 inline-block"
                >
                  View {providerInfo?.name} documentation →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              existingConfig ? 'Update Configuration' : 'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}