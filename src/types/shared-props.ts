/**
 * Shared Component Interfaces Library
 * Consolidates 136+ duplicate interface definitions into reusable patterns
 */

import { ReactNode } from 'react';

// ===== COMMON PATTERNS =====

// Standard size options
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Loading and error states
export interface LoadingState {
  loading?: boolean;
  error?: string | null;
}

// Standard event handlers
export interface StandardHandlers {
  onClick?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  onChange?: (value: any) => void;
}

// API-related props
export interface ApiProps {
  appId: number;
  apiKey?: string;
  appSecretKey?: string;
}

// Base modal props used by most modal components
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

// Standard form props with save/cancel actions
export interface BaseFormModalProps extends BaseModalProps {
  onSave: () => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
}

// Props for modals that work with API data
export interface ApiDataModalProps extends BaseFormModalProps, ApiProps {}

// Standard list item props
export interface BaseListItemProps {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Props for draggable list items
export interface DraggableItemProps extends BaseListItemProps {
  index: number;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
}

// Standard table component props
export interface BaseTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    title: string;
    render?: (value: any, item: T) => ReactNode;
  }>;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
}

// Filter component props
export interface BaseFilterProps {
  onFilterChange: (filters: Record<string, any>) => void;
  filters: Record<string, any>;
  onReset?: () => void;
}

// Pagination props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

// Media upload props
export interface MediaUploadProps {
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  currentUrl?: string;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  preview?: boolean;
  loading?: boolean;
  error?: string;
}

// Search component props
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  loading?: boolean;
}

// Status badge props
export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

// Action button group props
export interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
  disabled?: boolean;
}

// Enhanced loading state props
export interface LoadingStateProps extends LoadingState {
  retry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  skeleton?: boolean;
}

// Confirmation modal props
export interface ConfirmationModalProps extends BaseModalProps {
  onConfirm: () => void;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

// ===== FORM PATTERNS =====

// Standard input props
export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

// Select/dropdown props
export interface SelectProps<T = any> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

// ===== UI COMPONENT PATTERNS =====

// Button props
export interface ButtonProps extends StandardHandlers {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

// Icon props
export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

// Card/container props
export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: Size;
  shadow?: boolean;
  border?: boolean;
}

// ===== DATA DISPLAY PATTERNS =====

// Grid/list item props
export interface GridItemProps {
  id: number | string;
  title: string;
  subtitle?: string;
  image?: string;
  onClick?: () => void;
  selected?: boolean;
}

// Stats/metric display
export interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
}

// ===== HOOK PATTERNS =====

// Standard async operation return
export interface AsyncOperationResult<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// CRUD operations
export interface CrudOperations<T = any> {
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: number | string, data: Partial<T>) => Promise<T | null>;
  delete: (id: number | string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

// ===== SPECIALIZED PATTERNS =====

// Drag and drop
export interface DragDropProps {
  onDrop: (files: FileList) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  accept?: string;
  multiple?: boolean;
}

// Navigation/routing
export interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  items: Array<{
    path: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }>;
}