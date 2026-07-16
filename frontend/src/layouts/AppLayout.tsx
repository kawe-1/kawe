import { Outlet } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Sidebar, MobileBurger } from '../components/ui/Sidebar';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setSidebarOpen, setShowAddWorkspaceModal } from '../features/ui/uiSlice';
import { CreateModal } from '../components/shared/CreateModal';
import { AddWorkspaceModal } from '../components/shared/AddWorkspaceModal';
import { setShowCreateModal, createNewSession } from '../features/sessions/sessionsSlice';
import { getActiveWorkspaceId, getProfileWorkspaces } from '../types/user';

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const { darkMode, sidebarOpen, showAddWorkspaceModal } = useAppSelector(state => state.ui);
  const { showCreateModal } = useAppSelector(state => state.sessions);
  const { profile } = useAppSelector(state => state.auth);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const workspaces = getProfileWorkspaces(profile);
  const activeWorkspaceId = getActiveWorkspaceId(profile);
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleCreateSession = (title: string) => {
    dispatch(createNewSession({
      title,
      workspaceId: activeWorkspace?.id,
      workspaceType: activeWorkspace?.type,
    }))
      .unwrap()
      .catch(() => { });
  };

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
          onCreate={handleCreateSession}
        />
      )}
      {showAddWorkspaceModal && (
        <AddWorkspaceModal onClose={() => dispatch(setShowAddWorkspaceModal(false))} />
      )}
    </div>
  );
}
