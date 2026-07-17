import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, AuthStateStatus } from '../../types/user';

interface AuthState {
  status: AuthStateStatus;
  profile: UserProfile;
}

const EMPTY_PROFILE: UserProfile = {
  name: '',
  bio: '',
  avatar: '',
  subjects: [],
  style: '',
  subjectArea: [],
  academicLevel: '',
  academicField: '',
  institution: '',
  groups: [],
  courses: [],
  activeWorkspaceId: 'individual',
};

function loadPersistedProfile(): UserProfile {
  try {
    const saved = JSON.parse(localStorage.getItem('kawe_profile') || 'null');
    if (saved && typeof saved === 'object') {
      return {
        ...EMPTY_PROFILE,
        ...saved,
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
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      state.profile.activeWorkspaceId = action.payload;
    },
    logout: (state) => {
      state.status = 'signin';
      state.profile = { ...EMPTY_PROFILE };
    },
  },
});

export const { setAuthStatus, updateProfile, setActiveWorkspace, logout } = authSlice.actions;
export default authSlice.reducer;
