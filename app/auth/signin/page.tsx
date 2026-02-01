'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { Shield, Loader2, Package, ChevronDown, Copy, Check, AlertTriangle, Users, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { getAdminConsentUrl } from '@/lib/msal-config';
import { markOnboardingComplete, clearOnboardingCache } from '@/lib/onboarding-utils';
import { trackSigninClick } from '@/hooks/useLandingStats';
import { GradientOrb } from '@/components/landing/ui/GradientOrb';
import { GridBackground } from '@/components/landing/ui/GridBackground';
import { FadeIn } from '@/components/landing/animations/FadeIn';

// Microsoft logo SVG component
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function SignInContent() {
  const { isAuthenticated, signIn, getAccessToken } = useMicrosoftAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isVerifyingConsent, setIsVerifyingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConsentSectionOpen, setIsConsentSectionOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const consentUrl = typeof window !== 'undefined' ? getAdminConsentUrl() : '';

  const handleCopyConsentUrl = async () => {
    try {
      await navigator.clipboard.writeText(consentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Verify consent status via API (server-side check)
   * Returns true if consent is granted and permissions are valid
   */
  const verifyConsentStatus = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      if (!token) return false;

      const response = await fetch('/api/auth/verify-consent', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return false;

      const result = await response.json();
      return result.verified === true;
    } catch {
      return false;
    }
  }, [getAccessToken]);

  // Redirect based on ACTUAL consent status (server-verified, not localStorage)
  // This ensures users with revoked/incomplete consent are sent to onboarding
  useEffect(() => {
    if (isAuthenticated && !isVerifyingConsent) {
      setIsVerifyingConsent(true);

      verifyConsentStatus().then((isVerified) => {
        if (isVerified) {
          // Consent verified - update cache and go to dashboard
          markOnboardingComplete();
          router.push(callbackUrl);
        } else {
          // Consent not granted or incomplete - clear stale cache and go to onboarding
          clearOnboardingCache();
          router.push('/onboarding');
        }
      });
    }
  }, [isAuthenticated, router, callbackUrl, verifyConsentStatus, isVerifyingConsent]);

  const handleSignIn = async () => {
    // Track signin click (fire-and-forget)
    trackSigninClick();

    setIsSigningIn(true);
    setError(null);
    try {
      const success = await signIn();
      if (!success) {
        setError('Sign in was cancelled or failed. Please try again.');
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Show loading state while checking auth or verifying consent
  if (isAuthenticated || isVerifyingConsent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-deepest">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
          <p className="text-stone-500">
            {isVerifyingConsent ? 'Verifying permissions...' : 'Redirecting to your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-deepest">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background layers */}
        <GridBackground variant="dots" opacity={0.3} className="absolute inset-0" />

        {/* Gradient orbs */}
        <GradientOrb
          color="cyan"
          size="xl"
          className="left-1/4 top-1/3 -translate-x-1/2 -translate-y-1/2"
          intensity="low"
        />
        <GradientOrb
          color="violet"
          size="lg"
          className="right-1/4 bottom-1/4 translate-x-1/2"
          intensity="low"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center pl-12 xl:pl-20 pr-8 xl:pr-12 ml-auto max-w-xl">
          {/* Logo and title */}
          <FadeIn animateOnMount delay={0}>
            <div className="flex items-center gap-4 mb-10">
              <div className="relative">
                <div className="absolute inset-0 bg-accent-cyan/20 rounded-full blur-xl" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-accent-cyan to-accent-violet rounded-xl flex items-center justify-center shadow-glow-cyan">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">IntuneGet</h1>
                <p className="text-stone-500 text-sm">Winget for Intune</p>
              </div>
            </div>
          </FadeIn>

          {/* Main Headline */}
          <FadeIn animateOnMount delay={0.05}>
            <h2 className="text-4xl xl:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.1] mb-6">
              <span className="gradient-text-cyan">10,000 Apps.</span>
              <br />
              <span className="text-stone-800">One Click.</span>
            </h2>
          </FadeIn>

          <FadeIn animateOnMount delay={0.1}>
            <p className="text-lg text-stone-600 mb-10 max-w-md leading-relaxed">
              Deploy Win32 applications to Microsoft Intune with ease.
              Search Winget, configure, and upload in minutes.
            </p>
          </FadeIn>

          {/* Trust stats */}
          <FadeIn animateOnMount delay={0.15}>
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">1,000+</p>
                  <p className="text-sm text-stone-500">IT teams</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-violet/10 flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-accent-violet" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">10,000+</p>
                  <p className="text-sm text-stone-500">Apps deployed</p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Multi-tenant badge */}
          <FadeIn animateOnMount delay={0.2}>
            <div className="mt-10 flex items-center gap-2 text-sm text-stone-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Multi-tenant support - works with any Entra ID tenant</span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="flex-1 flex items-center justify-center lg:justify-start px-4 sm:px-6 lg:pl-12 lg:pr-20">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <FadeIn animateOnMount className="lg:hidden flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-accent-cyan/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-accent-cyan to-accent-violet rounded-2xl flex items-center justify-center shadow-glow-cyan">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-stone-900">IntuneGet</h1>
            <p className="text-stone-500 text-sm">Winget for Intune</p>
          </FadeIn>

          {/* Sign in card */}
          <FadeIn animateOnMount delay={0.1}>
            <div className="bg-white border border-stone-200 rounded-2xl shadow-soft-lg p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-stone-900">Start Deploying</h2>
                <p className="text-stone-500">
                  Sign in to deploy apps to Intune in seconds
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Sign in button */}
              <Button
                onClick={handleSignIn}
                disabled={isSigningIn}
                size="lg"
                className="w-full h-12 text-base font-semibold gap-3 bg-accent-cyan hover:bg-accent-cyan-dim text-white shadow-glow-cyan hover:shadow-glow-cyan-lg transition-all duration-300"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <MicrosoftLogo className="h-5 w-5" />
                    Continue with Microsoft
                  </>
                )}
              </Button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
                <Shield className="h-3.5 w-3.5 text-accent-cyan" />
                <span>Protected by Microsoft Entra ID</span>
              </div>

              {/* Collapsible consent link section */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setIsConsentSectionOpen(!isConsentSectionOpen)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors py-1"
                >
                  <span>Need admin consent?</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isConsentSectionOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isConsentSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-amber-800 font-medium">Global Admin Required</p>
                        <p className="text-amber-700 mt-1">
                          Only Global Administrators can grant the permissions IntuneGet needs.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-stone-500 font-medium">
                        Share this link with your Global Administrator:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          value={consentUrl}
                          className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-700 truncate focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                        />
                        <Button
                          onClick={handleCopyConsentUrl}
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0 border-stone-200 hover:bg-stone-50 text-stone-600"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500">
                      Once they grant consent, you can sign in normally.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Footer links */}
          <FadeIn animateOnMount delay={0.15}>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-stone-500">
              <Link href="/" className="hover:text-stone-700 transition-colors">
                Back to home
              </Link>
              <span className="text-stone-300">|</span>
              <Link
                href="/docs/docker"
                className="hover:text-stone-700 transition-colors"
              >
                Self-host guide
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-deepest">
          <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
