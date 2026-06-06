import { Outlet } from 'react-router-dom';
import React from 'react';

export default function SplitLayout() {
  return (
    <div className="split-shell">
      <Outlet />
    </div>
  );
}
