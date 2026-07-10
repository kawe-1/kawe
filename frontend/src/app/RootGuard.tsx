import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { initializeAuth } from '../features/auth/authSlice';

/**
 * Runs once on app boot. Reads the JWT from localStorage (if any),
 * calls /api/auth/me, and hydrates Redux with the real profile +
 * onboarding status before any route renders.
 *
 * Wrap this around <RouterProvider /> so no page mounts before
 * we know whether the user is authenticated and onboarded.
 */
export default function RootGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(state => state.auth.initialized);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (!initialized) {
    // Replace with a real splash/spinner component if you have one
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <span>Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
