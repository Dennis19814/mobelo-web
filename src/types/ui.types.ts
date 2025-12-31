/**
 * UI-related type definitions
 */

// Common UI Types
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type InputSize = 'sm' | 'md' | 'lg'
export type AlertType = 'success' | 'error' | 'warning' | 'info'

// Modal Types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

// Form Types
export interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

// Loading States
export interface LoadingState {
  isLoading: boolean
  error?: string | null
  data?: any
}

// Toast/Notification Types
export interface Toast {
  id: string
  type: AlertType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Theme Types
export interface Theme {
  colors: {
    primary: string
    secondary: string
    success: string
    danger: string
    warning: string
    info: string
    light: string
    dark: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
  }
  fonts: {
    primary: string
    secondary: string
    mono: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  breakpoints: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// Component State Types
export interface ComponentState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T
  title: string
  render?: (value: any, record: T) => React.ReactNode
  sortable?: boolean
  width?: string | number
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowKey?: keyof T | ((record: T) => string)
}

// Navigation Types
export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<any>
  active?: boolean
  disabled?: boolean
  children?: NavItem[]
}

// Sidebar Types
export interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  items: NavItem[]
  title?: string
}

// Card Types
export interface CardProps {
  title?: string
  subtitle?: string
  image?: string
  actions?: React.ReactNode
  className?: string
  hoverable?: boolean
  loading?: boolean
}

// Badge Types
export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

// Dropdown Types
export interface DropdownItem {
  id: string
  label: string
  icon?: React.ComponentType<any>
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
}

export interface DropdownProps {
  items: DropdownItem[]
  trigger: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

// Pagination Types
export interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
}

// Search Types
export interface SearchProps {
  placeholder?: string
  onSearch: (value: string) => void
  loading?: boolean
  allowClear?: boolean
  size?: InputSize
}