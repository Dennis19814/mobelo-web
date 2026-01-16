'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2, Tags, Award } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col my-4 relative">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Award className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                {brand ? 'Edit Brand' : 'Add Brand'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm px-3 py-2">
              <p className="text-xs text-red-800">{errors.submit}</p>
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
              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter brand name"
              maxLength={30}
            />
            {errors.name && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website (Optional)
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo (Optional)
            </label>
            {logoPreview ? (
              <div className="space-y-2">
                <div className="relative w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Brand logo"
                    fill
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Logo
                  </div>
                </label>
                {logoFile && (
                  <p className="text-xs text-gray-600 truncate">
                    {logoFile.name}
                  </p>
                )}
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <Upload className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload • Max 5MB</p>
                </div>
              </label>
            )}
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
              Active brand (visible to customers)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{brand ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{brand ? 'Update Brand' : 'Create Brand'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}