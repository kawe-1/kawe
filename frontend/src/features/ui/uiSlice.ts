import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LayoutMode = 'sidebar' | 'top' | 'split';

interface UiState {
  layout: LayoutMode;
  sidebarOpen: boolean;
  darkMode: boolean;
}

const initialState: UiState = {
  layout: 'sidebar',
  sidebarOpen: false,
  darkMode: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLayout: (state, action: PayloadAction<LayoutMode>) => {
      state.layout = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
  },
});

export const { setLayout, setSidebarOpen, toggleDarkMode, setDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
