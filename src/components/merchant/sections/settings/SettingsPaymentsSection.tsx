'use client';
import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useMerchantAuth, useCrudOperations } from '@/hooks';
import {
  CheckCircle, AlertCircle, TestTube, Edit2, Key, CreditCard
} from 'lucide-react';
import { AppConfiguration, CreateAppConfigDto, UpdateAppConfigDto } from '@/types/configuration.types';

const StripeConfigModal = lazy(() => import('../../modals/StripeConfigModal').then(m => ({ default: m.StripeConfigModal })));

interface SettingsPaymentsSectionProps {
  appId: number;
  apiKey?: string;
  appSecretKey?: string;
}

export default function SettingsPaymentsSection({ appId, apiKey, appSecretKey }: SettingsPaymentsSectionProps) {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const {
    error: crudError,
    successMessage,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations();

  const [configurations, setConfigurations] = useState<AppConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [testingConfig, setTestingConfig] = useState<number | null>(null);

  const fetchConfigurations = useCallback(async () => {
    if (!headers) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/v1/platform/apps/${appId}/configurations`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      }
    } catch (error) {
      logger.error('Error fetching configurations:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setLoading(false);
    }
  }, [headers, appId]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const testConfiguration = async (configId: number) => {
    try {
      setTestingConfig(configId);
      setSuccessMessage(null);
      setCrudError(null);

      const response = await fetch(`/api/proxy/v1/platform/apps/${appId}/configurations/${configId}/test`, {
        method: 'POST',
        headers: headers || undefined
      });

      const result = await response.json();

      if (result.isValid) {
        setSuccessMessage(result.message || 'Configuration test successful!');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setCrudError(result.message || 'Configuration test failed');
        setTimeout(() => setCrudError(null), 5000);
      }
    } catch (error) {
      logger.error('Error testing configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      setCrudError('Test failed due to network error');
      setTimeout(() => setCrudError(null), 5000);
    } finally {
      setTestingConfig(null);
    }
  };

  const handleSaveConfiguration = async (config: CreateAppConfigDto | UpdateAppConfigDto, configId?: number) => {
    try {
      const stripeConfigs = configurations.filter(c => c.configType === 'payment' && c.provider === 'stripe');
      const environment = 'environment' in config ? config.environment : 'sandbox';
      const existingConfig = stripeConfigs.find(c => c.environment === environment);
      const effectiveConfigId = configId ?? existingConfig?.id;

      const url = effectiveConfigId
        ? `/api/proxy/v1/platform/apps/${appId}/configurations/${effectiveConfigId}`
        : `/api/proxy/v1/platform/apps/${appId}/configurations`;

      const response = await fetch(url, {
        method: effectiveConfigId ? 'PATCH' : 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }

      const savedConfig = await response.json();

      if (effectiveConfigId) {
        setConfigurations(prev =>
          prev.map(c => c.id === effectiveConfigId ? savedConfig : c)
        );
      } else {
        setConfigurations(prev => [...prev, savedConfig]);
      }

      setSuccessMessage('Configuration saved successfully!');
      setShowStripeModal(false);
      await fetchConfigurations();

      return savedConfig;
    } catch (error) {
      logger.error('Error saving configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  };

  const handleTestStripeConfiguration = async (config: CreateAppConfigDto | UpdateAppConfigDto) => {
    try {
      const environment = 'environment' in config ? config.environment : 'sandbox';
      const existingConfig = configurations.find(
        c => c.provider === 'stripe' && c.environment === environment
      );

      await handleSaveConfiguration(config, existingConfig?.id);

      const testResponse = await fetch(
        `/api/proxy/v1/platform/apps/${appId}/configurations/stripe/test?environment=${environment}`,
        {
          method: 'GET',
          headers: headers || undefined
        }
      );

      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        throw new Error(errorData.message || 'Failed to test Stripe configuration');
      }

      const result = await testResponse.json();

      return {
        isValid: result.isValid === true,
        message: result.isValid ? (result.message || 'Stripe keys are valid!') : (result.error || 'Invalid Stripe keys')
      };
    } catch (error) {
      logger.error('Error testing Stripe configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  };

  const stripeConfigs = configurations.filter(c => c.configType === 'payment' && c.provider === 'stripe');
  const sandboxConfig = stripeConfigs.find(c => c.environment === 'sandbox');
  const productionConfig = stripeConfigs.find(c => c.environment === 'production');

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Toast Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800 transition-colors"
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {crudError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">{crudError}</p>
            </div>
            <button
              onClick={() => setCrudError('')}
              className="text-red-600 hover:text-red-800 transition-colors"
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Configuration</h3>
          <p className="text-sm text-gray-600">Manage Stripe API keys for payment processing</p>
        </div>
        <button
          onClick={() => setShowStripeModal(true)}
          className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap w-full lg:w-auto shrink-0"
        >
          <Key className="w-4 h-4 mr-2" />
          Configure Stripe
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Sandbox Environment */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-w-0">
              <div className="flex items-center justify-between mb-3 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TestTube className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Test Environment</h4>
                    <p className="text-sm text-gray-500">For development and testing</p>
                  </div>
                </div>
                {sandboxConfig?.isEnabled && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {sandboxConfig ? (
                <div className="space-y-3 min-w-0 overflow-hidden">
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-gray-500">Publishable Key</p>
                    <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{sandboxConfig.clientId}</p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-gray-500">Secret Key</p>
                    <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{sandboxConfig.clientSecretMasked}</p>
                  </div>
                  {sandboxConfig.webhookUrl && (
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs text-gray-500">Webhook URL</p>
                      <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{sandboxConfig.webhookUrl}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => testConfiguration(sandboxConfig.id)}
                      disabled={testingConfig === sandboxConfig.id}
                      className="flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                    >
                      {testingConfig === sandboxConfig.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-2" />
                      ) : (
                        <TestTube className="w-3 h-3 mr-2" />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => setShowStripeModal(true)}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                    >
                      <Edit2 className="w-3 h-3 mr-2" />
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No test keys configured</p>
                  <button
                    onClick={() => setShowStripeModal(true)}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    Add test keys →
                  </button>
                </div>
              )}
            </div>

            {/* Production Environment */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-w-0">
              <div className="flex items-center justify-between mb-3 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Production Environment</h4>
                    <p className="text-sm text-gray-500">For live transactions</p>
                  </div>
                </div>
                {productionConfig?.isEnabled && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {productionConfig ? (
                <div className="space-y-3 min-w-0 overflow-hidden">
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-gray-500">Publishable Key</p>
                    <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{productionConfig.clientId}</p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-gray-500">Secret Key</p>
                    <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{productionConfig.clientSecretMasked}</p>
                  </div>
                  {productionConfig.webhookUrl && (
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs text-gray-500">Webhook URL</p>
                      <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{productionConfig.webhookUrl}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => testConfiguration(productionConfig.id)}
                      disabled={testingConfig === productionConfig.id}
                      className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      {testingConfig === productionConfig.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2" />
                      ) : (
                        <TestTube className="w-3 h-3 mr-2" />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => setShowStripeModal(true)}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                    >
                      <Edit2 className="w-3 h-3 mr-2" />
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No live keys configured</p>
                  <button
                    onClick={() => setShowStripeModal(true)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Add live keys →
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-start space-x-2 md:space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Stripe Configuration</h4>
                <p className="text-xs md:text-sm text-yellow-700 mt-1">
                  Always test your integration in sandbox mode before enabling production keys. Keep your secret keys secure and never expose them in client-side code.
                </p>
                <div className="mt-2">
                  <a href="https://stripe.com/docs" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 text-xs md:text-sm font-medium">
                    View Stripe documentation →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        {showStripeModal && (
          <StripeConfigModal
            isOpen={showStripeModal}
            onClose={() => setShowStripeModal(false)}
            onSave={handleSaveConfiguration}
            onTest={handleTestStripeConfiguration}
            existingConfigs={{
              sandbox: sandboxConfig || null,
              production: productionConfig || null
            }}
            appId={appId}
          />
        )}
      </Suspense>
    </div>
  );
}
