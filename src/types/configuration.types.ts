export interface AppConfiguration {
  id: number;
  appId: number;
  configType: 'social_auth' | 'payment' | 'sms' | 'email' | 'general';
  provider: 'google' | 'facebook' | 'instagram' | 'apple' | 'stripe' | 'twilio' | 'brevo' | 'sendgrid' | 'mailgun' | 'smtp';
  clientId?: string;
  clientSecret?: string; // Full decrypted secret from backend
  clientSecretMasked?: string;
  scopes: string[];
  settings: Record<string, any>;
  isEnabled: boolean;
  environment: 'sandbox' | 'production';
  webhookUrl?: string;
  callbackUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppConfigDto {
  configType: 'social_auth' | 'payment' | 'sms' | 'email' | 'general';
  provider: 'google' | 'facebook' | 'instagram' | 'apple' | 'stripe' | 'twilio' | 'brevo' | 'sendgrid' | 'mailgun' | 'smtp';
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  settings?: Record<string, any>;
  isEnabled?: boolean;
  environment?: 'sandbox' | 'production';
  webhookUrl?: string;
  callbackUrl?: string;
}

export interface UpdateAppConfigDto {
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  settings?: Record<string, any>;
  isEnabled?: boolean;
  webhookUrl?: string;
  callbackUrl?: string;
}

export interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  scopes: string[];
  docs: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
  webhookUrl?: string;
  environment: 'sandbox' | 'production';
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  environment: 'sandbox' | 'production';
}

export interface EmailConfig {
  provider: 'brevo' | 'sendgrid' | 'mailgun' | 'smtp';
  apiKey: string;
  senderName: string;
  senderEmail: string;
  domain?: string; // For Mailgun only
  environment: 'sandbox' | 'production';
}