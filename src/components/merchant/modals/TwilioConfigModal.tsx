'use client';

import { useState, useEffect } from 'react';
import { X, Info, Eye, EyeOff, TestTube, MessageSquare } from 'lucide-react';
import { CreateAppConfigDto, UpdateAppConfigDto, AppConfiguration } from '@/types/configuration.types';

interface TwilioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CreateAppConfigDto | UpdateAppConfigDto, configId?: number) => Promise<void>;
  onTest?: (config: CreateAppConfigDto | UpdateAppConfigDto) => Promise<{ isValid: boolean; message: string }>;
  existingConfig?: AppConfiguration | null;
  appId: number;
}

interface TwilioConfigState {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  isEnabled: boolean;
}

export function TwilioConfigModal({
  isOpen,
  onClose,
  onSave,
  onTest,
  existingConfig,
  appId
}: TwilioConfigModalProps) {
  const [config, setConfig] = useState<TwilioConfigState>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    isEnabled: false
  });
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        accountSid: existingConfig.clientId || '',
        authToken: '',
        phoneNumber: existingConfig.settings?.phoneNumber || '',
        isEnabled: existingConfig.isEnabled
      });
    }
  }, [existingConfig]);

  const handleSave = async () => {
    if (!config.accountSid.trim()) {
      setError('Account SID is required');
      return;
    }

    if (!existingConfig && !config.authToken.trim()) {
      setError('Auth Token is required for new configurations');
      return;
    }

    if (!config.phoneNumber.trim()) {
      setError('Phone Number is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const configData: CreateAppConfigDto | UpdateAppConfigDto = existingConfig
        ? {
            // Update payload: provider can be changed, configType is immutable
            ...(config.accountSid && { clientId: config.accountSid }),
            ...(config.authToken && { clientSecret: config.authToken }),
            settings: {
              phoneNumber: config.phoneNumber
            },
            isEnabled: config.isEnabled
          }
        : {
            // Create payload: both configType and provider required
            configType: 'sms',
            provider: 'twilio',
            clientId: config.accountSid,
            clientSecret: config.authToken,
            settings: {
              phoneNumber: config.phoneNumber
            },
            isEnabled: config.isEnabled
          };

      await onSave(configData, existingConfig?.id);
      setSuccessMessage('SMS configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Parse error message from API response
      let errorMessage = 'Failed to save configuration';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide user-friendly messages for specific errors
        if (errorMessage.includes('already exists')) {
          errorMessage = 'An SMS configuration already exists. The existing configuration has been updated with your changes.';
        } else if (errorMessage.includes('Invalid')) {
          errorMessage = 'Invalid configuration. Please check your Account SID and Auth Token.';
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

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      setError('All fields are required to test the configuration');
      return;
    }

    setTesting(true);
    setError(null);

    try {
      const configData: CreateAppConfigDto = {
        configType: 'sms',
        provider: 'twilio',
        clientId: config.accountSid,
        clientSecret: config.authToken,
        settings: {
          phoneNumber: config.phoneNumber
        }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Configure Twilio SMS Service
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

          {/* Account SID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Account SID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.accountSid}
              onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Twilio Account SID from the console dashboard
            </p>
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Auth Token <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showAuthToken ? 'text' : 'password'}
                value={config.authToken}
                onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                placeholder={existingConfig ? 'Leave blank to keep existing token' : 'Your Twilio Auth Token'}
                className="w-full px-2.5 py-1.5 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showAuthToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Keep this token secure. Never expose it in client-side code
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Twilio Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.phoneNumber}
              onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Twilio phone number in E.164 format (e.g., +1234567890)
            </p>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Enable SMS Service
              </label>
              <p className="text-xs text-gray-500">
                Enable SMS service for your application
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

          {/* Documentation */}
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-900">
                  Twilio Configuration
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  This configuration works for both development and production. Get your credentials from the Twilio console.
                </p>
                <a
                  href="https://console.twilio.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2 inline-block"
                >
                  Get your Twilio credentials →
                </a>
              </div>
            </div>
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
