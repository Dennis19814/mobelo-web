'use client';

import React from 'react';
import { IconData } from './icon-registry';

interface IconPreviewProps {
  selectedIcon?: IconData;
  className?: string;
  showDetails?: boolean;
}

export const IconPreview: React.FC<IconPreviewProps> = ({
  selectedIcon,
  className = '',
  showDetails = true,
}) => {
  if (!selectedIcon) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Select an icon to preview
        </p>
      </div>
    );
  }

  const IconComponent = selectedIcon.component;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        {/* Large icon preview */}
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 border-2 border-orange-200 rounded-lg flex items-center justify-center">
          <IconComponent size={32} className="text-orange-600" />
        </div>

        {/* Icon details */}
        {showDetails && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedIcon.name}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedIcon.description}
            </p>

            {/* Library and technical info */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Library:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {selectedIcon.library}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Category:</span>
                <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                  {selectedIcon.category}
                </span>
              </div>
            </div>

            {/* Keywords */}
            {selectedIcon.keywords.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Keywords:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedIcon.keywords.slice(0, 6).map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {selectedIcon.keywords.length > 6 && (
                    <span className="inline-block text-gray-400 text-xs px-2 py-1">
                      +{selectedIcon.keywords.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IconPreview;