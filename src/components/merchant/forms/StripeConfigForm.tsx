'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle, XCircle, TestTube, Eye, EyeOff } from 'lucide-react';

interface StripeConfig {
  configured: boolean;
  environment: 'sandbox' | 'production';
  publishableKey?: string;
  isEnabled?: boolean;
}

interface StripeConfigFormProps {
  appId: number;
}

export function StripeConfigForm({ appId }: StripeConfigFormProps) {
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<StripeConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const { toast } = useToast();

  const loadCurrentConfig = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/proxy/apps/${appId}/configuration/stripe?environment=${environment}`,
        {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
            'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
          },
        }
      );

      if (response.ok) {
        const config: StripeConfig = await response.json();
        setCurrentConfig(config);

        if (config.configured && config.publishableKey) {
          setPublishableKey(config.publishableKey);
          // Don't set secret key from response for security
        }
      }
    } catch (error) {
      logger.error('Failed to load Stripe configuration:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    }
  }, [appId, environment]);

  useEffect(() => {
    loadCurrentConfig();
  }, [loadCurrentConfig]);

  const testConnection = async () => {
    if (!currentConfig?.configured) {
      toast({
        title: 'No Configuration',
        description: 'Please save your Stripe configuration first',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingConnection(true);

    try {
      const response = await fetch(
        `/api/proxy/apps/${appId}/configuration/stripe/test?environment=${environment}`,
        {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
            'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
          },
        }
      );

      const result = await response.json();

      if (result.valid) {
        setConnectionStatus('valid');
        toast({
          title: 'Connection Successful',
          description: 'Stripe configuration is working correctly',
        });
      } else {
        setConnectionStatus('invalid');
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to Stripe',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('invalid');
      toast({
        title: 'Connection Error',
        description: 'Failed to test Stripe connection',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!publishableKey.trim() || !secretKey.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide both publishable key and secret key',
        variant: 'destructive',
      });
      return;
    }

    // Validate key formats
    const expectedPubPrefix = environment === 'sandbox' ? 'pk_test_' : 'pk_live_';
    const expectedSecPrefix = environment === 'sandbox' ? 'sk_test_' : 'sk_live_';

    if (!publishableKey.startsWith(expectedPubPrefix)) {
      toast({
        title: 'Invalid Publishable Key',
        description: `${environment} publishable key should start with ${expectedPubPrefix}`,
        variant: 'destructive',
      });
      return;
    }

    if (!secretKey.startsWith(expectedSecPrefix)) {
      toast({
        title: 'Invalid Secret Key',
        description: `${environment} secret key should start with ${expectedSecPrefix}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/proxy/apps/${appId}/configuration/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
          'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
        },
        body: JSON.stringify({
          publishableKey,
          secretKey,
          webhookSecret: webhookSecret.trim() || undefined,
          environment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }

      const result = await response.json();

      toast({
        title: 'Configuration Saved',
        description: 'Stripe configuration has been saved successfully',
      });

      // Reload current config
      await loadCurrentConfig();

      // Clear secret key field for security
      setSecretKey('');
      setConnectionStatus('unknown');
    } catch (error) {
      logger.error('Save error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentConfig?.configured) return;

    if (!confirm('Are you sure you want to delete this Stripe configuration? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/proxy/apps/${appId}/configuration/stripe?environment=${environment}`,
        {
          method: 'DELETE',
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
            'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete configuration');
      }

      toast({
        title: 'Configuration Deleted',
        description: 'Stripe configuration has been deleted',
      });

      // Reset form
      setPublishableKey('');
      setSecretKey('');
      setWebhookSecret('');
      setCurrentConfig(null);
      setConnectionStatus('unknown');
    } catch (error) {
      logger.error('Delete error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!currentConfig?.configured) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }

    if (connectionStatus === 'valid') {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Working</Badge>;
    }

    if (connectionStatus === 'invalid') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Invalid</Badge>;
    }

    return <Badge variant="outline">Unknown</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Configuration
        </CardTitle>
        <CardDescription>
          Configure Stripe payment processing for your app. You can set up both sandbox (test) and production environments.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Environment Selection */}
        <div className="space-y-2">
          <Label>Environment</Label>
          <div className="flex items-center gap-4">
            <Select value={environment} onValueChange={(value: 'sandbox' | 'production') => setEnvironment(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                <SelectItem value="production">Production (Live)</SelectItem>
              </SelectContent>
            </Select>
            {getStatusBadge()}
          </div>
        </div>

        {/* Current Configuration Status */}
        {currentConfig?.configured && (
          <div className="p-4 bg-orange-50 dark:bg-blue-900/20 border border-orange-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-blue-100">
                  Current Configuration
                </h4>
                <p className="text-sm text-orange-700 dark:text-blue-300">
                  Publishable Key: {currentConfig.publishableKey}
                </p>
                <p className="text-sm text-orange-700 dark:text-blue-300">
                  Status: {currentConfig.isEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={isTestingConnection}
              >
                <TestTube className="w-4 h-4 mr-1" />
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        )}

        {/* Publishable Key */}
        <div className="space-y-2">
          <Label htmlFor="publishable-key">
            Publishable Key
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="publishable-key"
            type="text"
            placeholder={`pk_${environment === 'sandbox' ? 'test' : 'live'}_...`}
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your Stripe publishable key (safe to expose in frontend)
          </p>
        </div>

        {/* Secret Key */}
        <div className="space-y-2">
          <Label htmlFor="secret-key">
            Secret Key
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="secret-key"
              type={showSecretKey ? 'text' : 'password'}
              placeholder={`sk_${environment === 'sandbox' ? 'test' : 'live'}_...`}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowSecretKey(!showSecretKey)}
            >
              {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your Stripe secret key (keep this secure and never expose in frontend)
          </p>
        </div>

        {/* Webhook Secret */}
        <div className="space-y-2">
          <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
          <div className="relative">
            <Input
              id="webhook-secret"
              type={showWebhookSecret ? 'text' : 'password'}
              placeholder="whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
            >
              {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Webhook endpoint secret for secure webhook verification
          </p>
        </div>

        {/* Help Text */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="font-medium mb-2">How to get your Stripe keys:</h4>
          <ol className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <li>1. Go to your <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Stripe Dashboard</a></li>
            <li>2. Navigate to Developers → API keys</li>
            <li>3. Copy your publishable key (starts with pk_) and secret key (starts with sk_)</li>
            <li>4. For webhooks, go to Developers → Webhooks and copy the signing secret</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isLoading || !publishableKey.trim() || !secretKey.trim()}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>

          {currentConfig?.configured && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}