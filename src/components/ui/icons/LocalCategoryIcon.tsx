'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Folder } from 'lucide-react';
import { parseIconKey } from '@/lib/local-icon-loader';
import type { Category } from '@/types/category';

// New unified category display component that handles both icons and emojis
interface UnifiedCategoryDisplayProps {
  category: Category;
  size?: number;
  className?: string;
  color?: string;
}

export const UnifiedCategoryDisplay: React.FC<UnifiedCategoryDisplayProps> = ({
  category,
  size = 20,
  className = '',
  color,
}) => {
  const [imageError, setImageError] = useState(false);

  // PRIORITY 1: Category image (imageUrl takes highest priority)
  if (category.imageUrl && !imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center overflow-hidden rounded ${className}`}
        style={{ width: size, height: size }}
        title={category.name}
      >
        <Image
          src={category.imageUrl}
          alt={category.name}
          width={size}
          height={size}
          style={{ objectFit: 'cover' }}
          unoptimized={true}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Determine display type for icon/emoji fallback
  const isEmoji = category.displayType === 'emoji' && category.emojiUnicode;
  const hasIcon = category.iconUrl || category.iconName;

  // Parse icon information if we have an icon
  let iconUrl: string | null = null;
  if (hasIcon) {
    if (category.iconUrl) {
      // Check if iconUrl is an external URL (S3, CDN, or any HTTP/HTTPS URL)
      if (category.iconUrl.startsWith('http://') || category.iconUrl.startsWith('https://') || category.iconUrl.startsWith('//')) {
        // External URL - use as is (e.g., S3 Flaticon icons from content generation)
        iconUrl = category.iconUrl.startsWith('//') ? `https:${category.iconUrl}` : category.iconUrl;
      }
      // Check if iconUrl is already a file path (starts with /)
      else if (category.iconUrl.startsWith('/icons/') || category.iconUrl.startsWith('icons/')) {
        // Full or relative path - normalize to lowercase library names
        const normalizedUrl = category.iconUrl
          .replace(/\/icons\/Bootstrap\//i, '/icons/bootstrap/')
          .replace(/\/icons\/Feather\//i, '/icons/feather/')
          .replace(/\/icons\/Heroicons\//i, '/icons/heroicons/')
          .replace(/\/icons\/Iconoir\//i, '/icons/iconoir/')
          .replace(/\/icons\/Lucide\//i, '/icons/lucide/')
          .replace(/\/icons\/Phosphor\//i, '/icons/phosphor/')
          .replace(/\/icons\/Remix\//i, '/icons/remix/')
          .replace(/\/icons\/Tabler\//i, '/icons/tabler/');
        iconUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
      } else if (category.iconUrl.startsWith('/')) {
        // Absolute path but might be incomplete
        iconUrl = category.iconUrl;
      } else if (category.iconUrl.includes('/')) {
        // Has slashes, assume it's a path - normalize library names
        const normalizedUrl = category.iconUrl
          .replace(/Bootstrap\//i, 'bootstrap/')
          .replace(/Feather\//i, 'feather/')
          .replace(/Heroicons\//i, 'heroicons/')
          .replace(/Iconoir\//i, 'iconoir/')
          .replace(/Lucide\//i, 'lucide/')
          .replace(/Phosphor\//i, 'phosphor/')
          .replace(/Remix\//i, 'remix/')
          .replace(/Tabler\//i, 'tabler/');
        iconUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
      } else if (category.iconUrl.includes(':')) {
        // Try to parse as "libraryKey:iconName" format (legacy)
        const parsed = parseIconKey(category.iconUrl);
        if (parsed) {
          iconUrl = `/icons/${parsed.library.toLowerCase()}/${parsed.name}.svg`;
        }
      } else if (category.iconLibrary) {
        // Just a filename with known library - construct full path with lowercase library
        iconUrl = `/icons/${category.iconLibrary.toLowerCase()}/${category.iconUrl}`;
      } else {
        // Just a filename - try to find it in iconoir (most common)
        iconUrl = `/icons/iconoir/${category.iconUrl}`;
      }
    } else if (category.iconName && category.iconLibrary) {
      iconUrl = `/icons/${category.iconLibrary.toLowerCase()}/${category.iconName}.svg`;
    } else if (category.iconName) {
      // Try lucide as default
      iconUrl = `/icons/lucide/${category.iconName}.svg`;
    }
  }

  // EMOJI PATH - render emoji image or fallback
  if (isEmoji) {
    // Normalize emoji source to lowercase (folders are lowercase: openmoji, fluent)
    const emojiSource = (category.emojiSource || 'openmoji').toLowerCase();
    const fileName = `${category.emojiUnicode}.svg`;

    // Build emoji URL, handle both full paths and incomplete paths
    let emojiUrl: string;
    if (category.emojiUrl) {
      // If emojiUrl exists, check if it's a full path or just a filename
      if (category.emojiUrl.startsWith('/emojis/') || category.emojiUrl.startsWith('emojis/')) {
        // Full or relative path - normalize case in path
        const normalizedUrl = category.emojiUrl.replace(/\/emojis\/OpenMoji\//i, '/emojis/openmoji/')
                                                 .replace(/\/emojis\/Fluent\//i, '/emojis/fluent/');
        emojiUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
      } else if (category.emojiUrl.includes('/')) {
        // Contains slashes but might be missing /emojis/ prefix
        const normalizedUrl = category.emojiUrl.replace(/OpenMoji\//i, 'openmoji/')
                                                 .replace(/Fluent\//i, 'fluent/');
        emojiUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
      } else {
        // Just a filename - construct full path with lowercase source
        emojiUrl = `/emojis/${emojiSource}/${category.emojiUrl}`;
      }
    } else {
      // No emojiUrl field - construct from unicode with lowercase source
      emojiUrl = `/emojis/${emojiSource}/${fileName}`;
    }

    // If image failed to load, show unicode fallback
    if (imageError && category.emojiUnicode) {
      try {
        const unicodeEmoji = String.fromCodePoint(parseInt(category.emojiUnicode, 16));
        return (
          <div
            className={`inline-flex items-center justify-center ${className}`}
            style={{
              width: size,
              height: size,
              fontSize: `${size * 0.8}px`,
              lineHeight: '1'
            }}
            title={category.name}
          >
            {unicodeEmoji}
          </div>
        );
      } catch (err) {
        // Invalid unicode - will fall through to Folder icon
      }
    }

    // Render image if not errored yet
    if (!imageError) {
      return (
        <div
          className={`inline-flex items-center justify-center overflow-hidden ${className}`}
          style={{ width: size, height: size }}
          title={category.name}
        >
          <Image
            src={emojiUrl}
            alt={category.name}
            width={size}
            height={size}
            style={{ filter: 'none', objectFit: 'contain' }}
            unoptimized={true}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
  }

  // ICON PATH - render icon image
  if (hasIcon && iconUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size, color: color || 'currentColor' }}
        title={category.name}
      >
        <Image
          src={iconUrl}
          alt={category.name}
          width={size}
          height={size}
          style={{ filter: 'none', objectFit: 'contain' }}
          unoptimized={true}
        />
      </div>
    );
  }

  // FALLBACK - render folder icon
  return (
    <Folder
      size={size}
      className={className}
      style={{ color }}
    />
  );
};

interface LocalCategoryIconProps {
  iconUrl?: string;
  iconName?: string;
  iconLibrary?: string;
  size?: number;
  className?: string;
  color?: string;
}

/**
 * LocalCategoryIcon component that renders icons from our local icon collection
 *
 * Supports multiple formats:
 * - iconUrl: "lucide:arrow-up" (libraryKey:iconName)
 * - iconUrl: "bootstrap:house-door"
 * - iconName + iconLibrary: iconName="arrow-up", iconLibrary="lucide"
 */
export const LocalCategoryIcon: React.FC<LocalCategoryIconProps> = ({
  iconUrl,
  iconName,
  iconLibrary,
  size = 20,
  className = '',
  color,
}) => {
  // Parse icon information
  let resolvedIconName = iconName;
  let resolvedIconLibrary = iconLibrary;
  let iconSrc = '';

  if (iconUrl) {
    // Check if iconUrl is an external URL (S3, CDN, or any HTTP/HTTPS URL)
    if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://') || iconUrl.startsWith('//')) {
      // External URL - use as is (e.g., S3 Flaticon icons from content generation)
      iconSrc = iconUrl.startsWith('//') ? `https:${iconUrl}` : iconUrl;
      // Extract filename for title
      const parts = iconUrl.split('/');
      resolvedIconName = parts[parts.length - 1]?.replace(/\.(svg|png|webp|jpg)$/, '') || iconName || 'icon';
    }
    // Check if iconUrl is already a local file path (starts with /)
    else if (iconUrl.startsWith('/')) {
      iconSrc = iconUrl;
      // Extract name from path for title
      const parts = iconUrl.split('/');
      resolvedIconName = parts[parts.length - 1]?.replace('.svg', '') || iconName;
    } else {
      // Try to parse as "libraryKey:iconName" format (legacy)
      const parsed = parseIconKey(iconUrl);
      if (parsed) {
        resolvedIconLibrary = parsed.library;
        resolvedIconName = parsed.name;
      }
    }
  }

  // Build direct icon URL if not already set (no hooks!)
  if (!iconSrc && resolvedIconName) {
    const library = resolvedIconLibrary || 'lucide'; // Default to lucide
    iconSrc = `/icons/${library}/${resolvedIconName}.svg`;
  }

  if (iconSrc) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, color: color || 'currentColor' }}
        title={resolvedIconName || 'icon'}
      >
        <Image
          src={iconSrc}
          alt={resolvedIconName || 'icon'}
          width={size}
          height={size}
          style={{ filter: 'none' }}
          unoptimized={true}
        />
      </div>
    );
  }

  // Fallback to default folder icon only when there's no icon name at all
  return (
    <Folder
      size={size}
      className={className}
      style={{ color }}
    />
  );
};

// Backward compatibility component that tries local icons first, then falls back to old system
interface CategoryIconProps {
  iconUrl?: string;
  iconName?: string;
  iconLibrary?: string;
  size?: number;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = (props) => {
  // Try local icons first
  const { iconUrl, iconName, iconLibrary } = props;

  // Check if this looks like a local icon format
  const isLocalFormat = iconUrl?.includes(':') && !iconUrl.includes('react-icons');

  if (isLocalFormat || (!iconUrl && iconName && iconLibrary)) {
    return <LocalCategoryIcon {...props} />;
  }

  // Fall back to original CategoryIcon for backward compatibility
  // This will be removed once all icons are migrated to local system
  return <LocalCategoryIcon {...props} />;
};

export default CategoryIcon;