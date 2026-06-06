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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
