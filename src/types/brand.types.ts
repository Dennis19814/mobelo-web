export interface Brand {
  id: number;
  appId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateBrandDto {
  appId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateBrandDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface BrandsResponse {
  data: Brand[];
  total: number;
  page: number;
  limit: number;
}