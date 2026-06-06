import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SessionSummary, SessionDetail, listSessions, getSession, createSession as createSessionApi } from '../../services/endpoints/sessions';

interface SessionsState {
  sessions: SessionSummary[];
  activeSessionDetail: SessionDetail | null;
  activeSessionId: string | null;
  activeTab: string;
  showCreateModal: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: SessionsState = {
  sessions: [],
  activeSessionDetail: null,
  activeSessionId: null,
  activeTab: 'notes',
  showCreateModal: false,
  status: 'idle',
  detailStatus: 'idle',
};

export const fetchSessions = createAsyncThunk('sessions/fetchSessions', async () => {
  return await listSessions();
});

export const fetchSessionDetail = createAsyncThunk('sessions/fetchSessionDetail', async (id: string) => {
  return await getSession(id);
});

export const createNewSession = createAsyncThunk('sessions/createNewSession', async (title: string) => {
  return await createSessionApi(title);
});

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
      if (action.payload) {
        state.activeTab = 'notes';
      } else {
        state.activeSessionDetail = null;
      }
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setShowCreateModal: (state, action: PayloadAction<boolean>) => {
      state.showCreateModal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchSessionDetail.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchSessionDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.activeSessionDetail = action.payload;
      })
      .addCase(fetchSessionDetail.rejected, (state) => {
        state.detailStatus = 'failed';
        state.activeSessionDetail = null;
      })
      .addCase(createNewSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.activeSessionId = action.payload.id;
        state.activeTab = 'sources';
      });
  },
});

export const { setActiveSession, setActiveTab, setShowCreateModal } = sessionsSlice.actions;
export default sessionsSlice.reducer;
