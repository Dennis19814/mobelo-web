/**
 * Global type definitions
 * Extends global interfaces and declares modules
 */

// Extend Window interface for global properties
declare global {
  interface Window {
    html2canvas?: any
    gtag?: (...args: any[]) => void
  }

  // Extend HTMLElement for custom properties
  interface HTMLElement {
    inert?: boolean
  }

  // Global CSS module declarations
  declare module '*.module.css' {
    const classes: { [key: string]: string }
    export default classes
  }

  declare module '*.module.scss' {
    const classes: { [key: string]: string }
    export default classes
  }

  // Image file declarations
  declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
    export default content
  }

  declare module '*.png' {
    const src: string
    export default src
  }

  declare module '*.jpg' {
    const src: string
    export default src
  }

  declare module '*.jpeg' {
    const src: string
    export default src
  }

  declare module '*.gif' {
    const src: string
    export default src
  }

  declare module '*.webp' {
    const src: string
    export default src
  }
}

// React component prop types
export type ComponentProps<T = Record<string, unknown>> = T & {
  className?: string
  children?: React.ReactNode
  id?: string
}

// Safe any type for gradual typing
export type SafeAny = any

// Event handler types
export type EventHandler<T = HTMLElement> = (event: React.SyntheticEvent<T>) => void
export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void
export type ClickHandler = (event: React.MouseEvent) => void
export type SubmitHandler = (event: React.FormEvent) => void

// Async function types
export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>
export type VoidFunction = () => void

// API response types
export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// CSS-in-JS types
export type CSSProperties = React.CSSProperties
export type CSSValue = string | number

// Form types
export type FormField = {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  required?: boolean
  placeholder?: string
  value?: string
}

export type FormErrors = Record<string, string | undefined>

// Navigation types
export type Route = {
  path: string
  label: string
  icon?: React.ComponentType
  exact?: boolean
}

export {}