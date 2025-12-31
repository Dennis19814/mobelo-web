'use client';

import React from 'react';
import { Folder } from 'lucide-react';
import { getIconByName, ICON_REGISTRY } from './icon-registry';

interface CategoryIconProps {
  iconUrl?: string;
  iconName?: string;
  iconLibrary?: string;
  size?: number;
  className?: string;
  color?: string;
}

/**
 * CategoryIcon component that renders icons based on iconUrl or iconName/iconLibrary
 *
 * Supports multiple formats:
 * - iconUrl: "react-icons:fa:FaShoppingCart"
 * - iconUrl: "lucide-react:ShoppingCart"
 * - iconName + iconLibrary: iconName="FaShoppingCart", iconLibrary="react-icons/fa"
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
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

  if (iconUrl) {
    const parts = iconUrl.split(':');
    if (parts.length >= 3) {
      // Format: "react-icons:fa:FaShoppingCart"
      resolvedIconLibrary = `${parts[0]}/${parts[1]}`;
      resolvedIconName = parts[2];
    } else if (parts.length === 2) {
      // Format: "lucide-react:ShoppingCart"
      resolvedIconLibrary = parts[0];
      resolvedIconName = parts[1];
    }
  }

  // Find icon in registry
  const iconData = ICON_REGISTRY.find(icon => {
    if (resolvedIconName) {
      // Try to match by component name (e.g., "FaShoppingCart")
      const componentName = icon.component.name;
      if (componentName === resolvedIconName) {
        return true;
      }

      // Try to match by icon name (e.g., "Shopping Cart")
      if (icon.name === resolvedIconName) {
        return true;
      }
    }

    return false;
  });

  if (iconData) {
    const IconComponent = iconData.component;
    return (
      <IconComponent
        size={size}
        className={className}
        style={{ color }}
        title={iconData.description}
      />
    );
  }

  // Fallback to default folder icon
  return (
    <Folder
      size={size}
      className={className}
      style={{ color }}
    />
  );
};

export default CategoryIcon;