'use client';

import React from 'react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { Brand } from '@/types/brand.types';

interface DraggableBrandRowProps {
  brand: Brand;
  index: number;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  deleteLoading: number | null;
  isDragDisabled?: boolean;
}

export default function DraggableBrandRow({
  brand,
  index,
  onEdit,
  onDelete,
  deleteLoading,
  isDragDisabled = false,
}: DraggableBrandRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: brand.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'bg-orange-50 shadow-lg' : ''}`}
    >
      {/* Drag Handle Column */}
      <td className="px-4 py-3 w-12">
        {!isDragDisabled ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-move hover:text-gray-700 touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
        ) : (
          <div className="h-5 w-5" />
        )}
      </td>

      {/* Display Order Column */}
      <td className="px-2 py-3 text-center text-sm text-gray-600">
        {index + 1}
      </td>

      {/* Brand Info Column */}
      <td className="px-6 py-4">
        <div className="flex items-center">
          {brand.logoUrl || brand.imageUrl ? (
            <div className="relative h-10 w-10 rounded-lg mr-3">
              <Image
                src={(brand.logoUrl || brand.imageUrl) as string}
                alt={brand.name}
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
          ) : (
            <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {brand.name}
            </div>
            {brand.website && (
              <div className="text-sm text-gray-500">
                {brand.website}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Description Column */}
      <td className="px-6 py-4 text-sm text-gray-600">
        {brand.description || '-'}
      </td>

      {/* Products Count Column */}
      <td className="px-6 py-4 text-sm text-gray-900">
        {brand.productCount || 0}
      </td>

      {/* Status Column */}
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
          ${brand.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'}`}>
          {brand.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEdit(brand)}
            className="text-gray-600 hover:text-orange-600 transition-colors"
            title="Edit brand"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(brand)}
            disabled={deleteLoading === brand.id}
            className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete brand"
          >
            {deleteLoading === brand.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}