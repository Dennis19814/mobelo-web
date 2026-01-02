'use client';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import TemplatesSection from '../TemplatesSection';

interface SettingsTemplatesSectionProps {
  appId: number;
  apiKey?: string;
  appSecretKey?: string;
}

export default function SettingsTemplatesSection({ appId, apiKey, appSecretKey }: SettingsTemplatesSectionProps) {
  return (
    <div className="space-y-4 w-full max-w-full">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }>
        <TemplatesSection appId={appId} apiKey={apiKey || ''} appSecretKey={appSecretKey || ''} />
      </Suspense>
    </div>
  );
}

