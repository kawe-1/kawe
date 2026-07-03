import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, AuthStateStatus, Workspace } from '../../types/user';

interface AuthState {
  status: AuthStateStatus;
  profile: UserProfile;
}

const INDIVIDUAL_WORKSPACE: Workspace = { id: 'individual', type: 'individual', label: 'Individual' };

const EMPTY_PROFILE: UserProfile = {
  name: '',
  bio: '',
  avatar: '',
  subjects: [],
  style: '',
  accountType: 'individual',
  subjectArea: [],
  academicLevel: '',
  academicField: '',
  institution: '',
  group: null,
  course: null,
  workspaces: [{ ...INDIVIDUAL_WORKSPACE }],
  activeWorkspaceId: 'individual',
};

function loadPersistedProfile(): UserProfile {
  try {
    const saved = JSON.parse(localStorage.getItem('kawe_profile') || 'null');
    if (saved && typeof saved === 'object') {
      return {
        ...EMPTY_PROFILE,
        ...saved,
        workspaces: Array.isArray(saved.workspaces) && saved.workspaces.length
          ? saved.workspaces
          : [{ ...INDIVIDUAL_WORKSPACE }],
        activeWorkspaceId: saved.activeWorkspaceId || 'individual',
      };
    }
  } catch { /* ignore malformed storage */ }
  return { ...EMPTY_PROFILE, name: 'Student' };
}

const initialState: AuthState = {
  status: 'app',
  profile: loadPersistedProfile(),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthStatus: (state, action: PayloadAction<AuthStateStatus>) => {
      state.status = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    // Adds a new workspace (a joined/created group or course) and makes it active.
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      const exists = state.profile.workspaces.some(w => w.id === action.payload.id);
      if (!exists) state.profile.workspaces.push(action.payload);
      state.profile.activeWorkspaceId = action.payload.id;
    },
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      state.profile.activeWorkspaceId = action.payload;
    },
    logout: (state) => {
      state.status = 'signin';
      state.profile = { ...EMPTY_PROFILE, workspaces: [{ ...INDIVIDUAL_WORKSPACE }] };
    },
  },
});

export const { setAuthStatus, updateProfile, addWorkspace, setActiveWorkspace, logout } = authSlice.actions;
export default authSlice.reducer;
