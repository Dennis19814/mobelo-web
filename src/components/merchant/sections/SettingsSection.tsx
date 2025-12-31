'use client';
import { logger } from '@/lib/logger'
import Image from 'next/image';

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useMerchantAuth, useCrudOperations } from '@/hooks';
import {
  Settings, Globe, Bell, Shield, Palette, Save, Key, Smartphone,
  CreditCard, CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  TestTube, Plus, Edit2, Trash2, MessageSquare, Mail, Upload, FileText, Loader2, Copy, Check
} from 'lucide-react';
import { AppConfiguration, CreateAppConfigDto, UpdateAppConfigDto } from '@/types/configuration.types';
import { apiService } from '@/lib/api-service';
import { copyToClipboard } from '@/lib/utils';
import { HeroImagesSection } from './HeroImagesSection';
import { BannerVisualEditor } from '../BannerVisualEditor';
// Note: Avoid using httpClient for logo-delete verification to prevent
// global 401 interceptor from logging users out on inconclusive checks.

// Lazy load modals
const SocialAuthConfigModal = lazy(() => import('../modals/SocialAuthConfigModal').then(m => ({ default: m.SocialAuthConfigModal })));
const StripeConfigModal = lazy(() => import('../modals/StripeConfigModal').then(m => ({ default: m.StripeConfigModal })));
const TwilioConfigModal = lazy(() => import('../modals/TwilioConfigModal').then(m => ({ default: m.TwilioConfigModal })));
const EmailConfigModal = lazy(() => import('../modals/EmailConfigModal').then(m => ({ default: m.EmailConfigModal })));
const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'));
const LegalDocumentModal = lazy(() => import('../modals/LegalDocumentModal').then(m => ({ default: m.LegalDocumentModal })));

// Lazy load TemplatesSection
const TemplatesSection = lazy(() => import('./TemplatesSection'));

interface App {
  id: number;
  app_name: string;
  app_idea: string;
  status: string;
  logoUrl?: string;
  logoMetadata?: {
    original: string;
    sizes: {
      [key: string]: string;
    };
    cdnUrl?: string;
    uploadedAt: Date;
  };
  showAppNameWithLogo?: boolean;
  splashUrl?: string;
  splashTagline?: string;
  splashDescription?: string;
  bannerJson?: Array<{
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    badge?: string;
    limitedTime: boolean;
    backgroundColor: string;
    textColor: string;
  }>;
}

interface SettingsSectionProps {
  app: App;
  apiKey?: string;
  appSecretKey?: string;
  // Notify parent so it can update currentApp/app list
  onAppUpdated?: (patch: Partial<App>) => void;
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

const SettingsSectionComponent = ({ app, apiKey, appSecretKey, onAppUpdated }: SettingsSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const {
    loading: crudLoading,
    error: crudError,
    successMessage,
    executeOperation,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations();

  const [activeTab, setActiveTab] = useState('general');
  const [configurations, setConfigurations] = useState<AppConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showTwilioModal, setShowTwilioModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<AppConfiguration | null>(null);
  const [testingConfig, setTestingConfig] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(app.logoUrl || null);
  const [uploadingSplash, setUploadingSplash] = useState(false);
  const [splashPreview, setSplashPreview] = useState<string | null>((app as any).splashUrl || null);
  const [deletingSplash, setDeletingSplash] = useState(false);
  const [splashTagline, setSplashTagline] = useState((app as any).splashTagline || '');
  const [splashDescription, setSplashDescription] = useState((app as any).splashDescription || '');
  const [savingSplashText, setSavingSplashText] = useState(false);
  const [appName, setAppName] = useState(app.app_name);
  const [appDescription, setAppDescription] = useState(app.app_idea);
  const [savingAppName, setSavingAppName] = useState(false);
  const [showAppNameWithLogo, setShowAppNameWithLogo] = useState(app.showAppNameWithLogo || false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [showDeleteLogoModal, setShowDeleteLogoModal] = useState(false);
  const [showDeleteSplashModal, setShowDeleteSplashModal] = useState(false);
  const [showLegalDocumentModal, setShowLegalDocumentModal] = useState(false);
  const [selectedLegalDocumentType, setSelectedLegalDocumentType] = useState<'terms_and_conditions' | 'privacy_policy' | null>(null);
  const [copiedKey, setCopiedKey] = useState<'api' | 'secret' | null>(null);

  const tabs = useMemo(() => [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'api', label: 'API', icon: Key },
    { id: 'social-auth', label: 'Logins', icon: Smartphone },
    { id: 'payments', label: 'Payment Gateway', icon: CreditCard },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'system-templates', label: 'Templates', icon: FileText },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ], []);

  const fetchConfigurations = useCallback(async () => {
    if (!headers) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/v1/platform/apps/${app.id}/configurations`, {
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
  }, [headers, app.id]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  // Sync state with app prop changes - ensures splash settings and other app data loads on page load
  useEffect(() => {
    setLogoPreview(app.logoUrl || null);
    setSplashPreview(app.splashUrl || null);
    setSplashTagline(app.splashTagline || '');
    setSplashDescription(app.splashDescription || '');
    setAppName(app.app_name);
    setAppDescription(app.app_idea);
    setShowAppNameWithLogo(app.showAppNameWithLogo || false);
  }, [app]);

  const testConfiguration = async (configId: number) => {
    try {
      setTestingConfig(configId);
      setSuccessMessage(null);
      setCrudError(null);

      const response = await fetch(`/api/proxy/v1/platform/apps/${app.id}/configurations/${configId}/test`, {
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
        ? `/api/proxy/v1/platform/apps/${app.id}/configurations/${effectiveConfigId}`
        : `/api/proxy/v1/platform/apps/${app.id}/configurations`;

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

      // Update local configurations
      if (isUpdate) {
        setConfigurations(prev =>
          prev.map(c => c.id === effectiveConfigId ? savedConfig : c)
        );
      } else {
        setConfigurations(prev => [...prev, savedConfig]);
      }

      setSuccessMessage(isUpdate ? 'Configuration updated successfully!' : 'Configuration created successfully!');

      // Close the appropriate modal after successful save to refresh state
      if (savedConfig.configType === 'email') {
        setShowEmailModal(false);
      } else if (savedConfig.configType === 'social_auth') {
        setShowSocialModal(false);
        setSelectedProvider(null);
        setSelectedConfig(null);
      } else if (savedConfig.configType === 'payment') {
        setShowStripeModal(false);
      } else if (savedConfig.configType === 'sms') {
        setShowTwilioModal(false);
      }

      return savedConfig;
    } catch (error) {
      logger.error('Error saving configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  };

  const handleTestStripeConfiguration = async (config: CreateAppConfigDto | UpdateAppConfigDto) => {
    try {
      // Get the environment from the config
      const environment = 'environment' in config ? config.environment : 'sandbox';

      // Find existing config ID for this environment
      const existingConfig = configurations.find(
        c => c.provider === 'stripe' && c.environment === environment
      );

      // Save or update the configuration
      await handleSaveConfiguration(config, existingConfig?.id);

      // Test using the existing test endpoint
      const testResponse = await fetch(
        `/api/proxy/v1/platform/apps/${app.id}/configurations/stripe/test?environment=${environment}`,
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
      console.log('🔍 API test response:', result);

      const returnValue = {
        isValid: result.isValid === true,
        message: result.isValid ? (result.message || 'Stripe keys are valid!') : (result.error || 'Invalid Stripe keys')
      };
      console.log('🔍 Returning to modal:', returnValue);

      return returnValue;
    } catch (error) {
      logger.error('Error testing Stripe configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  };

  const toggleConfiguration = async (configId: number) => {
    try {
      const response = await fetch(`/api/proxy/v1/platform/apps/${app.id}/configurations/${configId}/toggle`, {
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
      alert('Failed to toggle configuration');
    }
  };

  const handleAppNameSave = async () => {
    if (!appName.trim()) {
      setCrudError('App name cannot be empty.');
      return;
    }

    try {
      setSavingAppName(true);
      setCrudError(null);

      const response = await apiService.updateApp(app.id, {
        app_name: appName,
        app_idea: appDescription
      });

      if (response.ok) {
        setSuccessMessage('App information updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000); // Auto-dismiss after 3 seconds
        onAppUpdated?.({ app_name: appName, app_idea: appDescription });
      } else {
        setCrudError(response.data?.message || 'Failed to update app information');
      }
    } catch (error) {
      logger.error('App info update error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      setCrudError('Failed to update app information. Please try again.');
    } finally {
      setSavingAppName(false);
    }
  };

  const handleToggleAppNameWithLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowAppNameWithLogo(newValue);

    try {
      const response = await apiService.updateApp(app.id, {
        showAppNameWithLogo: newValue
      });
      if (response.ok) {
        setSuccessMessage('Setting updated successfully!');
        onAppUpdated?.({ showAppNameWithLogo: newValue });
      } else {
        setShowAppNameWithLogo(!newValue); // Revert on error
        setCrudError('Failed to update setting');
      }
    } catch (error) {
      setShowAppNameWithLogo(!newValue); // Revert on error
      logger.error('Toggle update error:', { error: error instanceof Error ? error.message : String(error) });
      setCrudError('Failed to update setting');
    }
  };

  const handleLogoDelete = async () => {
    try {
      setDeletingLogo(true);
      setCrudError(null);

      console.log('[SETTINGS] handleLogoDelete start', { appId: app.id });
      const response = await apiService.deleteAppLogo(app.id);
      console.log('[SETTINGS] deleteAppLogo returned', { ok: response.ok, status: response.status, logoUrl: response.data?.logoUrl ?? null, hasLogoMetadata: !!response.data?.logoMetadata });

      if (response.ok) {
        // Trust the backend response body which returns the updated app entity
        // with logoUrl/logoMetadata cleared when successful.
        const removed = response.data && response.data.logoUrl == null;
        if (!removed) {
          setCrudError('Logo removal was not confirmed. Please retry.');
          setDeletingLogo(false);
          return;
        }

        // Clear local preview and bubble change up so UI reflects immediately
        setLogoPreview(null);
        console.log('[SETTINGS] Cleared local preview');

        // Inform parent so it updates currentApp/app list
        onAppUpdated?.({ logoUrl: undefined as any, logoMetadata: undefined as any });
        console.log('[SETTINGS] Notified parent about app update (logo cleared)');

        // Keep staff session local app in sync (staff mode uses localStorage 'staff_app')
        try {
          const staffAppData = typeof window !== 'undefined' ? localStorage.getItem('staff_app') : null;
          if (staffAppData) {
            const staffApp = JSON.parse(staffAppData);
            if (staffApp && staffApp.id === app.id) {
              localStorage.setItem('staff_app', JSON.stringify({ ...staffApp, logoUrl: null, logoMetadata: null }));
              console.log('[SETTINGS] Updated localStorage.staff_app');
            }
          }
        } catch { /* noop */ }

        setSuccessMessage('Logo removed successfully!');
        setShowDeleteLogoModal(false); // Close modal on success
        console.log('[SETTINGS] Logo removed success flow completed');
      } else {
        setCrudError(response.data?.message || 'Failed to remove logo');
        console.warn('[SETTINGS] deleteAppLogo failed', { status: response.status, data: response.data });
      }
    } catch (error) {
      logger.error('Logo delete error:', { error: error instanceof Error ? error.message : String(error) });
      console.error('[SETTINGS] handleLogoDelete error', error);
      setCrudError('Failed to remove logo. Please try again.');
    } finally {
      setDeletingLogo(false);
      console.log('[SETTINGS] handleLogoDelete end');
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setCrudError('Invalid file type. Please upload JPEG, PNG, WebP, or SVG.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCrudError('File size must be less than 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      setCrudError(null);

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      const response = await apiService.uploadAppLogo(app.id, file);

      if (response.ok) {
        setSuccessMessage('Logo uploaded successfully!');
        // The logo preview will be updated from the response
        if (response.data.logoUrl) {
          setLogoPreview(response.data.logoUrl);
        }

        // Inform parent so it updates currentApp/app list
        onAppUpdated?.({ logoUrl: response.data.logoUrl, logoMetadata: response.data.logoMetadata });

        // Keep staff session local app in sync (staff mode uses localStorage 'staff_app')
        try {
          const staffAppData = typeof window !== 'undefined' ? localStorage.getItem('staff_app') : null;
          if (staffAppData) {
            const staffApp = JSON.parse(staffAppData);
            if (staffApp && staffApp.id === app.id) {
              localStorage.setItem('staff_app', JSON.stringify({ ...staffApp, logoUrl: response.data.logoUrl, logoMetadata: response.data.logoMetadata }));
            }
          }
        } catch { /* noop */ }
      } else {
        setCrudError(response.data?.message || 'Failed to upload logo');
        setLogoPreview(null);
      }
    } catch (error) {
      logger.error('Logo upload error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      setCrudError('Failed to upload logo. Please try again.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSplashUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setCrudError('Invalid file type. Please upload JPEG, PNG, or WebP.');
      setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
      event.target.value = ''; // Reset input
      return;
    }

    // Validate file size
    if (file.size > 8 * 1024 * 1024) {
      setCrudError('File size must be less than 8MB.');
      setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
      event.target.value = ''; // Reset input
      return;
    }

    // Validate image dimensions
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      const minWidth = 1080;
      const minHeight = 1920;
      const recommendedWidth = 1242;
      const recommendedHeight = 2688;
      const aspectRatio = img.width / img.height;
      const recommendedAspectRatio = recommendedWidth / recommendedHeight;

      // Check minimum dimensions
      if (img.width < minWidth || img.height < minHeight) {
        setCrudError(`Image is too small. Minimum size is ${minWidth}x${minHeight}px. Your image is ${img.width}x${img.height}px.`);
        setTimeout(() => setCrudError(null), 8000); // Auto-dismiss after 8 seconds (longer for detailed message)
        event.target.value = ''; // Reset input
        return;
      }

      // Check aspect ratio (allow some tolerance)
      const aspectRatioDiff = Math.abs(aspectRatio - recommendedAspectRatio);
      if (aspectRatioDiff > 0.1) {
        setCrudError(`Invalid aspect ratio. Expected portrait orientation (9:19.5 ratio). Recommended: ${recommendedWidth}x${recommendedHeight}px. Your image is ${img.width}x${img.height}px.`);
        setTimeout(() => setCrudError(null), 8000); // Auto-dismiss after 8 seconds (longer for detailed message)
        event.target.value = ''; // Reset input
        return;
      }

      // Warn if not recommended dimensions but still acceptable
      if (img.width !== recommendedWidth || img.height !== recommendedHeight) {
        console.warn(`Image dimensions (${img.width}x${img.height}px) differ from recommended (${recommendedWidth}x${recommendedHeight}px)`);
      }

      // Proceed with upload
      try {
        setUploadingSplash(true);
        setCrudError(null);

        const reader = new FileReader();
        reader.onloadend = () => setSplashPreview(reader.result as string);
        reader.readAsDataURL(file);

        const response = await apiService.uploadAppSplash(app.id, file);
        if (response.ok) {
          setSuccessMessage('Splash uploaded successfully!');
          setTimeout(() => setSuccessMessage(null), 5000); // Auto-dismiss after 5 seconds
          if (response.data?.splashUrl) {
            setSplashPreview(response.data.splashUrl);
            // Notify parent component
            onAppUpdated?.({ splashUrl: response.data.splashUrl } as any);
          }
        } else {
          setCrudError(response.data?.message || 'Failed to upload splash image');
          setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
          setSplashPreview(null);
        }
      } catch (error) {
        logger.error('Splash upload error:', { error: error instanceof Error ? error.message : String(error) });
        setCrudError('Failed to upload splash image. Please try again.');
        setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
        setSplashPreview(null);
      } finally {
        setUploadingSplash(false);
        event.target.value = ''; // Reset input
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setCrudError('Failed to load image. Please try a different file.');
      setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
      event.target.value = ''; // Reset input
    };

    img.src = objectUrl;
  };

  const handleSplashTextSave = async () => {
    try {
      setSavingSplashText(true);
      setCrudError(null);

      const response = await apiService.updateApp(app.id, {
        splashTagline,
        splashDescription
      });

      if (response.ok) {
        setSuccessMessage('Splash text updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        onAppUpdated?.({ splashTagline, splashDescription } as any);
      } else {
        setCrudError(response.data?.message || 'Failed to update splash text');
      }
    } catch (error) {
      logger.error('Splash text update error:', { error: error instanceof Error ? error.message : String(error) });
      setCrudError('Failed to update splash text. Please try again.');
    } finally {
      setSavingSplashText(false);
    }
  };

  const handleSplashDelete = async () => {
    try {
      setDeletingSplash(true);
      setCrudError(null);
      const response = await apiService.deleteAppSplash(app.id);
      if (response.ok) {
        setSplashPreview(null);
        setSplashTagline('');
        setSplashDescription('');
        setSuccessMessage('Splash removed successfully!');
        setTimeout(() => setSuccessMessage(null), 5000); // Auto-dismiss after 5 seconds
        setShowDeleteSplashModal(false); // Close modal on success
        // Notify parent component
        onAppUpdated?.({ splashUrl: null, splashTagline: '', splashDescription: '' } as any);
      } else {
        setCrudError(response.data?.message || 'Failed to remove splash image');
        setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
      }
    } catch (error) {
      logger.error('Splash delete error:', { error: error instanceof Error ? error.message : String(error) });
      setCrudError('Failed to remove splash image. Please try again.');
      setTimeout(() => setCrudError(null), 5000); // Auto-dismiss after 5 seconds
    } finally {
      setDeletingSplash(false);
    }
  };

  const handleCopyKey = async (key: string, type: 'api' | 'secret') => {
    const success = await copyToClipboard(key);
    if (success) {
      setCopiedKey(type);
      setTimeout(() => setCopiedKey(null), 2000); // Reset after 2 seconds
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'api':
        return renderApiTab();
      case 'social-auth':
        return renderSocialAuthTab();
      case 'payments':
        return renderPaymentsTab();
      case 'sms':
        return renderSmsTab();
      case 'email':
        return renderEmailTab();
      case 'system-templates':
        return renderSystemTemplatesTab();
      case 'appearance':
        return renderAppearanceTab();
      case 'notifications':
        return renderNotificationsTab();
      default:
        return null;
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-4">

      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">App Information</h3>
        <div className="space-y-3 w-full min-w-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm min-w-0"
                disabled={savingAppName}
              />
              <button
                onClick={handleAppNameSave}
                disabled={savingAppName || (appName === app.app_name && appDescription === app.app_idea)}
                className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shrink-0"
              >
                <Save className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">{savingAppName ? 'Saving...' : 'Save'}</span>
                <span className="md:hidden">{savingAppName ? '...' : ''}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Description</label>
            <textarea
              rows={4}
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-y min-h-[100px]"
              disabled={savingAppName}
            />
          </div>
        </div>
      </div>

      {/* App Logo Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">App Logo</h3>
        <div className="space-y-3 w-full min-w-0">
          <div>
            <p className="text-xs md:text-sm text-gray-600 mb-4 break-words">
              Upload your app logo. This will be displayed on mobile devices. Supported formats: JPEG, PNG, WebP, SVG (max 5MB, minimum 128x128px).
            </p>

            {/* Current Logo Preview */}
            {(logoPreview || app.logoUrl) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Logo</label>
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview || app.logoUrl || ''}
                    alt="App Logo"
                    className="w-32 h-32 object-contain border border-gray-300 rounded-lg bg-gray-50"
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload and Delete Buttons */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <div className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </div>
              </label>
              {(logoPreview || app.logoUrl) && (
                <button
                  onClick={() => setShowDeleteLogoModal(true)}
                  disabled={deletingLogo}
                  className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deletingLogo ? 'Removing...' : 'Remove Logo'}
                </button>
              )}
              {uploadingLogo && (
                <span className="text-sm text-gray-600">Processing image...</span>
              )}
            </div>

            {/* Show App Name with Logo Toggle */}
            {(logoPreview || app.logoUrl) && (
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Show App Name with Logo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Display app name alongside logo in mobile header
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAppNameWithLogo}
                    onChange={handleToggleAppNameWithLogo}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            )}

            {/* File Requirements Info */}
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p className="break-words">• Supported formats: JPEG, PNG, WebP, SVG</p>
              <p className="break-words">• Maximum file size: 5MB</p>
              <p className="break-words">• Minimum dimensions: 128x128 pixels</p>
              <p className="break-words">• Logo will be optimized for different screen sizes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Splash Screen Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 mb-3 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Splash Screen</h3>
          {splashPreview && (
            <button
              onClick={handleSplashDelete}
              disabled={deletingSplash}
              className="px-3 py-1.5 text-xs md:text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 shrink-0 w-full md:w-auto"
            >
              {deletingSplash ? 'Removing...' : <><span className="hidden md:inline">Remove Splash</span><span className="md:hidden">Remove</span></>}
            </button>
          )}
        </div>
        {/* Current Splash Preview */}
        {splashPreview && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Splash</label>
            <div className="relative border border-gray-200 rounded-lg p-3 bg-gray-50 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={splashPreview}
                alt="Splash"
                className="max-h-[260px] max-w-full object-contain rounded-lg shadow-sm"
              />
              {uploadingSplash && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload and Delete Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleSplashUpload}
              onClick={(e) => {
                // Reset input to allow selecting the same file again
                (e.target as HTMLInputElement).value = '';
              }}
              disabled={uploadingSplash}
              className="hidden"
            />
            <div className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap">
              <Upload className="w-4 h-4 mr-2" />
              {uploadingSplash ? 'Uploading...' : 'Upload Splash'}
            </div>
          </label>
          {splashPreview && (
            <button
              onClick={() => setShowDeleteSplashModal(true)}
              disabled={deletingSplash}
              className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deletingSplash ? 'Removing...' : 'Remove Splash'}
            </button>
          )}
          {uploadingSplash && (
            <span className="text-sm text-gray-600">Processing image...</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 break-words">Recommended: 1242x2688px. Max 8MB. PNG/JPG/WEBP.</p>

        {/* Splash Text Content */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Splash Screen Text</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={splashTagline}
                onChange={(e) => setSplashTagline(e.target.value)}
                placeholder="e.g., Welcome to Your App"
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                disabled={savingSplashText}
              />
              <p className="text-xs text-gray-500 mt-1">{splashTagline.length}/255 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={splashDescription}
                onChange={(e) => setSplashDescription(e.target.value)}
                placeholder="e.g., Your journey to success starts here"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-y min-h-[80px]"
                disabled={savingSplashText}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSplashTextSave}
                disabled={savingSplashText || ((app as any).splashTagline === splashTagline && (app as any).splashDescription === splashDescription)}
                className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSplashText ? 'Saving...' : 'Save Text'}
              </button>
              {(splashTagline || splashDescription) && (
                <button
                  onClick={() => {
                    setSplashTagline('');
                    setSplashDescription('');
                    handleSplashTextSave();
                  }}
                  disabled={savingSplashText}
                  className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Images Section */}
      <HeroImagesSection appId={app.id} />

      {/* Banner Slider Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full min-w-0 overflow-hidden">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Banner Slider</h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3 break-words">
          Configure banner slider content for your mobile app. Use the visual editor to customize banners displayed on the home screen.
        </p>

        <div className="min-w-0">
          <BannerVisualEditor
            appId={app.id}
            initialValue={app.bannerJson}
            onSave={async (banners) => {
              try {
                const response = await apiService.updateBannerJson(app.id, banners);
                if (!response.ok) {
                  throw new Error('Failed to save banner configuration');
                }
                // Update parent component with new banner data
                if (onAppUpdated) {
                  onAppUpdated({ bannerJson: banners });
                }
              } catch (error) {
                throw error;
              }
            }}
          />
        </div>
      </div>

      {/* Legal Documents Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Legal Documents</h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3 break-words">
          Manage your app's legal documents. These will be displayed to users in your mobile app.
        </p>

        <div className="space-y-3">
          {/* Terms and Conditions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <FileText className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Terms and Conditions</p>
                <p className="text-xs text-gray-500">Define the terms of service for your app</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedLegalDocumentType('terms_and_conditions');
                setShowLegalDocumentModal(true);
              }}
              className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap w-full md:w-auto shrink-0"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>

          {/* Privacy Policy */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <FileText className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Privacy Policy</p>
                <p className="text-xs text-gray-500">Explain how you handle user data and privacy</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedLegalDocumentType('privacy_policy');
                setShowLegalDocumentModal(true);
              }}
              className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap w-full md:w-auto shrink-0"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-4 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">API Credentials</h3>
          <p className="text-xs md:text-sm text-gray-600 break-words">Use these credentials to authenticate with the Mobelo API</p>
        </div>
      </div>

      {/* API Key Card */}
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

      {/* App Secret Key Card */}
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

      {/* API Documentation Link */}
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

  const renderSocialAuthTab = () => {
    const socialConfigs = configurations.filter(c => c.configType === 'social_auth');

    return (
      <div className="space-y-4 w-full max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Social Authentication</h3>
            <p className="text-sm text-gray-600">Configure OAuth providers for user login</p>
          </div>
        </div>

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
      </div>
    );
  };

  const renderPaymentsTab = () => {
    const stripeConfigs = configurations.filter(c => c.configType === 'payment' && c.provider === 'stripe');
    const sandboxConfig = stripeConfigs.find(c => c.environment === 'sandbox');
    const productionConfig = stripeConfigs.find(c => c.environment === 'production');

    return (
      <div className="space-y-4 w-full max-w-full">
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
      </div>
    );
  };

  const renderSmsTab = () => {
    const twilioConfig = configurations.find(c => c.configType === 'sms');

    return (
      <div className="space-y-4 w-full max-w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SMS Configuration</h3>
            <p className="text-sm text-gray-600">Manage Twilio credentials for SMS OTP delivery</p>
          </div>
          <button
            onClick={() => setShowTwilioModal(true)}
            className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap w-full lg:w-auto shrink-0"
          >
            <Key className="w-4 h-4 mr-2" />
            {twilioConfig ? 'Update Configuration' : 'Configure Twilio'}
          </button>
        </div>

        {/* Single SMS Configuration Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 min-w-0">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Twilio SMS Service</h4>
                <p className="text-sm text-gray-500">Single configuration for all environments</p>
              </div>
            </div>
            {twilioConfig?.isEnabled && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>

          {twilioConfig ? (
            <div className="space-y-3 min-w-0 overflow-hidden">
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-500">Account SID</p>
                <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{twilioConfig.clientId}</p>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-500">Auth Token</p>
                <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{twilioConfig.clientSecretMasked}</p>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="text-sm font-mono text-gray-900 break-all overflow-hidden">{twilioConfig.settings?.phoneNumber || 'Not configured'}</p>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => testConfiguration(twilioConfig.id)}
                  disabled={testingConfig === twilioConfig.id}
                  className="flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                >
                  {testingConfig === twilioConfig.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-2" />
                  ) : (
                    <TestTube className="w-3 h-3 mr-2" />
                  )}
                  Test
                </button>
                <button
                  onClick={() => setShowTwilioModal(true)}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">No SMS service configured</p>
              <button
                onClick={() => setShowTwilioModal(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Configure Twilio SMS →
              </button>
            </div>
          )}
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-start space-x-2 md:space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-slate-900">Twilio Configuration</h4>
              <p className="text-xs md:text-sm text-orange-700 mt-1">
                This configuration works for both development and production environments. Keep your auth token secure.
              </p>
              <div className="mt-2">
                <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 text-xs md:text-sm font-medium">
                  View Twilio console →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailTab = () => {
    const emailConfig = configurations.find(c => c.configType === 'email');

    return (
      <div className="space-y-4 w-full max-w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Provider Configuration</h3>
            <p className="text-sm text-gray-600">Manage email service credentials for transactional emails</p>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap w-full lg:w-auto shrink-0"
          >
            <Key className="w-4 h-4 mr-2" />
            {emailConfig ? 'Update Configuration' : 'Configure Email'}
          </button>
        </div>

        {/* Single Email Configuration Card */}
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
      </div>
    );
  };

  const renderAppearanceTab = () => (
    <div className="space-y-4 w-full max-w-full min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">App Appearance</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              <button className="w-10 h-10 bg-orange-600 rounded-lg border-2 border-gray-300"></button>
              <button className="w-10 h-10 bg-green-600 rounded-lg border-2 border-transparent"></button>
              <button className="w-10 h-10 bg-purple-600 rounded-lg border-2 border-transparent"></button>
              <button className="w-10 h-10 bg-red-600 rounded-lg border-2 border-transparent"></button>
              <button className="w-10 h-10 bg-gray-600 rounded-lg border-2 border-transparent"></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-4 w-full max-w-full min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-700">Email notifications for new orders</span>
            <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500 shrink-0" />
          </label>
          <label className="flex flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-700">Push notifications for activities</span>
            <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500 shrink-0" />
          </label>
          <label className="flex flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-700">Weekly summary reports</span>
            <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500 shrink-0" defaultChecked />
          </label>
        </div>
      </div>
    </div>
  );

  const renderSystemTemplatesTab = () => {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }>
        <TemplatesSection appId={app.id} apiKey={apiKey || ''} appSecretKey={appSecretKey || ''} />
      </Suspense>
    );
  };

  return (
    <div className="w-full max-w-full min-w-0">
      {/* Sticky Header Section */}
      <div className="sticky top-0 lg:top-16 z-30 bg-gray-50 -mx-3 sm:-mx-4 md:-mx-4 lg:-mx-5 px-3 sm:px-4 md:px-4 lg:px-5 shadow-sm">
        <div className="pt-3 md:pt-4 lg:pt-5 mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm md:text-base text-gray-600 break-words">Configure your app preferences, authentication, and integrations</p>
        </div>

        {/* Tab Navigation - Responsive with horizontal scroll */}
        <div className="border-b border-gray-200 overflow-x-auto pb-0">
          <nav className="flex flex-wrap lg:flex-nowrap space-x-1 md:space-x-2 lg:space-x-3" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="py-4 px-2 md:px-3 text-sm whitespace-nowrap transition-all"
                >
                  <span className={`flex items-center pb-1 ${
                    activeTab === tab.id
                      ? 'font-bold text-gray-900 border-b-[3px] border-orange-600'
                      : 'font-normal text-gray-600 border-b-[3px] border-transparent hover:text-gray-900'
                  }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="ml-1.5 md:ml-2">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sticky Toast Messages - Always visible in header */}
        {successMessage && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
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
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
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
      </div>

      {/* Tab Content */}
      <div className="min-h-96 mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{saveMessage}</p>
          </div>
        </div>
      )}

      {/* Social Auth Configuration Modal */}
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
            appId={app.id}
          />
        )}
      </Suspense>

      {/* Stripe Configuration Modal */}
      <Suspense fallback={null}>
        {showStripeModal && (
          <StripeConfigModal
            isOpen={showStripeModal}
            onClose={() => setShowStripeModal(false)}
            onSave={handleSaveConfiguration}
            onTest={handleTestStripeConfiguration}
            existingConfigs={{
              sandbox: configurations.find(c => c.provider === 'stripe' && c.environment === 'sandbox') || null,
              production: configurations.find(c => c.provider === 'stripe' && c.environment === 'production') || null
            }}
            appId={app.id}
          />
        )}
      </Suspense>

      {/* Twilio Configuration Modal */}
      <Suspense fallback={null}>
        {showTwilioModal && (
          <TwilioConfigModal
            isOpen={showTwilioModal}
            onClose={() => setShowTwilioModal(false)}
            onSave={handleSaveConfiguration}
            existingConfig={configurations.find(c => c.configType === 'sms') || null}
            appId={app.id}
          />
        )}
      </Suspense>

      {/* Email Configuration Modal */}
      <Suspense fallback={null}>
        {showEmailModal && (
          <EmailConfigModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSave={handleSaveConfiguration}
            existingConfig={configurations.find(c => c.configType === 'email') || null}
            appId={app.id}
          />
        )}
      </Suspense>

      {/* Delete Logo Confirmation Modal */}
      <Suspense fallback={null}>
        {showDeleteLogoModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteLogoModal}
            onClose={() => setShowDeleteLogoModal(false)}
            onConfirm={handleLogoDelete}
            title="Remove App Logo"
            message="Are you sure you want to remove the app logo? This will remove the logo from your mobile app. This action cannot be undone."
            itemType="logo"
            confirmButtonText="Remove Logo"
            cancelButtonText="Keep Logo"
          />
        )}
      </Suspense>

      {/* Delete Splash Confirmation Modal */}
      <Suspense fallback={null}>
        {showDeleteSplashModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteSplashModal}
            onClose={() => setShowDeleteSplashModal(false)}
            onConfirm={handleSplashDelete}
            title="Remove Splash Screen"
            message="Are you sure you want to remove the splash screen? This will remove the splash screen from your mobile app. This action cannot be undone."
            itemType="splash screen"
            confirmButtonText="Remove Splash"
            cancelButtonText="Keep Splash"
          />
        )}
      </Suspense>

      {/* Legal Document Modal */}
      <Suspense fallback={null}>
        {showLegalDocumentModal && selectedLegalDocumentType && (
          <LegalDocumentModal
            isOpen={showLegalDocumentModal}
            onClose={() => {
              setShowLegalDocumentModal(false);
              setSelectedLegalDocumentType(null);
            }}
            documentType={selectedLegalDocumentType}
            appId={app.id}
            onSave={() => {
              setSuccessMessage('Legal document saved successfully!');
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default memo(SettingsSectionComponent);
