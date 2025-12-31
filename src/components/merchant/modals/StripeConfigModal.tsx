'use client';

import { useState, useEffect } from 'react';
import { X, Info, TestTube, CreditCard } from 'lucide-react';
import { CreateAppConfigDto, UpdateAppConfigDto, AppConfiguration } from '@/types/configuration.types';

interface StripeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CreateAppConfigDto | UpdateAppConfigDto, configId?: number) => Promise<void>;
  onTest?: (config: CreateAppConfigDto | UpdateAppConfigDto) => Promise<{ isValid: boolean; message: string }>;
  existingConfigs: {
    sandbox?: AppConfiguration | null;
    production?: AppConfiguration | null;
  };
  appId: number;
}

export function StripeConfigModal({
  isOpen,
  onClose,
  onSave,
  onTest,
  existingConfigs,
  appId
}: StripeConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'production'>('sandbox');
  const [sandboxConfig, setSandboxConfig] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isEnabled: false
  });
  const [productionConfig, setProductionConfig] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isEnabled: false
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 State changed - successMessage:', successMessage, 'error:', error);
  }, [successMessage, error]);

  useEffect(() => {
    if (existingConfigs.sandbox) {
      setSandboxConfig({
        publishableKey: existingConfigs.sandbox.clientId || '',
        secretKey: existingConfigs.sandbox.clientSecret || '',
        webhookSecret: existingConfigs.sandbox.settings?.webhookSecret || '',
        isEnabled: existingConfigs.sandbox.isEnabled
      });
    }
    if (existingConfigs.production) {
      setProductionConfig({
        publishableKey: existingConfigs.production.clientId || '',
        secretKey: existingConfigs.production.clientSecret || '',
        webhookSecret: existingConfigs.production.settings?.webhookSecret || '',
        isEnabled: existingConfigs.production.isEnabled
      });
    }
  }, [existingConfigs]);

  const getCurrentConfig = () => activeTab === 'sandbox' ? sandboxConfig : productionConfig;
  const setCurrentConfig = (config: typeof sandboxConfig) => {
    if (activeTab === 'sandbox') {
      setSandboxConfig(config);
    } else {
      setProductionConfig(config);
    }
  };

  const handleSave = async () => {
    const config = getCurrentConfig();
    const existingConfig = activeTab === 'sandbox' ? existingConfigs.sandbox : existingConfigs.production;

    if (!config.publishableKey.trim()) {
      setError('Publishable Key is required');
      return;
    }

    if (!existingConfig && !config.secretKey.trim()) {
      setError('Secret Key is required for new configurations');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const configData: CreateAppConfigDto | UpdateAppConfigDto = existingConfig
        ? {
            clientId: config.publishableKey,
            ...(config.secretKey && { clientSecret: config.secretKey }),
            settings: {
              webhookSecret: config.webhookSecret
            },
            isEnabled: config.isEnabled
          }
        : {
            configType: 'payment',
            provider: 'stripe',
            clientId: config.publishableKey,
            clientSecret: config.secretKey,
            settings: {
              webhookSecret: config.webhookSecret
            },
            isEnabled: config.isEnabled,
            environment: activeTab,
            webhookUrl: `${window.location.origin}/api/webhooks/stripe`
          };

      // Pass configId if updating existing configuration
      await onSave(configData, existingConfig?.id);
      setSuccessMessage(`${activeTab === 'sandbox' ? 'Test' : 'Live'} configuration saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;

    const config = getCurrentConfig();
    if (!config.publishableKey || !config.secretKey) {
      setError('Both keys are required to test the configuration');
      return;
    }

    setTesting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const existingConfig = activeTab === 'sandbox' ? existingConfigs.sandbox : existingConfigs.production;

      const configData: CreateAppConfigDto | UpdateAppConfigDto = existingConfig
        ? {
            clientId: config.publishableKey,
            clientSecret: config.secretKey,
            settings: {
              webhookSecret: config.webhookSecret
            },
            isEnabled: config.isEnabled
          }
        : {
            configType: 'payment',
            provider: 'stripe',
            clientId: config.publishableKey,
            clientSecret: config.secretKey,
            environment: activeTab,
            settings: {
              webhookSecret: config.webhookSecret
            },
            isEnabled: config.isEnabled
          };

      const result = await onTest(configData);
      console.log('🔍 Test result:', result);

      if (result.isValid) {
        console.log('✅ Setting success message:', result.message);
        setSuccessMessage(result.message || 'Configuration test successful!');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        console.log('❌ Setting error message:', result.message);
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-0 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Configure Stripe Payment Processing
              </h3>
              <p className="text-sm text-gray-500">
                Set up API keys for payment processing
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-6 py-3 font-medium text-sm border-b-2 ${
                activeTab === 'sandbox'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TestTube className="w-4 h-4" />
                <span>Test Environment</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`px-6 py-3 font-medium text-sm border-b-2 ${
                activeTab === 'production'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Production Environment</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
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

          {/* Publishable Key */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Publishable Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={getCurrentConfig().publishableKey}
              onChange={(e) => setCurrentConfig({ ...getCurrentConfig(), publishableKey: e.target.value })}
              placeholder={activeTab === 'sandbox' ? 'pk_test_...' : 'pk_live_...'}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              This key can be safely used in client-side code
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Secret Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={getCurrentConfig().secretKey}
              onChange={(e) => setCurrentConfig({ ...getCurrentConfig(), secretKey: e.target.value })}
              placeholder={
                (activeTab === 'sandbox' ? existingConfigs.sandbox : existingConfigs.production)
                  ? 'Leave blank to keep existing secret'
                  : (activeTab === 'sandbox' ? 'sk_test_...' : 'sk_live_...')
              }
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Keep this key secure. Never expose it in client-side code
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Webhook Signing Secret (Optional)
            </label>
            <input
              type="text"
              value={getCurrentConfig().webhookSecret}
              onChange={(e) => setCurrentConfig({ ...getCurrentConfig(), webhookSecret: e.target.value })}
              placeholder="whsec_..."
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for webhook verification if you're using Stripe webhooks
            </p>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Enable {activeTab === 'sandbox' ? 'Test' : 'Live'} Payments
              </label>
              <p className="text-xs text-gray-500">
                {activeTab === 'sandbox'
                  ? 'Use test mode for development and testing'
                  : 'Enable live payments for production use'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={getCurrentConfig().isEnabled}
                onChange={(e) => setCurrentConfig({ ...getCurrentConfig(), isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Documentation */}
          <div className={`${activeTab === 'sandbox' ? 'bg-orange-50' : 'bg-green-50'} rounded-lg p-3`}>
            <div className="flex items-start space-x-3">
              <Info className={`w-5 h-5 ${activeTab === 'sandbox' ? 'text-orange-600' : 'text-green-600'} mt-0.5`} />
              <div>
                <h4 className={`text-sm font-medium ${activeTab === 'sandbox' ? 'text-orange-900' : 'text-green-900'}`}>
                  {activeTab === 'sandbox' ? 'Test Mode' : 'Live Mode'} Configuration
                </h4>
                <p className={`text-sm ${activeTab === 'sandbox' ? 'text-orange-700' : 'text-green-700'} mt-1`}>
                  {activeTab === 'sandbox'
                    ? 'Use test API keys for development. No real charges will be made.'
                    : 'Live keys will process real payments. Ensure your integration is thoroughly tested.'}
                </p>
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${activeTab === 'sandbox' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'} text-sm font-medium mt-2 inline-block`}
                >
                  Get your Stripe API keys →
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