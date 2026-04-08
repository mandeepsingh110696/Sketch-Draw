"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { initSocket } from "@/socket";
import { store } from "@/store";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initSocket();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
