export interface Category {
  id: number;
  appId: number;
  parentId?: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  iconName: string;
  iconLibrary: string;
  emojiUnicode?: string;
  emojiShortcode?: string;
  emojiSource?: string;
  displayType: 'icon' | 'emoji';
  displayOrder: number;
  isActive: boolean;
  path?: string;
  level: number;
  productCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Relations
  parent?: Category;
  children?: Category[];
}

export interface CategoryWithHierarchy extends Category {
  siblingPosition: number; // Position among siblings at same level
  hierarchicalDisplayOrder: string; // "1", "1.1", "1.2.1", etc.
  isExpanded?: boolean; // For UI state management
  hasChildren: boolean;
}

export interface CreateCategoryDto {
  appId: number;
  parentId?: number;
  name: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: number;
  metadata?: Record<string, any>;
}

export interface CategoriesResponse {
  data: Category[];
  total: number;
  page?: number;
  limit?: number;
}

export interface CategoryReorderRequest {
  parentId?: number; // Scope reordering to this parent level (null for root level)
  categories: Array<{
    id: number;
    displayOrder: number;
  }>;
}

export interface CategoryReorderData {
  id: number;
  displayOrder: number;
}

// Helper type for drag and drop operations
export interface CategoryDragItem {
  id: number;
  type: 'category';
  category: CategoryWithHierarchy;
}

// Type for valid drop targets during drag operations
export interface CategoryDropTarget {
  id: number;
  parentId?: number;
  level: number;
  canAccept: (dragItem: CategoryDragItem) => boolean;
}