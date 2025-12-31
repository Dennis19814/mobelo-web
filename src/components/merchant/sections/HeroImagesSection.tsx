'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, GripVertical, X, CheckCircle, XCircle, ImageIcon } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';

interface HeroImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HeroImagesSectionProps {
  appId: number;
}

export const HeroImagesSection = ({ appId }: HeroImagesSectionProps) => {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load hero images
  useEffect(() => {
    loadHeroImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const loadHeroImages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHeroImages(appId);

      if (response.ok && response.data) {
        setHeroImages(response.data);
      }
    } catch (err) {
      setError('Failed to load hero images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate file count
    if (fileArray.length > 10) {
      setError('Maximum 10 images can be uploaded at once');
      return;
    }

    if (heroImages.length + fileArray.length > 10) {
      setError(`Cannot upload ${fileArray.length} images. Maximum 10 images allowed (current: ${heroImages.length})`);
      return;
    }

    // Validate file sizes and types
    const invalidFiles = fileArray.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return !isValidType || !isValidSize;
    });

    if (invalidFiles.length > 0) {
      setError('Some files are invalid. Please upload JPEG, PNG, or WebP images under 5MB.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setUploading(true);

    try {
      const response = await apiService.uploadHeroImages(appId, fileArray);

      if (response.ok && response.data) {
        setSuccessMessage(`Successfully uploaded ${fileArray.length} image(s)`);
        await loadHeroImages();

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data?.message || 'Failed to upload images');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (imageId: number) => {
    setImageToDelete(imageId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      setError(null);
      const response = await apiService.deleteHeroImage(imageToDelete, appId);

      if (response.ok) {
        setSuccessMessage('Hero image deleted successfully');
        await loadHeroImages();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to delete image');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
      console.error(err);
    } finally {
      setImageToDelete(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reorderedImages = [...heroImages];
    const [movedImage] = reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, movedImage);

    // Update display orders
    const orders = reorderedImages.map((img, idx) => ({
      id: img.id,
      displayOrder: idx
    }));

    // Optimistically update UI
    setHeroImages(reorderedImages);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      console.log('Reordering images:', orders);
      const response = await apiService.reorderHeroImages(appId, orders);
      console.log('Reorder response:', response);

      if (response.ok) {
        setSuccessMessage('Images reordered successfully');
        // Reload from backend to confirm persistence
        await loadHeroImages();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Revert on error
        await loadHeroImages();
        setError('Failed to reorder images');
        console.error('Reorder failed:', response);
      }
    } catch (err: any) {
      await loadHeroImages();
      setError(err.message || 'Failed to reorder images');
      console.error('Reorder error:', err);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Hero Images</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload images to display in the mobile app home screen slider. Max 10 images. Drag to reorder.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mb-6">
        <label className="cursor-pointer inline-block">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || heroImages.length >= 10}
            className="hidden"
          />
          <div className={`
            flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg
            hover:bg-orange-700 transition-colors w-fit
            ${(uploading || heroImages.length >= 10) ? 'bg-gray-400 cursor-not-allowed' : 'cursor-pointer'}
          `}>
            <Upload className="w-5 h-5 mr-2" />
            {uploading ? 'Uploading...' : `Upload Images (${heroImages.length}/10)`}
          </div>
        </label>
        <div className="mt-2 text-xs text-gray-500">
          <p>• Supported formats: JPEG, PNG, WebP</p>
          <p>• Maximum file size: 5MB per image</p>
          <p>• Images will be optimized to 1200px width</p>
          <p>• Up to 10 images can be uploaded at once</p>
        </div>
      </div>

      {/* Hero Images Grid */}
      {heroImages.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No hero images uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload images to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {heroImages.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                relative group border-2 rounded-lg p-2 transition-all cursor-move
                ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                ${dragOverIndex === index ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
                hover:border-gray-300
              `}
            >
              {/* Drag Handle */}
              <div className="absolute top-1 left-1 text-gray-400 group-hover:text-gray-600 z-10">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Image - 70% smaller than original */}
              <div className="relative overflow-hidden rounded bg-gray-100 h-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.imageUrl}
                  alt={`Hero image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteClick(image.id)}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full
                         hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Delete image"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {/* Order Badge */}
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black bg-opacity-60
                           text-white text-xs rounded z-10">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Hero Image"
        message="Are you sure you want to delete this hero image? This action cannot be undone and the image will be removed from your mobile app."
        itemType="hero image"
        confirmButtonText="Delete Image"
      />
    </div>
  );
};
