"use client";

import { logger } from '@/lib/logger'

import React, { useState } from "react";
import {
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  DollarSign,
} from "lucide-react";
import BrandSelector from "../ui/BrandSelector";
import { apiService } from "@/lib/api-service";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  children?: Category[];
  productCount?: number;
}

interface ProductFiltersProps {
  categories: Category[];
  brands?: string[];
  onFilterChange: (filters: FilterValues) => void;
  onClose?: () => void;
  isOpen?: boolean;
  horizontal?: boolean;
  apiKey?: string;
  appSecretKey?: string;
}

export interface FilterValues {
  categories: number[];
  brands: string[];
  priceRange: { min?: number; max?: number };
  stockStatus: string[];
  productFlags: string[];
  status: string[];
  dateRange: { start?: Date; end?: Date };
}

export default function ProductFilters({
  categories,
  brands = [],
  onFilterChange,
  onClose,
  isOpen = true,
  horizontal = false,
  apiKey,
  appSecretKey,
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    categories: [],
    brands: [],
    priceRange: {},
    stockStatus: [],
    productFlags: [],
    status: [],
    dateRange: {},
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [currentBrand, setCurrentBrand] = useState("");

  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];

    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBrandAdd = (brand: string) => {
    if (brand.trim() && !filters.brands.includes(brand.trim())) {
      const newBrands = [...filters.brands, brand.trim()];
      const newFilters = { ...filters, brands: newBrands };
      setFilters(newFilters);
      onFilterChange(newFilters);
      setCurrentBrand(''); // Clear the input after adding
    }
  };

  const handleBrandRemove = (brand: string) => {
    const newBrands = filters.brands.filter((b) => b !== brand);
    const newFilters = { ...filters, brands: newBrands };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStockStatusToggle = (status: string) => {
    const newStatuses = filters.stockStatus.includes(status)
      ? filters.stockStatus.filter((s) => s !== status)
      : [...filters.stockStatus, status];

    const newFilters = { ...filters, stockStatus: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleProductFlagToggle = (flag: string) => {
    const newFlags = filters.productFlags.includes(flag)
      ? filters.productFlags.filter((f) => f !== flag)
      : [...filters.productFlags, flag];

    const newFilters = { ...filters, productFlags: newFlags };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    const newFilters = { ...filters, status: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = () => {
    const newFilters = {
      ...filters,
      priceRange: {
        min: priceMin ? parseFloat(priceMin) : undefined,
        max: priceMax ? parseFloat(priceMax) : undefined,
      },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterValues = {
      categories: [],
      brands: [],
      priceRange: {},
      stockStatus: [],
      productFlags: [],
      status: [],
      dateRange: {},
    };
    setFilters(emptyFilters);
    setPriceMin("");
    setPriceMax("");
    setCurrentBrand("");
    onFilterChange(emptyFilters);
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between py-2 hover:bg-gray-50 rounded ${
            level > 0 ? `ml-${level * 4}` : ""
          }`}
          style={{ marginLeft: level > 0 ? `${level * 16}px` : 0 }}
        >
          <label className="flex items-center flex-1 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 mr-2"
              checked={filters.categories.includes(category.id)}
              onChange={() => handleCategoryToggle(category.id)}
            />
            <span className="text-sm text-gray-700">{category.name}</span>
            {category.productCount !== undefined && (
              <span className="ml-2 text-xs text-gray-500">
                ({category.productCount})
              </span>
            )}
          </label>
          {hasChildren && (
            <button
              onClick={() => toggleCategoryExpansion(category.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  // Horizontal layout for filters
  if (horizontal) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllFilters}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              Clear all
            </button>
            {onClose && (
              <button 
                onClick={onClose} 
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Horizontal Filter Groups */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Categories */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Categories</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 mr-1"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <span className="text-gray-700 truncate">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Brands</h4>
            <div className="space-y-2">
              <BrandSelector
                value={currentBrand}
                onChange={(value) => {
                  setCurrentBrand(value);
                  if (value) {
                    handleBrandAdd(value);
                  }
                }}
                onFetchBrands={async (search) => {
                  if (!apiKey || !appSecretKey) return [];
                  try {
                    const response = await apiService.getBrands({ search });
                    if (response.ok && Array.isArray(response.data)) {
                      return response.data;
                    }
                    return [];
                  } catch (error) {
                    logger.error('Failed to fetch brands:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
                    return [];
                  }
                }}
                placeholder="Add brand filter..."
                className="text-xs"
              />
              {/* Selected brands */}
              {filters.brands.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {filters.brands.map((brand) => (
                    <span
                      key={brand}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {brand}
                      <button
                        type="button"
                        onClick={() => handleBrandRemove(brand)}
                        className="ml-1 inline-flex items-center p-0.5 rounded-sm text-blue-400 hover:bg-blue-200 hover:text-orange-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Price Range</h4>
            <div className="space-y-1">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Stock Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Stock</h4>
            <div className="space-y-1">
              {["in_stock", "low_stock", "out_of_stock"].map((status) => (
                <label key={status} className="flex items-center cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 mr-1"
                    checked={filters.stockStatus.includes(status)}
                    onChange={() => handleStockStatusToggle(status)}
                  />
                  <span className="text-gray-700 truncate">
                    {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Flags */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Flags</h4>
            <div className="space-y-1">
              {["featured", "new", "best_seller", "on_sale"].map((flag) => (
                <label key={flag} className="flex items-center cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 mr-1"
                    checked={filters.productFlags.includes(flag)}
                    onChange={() => handleProductFlagToggle(flag)}
                  />
                  <span className="text-gray-700 truncate">
                    {flag === "new" ? "New" : flag === "best_seller" ? "Best Seller" : flag === "on_sale" ? "On Sale" : "Featured"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Status</h4>
            <div className="space-y-1">
              {["active", "draft", "archived"].map((status) => (
                <label key={status} className="flex items-center cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 mr-1"
                    checked={filters.status.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                  />
                  <span className="text-gray-700 truncate">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Apply and Close Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onFilterChange(filters);
                if (onClose) onClose();
              }}
              className="px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original vertical layout
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearAllFilters}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Clear all
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
        <div className="space-y-1">
          {categories.map((category) => renderCategory(category))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Brands</h4>
        <div className="space-y-3">
          <BrandSelector
            value={currentBrand}
            onChange={(value) => {
              setCurrentBrand(value);
              if (value) {
                handleBrandAdd(value);
              }
            }}
            onFetchBrands={async (search) => {
              if (!apiKey || !appSecretKey) return [];
              try {
                const response = await apiService.getBrands({ search });
                if (response.ok && Array.isArray(response.data)) {
                  return response.data;
                }
                return [];
              } catch (error) {
                logger.error('Failed to fetch brands:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
                return [];
              }
            }}
            placeholder="Add brand filter..."
            className="text-sm"
          />
          {/* Selected brands */}
          {filters.brands.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Selected brands:</div>
              <div className="flex flex-wrap gap-2">
                {filters.brands.map((brand) => (
                  <span
                    key={brand}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {brand}
                    <button
                      type="button"
                      onClick={() => handleBrandRemove(brand)}
                      className="ml-2 inline-flex items-center p-0.5 rounded-sm text-blue-400 hover:bg-blue-200 hover:text-orange-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={handlePriceChange}
              className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <span className="text-gray-500">-</span>
          <div className="relative flex-1">
            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={handlePriceChange}
              className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stock Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Stock Status</h4>
        <div className="space-y-2">
          {["in_stock", "low_stock", "out_of_stock"].map((status) => (
            <label key={status} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 mr-2"
                checked={filters.stockStatus.includes(status)}
                onChange={() => handleStockStatusToggle(status)}
              />
              <span className="text-sm text-gray-700">
                {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Flags */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Product Flags</h4>
        <div className="space-y-2">
          {["featured", "new", "best_seller", "on_sale"].map((flag) => (
            <label key={flag} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 mr-2"
                checked={filters.productFlags.includes(flag)}
                onChange={() => handleProductFlagToggle(flag)}
              />
              <span className="text-sm text-gray-700">
                {flag.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
        <div className="space-y-2">
          {["active", "draft", "archived"].map((status) => (
            <label key={status} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 mr-2"
                checked={filters.status.includes(status)}
                onChange={() => handleStatusToggle(status)}
              />
              <span className="text-sm text-gray-700">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={() => onFilterChange(filters)}
        className="w-full py-2 px-4 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
      >
        Apply Filters
      </button>
    </div>
  );
}