'use client';
import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useMerchantAuth, useCrudOperations } from '@/hooks';
import {
  CheckCircle, AlertCircle, TestTube, Edit2, Key, Mail
} from 'lucide-react';
import { AppConfiguration, CreateAppConfigDto, UpdateAppConfigDto } from '@/types/configuration.types';

const EmailConfigModal = lazy(() => import('../../modals/EmailConfigModal').then(m => ({ default: m.EmailConfigModal })));

interface SettingsEmailSectionProps {
  appId: number;
  apiKey?: string;
  appSecretKey?: string;
}

export default function SettingsEmailSection({ appId, apiKey, appSecretKey }: SettingsEmailSectionProps) {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const {
    error: crudError,
    successMessage,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations();

  const [configurations, setConfigurations] = useState<AppConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
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
      const emailConfig = configurations.find(c => c.configType === 'email');
      const effectiveConfigId = configId ?? emailConfig?.id;

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
      setShowEmailModal(false);
      await fetchConfigurations();

      return savedConfig;
    } catch (error) {
      logger.error('Error saving configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  };

  const emailConfig = configurations.find(c => c.configType === 'email');

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

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Email Provider Configuration</h1>
            <p className="text-sm md:text-base text-gray-600 break-words">Manage email service credentials for transactional emails</p>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap w-full lg:w-auto shrink-0"
          >
            <Key className="w-4 h-4 mr-2" />
            {emailConfig ? 'Update Configuration' : 'Configure Email'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-3 min-w-0">
            <div className="flex items-center justify-between mb-3 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Mail className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Email Provider</h4>
                  <p className="text-sm text-gray-500">Single configuration for all environments</p>
                </div>
              </div>
              {emailConfig?.isEnabled && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>

            {emailConfig ? (
              <div className="space-y-3 min-w-0 overflow-hidden">
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs text-gray-500">Provider</p>
                  <p className="text-sm font-medium text-gray-900 capitalize break-all overflow-hidden">{emailConfig.provider}</p>
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs text-gray-500">Sender Name</p>
                  <p className="text-sm text-gray-900 break-all overflow-hidden">{emailConfig.settings?.senderName || 'Not configured'}</p>
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs text-gray-500">Sender Email</p>
                  <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{emailConfig.settings?.senderEmail || 'Not configured'}</p>
                </div>
                {emailConfig.provider === 'mailgun' && emailConfig.settings?.domain && (
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-gray-500">Domain</p>
                    <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{emailConfig.settings.domain}</p>
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => testConfiguration(emailConfig.id)}
                    disabled={testingConfig === emailConfig.id}
                    className="flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                  >
                    {testingConfig === emailConfig.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-2" />
                    ) : (
                      <TestTube className="w-3 h-3 mr-2" />
                    )}
                    Test
                  </button>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                  >
                    <Edit2 className="w-3 h-3 mr-2" />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No email provider configured</p>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Configure email provider →
                </button>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="flex items-start space-x-2 md:space-x-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-indigo-900">Email Provider Configuration</h4>
                <p className="text-xs md:text-sm text-indigo-700 mt-1">
                  Choose between Brevo, SendGrid, or Mailgun. This configuration works for both development and production environments.
                </p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <a href="https://developers.brevo.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 text-xs md:text-sm font-medium">
                    Brevo Docs →
                  </a>
                  <a href="https://docs.sendgrid.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 text-xs md:text-sm font-medium">
                    SendGrid Docs →
                  </a>
                  <a href="https://documentation.mailgun.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 text-xs md:text-sm font-medium">
                    Mailgun Docs →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        {showEmailModal && (
          <EmailConfigModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSave={handleSaveConfiguration}
            existingConfig={emailConfig || null}
            appId={appId}
          />
        )}
      </Suspense>
    </div>
  );
}
