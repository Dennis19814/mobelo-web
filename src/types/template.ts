export type TemplateType = 'email_otp' | 'sms_otp';

export interface Template {
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

export const TEMPLATE_VARIABLES = {
  email_otp: [
    { key: 'otp_code', label: 'OTP Code', required: true },
    { key: 'app_name', label: 'App Name', required: false },
    { key: 'user_name', label: 'User Name', required: false },
    { key: 'expiry_minutes', label: 'Expiry Minutes', required: false },
    { key: 'year', label: 'Current Year', required: false },
  ],
  sms_otp: [
    { key: 'otp_code', label: 'OTP Code', required: true },
    { key: 'app_name', label: 'App Name', required: false },
    { key: 'expiry_minutes', label: 'Expiry Minutes', required: false },
  ],
};

export const DEFAULT_EMAIL_TEMPLATE = `Hi {{user_name}},

Your verification code for {{app_name}} is:

{{otp_code}}

This code will expire in {{expiry_minutes}} minutes.

If you didn't request this code, please ignore this email.

Thanks,
The {{app_name}} Team

© {{year}} {{app_name}}. All rights reserved.`;

export const DEFAULT_SMS_TEMPLATE = `Your {{app_name}} verification code is {{otp_code}}. Valid for {{expiry_minutes}} minutes.`;

export const DEFAULT_EMAIL_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">Verification Code</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                Hi {{user_name}},
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                Your verification code for <strong>{{app_name}}</strong> is:
              </p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding: 0 40px 30px;">
              <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; display: inline-block;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; font-family: 'Courier New', monospace;">{{otp_code}}</span>
              </div>
            </td>
          </tr>

          <!-- Footer Info -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                This code will expire in <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.5;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #e5e7eb; margin: 20px 0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Thanks,<br>
                The <strong>{{app_name}}</strong> Team
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
