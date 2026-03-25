import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MENU_ITEMS, type MenuTool } from "@/constants";

export type MenuAction =
  | typeof MENU_ITEMS.UNDO
  | typeof MENU_ITEMS.REDO
  | typeof MENU_ITEMS.DOWNLOAD
  | typeof MENU_ITEMS.CLEAR
  | null;

type MenuState = {
  activeTool: MenuTool;
  actionMenuItem: MenuAction;
};

const initialState: MenuState = {
  activeTool: MENU_ITEMS.PENCIL,
  actionMenuItem: null,
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    menuItemClick: (state, action: PayloadAction<MenuTool>) => {
      state.activeTool = action.payload;
    },
    actionItemClick: (state, action: PayloadAction<MenuAction>) => {
      state.actionMenuItem = action.payload;
    },
  },
});

export const { menuItemClick, actionItemClick } = menuSlice.actions;
export default menuSlice.reducer;
