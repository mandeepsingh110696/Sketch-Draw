import { configureStore } from "@reduxjs/toolkit";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import menuReducer from "@/slice/menuSlice";
import toolboxReducer from "@/slice/toolboxslice";

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    toolbox: toolboxReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
