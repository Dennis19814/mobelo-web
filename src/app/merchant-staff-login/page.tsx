'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { apiService } from '@/lib/api-service';
import { clearOwnerAuthData } from '@/lib/auth-utils';
import { hashId } from '@/lib/url-hash';

/**
 * Merchant Staff Login Page
 *
 * This page handles staff authentication with OTP verification.
 * Staff members need to provide:
 * 1. App identifier (app_name, app_id, or domain)
 * 2. Email or phone number
 * 3. OTP code (received via email/SMS)
 *
 * Authentication Flow:
 * 1. Staff enters app identifier + email/phone → Send OTP
 * 2. Staff enters OTP code → Verify OTP
 * 3. Receive JWT tokens → Store in localStorage
 * 4. Redirect to merchant panel for their app
 */
function MerchantStaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams();

  // Form state
  const [appIdentifier, setAppIdentifier] = useState('');
  const [appName, setAppName] = useState<string | null>(null);
  const [appResolved, setAppResolved] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-detect app identifier from URL (?appId=15 or /merchant-staff-login/15)
  useEffect(() => {
    const qpId = searchParams?.get('appId') || searchParams?.get('id') || searchParams?.get('app');
    const pathId = (routeParams as any)?.id as string | undefined;
    const resolvedId = qpId || pathId;

    if (!resolvedId) {
      setAppResolved(true);
      return;
    }

    setAppIdentifier(resolvedId);

    (async () => {
      try {
        const resp = await apiService.getPublicAppSummary(resolvedId);
        if (resp.ok && resp.data?.app_name) {
          setAppName(resp.data.app_name);
        }
      } catch {
        // ignore
      } finally {
        setAppResolved(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Step 1: Send OTP to staff member
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await apiService.sendStaffOtp({
        appIdentifier,
        identifier,
      });

      if (response.ok) {
        setSuccessMessage('OTP sent successfully! Check your email/phone.');
        setStep('otp');
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          setError('App not found. Please check your app identifier.');
        } else if (response.status === 401) {
          setError(response.data?.message || 'Staff user not found. Please contact your administrator.');
        } else if (response.status === 504 || response.status === 408) {
          setError('Request timed out. Please check your internet connection and try again.');
        } else {
          setError(response.data?.message || 'Failed to send OTP. Please check your details.');
        }
      }
    } catch (err: any) {
      console.error('Send OTP Error:', err);

      // Handle network errors
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP and authenticate
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await apiService.verifyStaffOtp({
        appIdentifier,
        identifier,
        code: otpCode,
      });

      if (response.ok && response.data) {
        // Clear any existing owner auth data to prevent conflicts
        clearOwnerAuthData();

        // Store JWT tokens in localStorage
        localStorage.setItem('staff_access_token', response.data.access_token);
        localStorage.setItem('staff_refresh_token', response.data.refresh_token);

        // Store staff user info
        localStorage.setItem('staff_user', JSON.stringify(response.data.staff));
        localStorage.setItem('staff_app', JSON.stringify(response.data.app));

        setSuccessMessage('Login successful! Redirecting...');

        // Redirect to merchant panel with page reload to ensure fresh state
        const hashedId = hashId(response.data.app.id);
        window.location.href = `/merchant-panel/${hashedId}`;
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          setError(response.data?.message || 'Invalid or expired OTP code. Please try again.');
        } else if (response.status === 404) {
          setError('App not found. Please check your app identifier.');
        } else if (response.status === 504 || response.status === 408) {
          setError('Request timed out. Please try again.');
        } else {
          setError(response.data?.message || 'Failed to verify OTP. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Verify OTP Error:', err);

      // Handle network errors
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else if (err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Go back to identifier step
   */
  const handleBack = () => {
    setStep('identifier');
    setOtpCode('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Staff Login
          </h1>
          <div className="text-gray-600">
            {appResolved && (appName || appIdentifier) && (
              <div className="mb-2">
                <span className="text-sm text-gray-500">App</span>
                <div className="text-lg font-semibold text-gray-900">
                  {appName ? appName : `App #${appIdentifier}`}
                </div>
              </div>
            )}
            <p>
              {step === 'identifier'
                ? 'Enter your email or phone to receive OTP'
                : 'Enter the OTP code sent to your email/phone'}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Step 1: Identifier Form */}
          {step === 'identifier' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              {!(appResolved && appIdentifier) && (
                <div>
                  <label htmlFor="appIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                    App Identifier *
                  </label>
                  <input
                    type="text"
                    id="appIdentifier"
                    value={appIdentifier}
                    onChange={(e) => setAppIdentifier(e.target.value)}
                    placeholder="App name, ID, or domain"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    e.g., "My Store", "123", or "mystore.com"
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Phone *
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com or +1234567890"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code *
                </label>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Code expires in 15 minutes
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('identifier');
                    handleSendOtp(new Event('submit') as any);
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MerchantStaffLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MerchantStaffLoginContent />
    </Suspense>
  );
}
