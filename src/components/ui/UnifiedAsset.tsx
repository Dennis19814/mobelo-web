'use client';
import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UnifiedAssetData } from '@/lib/unified-asset-loader';
import { LocalIcon } from '@/components/ui/icons/LocalIcon';

interface UnifiedAssetProps {
  asset: UnifiedAssetData;
  size?: number;
  className?: string;
}

export const UnifiedAsset: React.FC<UnifiedAssetProps> = ({
  asset,
  size = 24,
  className = ''
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (asset.type === 'icon' && !asset.svgContent) {
      // Load SVG content for icons
      setLoading(true);
      // Ensure the path doesn't have double slashes and starts with /
      const filePath = asset.filePath.startsWith('/')
        ? asset.filePath
        : `/${asset.filePath}`;

      fetch(filePath)
        .then(res => res.text())
        .then(content => {
          setSvgContent(content);
          setLoading(false);
        })
        .catch((err) => {
          logger.error(`Failed to load icon from ${filePath}:`, { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
          setError(true);
          setLoading(false);
        });
    }
  }, [asset]);

  if (asset.type === 'emoji') {
    // Ensure the path doesn't have double slashes and starts with /
    const emojiPath = asset.filePath.startsWith('/')
      ? asset.filePath
      : `/${asset.filePath}`;

    return (
      <Image
        src={emojiPath}
        alt={asset.name}
        width={size}
        height={size}
        className={className}
        unoptimized={true}
        onError={(e) => {
          // Fallback for broken emoji images
          const img = e.target as HTMLImageElement;
          img.style.display = 'none';
          if (asset.unicode) {
            const span = document.createElement('span');
            span.textContent = String.fromCodePoint(parseInt(asset.unicode.split('-')[0], 16));
            span.style.fontSize = `${size}px`;
            img.parentNode?.appendChild(span);
          }
        }}
      />
    );
  }

  // For icons
  if (loading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12" y2="16" />
        </svg>
      </div>
    );
  }

  // If we have the icon data in the format expected by LocalIcon
  if (asset.type === 'icon') {
    const iconData = {
      name: asset.name,
      library: asset.library,
      libraryKey: asset.libraryKey,
      title: asset.title,
      description: asset.description || '',
      keywords: asset.keywords,
      category: asset.category,
      license: asset.license || '',
      website: asset.website || '',
      filePath: asset.filePath,
      optimized: asset.optimized || false
    };

    return (
      <LocalIcon
        iconData={iconData}
        size={size}
        className={className}
      />
    );
  }

  return null;
};

export default UnifiedAsset;