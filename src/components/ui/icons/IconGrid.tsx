'use client';

import React from 'react';
import { IconData } from './icon-registry';

interface IconGridProps {
  icons: IconData[];
  selectedIcon?: IconData;
  onSelect: (icon: IconData) => void;
  className?: string;
  iconSize?: number;
  columns?: number;
}

export const IconGrid: React.FC<IconGridProps> = ({
  icons,
  selectedIcon,
  onSelect,
  className = '',
  iconSize = 24,
  columns = 8,
}) => {
  if (icons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No icons found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or category filter</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        className="grid gap-2 p-4 max-h-96 overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {icons.map((icon, index) => {
          const IconComponent = icon.component;
          const isSelected = selectedIcon?.name === icon.name;

          return (
            <button
              key={`${icon.name}-${index}`}
              onClick={() => onSelect(icon)}
              className={`
                group relative p-3 rounded-lg border-2 transition-all duration-200
                hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isSelected
                  ? 'border-blue-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
              title={`${icon.name} - ${icon.description}`}
            >
              <div className="flex flex-col items-center space-y-1">
                <IconComponent
                  size={iconSize}
                  className={`transition-colors ${
                    isSelected
                      ? 'text-orange-600'
                      : 'text-gray-600 group-hover:text-gray-800'
                  }`}
                />
                <span className={`text-xs font-medium truncate w-full text-center ${
                  isSelected ? 'text-orange-700' : 'text-gray-500 group-hover:text-gray-700'
                }`}>
                  {icon.name.length > 12 ? `${icon.name.substring(0, 12)}...` : icon.name}
                </span>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1
                            bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100
                            transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {icon.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0
                              border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer with icon count */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-sm text-gray-600">
        {icons.length} icon{icons.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
};

export default IconGrid;