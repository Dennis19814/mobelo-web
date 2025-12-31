'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2 } from 'lucide-react';
import { Brand, CreateBrandDto, UpdateBrandDto } from '@/types/brand.types';
import { ApiDataModalProps } from '@/types/shared-props';

interface BrandModalProps extends ApiDataModalProps {
  brand?: Brand | null;
}

export default function BrandModal({ isOpen, onClose, onSave, brand, appId, apiKey, appSecretKey }: BrandModalProps) {
  const [formData, setFormData] = useState<CreateBrandDto | UpdateBrandDto>({
    name: '',
    description: '',
    website: '',
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
        website: brand.website || '',
        isActive: brand.isActive,
      });
      setLogoPreview(brand.logoUrl || brand.imageUrl || '');
    } else {
      setFormData({
        name: '',
        description: '',
        website: '',
        isActive: true,
      });
      setLogoPreview('');
    }
    setLogoFile(null);
    setErrors({});
  }, [brand, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Brand name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Use props first, fallback to localStorage
      const userApiKey = apiKey || localStorage.getItem('userApiKey') || '';
      const finalAppSecretKey = appSecretKey || localStorage.getItem('appSecretKey') || '';

      logger.debug('BrandModal - API keys used:', {
        source: apiKey && appSecretKey ? 'props' : 'localStorage fallback',
        userApiKey: userApiKey ? `${userApiKey.substring(0, 10)}...` : 'Missing',
        appSecretKey: finalAppSecretKey ? `${finalAppSecretKey.substring(0, 15)}...` : 'Missing'
      });

      if (!userApiKey || !finalAppSecretKey) {
        throw new Error('Authentication credentials are missing. Please refresh the page and try again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': userApiKey,
        'x-app-secret': finalAppSecretKey,
      };

      let brandId = brand?.id;

      if (brand) {
        // Update existing brand - filter out empty optional fields
        const updateData: any = {
          name: formData.name,
          isActive: formData.isActive,
        };

        // Only include optional fields if they have values
        if (formData.description && formData.description.trim()) {
          updateData.description = formData.description;
        }
        if (formData.website && formData.website.trim()) {
          updateData.website = formData.website;
        }

        logger.debug(`Updating brand ${brand.id}:`, { value: updateData });

        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const response = await fetch(`/api/proxy/v1/merchant/brands/${brand.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateData),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update brand' }));
            throw new Error(errorData.message || errorData.error || 'Failed to update brand');
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            throw new Error('Request timeout - the server is not responding. Please try again.');
          }
          throw err;
        }
      } else {
        // Create new brand - filter out empty optional fields
        const createData: any = {
          name: formData.name,
          isActive: formData.isActive,
        };

        // Only include optional fields if they have values
        if (formData.description && formData.description.trim()) {
          createData.description = formData.description;
        }
        if (formData.website && formData.website.trim()) {
          createData.website = formData.website;
        }

        logger.debug('Creating brand:', { value: createData });

        const response = await fetch('/api/proxy/v1/merchant/brands', {
          method: 'POST',
          headers,
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Brand creation failed:', { value: errorData });
          throw new Error(errorData.message || 'Failed to create brand');
        }

        const result = await response.json();
        brandId = result.id;
      }

      // Upload logo if selected
      if (logoFile && brandId) {
        logger.debug(`Uploading logo for brand ${brandId}`);
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);

        // Add timeout for logo upload
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file upload

        try {
          const logoResponse = await fetch(`/api/proxy/v1/merchant/brands/${brandId}/logo`, {
            method: 'POST',
            headers: {
              'x-api-key': userApiKey,
              'x-app-secret': finalAppSecretKey,
            },
            body: logoFormData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!logoResponse.ok) {
            const errorText = await logoResponse.text();
            logger.error('Failed to upload logo:', { value: errorText });
            // Don't throw here - brand was created/updated successfully, just logo failed
            logger.warn('Brand saved but logo upload failed. You can try uploading the logo again.');
          } else {
            logger.debug('Logo uploaded successfully');
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            logger.error('Logo upload timeout');
            // Don't throw - brand was saved, just logo failed
            logger.warn('Brand saved but logo upload timed out. You can try uploading the logo again.');
          } else {
            logger.error('Logo upload error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
          }
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      logger.error('Error saving brand:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      const errorMessage = error.message || 'Failed to save brand. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {brand ? 'Edit Brand' : 'Create New Brand'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-1.5 text-sm border rounded-lg text-gray-900 bg-white
                ${errors.name ? 'border-red-500' : 'border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter brand name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter brand description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="flex items-start space-x-3">
              {logoPreview && (
                <div className="relative w-20 h-20 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={logoPreview}
                    alt="Brand logo"
                    fill
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col space-y-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </div>
                </label>
                {logoFile && (
                  <span className="text-xs text-gray-600 truncate">
                    {logoFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-orange-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {brand ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}