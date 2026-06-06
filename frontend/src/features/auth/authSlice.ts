import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, AuthStateStatus } from '../../types/user';

interface AuthState {
  status: AuthStateStatus;
  profile: UserProfile;
}

const initialState: AuthState = {
  status: 'app',
  profile: { name: 'Student', bio: '', avatar: '' },
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
      state.profile = { name: '', bio: '', avatar: '' };
    },
  },
});

export const { setAuthStatus, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
