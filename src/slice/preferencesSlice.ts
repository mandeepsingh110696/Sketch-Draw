import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PreferencesState = {
  transparentExport: boolean;
  showDotGrid: boolean;
};

const initialState: PreferencesState = {
  transparentExport: false,
  showDotGrid: true,
};

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setTransparentExport: (state, action: PayloadAction<boolean>) => {
      state.transparentExport = action.payload;
    },
    setShowDotGrid: (state, action: PayloadAction<boolean>) => {
      state.showDotGrid = action.payload;
    },
  },
});

export const { setTransparentExport, setShowDotGrid } =
  preferencesSlice.actions;
export default preferencesSlice.reducer;
