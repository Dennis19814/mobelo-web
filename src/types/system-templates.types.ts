/**
 * System Templates Types
 *
 * TypeScript types for customizable email and SMS OTP templates
 */

export type TemplateType = 'email_otp' | 'sms_otp';

export interface SystemTemplate {
  id: number;
  appId: number;
  type: TemplateType;
  name: string;
  subject: string | null;
  content: string;
  contentHtml: string | null;
  availableVariables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTemplateDto {
  name?: string;
  subject?: string | null;
  content?: string;
  contentHtml?: string | null;
  availableVariables?: string[];
  isActive?: boolean;
}

export interface PreviewTemplateDto {
  variables?: Record<string, string>;
}

export interface PreviewResponse {
  subject?: string;
  content: string;
  contentHtml?: string;
}

/**
 * Variable descriptor for template editing UI
 */
export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

/**
 * Default variables by template type
 */
export const DEFAULT_TEMPLATE_VARIABLES: Record<TemplateType, TemplateVariable[]> = {
  email_otp: [
    {
      name: 'otp_code',
      description: 'The 6-digit verification code',
      example: '123456',
      required: true,
    },
    {
      name: 'app_name',
      description: 'Name of your application',
      example: 'MyApp',
      required: false,
    },
    {
      name: 'user_name',
      description: 'Name of the user (if available)',
      example: 'John Doe',
      required: false,
    },
    {
      name: 'expiry_minutes',
      description: 'OTP expiration time in minutes',
      example: '15',
      required: false,
    },
    {
      name: 'year',
      description: 'Current year for copyright notices',
      example: '2025',
      required: false,
    },
  ],
  sms_otp: [
    {
      name: 'otp_code',
      description: 'The 6-digit verification code',
      example: '123456',
      required: true,
    },
    {
      name: 'app_name',
      description: 'Name of your application',
      example: 'MyApp',
      required: false,
    },
    {
      name: 'expiry_minutes',
      description: 'OTP expiration time in minutes',
      example: '15',
      required: false,
    },
  ],
};

/**
 * Template type metadata for UI display
 */
export interface TemplateTypeMetadata {
  type: TemplateType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const TEMPLATE_TYPE_METADATA: Record<TemplateType, TemplateTypeMetadata> = {
  email_otp: {
    type: 'email_otp',
    label: 'Email OTP',
    description: 'Verification code sent via email',
    icon: 'Mail',
    color: 'blue',
  },
  sms_otp: {
    type: 'sms_otp',
    label: 'SMS OTP',
    description: 'Verification code sent via text message',
    icon: 'MessageSquare',
    color: 'green',
  },
};
