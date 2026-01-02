'use client';
import { logger } from '@/lib/logger'
import { useState, useEffect, lazy, Suspense } from 'react';
import { useCrudOperations } from '@/hooks';
import {
  Save, Trash2, Upload, FileText, Edit2
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { HeroImagesSection } from '../HeroImagesSection';
import { BannerVisualEditor } from '../../BannerVisualEditor';

const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'));
const LegalDocumentModal = lazy(() => import('../../modals/LegalDocumentModal').then(m => ({ default: m.LegalDocumentModal })));

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

interface SettingsGeneralSectionProps {
  app: App;
  onAppUpdated?: (patch: Partial<App>) => void;
}

export default function SettingsGeneralSection({ app, onAppUpdated }: SettingsGeneralSectionProps) {
  const {
    error: crudError,
    successMessage,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations();

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

  // Sync state with app prop changes
  useEffect(() => {
    setLogoPreview(app.logoUrl || null);
    setSplashPreview(app.splashUrl || null);
    setSplashTagline(app.splashTagline || '');
    setSplashDescription(app.splashDescription || '');
    setAppName(app.app_name);
    setAppDescription(app.app_idea);
    setShowAppNameWithLogo(app.showAppNameWithLogo || false);
  }, [app]);

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
        setTimeout(() => setSuccessMessage(null), 3000);
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
        setShowAppNameWithLogo(!newValue);
        setCrudError('Failed to update setting');
      }
    } catch (error) {
      setShowAppNameWithLogo(!newValue);
      logger.error('Toggle update error:', { error: error instanceof Error ? error.message : String(error) });
      setCrudError('Failed to update setting');
    }
  };

  const handleLogoDelete = async () => {
    try {
      setDeletingLogo(true);
      setCrudError(null);

      const response = await apiService.deleteAppLogo(app.id);

      if (response.ok) {
        const removed = response.data && response.data.logoUrl == null;
        if (!removed) {
          setCrudError('Logo removal was not confirmed. Please retry.');
          setDeletingLogo(false);
          return;
        }

        setLogoPreview(null);
        onAppUpdated?.({ logoUrl: undefined as any, logoMetadata: undefined as any });

        try {
          const staffAppData = typeof window !== 'undefined' ? localStorage.getItem('staff_app') : null;
          if (staffAppData) {
            const staffApp = JSON.parse(staffAppData);
            if (staffApp && staffApp.id === app.id) {
              localStorage.setItem('staff_app', JSON.stringify({ ...staffApp, logoUrl: null, logoMetadata: null }));
            }
          }
        } catch { /* noop */ }

        setSuccessMessage('Logo removed successfully!');
        setShowDeleteLogoModal(false);
      } else {
        setCrudError(response.data?.message || 'Failed to remove logo');
      }
    } catch (error) {
      logger.error('Logo delete error:', { error: error instanceof Error ? error.message : String(error) });
      setCrudError('Failed to remove logo. Please try again.');
    } finally {
      setDeletingLogo(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setCrudError('Invalid file type. Please upload JPEG, PNG, WebP, or SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCrudError('File size must be less than 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      setCrudError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const response = await apiService.uploadAppLogo(app.id, file);

      if (response.ok) {
        setSuccessMessage('Logo uploaded successfully!');
        if (response.data.logoUrl) {
          setLogoPreview(response.data.logoUrl);
        }
        onAppUpdated?.({ logoUrl: response.data.logoUrl, logoMetadata: response.data.logoMetadata });

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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setCrudError('Invalid file type. Please upload JPEG, PNG, or WebP.');
      setTimeout(() => setCrudError(null), 5000);
      event.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setCrudError('File size must be less than 8MB.');
      setTimeout(() => setCrudError(null), 5000);
      event.target.value = '';
      return;
    }

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

      if (img.width < minWidth || img.height < minHeight) {
        setCrudError(`Image is too small. Minimum size is ${minWidth}x${minHeight}px. Your image is ${img.width}x${img.height}px.`);
        setTimeout(() => setCrudError(null), 8000);
        event.target.value = '';
        return;
      }

      const aspectRatioDiff = Math.abs(aspectRatio - recommendedAspectRatio);
      if (aspectRatioDiff > 0.1) {
        setCrudError(`Invalid aspect ratio. Expected portrait orientation (9:19.5 ratio). Recommended: ${recommendedWidth}x${recommendedHeight}px. Your image is ${img.width}x${img.height}px.`);
        setTimeout(() => setCrudError(null), 8000);
        event.target.value = '';
        return;
      }

      try {
        setUploadingSplash(true);
        setCrudError(null);

        const reader = new FileReader();
        reader.onloadend = () => setSplashPreview(reader.result as string);
        reader.readAsDataURL(file);

        const response = await apiService.uploadAppSplash(app.id, file);
        if (response.ok) {
          setSuccessMessage('Splash uploaded successfully!');
          setTimeout(() => setSuccessMessage(null), 5000);
          if (response.data?.splashUrl) {
            setSplashPreview(response.data.splashUrl);
            onAppUpdated?.({ splashUrl: response.data.splashUrl } as any);
          }
        } else {
          setCrudError(response.data?.message || 'Failed to upload splash image');
          setTimeout(() => setCrudError(null), 5000);
          setSplashPreview(null);
        }
      } catch (error) {
        logger.error('Splash upload error:', { error: error instanceof Error ? error.message : String(error) });
        setCrudError('Failed to upload splash image. Please try again.');
        setTimeout(() => setCrudError(null), 5000);
        setSplashPreview(null);
      } finally {
        setUploadingSplash(false);
        event.target.value = '';
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setCrudError('Failed to load image. Please try a different file.');
      setTimeout(() => setCrudError(null), 5000);
      event.target.value = '';
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
        setTimeout(() => setSuccessMessage(null), 5000);
        setShowDeleteSplashModal(false);
        onAppUpdated?.({ splashUrl: null, splashTagline: '', splashDescription: '' } as any);
      } else {
        setCrudError(response.data?.message || 'Failed to remove splash image');
        setTimeout(() => setCrudError(null), 5000);
      }
    } catch (error) {
      logger.error('Splash delete error:', { error: error instanceof Error ? error.message : String(error) });
      setCrudError('Failed to remove splash image. Please try again.');
      setTimeout(() => setCrudError(null), 5000);
    } finally {
      setDeletingSplash(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">General</h1>
        <p className="text-sm md:text-base text-gray-600 break-words">Manage your app information, logo, splash screen, and legal documents</p>
      </div>

      {/* Toast Messages */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-800">{successMessage}</span>
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
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-red-800">{crudError}</span>
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
            <p className="text-xs md:text-sm text-gray-600 mb-4 break-words">
              Upload your app logo. This will be displayed on mobile devices. Supported formats: JPEG, PNG, WebP, SVG (max 5MB, minimum 128x128px).
            </p>

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
            </div>

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
          </div>
        </div>

        {/* Splash Screen Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 mb-3 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Splash Screen</h3>
            {splashPreview && (
              <button
                onClick={() => setShowDeleteSplashModal(true)}
                disabled={deletingSplash}
                className="px-3 py-1.5 text-xs md:text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 shrink-0 w-full md:w-auto"
              >
                {deletingSplash ? 'Removing...' : <><span className="hidden md:inline">Remove Splash</span><span className="md:hidden">Remove</span></>}
              </button>
            )}
          </div>
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

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleSplashUpload}
                onClick={(e) => {
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
          </div>
          <p className="text-xs text-gray-500 mt-2 break-words">Recommended: 1242x2688px. Max 8MB. PNG/JPG/WEBP.</p>

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
              </div>
            </div>
          </div>
        </div>

        <HeroImagesSection appId={app.id} />

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

        <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Legal Documents</h3>
          <p className="text-xs md:text-sm text-gray-600 mb-3 break-words">
            Manage your app's legal documents. These will be displayed to users in your mobile app.
          </p>
          <div className="space-y-3">
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
}

