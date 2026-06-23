import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardPage from '../pages/dashboard';
import SessionPage from '../pages/session';
import AuthPage from '../pages/auth';
import OnboardingPage from '../pages/auth/onboarding';
import LandingPage from '../pages/landing';
import React from 'react';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/auth" replace />,
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
        element: <AuthPage />,
      },
    ],
  },
  {
    path: '/onboarding',
    element: <AuthLayout />,
    children: [
      {
        path: '',
        element: <OnboardingPage />,
      },
    ],
  },
  {
    path: '/dashboard',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '/session/:id',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: <SessionPage />,
      },
    ],
  },
]);
