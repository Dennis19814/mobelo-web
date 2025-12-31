'use client';
import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { LocalIconData, iconLoader } from '@/lib/local-icon-loader';

interface LocalIconProps {
  iconData: LocalIconData;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  onClick?: () => void;
}

export const LocalIcon: React.FC<LocalIconProps> = ({
  iconData,
  size = 24,
  className = '',
  style = {},
  color = 'currentColor',
  onClick
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadIcon = async () => {
      try {
        setLoading(true);
        setError(null);
        const svg = await iconLoader.loadIconSvg(iconData);

        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load icon');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      isMounted = false;
    };
  }, [iconData]);

  // Loading state
  if (loading) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        <div className="animate-pulse bg-gray-300 rounded" style={{ width: size * 0.8, height: size * 0.8 }} />
      </div>
    );
  }

  // Error state
  if (error || !svgContent) {
    return (
      <div
        className={`inline-flex items-center justify-center text-gray-400 ${className}`}
        style={{ width: size, height: size, ...style }}
        title={`Failed to load icon: ${iconData.name}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width={size}
          height={size}
        >
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </div>
    );
  }

  // TEMPORARY: Bypass processing to test if that's the issue
  const processedSvg = svgContent.replace(/width="[^"]*"/g, `width="${size}"`).replace(/height="[^"]*"/g, `height="${size}"`);

  // Ensure no double slashes - filePath already starts with /
  const iconUrl = iconData.filePath.startsWith('/') ? iconData.filePath : `/${iconData.filePath}`;

  return (
    <div
      className={`inline-flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        width: size,
        height: size,
        color: style?.color || 'rgb(75 85 99)', // text-gray-600 fallback
        ...style
      }}
      onClick={onClick}
      title={iconData.title || iconData.name}
    >
      <Image
        src={iconUrl}
        alt={iconData.title || iconData.name}
        width={size}
        height={size}
        style={{ filter: 'none' }}
        unoptimized={true}
      />
    </div>
  );
};

// Simple Icon component for when you only have icon name/library
interface SimpleLocalIconProps {
  name: string;
  library?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  onClick?: () => void;
}

export const SimpleLocalIcon: React.FC<SimpleLocalIconProps> = ({
  name,
  library,
  ...props
}) => {
  const [iconData, setIconData] = useState<LocalIconData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIconData = async () => {
      try {
        await iconLoader.loadMetadata();
        const icon = iconLoader.getIconByName(name, library);
        setIconData(icon || null);
      } catch (error) {
        logger.error('Failed to load icon data:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        setIconData(null);
      } finally {
        setLoading(false);
      }
    };

    loadIconData();
  }, [name, library]);

  if (loading) {
    return (
      <div
        className={`inline-flex items-center justify-center ${props.className || ''}`}
        style={{ width: props.size || 24, height: props.size || 24, ...props.style }}
      >
        <div className="animate-pulse bg-gray-300 rounded" style={{ width: (props.size || 24) * 0.8, height: (props.size || 24) * 0.8 }} />
      </div>
    );
  }

  if (!iconData) {
    return (
      <div
        className={`inline-flex items-center justify-center text-gray-400 ${props.className || ''}`}
        style={{ width: props.size || 24, height: props.size || 24, ...props.style }}
        title={`Icon not found: ${name}`}
      >
        ?
      </div>
    );
  }

  return <LocalIcon iconData={iconData} {...props} />;
};

// Utility function to process SVG content
function processSvgContent(svgContent: string, size: number, color: string): string {
  let processed = svgContent;

  // Set size attributes
  processed = processed.replace(/width="[^"]*"/g, `width="${size}"`);
  processed = processed.replace(/height="[^"]*"/g, `height="${size}"`);

  // If no width/height attributes exist, add them
  if (!processed.includes('width=')) {
    processed = processed.replace('<svg', `<svg width="${size}"`);
  }
  if (!processed.includes('height=')) {
    processed = processed.replace('<svg', `<svg height="${size}"`);
  }

  // Always ensure proper color attributes for consistent rendering
  const hasFillNone = processed.includes('fill="none"');
  const hasHardcodedColors = /stroke="#[0-9A-Fa-f]{6}"/gi.test(processed) || /fill="#[0-9A-Fa-f]{6}"/gi.test(processed);

  if (color && color !== 'currentColor') {
    // Explicit color mode - replace all color attributes
    processed = processed.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
    if (!hasFillNone) {
      processed = processed.replace(/fill="[^"]*"/g, `fill="${color}"`);
    }
  } else {
    // CurrentColor mode - ensure proper inheritance
    // Convert hardcoded hex colors to currentColor
    if (hasHardcodedColors) {
      processed = processed.replace(/stroke="#[0-9A-Fa-f]{6}"/gi, 'stroke="currentColor"');
      if (!hasFillNone) {
        processed = processed.replace(/fill="#[0-9A-Fa-f]{6}"/gi, 'fill="currentColor"');
      }
    }

    // Ensure stroke="currentColor" is present for outline icons
    if (!processed.includes('stroke="currentColor"') && (processed.includes('stroke=') || hasFillNone)) {
      // If it has stroke attributes or is a fill="none" icon, ensure currentColor stroke
      processed = processed.replace(/stroke="[^"]*"/g, 'stroke="currentColor"');

      // If no stroke attribute exists but has fill="none", add stroke
      if (!processed.includes('stroke=') && hasFillNone) {
        processed = processed.replace('<svg', '<svg stroke="currentColor"');
      }
    }

    // For fill-based icons without fill="none", ensure they have currentColor fill
    if (!hasFillNone && !processed.includes('fill="currentColor"') && !processed.includes('stroke="currentColor"')) {
      processed = processed.replace(/fill="[^"]*"/g, 'fill="currentColor"');

      // If no fill attribute exists, add it
      if (!processed.includes('fill=')) {
        processed = processed.replace('<svg', '<svg fill="currentColor"');
      }
    }
  }

  return processed;
}

export default LocalIcon;