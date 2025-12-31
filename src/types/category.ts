export interface Category {
  id: number;
  appId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  iconName: string;
  iconLibrary: string;
  // Emoji support
  emojiUnicode?: string;       // "1F600"
  emojiShortcode?: string;     // ":grinning:"
  emojiSource?: string;        // "openmoji"
  emojiUrl?: string;           // Full path or filename: "/emojis/openmoji/1F600.svg" or "1F600.svg"
  displayType: 'icon' | 'emoji';  // What to display
  parentId?: number;
  displayOrder: number;
  isActive: boolean;
  path?: string;
  level: number;
  productCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Category;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  iconName: string;
  iconLibrary: string;
  iconUrl: string;
  // Emoji support
  emojiUnicode?: string;
  emojiShortcode?: string;
  emojiSource?: string;
  emojiUrl?: string;
  displayType: 'icon' | 'emoji';
  appId: number;
  parentId?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  iconName?: string;
  iconLibrary?: string;
  iconUrl?: string;
  // Emoji support
  emojiUnicode?: string;
  emojiShortcode?: string;
  emojiSource?: string;
  emojiUrl?: string;
  displayType?: 'icon' | 'emoji';
  parentId?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryReorderData {
  id: number;
  displayOrder: number;
}

export interface CategoryApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}