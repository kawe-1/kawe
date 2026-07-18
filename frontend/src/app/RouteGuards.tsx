import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

/**
 * Blocks access to authenticated-only pages (dashboard, session) when
 * the user isn't signed in, or redirects to /onboarding if they haven't
 * finished it yet.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAppSelector(state => state.auth);

  if (status === 'signin' || status === 'landing') {
    return <Navigate to="/auth" replace />;
  }
  if (status === 'onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/**
 * Blocks access to /auth when already signed in — sends them to
 * onboarding or dashboard depending on where they left off.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAppSelector(state => state.auth);

  if (status === 'app') {
    return <Navigate to="/dashboard" replace />;
  }
  if (status === 'onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/**
 * Guards the onboarding page itself — a signed-out user shouldn't be
 * able to land there directly, and an already-onboarded user shouldn't
 * be able to re-trigger the flow by hitting the URL manually.
 */
export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAppSelector(state => state.auth);

  if (status === 'signin' || status === 'landing') {
    return <Navigate to="/auth" replace />;
  }
  if (status === 'app') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
