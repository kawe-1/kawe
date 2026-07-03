import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import sessionsReducer from '../features/sessions/sessionsSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sessions: sessionsReducer,
    ui: uiReducer,
  },
});

// Persist the profile (name, academic info, workspaces, active workspace) across reloads
// so switching between Individual / a group / a class sticks, rather than resetting.
let lastProfileJson = '';
store.subscribe(() => {
  const profile = store.getState().auth.profile;
  const json = JSON.stringify(profile);
  if (json !== lastProfileJson) {
    lastProfileJson = json;
    try { localStorage.setItem('kawe_profile', json); } catch { /* storage unavailable */ }
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
