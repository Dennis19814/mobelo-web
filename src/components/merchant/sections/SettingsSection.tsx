'use client';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load child components
const SettingsGeneralSection = lazy(() => import('./settings/SettingsGeneralSection'));
const SettingsApiSection = lazy(() => import('./settings/SettingsApiSection'));
const SettingsSocialAuthSection = lazy(() => import('./settings/SettingsSocialAuthSection'));
const SettingsPaymentsSection = lazy(() => import('./settings/SettingsPaymentsSection'));
const SettingsSmsSection = lazy(() => import('./settings/SettingsSmsSection'));
const SettingsEmailSection = lazy(() => import('./settings/SettingsEmailSection'));
const SettingsTemplatesSection = lazy(() => import('./settings/SettingsTemplatesSection'));
const SettingsNotificationsSection = lazy(() => import('./settings/SettingsNotificationsSection'));
const SettingsStoreOriginSection = lazy(() => import('./settings/SettingsStoreOriginSection'));

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
  activeSection?: string;
  onAppUpdated?: (patch: Partial<App>) => void;
}

export default function SettingsSection({ app, apiKey, appSecretKey, activeSection = 'settings-general', onAppUpdated }: SettingsSectionProps) {
  const renderContent = () => {
    switch (activeSection) {
      case 'settings-general':
        return <SettingsGeneralSection app={app} onAppUpdated={onAppUpdated} />;
      case 'settings-api':
        return <SettingsApiSection apiKey={apiKey} appSecretKey={appSecretKey} />;
      case 'settings-social-auth':
        return <SettingsSocialAuthSection appId={app.id} apiKey={apiKey} appSecretKey={appSecretKey} />;
      case 'settings-payments':
        return <SettingsPaymentsSection appId={app.id} apiKey={apiKey} appSecretKey={appSecretKey} />;
      case 'settings-sms':
        return <SettingsSmsSection appId={app.id} apiKey={apiKey} appSecretKey={appSecretKey} />;
      case 'settings-email':
        return <SettingsEmailSection appId={app.id} apiKey={apiKey} appSecretKey={appSecretKey} />;
      case 'settings-templates':
        return <SettingsTemplatesSection appId={app.id} apiKey={apiKey} appSecretKey={appSecretKey} />;
      case 'settings-notifications':
        return <SettingsNotificationsSection />;
      case 'settings-store-origin':
        return <SettingsStoreOriginSection appId={app.id} />;
      default:
        return <SettingsGeneralSection app={app} onAppUpdated={onAppUpdated} />;
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }>
        {renderContent()}
      </Suspense>
    </div>
  );
}
