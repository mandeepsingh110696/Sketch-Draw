import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { COLORS, MENU_ITEMS, type MenuTool } from "@/constants";

export type ToolSettings = {
  color: string;
  size: number;
  opacity: number;
};

type ToolboxState = Record<MenuTool, ToolSettings>;

const initialState: ToolboxState = {
  [MENU_ITEMS.PENCIL]: {
    color: COLORS.BLACK,
    size: 3,
    opacity: 1,
  },
  [MENU_ITEMS.ERASER]: {
    color: COLORS.WHITE,
    size: 12,
    opacity: 1,
  },
  [MENU_ITEMS.HIGHLIGHTER]: {
    color: COLORS.YELLOW,
    size: 20,
    opacity: 0.35,
  },
  [MENU_ITEMS.LINE]: {
    color: COLORS.BLACK,
    size: 3,
    opacity: 1,
  },
  [MENU_ITEMS.RECT]: {
    color: COLORS.BLACK,
    size: 3,
    opacity: 1,
  },
};

export const toolBoxSlice = createSlice({
  name: "toolbox",
  initialState,
  reducers: {
    changeColor: (
      state,
      action: PayloadAction<{ item: MenuTool; color: string }>,
    ) => {
      state[action.payload.item].color = action.payload.color;
    },
    changeBrushSize: (
      state,
      action: PayloadAction<{ item: MenuTool; size: number }>,
    ) => {
      state[action.payload.item].size = action.payload.size;
    },
    changeOpacity: (
      state,
      action: PayloadAction<{ item: MenuTool; opacity: number }>,
    ) => {
      state[action.payload.item].opacity = action.payload.opacity;
    },
  },
});

export const { changeColor, changeBrushSize, changeOpacity } =
  toolBoxSlice.actions;
export default toolBoxSlice.reducer;
