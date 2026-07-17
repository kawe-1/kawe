import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, AuthStateStatus, GroupInfo, CourseInfo, getActiveWorkspaceId } from '../../types/user';
import api from '../../services/axios';

interface AuthState {
  status: AuthStateStatus;
  profile: UserProfile;
  initialized: boolean; // true once the boot-time /auth/me check has resolved
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

const initialState: AuthState = {
  status: 'app',
  profile: { ...EMPTY_PROFILE },
  initialized: false,
};

/**
 * Called once on app boot. Fetches the full user profile from the backend
 * and decides whether to route to onboarding or straight to the app.
 */
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const token = localStorage.getItem('kawe_token');
  if (!token) return null;
  const { data } = await api.get('/api/auth/me');
  return data;
});

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
    // Adds a newly created/joined group or course to the profile so it shows
    // up in the workspace switcher immediately, without waiting for a reload.
    addWorkspace: (
      state,
      action: PayloadAction<{ type: 'study_group'; group: GroupInfo } | { type: 'course_group'; course: CourseInfo }>,
    ) => {
      const payload = action.payload;
      if (payload.type === 'study_group') {
        const exists = state.profile.groups.some(g => g.id === payload.group.id);
        if (!exists) state.profile.groups.push(payload.group);
      } else {
        const exists = state.profile.courses.some(c => c.id === payload.course.id);
        if (!exists) state.profile.courses.push(payload.course);
      }
    },
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      state.profile.activeWorkspaceId = action.payload;
    },
    logout: (state) => {
      localStorage.removeItem('kawe_token');
      state.status = 'signin';
      state.profile = { ...EMPTY_PROFILE };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.initialized = true;

      if (!action.payload) {
        state.status = 'signin';
        state.profile = { ...EMPTY_PROFILE };
        return;
      }

      const user = action.payload;

      const profile: UserProfile = {
        ...EMPTY_PROFILE,
        name: user.name,
        subjectArea: user.subject_area ?? [],
        academicLevel: user.academic_level ?? '',
        institution: user.institution ?? '',
        groups: user.groups ?? [],
        courses: user.courses ?? [],
      };

      profile.activeWorkspaceId = user.activeWorkspaceId || getActiveWorkspaceId(profile);
      state.profile = profile;
      state.status = user.has_onboarded ? 'app' : 'onboarding';
    });
    builder.addCase(initializeAuth.rejected, (state) => {
      state.initialized = true;
      localStorage.removeItem('kawe_token');
      state.status = 'signin';
      state.profile = { ...EMPTY_PROFILE };
    });
  },
});

export const { setAuthStatus, updateProfile, addWorkspace, setActiveWorkspace, logout } = authSlice.actions;
export default authSlice.reducer;
