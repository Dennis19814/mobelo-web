'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { CategoryWithHierarchy } from '@/types/category.types';
import { UnifiedCategoryDisplay } from '@/components/ui/icons/LocalCategoryIcon';

interface DraggableHierarchicalCategoryRowProps {
  category: CategoryWithHierarchy;
  index: number;
  onEdit: (category: CategoryWithHierarchy) => void;
  onDelete: (category: CategoryWithHierarchy) => void;
  onToggleExpand?: (category: CategoryWithHierarchy) => void;
  deleteLoading: number | null;
  isDragDisabled?: boolean;
  showHierarchy?: boolean;
}

export default function DraggableHierarchicalCategoryRow({
  category,
  index,
  onEdit,
  onDelete,
  onToggleExpand,
  deleteLoading,
  isDragDisabled = false,
  showHierarchy = true,
}: DraggableHierarchicalCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled: isDragDisabled,
    data: {
      type: 'category',
      category,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate indentation based on hierarchy level
  const indentationLevel = showHierarchy ? category.level : 0;
  const indentationPx = indentationLevel * 24; // 24px per level

  // Generate hierarchical display order (1, 1.1, 1.2.1, etc.)
  const displayOrder = category.hierarchicalDisplayOrder || `${index + 1}`;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-gray-50/50 transition-colors ${isDragging ? 'bg-orange-50 shadow-lg z-50' : ''} ${
        indentationLevel > 0 ? 'relative' : ''
      }`}
    >

      {/* Drag Handle Column */}
      <td className="px-2 md:px-4 py-4 w-8 md:w-12">
        {!isDragDisabled ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-move hover:text-gray-700 touch-none opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag to reorder within same level"
          >
            <GripVertical className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </button>
        ) : (
          <div className="h-4 w-4 md:h-5 md:w-5" />
        )}
      </td>

      {/* Hierarchical Display Order Column - Only show whole numbers (parent categories) */}
      <td className="hidden lg:table-cell px-2 py-4 text-center">
        {!displayOrder.includes('.') && (
          <span className="text-sm text-gray-600 font-mono">
            {displayOrder}
          </span>
        )}
      </td>

      {/* Category Info Column with Hierarchy */}
      <td className="px-2 md:px-4 lg:px-6 py-4 relative">
        {/* Visual Hierarchy Connector for Subcategories - Thin light orange vertical line */}
        {indentationLevel > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-200 pointer-events-none"
            style={{ left: `${indentationPx - 12}px` }}
          />
        )}
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${indentationPx}px` }}
        >
          {/* Hierarchy Toggle for Categories with Children */}
          {showHierarchy && category.hasChildren && onToggleExpand && (
            <button
              onClick={() => onToggleExpand(category)}
              className="flex-shrink-0 hover:bg-orange-50 rounded transition-colors flex items-center justify-center h-6 w-6"
              title={category.isExpanded ? 'Collapse children' : 'Expand children'}
            >
              {category.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-orange-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-orange-600" />
              )}
            </button>
          )}

          {/* Spacer when no toggle button */}
          {(!showHierarchy || !category.hasChildren || !onToggleExpand) && (
            <div className="w-6" />
          )}

          {/* Category Icon/Emoji Display - Light grey rounded square border */}
          <div className="flex-shrink-0 flex items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 p-1.5">
            <UnifiedCategoryDisplay
              category={category}
              size={24}
              className="h-6 w-6"
            />
          </div>

          {/* Category Name and Description */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {category.name}
            </div>
            {/* Show description below name - truncated with ellipsis */}
            {category.description && (
              <div className="text-xs text-gray-500 mt-0.5 truncate" title={category.description}>
                {category.description.length > 15 
                  ? `${category.description.substring(0, 15)}...` 
                  : category.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Products Count Column - Hidden on tablets and below */}
      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 text-center">
        <span className="text-sm text-gray-900">{category.productCount || 0}</span>
      </td>

      {/* Status Column - Hidden on mobile */}
      <td className="hidden md:table-cell px-3 md:px-4 lg:px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full
          ${category.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            category.isActive ? 'bg-green-600' : 'bg-gray-400'
          }`}></span>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Actions Column - Always visible */}
      <td className="px-2 md:px-4 lg:px-6 py-4 text-right">
        <div className="flex justify-end space-x-1 md:space-x-2">
          <button
            onClick={() => onEdit(category)}
            className="text-gray-600 hover:text-orange-600 transition-colors p-1.5 rounded hover:bg-orange-50"
            title="Edit category"
          >
            <Pencil className="h-4 w-4 md:h-4 md:w-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            disabled={deleteLoading === category.id || category.hasChildren}
            className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1.5 rounded hover:bg-red-50"
            title={category.hasChildren ? "Cannot delete category with children" : "Delete category"}
          >
            {deleteLoading === category.id ? (
              <Loader2 className="h-4 w-4 md:h-4 md:w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 md:h-4 md:w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}