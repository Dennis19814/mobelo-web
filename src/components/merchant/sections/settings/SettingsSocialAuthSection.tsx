'use client';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useMerchantAuth, useCrudOperations } from '@/hooks';
import {
  CheckCircle, XCircle, AlertCircle, TestTube, Edit2, Smartphone
} from 'lucide-react';
import { AppConfiguration, CreateAppConfigDto, UpdateAppConfigDto } from '@/types/configuration.types';

const SocialAuthConfigModal = lazy(() => import('../../modals/SocialAuthConfigModal').then(m => ({ default: m.SocialAuthConfigModal })));

interface SettingsSocialAuthSectionProps {
  appId: number;
  apiKey?: string;
  appSecretKey?: string;
}

const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    icon: '/logos/google-logo.png',
    isImage: true,
    color: 'blue',
    scopes: ['email', 'profile', 'openid'],
    docs: 'https://developers.google.com/identity/protocols/oauth2'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '/logos/facebook-logo.png',
    isImage: true,
    color: 'blue',
    scopes: ['email', 'public_profile'],
    docs: 'https://developers.facebook.com/docs/facebook-login'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '/logos/instagram-logo.png',
    isImage: true,
    color: 'pink',
    scopes: ['user_profile', 'user_media'],
    docs: 'https://developers.facebook.com/docs/instagram-basic-display-api'
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: '/logos/apple-logo.png',
    isImage: true,
    color: 'gray',
    scopes: ['name', 'email'],
    docs: 'https://developer.apple.com/sign-in-with-apple'
  }
];

export default function SettingsSocialAuthSection({ appId, apiKey, appSecretKey }: SettingsSocialAuthSectionProps) {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const {
    error: crudError,
    successMessage,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations();

  const [configurations, setConfigurations] = useState<AppConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<AppConfiguration | null>(null);
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
      const isUpdate = selectedConfig !== null || configId !== undefined;
      const effectiveConfigId = configId ?? selectedConfig?.id;
      const url = isUpdate
        ? `/api/proxy/v1/platform/apps/${appId}/configurations/${effectiveConfigId}`
        : `/api/proxy/v1/platform/apps/${appId}/configurations`;

      const response = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
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

      if (isUpdate) {
        setConfigurations(prev =>
          prev.map(c => c.id === effectiveConfigId ? savedConfig : c)
        );
      } else {
        setConfigurations(prev => [...prev, savedConfig]);
      }

      setSuccessMessage(isUpdate ? 'Configuration updated successfully!' : 'Configuration created successfully!');

      setShowSocialModal(false);
      setSelectedProvider(null);
      setSelectedConfig(null);
      await fetchConfigurations();

      return savedConfig;
    } catch (error) {
      logger.error('Error saving configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  };

  const toggleConfiguration = async (configId: number) => {
    try {
      const response = await fetch(`/api/proxy/v1/platform/apps/${appId}/configurations/${configId}/toggle`, {
        method: 'PATCH',
        headers: headers || undefined
      });

      if (!response.ok) {
        throw new Error('Failed to toggle configuration');
      }

      const updatedConfig = await response.json();

      setConfigurations(prev =>
        prev.map(c => c.id === configId ? updatedConfig : c)
      );

      setSuccessMessage(`Configuration ${updatedConfig.isEnabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      logger.error('Error toggling configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      setCrudError('Failed to toggle configuration');
    }
  };

  const socialConfigs = configurations.filter(c => c.configType === 'social_auth');

  return (
    <div className=" w-full max-w-full">
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
              <XCircle className="w-4 h-4" />
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
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Social Authentication</h1>
        <p className="text-sm md:text-base text-gray-600 break-words">Configure OAuth providers for user login</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOCIAL_PROVIDERS.map(provider => {
              const config = socialConfigs.find(c => c.provider === provider.id);
              const isConfigured = !!config;
              const isEnabled = config?.isEnabled || false;

              return (
                <div key={provider.id} className="bg-white rounded-lg border border-gray-200 p-3 min-w-0">
                  <div className="flex items-center justify-between mb-3 min-w-0">
                    <div className="flex items-center space-x-3">
                      {provider.isImage ? (
                        <Image
                          src={provider.icon}
                          alt={provider.name}
                          width={32}
                          height={32}
                          className="w-8 h-8"
                        />
                      ) : (
                        <span className="text-2xl">{provider.icon}</span>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{provider.name}</h4>
                        <p className="text-sm text-gray-500">
                          {isConfigured ? (isEnabled ? 'Enabled' : 'Configured') : 'Not configured'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isConfigured && (
                        <>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleConfiguration(config.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                          </label>
                          <button
                            onClick={() => testConfiguration(config.id)}
                            disabled={testingConfig === config.id}
                            className="p-2 text-gray-600 hover:text-orange-600"
                            title="Test configuration"
                          >
                            {testingConfig === config.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProvider(provider.id);
                              setSelectedConfig(config);
                              setShowSocialModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-orange-600"
                            title="Edit configuration"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isConfigured ? (
                        isEnabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                  </div>

                  {isConfigured ? (
                    <div className="space-y-3 min-w-0 overflow-hidden">
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs text-gray-500">Client ID</p>
                        <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{config.clientId}</p>
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs text-gray-500">Client Secret</p>
                        <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{config.clientSecretMasked}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Scopes</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {config.scopes.map(scope => (
                            <span key={scope} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                      {config.callbackUrl && (
                        <div>
                          <p className="text-xs text-gray-500">Callback URL</p>
                          <p className="text-sm font-mono text-gray-900 break-all">{config.callbackUrl}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">Configure {provider.name} OAuth</p>
                      <button
                        onClick={() => {
                          setSelectedProvider(provider.id);
                          setShowSocialModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                      >
                        Get started →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-start space-x-2 md:space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-slate-900">OAuth Configuration Guide</h4>
                <p className="text-xs md:text-sm text-orange-700 mt-1">
                  Each provider requires OAuth app registration. Make sure to use the correct callback URLs and scopes for your app.
                </p>
                <div className="mt-2">
                  <a href="#" className="text-orange-600 hover:text-orange-700 text-xs md:text-sm font-medium">
                    View setup documentation →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        {showSocialModal && selectedProvider && (
          <SocialAuthConfigModal
            isOpen={showSocialModal}
            onClose={() => {
              setShowSocialModal(false);
              setSelectedProvider(null);
              setSelectedConfig(null);
            }}
            onSave={handleSaveConfiguration}
            provider={selectedProvider}
            existingConfig={selectedConfig}
            appId={appId}
          />
        )}
      </Suspense>
    </div>
  );
}
