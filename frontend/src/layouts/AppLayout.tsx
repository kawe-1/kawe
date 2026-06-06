import { Outlet } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Sidebar, MobileBurger } from '../components/ui/Sidebar';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setSidebarOpen } from '../features/ui/uiSlice';
import { CreateModal } from '../components/shared/CreateModal';
import { setShowCreateModal, createNewSession } from '../features/sessions/sessionsSlice';

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const { darkMode, sidebarOpen } = useAppSelector(state => state.ui);
  const { showCreateModal } = useAppSelector(state => state.sessions);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="app-shell">
      <MobileBurger onClick={() => dispatch(setSidebarOpen(!sidebarOpen))} />
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
      {showCreateModal && (
        <CreateModal 
          onClose={() => dispatch(setShowCreateModal(false))} 
          onCreate={title => dispatch(createNewSession(title))}
        />
      )}
    </div>
  );
}
