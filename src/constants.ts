export const COLORS = {
  BLACK: "#18181b",
  RED: "#dc2626",
  GREEN: "#16a34a",
  BLUE: "#2563eb",
  ORANGE: "#ea580c",
  YELLOW: "#ca8a04",
  WHITE: "#fafafa",
} as const;

export type ColorKey = keyof typeof COLORS;

export const MENU_ITEMS = {
  PENCIL: "PENCIL",
  ERASER: "ERASER",
  HIGHLIGHTER: "HIGHLIGHTER",
  LINE: "LINE",
  RECT: "RECT",
  UNDO: "UNDO",
  REDO: "REDO",
  DOWNLOAD: "DOWNLOAD",
  CLEAR: "CLEAR",
} as const;

export type MenuTool =
  | typeof MENU_ITEMS.PENCIL
  | typeof MENU_ITEMS.ERASER
  | typeof MENU_ITEMS.HIGHLIGHTER
  | typeof MENU_ITEMS.LINE
  | typeof MENU_ITEMS.RECT;
