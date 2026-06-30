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
  accountType: 'individual',
  subjectArea: [],
  academicLevel: '',
  institution: '',
  group: null,
  course: null,
};

const initialState: AuthState = {
  status: 'app',
  profile: { ...EMPTY_PROFILE, name: 'Student' },
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
    logout: (state) => {
      state.status = 'signin';
      state.profile = { ...EMPTY_PROFILE };
    },
  },
});

export const { setAuthStatus, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
