import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { COLORS, MENU_ITEMS, type MenuTool } from "@/constants";

export type ToolSettings = {
  color: string;
  size: number;
};

type ToolboxState = Record<MenuTool, ToolSettings>;

const initialState: ToolboxState = {
  [MENU_ITEMS.PENCIL]: {
    color: COLORS.BLACK,
    size: 3,
  },
  [MENU_ITEMS.ERASER]: {
    color: COLORS.WHITE,
    size: 12,
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
  },
});

export const { changeColor, changeBrushSize } = toolBoxSlice.actions;
export default toolBoxSlice.reducer;
