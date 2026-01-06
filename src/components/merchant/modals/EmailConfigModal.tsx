'use client';

import { useState, useEffect } from 'react';
import { X, Info, Eye, EyeOff, TestTube, Mail } from 'lucide-react';
import { CreateAppConfigDto, UpdateAppConfigDto, AppConfiguration } from '@/types/configuration.types';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CreateAppConfigDto | UpdateAppConfigDto, configId?: number) => Promise<void>;
  onTest?: (config: CreateAppConfigDto | UpdateAppConfigDto) => Promise<{ isValid: boolean; message: string }>;
  existingConfig?: AppConfiguration | null;
  appId: number;
}

type EmailProvider = 'brevo' | 'sendgrid' | 'mailgun' | 'smtp';

interface EmailConfigState {
  provider: EmailProvider;
  apiKey: string;
  smtpUsername: string; // SMTP login username (different from sender email)
  smtpHost: string; // For custom SMTP
  smtpPort: number; // For custom SMTP
  senderName: string;
  senderEmail: string;
  domain: string; // For Mailgun only
  isEnabled: boolean;
}

const EMAIL_PROVIDERS = [
  {
    id: 'brevo' as EmailProvider,
    name: 'Brevo (SendinBlue)',
    description: 'Email marketing and transactional emails',
    docsUrl: 'https://developers.brevo.com/'
  },
  {
    id: 'sendgrid' as EmailProvider,
    name: 'SendGrid',
    description: 'Email delivery platform by Twilio',
    docsUrl: 'https://docs.sendgrid.com/'
  },
  {
    id: 'mailgun' as EmailProvider,
    name: 'Mailgun',
    description: 'Email API service for developers',
    docsUrl: 'https://documentation.mailgun.com/'
  },
  {
    id: 'smtp' as EmailProvider,
    name: 'Custom SMTP',
    description: 'Use any SMTP server with custom configuration',
    docsUrl: 'https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol'
  }
];

export function EmailConfigModal({
  isOpen,
  onClose,
  onSave,
  onTest,
  existingConfig,
  appId
}: EmailConfigModalProps) {
  const [config, setConfig] = useState<EmailConfigState>({
    provider: 'brevo',
    apiKey: '',
    smtpUsername: '',
    smtpHost: '',
    smtpPort: 587,
    senderName: '',
    senderEmail: '',
    domain: '',
    isEnabled: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        provider: (existingConfig.provider as EmailProvider) || 'brevo',
        apiKey: existingConfig.clientSecret || '',
        smtpUsername: existingConfig.clientId || '',
        smtpHost: existingConfig.settings?.host || '',
        smtpPort: existingConfig.settings?.port || 587,
        senderName: existingConfig.settings?.senderName || '',
        senderEmail: existingConfig.settings?.senderEmail || '',
        domain: existingConfig.settings?.domain || '',
        isEnabled: existingConfig.isEnabled
      });
    }
  }, [existingConfig]);

  const getProviderInfo = (providerId: EmailProvider) => {
    return EMAIL_PROVIDERS.find(p => p.id === providerId);
  };

  const handleSave = async () => {
    if (!config.senderName.trim()) {
      setError('Sender Name is required');
      return;
    }

    if (!config.senderEmail.trim()) {
      setError('Sender Email is required');
      return;
    }

    if (!existingConfig && !config.apiKey.trim()) {
      setError('API Key is required for new configurations');
      return;
    }

    if ((config.provider === 'brevo' || config.provider === 'smtp') && !config.smtpUsername.trim()) {
      setError('SMTP Username is required for Brevo and Custom SMTP');
      return;
    }

    if (config.provider === 'smtp') {
      if (!config.smtpHost.trim()) {
        setError('SMTP Host is required for Custom SMTP');
        return;
      }
      if (!config.smtpPort || config.smtpPort <= 0) {
        setError('Valid SMTP Port is required for Custom SMTP');
        return;
      }
    }

    if (config.provider === 'mailgun' && !config.domain.trim()) {
      setError('Domain is required for Mailgun');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const settings: Record<string, any> = {
        senderName: config.senderName,
        senderEmail: config.senderEmail
      };

      if (config.provider === 'mailgun') {
        settings.domain = config.domain;
      }

      // Add host/port for Brevo and Custom SMTP
      if (config.provider === 'brevo' || config.provider === 'smtp') {
        if (config.smtpHost) {
          settings.host = config.smtpHost;
        }
        if (config.smtpPort) {
          settings.port = config.smtpPort;
        }
      }

      const configData: CreateAppConfigDto | UpdateAppConfigDto = existingConfig
        ? {
            // Update payload: provider can be changed, configType is immutable
            ...(config.apiKey && { clientSecret: config.apiKey }),
            ...(config.smtpUsername && { clientId: config.smtpUsername }),
            settings,
            isEnabled: config.isEnabled,
            provider: config.provider
          }
        : {
            // Create payload: both configType and provider required
            configType: 'email',
            provider: config.provider,
            clientSecret: config.apiKey,
            clientId: config.smtpUsername || undefined,
            settings,
            isEnabled: config.isEnabled
          };

      await onSave(configData, existingConfig?.id);
      setSuccessMessage('Email configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Parse error message from API response
      let errorMessage = 'Failed to save configuration';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide user-friendly messages for specific errors
        if (errorMessage.includes('already exists')) {
          errorMessage = 'An email configuration already exists. The existing configuration has been updated with your changes.';
        } else if (errorMessage.includes('Invalid')) {
          errorMessage = 'Invalid configuration. Please check your API key and settings.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;

    if (!config.apiKey || !config.senderName || !config.senderEmail) {
      setError('API Key, Sender Name, and Sender Email are required to test');
      return;
    }

    if ((config.provider === 'brevo' || config.provider === 'smtp') && !config.smtpUsername) {
      setError('SMTP Username is required for Brevo and Custom SMTP');
      return;
    }

    if (config.provider === 'smtp' && (!config.smtpHost || !config.smtpPort)) {
      setError('SMTP Host and Port are required for Custom SMTP');
      return;
    }

    if (config.provider === 'mailgun' && !config.domain) {
      setError('Domain is required for Mailgun');
      return;
    }

    setTesting(true);
    setError(null);

    try {
      const settings: Record<string, any> = {
        senderName: config.senderName,
        senderEmail: config.senderEmail
      };

      if (config.provider === 'mailgun') {
        settings.domain = config.domain;
      }

      // Add host/port for Brevo and Custom SMTP
      if (config.provider === 'brevo' || config.provider === 'smtp') {
        if (config.smtpHost) {
          settings.host = config.smtpHost;
        }
        if (config.smtpPort) {
          settings.port = config.smtpPort;
        }
      }

      const configData: CreateAppConfigDto = {
        configType: 'email',
        provider: config.provider,
        clientSecret: config.apiKey,
        clientId: config.smtpUsername || undefined,
        settings
      };

      const result = await onTest(configData);
      if (result.isValid) {
        setSuccessMessage(result.message || 'Configuration test successful!');
      } else {
        setError(result.message || 'Configuration test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  const providerInfo = getProviderInfo(config.provider);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Mail className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Configure Email Service Provider
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
            disabled={saving}
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-sm">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 text-sm">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as EmailProvider })}
              className="w-64 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!!existingConfig}
            >
              {EMAIL_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {providerInfo?.description}
            </p>
          </div>

          {/* Sender Name and Email - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sender Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.senderName}
                onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                placeholder="Your App Name"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Name in "From" field
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sender Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={config.senderEmail}
                onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                placeholder="noreply@yourdomain.com"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email in "From" field
              </p>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={existingConfig ? 'Enter new API key to update' : 'Your API Key'}
                className="w-full px-2.5 py-1.5 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Keep this key secure. Never expose it in client-side code
            </p>
          </div>

          {/* SMTP Username (conditional - for Brevo and Custom SMTP) */}
          {(config.provider === 'brevo' || config.provider === 'smtp') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                SMTP Username / Login <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.smtpUsername}
                onChange={(e) => setConfig({ ...config, smtpUsername: e.target.value })}
                placeholder={config.provider === 'brevo' ? '935ff9001@smtp-brevo.com' : 'SMTP username'}
                className="w-96 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.provider === 'brevo'
                  ? 'Your Brevo SMTP login'
                  : 'SMTP authentication username'}
              </p>
            </div>
          )}

          {/* SMTP Host and Port (conditional - for Custom SMTP only) */}
          {config.provider === 'smtp' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.smtpHost}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  placeholder="smtp.example.com"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  SMTP server hostname
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                  min="1"
                  max="65535"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  587, 465, or 25
                </p>
              </div>
            </div>
          )}

          {/* Mailgun Domain (conditional) */}
          {config.provider === 'mailgun' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mailgun Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.domain}
                onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                placeholder="mg.yourdomain.com"
                className="w-96 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Mailgun sending domain
              </p>
            </div>
          )}

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Enable Email Service
              </label>
              <p className="text-xs text-gray-500">
                Enable email service for your application
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isEnabled}
                onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t border-gray-200">
          <div>
            {onTest && (
              <button
                onClick={handleTest}
                disabled={saving || testing}
                className="px-4 py-1.5 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Configuration
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex gap-2">
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
                'Save Configuration'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
