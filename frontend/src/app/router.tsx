import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardPage from '../pages/dashboard';
import SessionPage from '../pages/session';
import AuthPage from '../pages/auth';
import OnboardingPage from '../pages/auth/onboarding';
import LandingPage from '../pages/landing';
import { ProtectedRoute, PublicOnlyRoute, OnboardingRoute } from '../app/RouteGuards';
import React from 'react';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: '',
        element: (
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        ),
      },
    ],
  },
  {
    path: '/onboarding',
    element: <AuthLayout />,
    children: [
      {
        path: '',
        element: (
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        ),
      },
    ],
  },
  {
    path: '/dashboard',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/session/:id',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: (
          <ProtectedRoute>
            <SessionPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
