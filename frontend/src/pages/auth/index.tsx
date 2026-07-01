import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../src/app/hooks';
import { setAuthStatus, updateProfile } from '../../../src/features/auth/authSlice';
import { SparkIcon } from '../../../src/components/ui/Icons';
import { loginUser, registerUser, googleAuthUser } from '../../../src/services/endpoints/auth';
import { ApiError } from '../../../src/services/axios';

// Extend Window so TypeScript knows about the GSI globals we inject at runtime
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleAuthSuccess = (token: string, user: { id: string; email: string; name: string, has_onboarded?: boolean }) => {
    // 1. Store JWT token securely in localStorage
    localStorage.setItem('kawe_token', token);
    dispatch(updateProfile({ name: user.name, avatar: '', subjects: [], style: '' }));

    // 3. Route based on whether this user has already completed onboarding
    if (user.has_onboarded) {
      dispatch(setAuthStatus('app'));
      navigate('/dashboard');
    } else {
      dispatch(setAuthStatus('onboarding'));
      navigate('/onboarding');
    }
  };

  // Called by GSI with a one-time credential string after the user picks an account
  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      setError(null);
      setGoogleLoading(true);
      try {
        const result = await googleAuthUser(response.credential);
        handleAuthSuccess(result.access_token, result.user);
      } catch (err: any) {
        setGoogleLoading(false);
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Google sign-in failed. Please try again.');
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Inject the GSI script once, then initialise the library when it loads
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // Google auth not configured — skip silently

    // Avoid double-injecting if the script is already present
    if (document.getElementById('gsi-script')) {
      if (window.google) initGsi();
      return;
    }

    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initGsi();
    document.head.appendChild(script);

    function initGsi() {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: handleGoogleCredential,
        use_fedcm_for_prompt: true,
      });
      setGsiReady(true);
    }
  }, [handleGoogleCredential]);

  // Once GSI is ready, render Google's styled button into our container div
  useEffect(() => {
    if (!gsiReady) return;
    const container = document.getElementById('g_id_button_container');
    if (container) {
      container.innerHTML = ''; // clear any previous render (mode switch)
      window.google?.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 340,
      });
    }
  }, [gsiReady, mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (mode === 'register' && !name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const response = await loginUser(email.trim(), password);
        handleAuthSuccess(response.access_token, response.user);
      } else {
        const response = await registerUser(email.trim(), password, name.trim());
        handleAuthSuccess(response.access_token, response.user);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(prev => (prev === 'login' ? 'register' : 'login'));
    setError(null);
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-spark">
          <SparkIcon size={56} />
        </div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-sub">
          {mode === 'login' ? 'Sign in to continue studying.' : 'Join Kawe and study smarter.'}
        </p>

        {/* Google Sign-In — rendered by GSI when VITE_GOOGLE_CLIENT_ID is set,
            otherwise falls back to a non-functional placeholder button */}
        {GOOGLE_CLIENT_ID ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, minHeight: 44, position: 'relative' }}>
            {/* GSI injects its iframe-based button into this div */}
            <div id="g_id_button_container" />
            {/* Overlay spinner while the Google flow is in flight */}
            {googleLoading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(var(--bg-rgb, 255,255,255), 0.7)',
                borderRadius: 6,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round"
                  style={{ animation: 'spin 1s linear infinite', color: 'var(--marigold)' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          /* Decorative placeholder when GOOGLE_CLIENT_ID is not configured */
          <button className="social-btn" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google (not configured)
          </button>
        )}

        <div className="auth-divider">or continue with email</div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {mode === 'register' && (
            <input
              className="auth-email"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          )}

          <input
            className="auth-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus={mode === 'login'}
          />

          <div style={{ position: 'relative', marginBottom: 12, width: '100%' }}>
            <input
              className="auth-email"
              type={showPwd ? 'text' : 'password'}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ marginBottom: 0, paddingRight: 44, width: '100%' }}
            />
            <button
              onClick={() => setShowPwd(v => !v)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', color: 'var(--muted)',
                padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {showPwd ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {error && (
            <div style={{
              background: 'color-mix(in srgb, var(--coral) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--coral) 30%, transparent)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              fontSize: 13, color: 'var(--coral)', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Please wait…
              </span>
            ) : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button style={{ background: 'none', border: 'none', color: 'var(--marigold)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit', padding: 0, fontFamily: 'inherit' }} onClick={switchMode}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button style={{ background: 'none', border: 'none', color: 'var(--marigold)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit', padding: 0, fontFamily: 'inherit' }} onClick={switchMode}>
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="auth-footer">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}
