import { Outlet } from 'react-router-dom';
import React from 'react';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <Outlet />
    </div>
  );
}
